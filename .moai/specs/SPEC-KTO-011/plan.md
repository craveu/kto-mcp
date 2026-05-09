# Plan — SPEC-KTO-011

## 1. 개요

본 계획은 SPEC-KTO-011을 5개 Phase로 분해하여 진행한다. Phase는 의존성 순서대로 실행되며, 각 Phase는 그 자체로 컴파일 가능하고 단위 테스트가 통과해야 다음 Phase로 진행한다 (단, Phase 2~3는 65 메서드 일괄 변경의 본질상 한 PR로 묶일 수 있음).

## 2. Phase 분해

### Phase 1 — 신규 인프라: SessionCredentialsStore + KtoServiceKeyMissingError

**목표**: 모든 후속 작업이 의존하는 단일 추상화와 에러 클래스를 먼저 도입한다.

**작업 항목**:
- `src/kto/common/kto-error.ts` — `KtoServiceKeyMissingError` 클래스 추가
  - `name = 'KtoServiceKeyMissingError'`
  - 사용자 가이드 메시지를 기본 message로 포함 ("Set Authorization: Bearer <KTO service key> header")
- `src/mcp/session-credentials.store.ts` — 신규 파일
  - `KtoCredentials` 인터페이스 export (`{ serviceKey: string; preencoded: boolean }`)
  - `@Injectable()` 클래스 `SessionCredentialsStore`
  - 내부 `private readonly store = new Map<string, KtoCredentials>()`
  - `register(sessionId, creds)`, `get(sessionId)`, `unregister(sessionId)` 메서드
- `src/mcp/session-credentials.store.spec.ts` — 신규 단위 테스트
  - register → get round-trip
  - unregister 후 get은 undefined
  - 동일 sessionId 재등록 시 덮어쓰기 동작
  - 등록되지 않은 sessionId 조회는 undefined

**검증**: `pnpm test src/mcp/session-credentials.store.spec.ts` 통과.

**완료 조건**: 신규 파일 컴파일 OK, 단위 테스트 100% 통과, 기존 테스트 회귀 0.

---

### Phase 2 — KtoHttpClient signature 변경

**목표**: KTO API 단일 진입점 시그니처를 stateless하게 변환. 이후 모든 service 메서드 변경의 기반.

**작업 항목**:
- `src/kto/kto-http.client.ts`
  - 생성자에서 `serviceKey: string`, `preencoded: boolean` 제거. `initialDelayOverrideMs`만 잔존.
  - `request<T>(opts: KtoRequestOptions)` → `request<T>(opts: KtoRequestOptions, credentials: KtoCredentials)`로 변경
  - 메서드 본문에서 `this.serviceKey`/`this.preencoded` 참조를 `credentials.serviceKey`/`credentials.preencoded`로 치환
  - URL-encoding 분기 헬퍼는 별도 함수로 추출 (가독성)
  - `@MX:ANCHOR` 주석의 `@MX:REASON`에 "credentials 파라미터 도입으로 멀티 테넌트 지원" 라인 추가
- `src/kto/kto-http.client.spec.ts`
  - 모든 테스트 케이스의 `request()` 호출에 credentials 인자 전달
  - 신규 테스트 1건: 동일 client 인스턴스로 두 다른 credentials 호출 → 각각 독립적으로 KTO 호출되는지 검증

**검증**: `pnpm test src/kto/kto-http.client.spec.ts` 통과. 다른 service.spec.ts들은 이 시점에서 컴파일 실패할 수 있음 (Phase 3에서 일괄 수정).

**완료 조건**: client 단위 테스트 통과. service.spec.ts들은 Phase 3 종료 시점까지 빨간 상태 허용.

---

### Phase 3 — 10개 service 일괄 갱신 (~65 메서드)

**목표**: 모든 KTO 도메인 서비스가 신규 client 시그니처를 따르도록 일괄 수정.

**범위 (Phase 단일 PR로 묶음)**:
| Service | 메서드 수 |
|---|---|
| KoreanTourInfoService | 15 |
| BarrierFreeTourInfoService | 10 |
| MedicalTourismService | 7 |
| WellnessTourismService | 8 |
| AudioGuideService | 8 |
| GoCampingService | 5 |
| PhotoGalleryService | 4 |
| PetTourService | 4 |
| DurunubiService | 2 |
| PhotoAwardService | 2 |
| **합계** | **65** |

**변환 패턴 (모든 메서드 동일)**:
- 시그니처: `async methodName(dto: SomeDto)` → `async methodName(dto: SomeDto, credentials: KtoCredentials)`
- 본문: `this.httpClient.request({ service, operation, params })` → `this.httpClient.request({ service, operation, params }, credentials)`
- 메서드 단위 `@MX:NOTE` 1줄 추가 (signature 변경 사실)

**자동화 옵션** (manager-tdd 판단):
- AST-grep `npm i -g @ast-grep/cli` 후 ts-pattern 매칭
- TypeScript Compiler API transform script
- 검증을 동반한 sed 패턴

**테스트 갱신**:
- 10개 `*.service.spec.ts` — 모든 mock httpClient 호출 setup이 `(opts, credentials)` 두 인자로 검증되도록 변경
- 각 service.spec의 모든 case에서 mock service method 호출에 dummy credentials 전달

**검증**:
- 전체 빌드 `pnpm run build` 성공
- 전체 단위 테스트 `pnpm test` (693건+) 통과
- 회귀 0

**완료 조건**: 모든 unit test 통과, build 성공.

---

### Phase 4 — Transport adapters + tool-registry + main 부트 흐름

**목표**: 헤더 추출 → store 등록 → tool-registry lookup → service 호출까지의 런타임 흐름 완성.

**작업 항목**:

`src/mcp/mcp.module.ts`:
- `SessionCredentialsStore`를 providers + exports에 추가

`src/mcp/tool-registry.ts`:
- `handleToolCall` 시그니처에 `(extra: RequestHandlerExtra, store: SessionCredentialsStore)` 추가 (의존성은 클로저로 캡처)
- `extra.sessionId` 또는 fallback 식별자로 `store.get()` 호출
- 결과가 `undefined`이고 모드가 HTTP라면 `KtoServiceKeyMissingError` throw → catch 블록에서 MCP 에러 -32603 응답으로 변환
- 결과가 있으면 `serviceMethod.call(service, dto, credentials)`로 변경
- `registerAll(server, registries, store)` 시그니처에 `store` 주입 추가

`src/mcp/transports/http-streamable.adapter.ts`:
- `start()`에서 `sessionIdGenerator`를 `randomUUID` 기반 콜백으로 설정 (stateful 모드)
- HTTP request handling 진입점에서 `Authorization: Bearer <key>` 추출 (case-insensitive header lookup)
- `X-KTO-Service-Key-Preencoded` 추출 (true/false 파싱, 기본 false)
- transport `onclose` (또는 SDK 제공 close 콜백)에서 `store.unregister(sessionId)` 호출
- `@MX:WARN` 주석 추가 (외부 입력 처리 + 키 노출 위험)
- 생성자에 `SessionCredentialsStore` 주입

`src/mcp/transports/http.adapter.ts`:
- 위와 동일한 변경

`src/mcp/transports/stdio.adapter.ts`:
- `start(server, credentials)` 시그니처 추가 또는 별도 부트 진입점에서 `store.register('__stdio_default__', credentials)` 호출
- 헤더 처리 로직은 일절 추가 안 함

`src/main.ts`:
- `getEnv()` 호출 후 모드 판단:
  - `mode === 'stdio'`인 경우만 `env.ktoServiceKey` 부재가 부트 실패
  - HTTP 모드는 키 부재 허용 (런타임 헤더로 받음)
- stdio 모드일 때 `store.register('__stdio_default__', { serviceKey, preencoded })` 호출
- HTTP 모드일 때는 store 등록 안 함 (transport adapter가 헤더 수신 시 등록)

`src/env.ts`:
- `getEnv()`가 mode를 먼저 판정하고 stdio일 때만 `KTO_SERVICE_KEY` 강제
- HTTP 모드에서는 빈 문자열도 허용 (반환 객체의 `ktoServiceKey`는 빈 문자열일 수 있음을 타입으로 명시)
- `src/env.spec.ts` 갱신: HTTP 모드 + 키 부재가 throw하지 않는지 검증

**테스트 갱신**:
- `src/mcp/tool-registry.spec.ts`
  - sessionId가 store에 있을 때 service에 credentials 전달 검증
  - sessionId가 store에 없을 때 KtoServiceKeyMissingError 변환 검증
- `src/mcp/transports/http-streamable.adapter.spec.ts`, `http.adapter.spec.ts`
  - Authorization 헤더 추출 검증
  - X-KTO-Service-Key-Preencoded 헤더 추출 검증
  - 세션 종료 시 store.unregister 호출 검증
- `src/mcp/transports/stdio.adapter.spec.ts`
  - 부트 시 fixed sessionId로 register 호출 검증

**검증**: 모든 단위 테스트 통과 + 빌드 성공.

**완료 조건**: tool-registry, 3개 transport adapter, main 모두 신규 흐름 동작.

---

### Phase 5 — e2e 테스트 + README 갱신

**목표**: end-to-end 시나리오 검증 + 사용자 문서 갱신.

**작업 항목**:

`test/kto.e2e-spec.ts`:
- 기존 stdio 시나리오는 회귀 테스트로 유지 (모두 통과해야 함)
- HTTP 시나리오 신규 추가:
  - HTTP transport 기동 → `Authorization: Bearer <real or mock key>` 동봉 → tools/call 정상 동작
  - HTTP transport에서 `Authorization` 미설정 → tools/call이 -32603 응답
  - HTTP transport에서 `Authorization` 미설정 → tools/list는 65 도구 정상 반환
  - HTTP transport에서 두 다른 세션이 다른 키 사용 → 서로 영향 없음
  - HTTP transport에서 `X-KTO-Service-Key-Preencoded: true` → URL 인코딩 분기 정상

`README.md`:
- "Multi-tenant usage" 섹션 신규 추가
  - Pattern A (stdio + env) — 기존 사용자 영향 없음 강조
  - Pattern B (HTTP + Authorization header) — 신규 SaaS 패턴
  - 헤더 사용 예시 (curl + AI 에이전트 SDK)
  - HTTPS 권장 경고
- 환경변수 표 갱신: `KTO_SERVICE_KEY`가 stdio 모드일 때만 필수임을 명시

**검증**:
- `pnpm run test:e2e` 모든 시나리오 통과
- `pnpm run lint` 0 warning
- `pnpm run build` 성공
- coverage ≥ 85%

**완료 조건**: e2e 통과, README 정합성 확인, SPEC acceptance 12 항목 모두 충족.

---

## 3. 기술 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| 신규 의존성 | 없음 | 기존 axios, NestJS, MCP SDK로 충분 |
| Store 구현 | NestJS `@Injectable` 싱글톤 + 내부 `Map<string, KtoCredentials>` | DI 컨테이너 활용으로 module 경계 명확, 추가 라이브러리 불필요 |
| HTTP 헤더 추출 | Node `IncomingMessage.headers`에서 직접 (case-insensitive) | adapter가 이미 raw `req`를 다루므로 자연스러움 |
| sessionId 생성 | SDK `sessionIdGenerator` 콜백에 `randomUUID` 사용 | stateful 모드로 전환하여 안정적 sessionId 확보 |
| stdio 고정 sessionId | `__stdio_default__` (양쪽 언더바 prefix·suffix) | 사용자 sessionId와의 충돌 가능성 최소화 |
| 키 미리보기 헬퍼 | 별도 유틸 함수 없음 (디버깅 시에만 인라인 처리) | 자동화된 키 노출 경로 자체를 만들지 않음 |
| 외부 store | 도입 안 함 (in-memory only) | v1.0 범위 밖, 별도 SPEC |

## 4. 위험과 완화

| ID | 심각도 | 위험 | 완화 |
|---|---|---|---|
| R1 | HIGH | 65 메서드 일괄 시그니처 변경으로 인한 회귀 | AST-grep 또는 TS Compiler API 활용으로 패턴 변환 일관성 보장. 기존 service.spec.ts 693건이 회귀 보호. e2e가 도구 호출 흐름을 끝단까지 검증. Phase 2~3을 단일 PR로 묶어 컴파일 무결성 보장. |
| R2 | MEDIUM | MCP SDK 1.29의 `RequestHandlerExtra.sessionId`가 가정대로 제공되지 않을 가능성 [ASSUMED] | RUN 첫 단계에서 `node_modules/@modelcontextprotocol/sdk/dist/types.d.ts` 직접 파싱 검증. 부재 시 transport adapter가 `req` 객체에 sessionId를 직접 부착하는 fallback 옵션. stateless 모드는 stateful로 전환하여 SDK가 sessionId를 안정 부여하게 한다. |
| R3 | LOW | stdio 고정 sessionId가 다른 시스템 sessionId와 충돌 가능성 | `__stdio_default__` 형태의 prefix/suffix 마커로 충돌 확률 무시 가능 수준. SDK가 randomUUID로 사용자 sessionId를 발급하므로 결정론적 충돌 0. |
| R4 | LOW | 잘못된 키 헤더로 들어와 매 호출마다 KTO 30/31/32 발생 | 기존 `KtoApiError(permanent: true)` 경로 그대로 사용. 별도 분기 불필요. 사용자에게 "키 확인" 가이드는 KtoApiError 메시지에 이미 포함. |
| R5 | MEDIUM | HTTP 헤더 case-insensitive 처리 누락 시 일부 클라이언트(`AUTHORIZATION` 대문자)에서 인증 실패 | Node `req.headers`는 SDK가 lowercase 정규화하지만 명시적으로 `req.headers['authorization']` 소문자 키로 조회. spec.ts에 대문자 헤더 케이스도 추가 검증. |
| R6 | LOW | stateful 모드 전환 시 메모리 누수 (세션 정리 누락) | transport `onclose` + `onsessionend` 콜백 모두에 `store.unregister` 연결. 프로세스 종료 시 in-memory Map은 자연 소멸. |
| R7 | LOW | 동일 sessionId로 재등록 시 이전 키 덮어쓰기 동작이 의도와 다를 가능성 | `register()` 동작 명세에서 "덮어쓰기" 명시. spec에 케이스 추가. |

## 5. MX Tag 계획

| 위치 | 태그 | 사유 |
|---|---|---|
| `SessionCredentialsStore.register` | `@MX:ANCHOR` | 모든 transport(3개)가 호출하는 단일 진입점. fan_in ≥ 3. `@MX:REASON`: 멀티 테넌트 키 라이프사이클 진입점 |
| `SessionCredentialsStore.get` | `@MX:ANCHOR` | tool-registry가 도구 호출마다 호출. fan_in ≥ 1이지만 모든 도구 흐름의 핵심 조회. `@MX:REASON`: 도구 호출 시점 키 조회 단일 통로 |
| `KtoHttpClient.request` | 기존 `@MX:ANCHOR` 갱신 | `@MX:REASON`에 "credentials 파라미터로 stateless 전환" 추가 |
| `KtoServiceKeyMissingError` | `@MX:NOTE` | 신규 에러 클래스의 의도 1줄 설명 |
| 65개 service 메서드 | `@MX:NOTE` | 시그니처 변경 사실 1줄 (각 메서드) |
| `http-streamable.adapter.handleRequest` (헤더 추출 부분) | `@MX:WARN` | 외부 입력 처리, 키 누설 위험. `@MX:REASON`: Authorization 헤더 raw 처리 |
| `http.adapter.handleRequest` (헤더 추출 부분) | `@MX:WARN` | 동일 사유 |

## 6. 우선순위

| Priority | 항목 |
|---|---|
| High | Phase 1, Phase 2, Phase 3 — 신규 인프라와 65 메서드 시그니처 정렬은 컴파일 무결성을 위해 단일 PR 단위로 진행 |
| High | Phase 4 — runtime 흐름 완성. R2 [ASSUMED] 검증 포함 |
| Medium | Phase 5 — e2e 시나리오와 문서 |
| Low | follow-up: README 한국어 번역, 운영 모니터링 메트릭 |

## 7. 단계 간 의존성

```
Phase 1 (Store + Error)
  ↓
Phase 2 (KtoHttpClient signature)
  ↓
Phase 3 (65 methods bulk update)  ← Phase 2와 단일 PR로 묶음 권장
  ↓
Phase 4 (transports + tool-registry + main)
  ↓
Phase 5 (e2e + README)
```

각 Phase는 직전 Phase의 컴파일 가능 상태를 전제로 한다. Phase 2~3은 65 메서드 일괄 수정의 본질상 한 커밋/PR로 진행하지 않으면 중간 상태에서 빌드가 깨진다.

## 8. 회귀 보호 전략

| 단계 | 메커니즘 |
|---|---|
| 컴파일 시점 | TypeScript strict 타입 체크가 시그니처 누락을 즉시 감지 |
| 단위 테스트 | 693+ 단위 테스트가 모든 service 메서드를 mock으로 검증 |
| e2e | stdio 모드 65 도구 모두 정상 동작 (기존 SPEC-KTO-001~010 acceptance 회귀 검증) |
| HTTP 시나리오 | 신규 e2e 시나리오 5건 (헤더 인증, 키 누락, 리스트 가능, 세션 분리, preencoded) |
| coverage | ≥ 85% 유지 |

## 9. RUN 단계 첫 작업

[ASSUMED] 마커 해소를 위해 RUN 진입 즉시:
1. `node_modules/@modelcontextprotocol/sdk` 디렉토리에서 `RequestHandlerExtra` 타입 정의 검색
2. `sessionId` 필드 존재 및 type 확인
3. stateless `sessionIdGenerator: undefined` 설정에서의 sessionId 동작 검증
4. 결과에 따라 Phase 4의 transport adapter 변경 범위 조정 (stateful 전환 필요 여부)

이 검증 결과는 Phase 4 착수 전에 progress.md에 기록한다.
