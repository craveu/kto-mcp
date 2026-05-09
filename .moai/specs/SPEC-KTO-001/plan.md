# Plan: SPEC-KTO-001 (KTO MCP 서버 1차 이터레이션)

## 개요

`spec.md` 의 요구사항을 만족하는 NestJS 11 기반 MCP 서버를 우선순위 기반 단계로
점진 구현한다. 본 문서는 작업 분해(WBS), 기술 결정 사항, 위험 요소, 그리고
구현 시 적용할 MX 태그 계획을 정의한다.

---

## 1. 기술 결정 사항

### 1.1 라이브러리 선정 (TBD 해소)

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| MCP SDK | `@modelcontextprotocol/sdk` 1.x 안정 채널 | 공식 TypeScript SDK. v2.x는 pre-alpha로 배제. |
| HTTP 클라이언트 | `axios` 직접 사용 | NestJS HttpModule은 RxJS Observable로 래핑하나, 본 서버에서는 Promise 기반 호출이 단순. 직접 사용으로 인터셉터·재시도 미들웨어 명시화. |
| XML 파서 | `fast-xml-parser` | KTO 게이트웨이 오류 응답(`OpenAPI_ServiceResponse`)만 파싱. JSON 응답은 axios 기본 파서 사용. |
| 검증 | `class-validator` + `class-transformer` | NestJS 표준. JSON Schema 변환은 `class-validator-jsonschema` 또는 자체 매퍼로 처리. |
| 테스트 | `jest` 30 (기존), `nock` (HTTP 모킹) | `nock` 으로 KTO API 호출을 결정론적으로 모킹. supertest는 e2e의 HTTP 모드에서만 사용. |

### 1.2 아키텍처 결정

#### 1.2.1 Transport별 부트스트랩 전략

- **stdio 모드**: `NestFactory.createApplicationContext(AppModule)` 로 컨테이너만 생성, HTTP 서버 미기동. `StdioServerTransport`로 stdin/stdout 결합.
- **streamable-http 모드**: `NestFactory.create()` + Express 어댑터, `/mcp` 라우트에 `StreamableHTTPServerTransport` 마운트.
- **http (non-streamable) 모드**: NestJS 컨트롤러로 `POST /mcp` 단일 요청-응답. MCP `tools/list` + `tools/call` JSON-RPC만 지원하는 단순화 어댑터.

세 어댑터는 공통 인터페이스 `McpTransportAdapter` 를 구현하여 `main.ts`에서 동적 선택.

#### 1.2.2 MCP 도구 등록 전략

- 각 KTO 오퍼레이션을 1:1로 도구화 (오퍼레이션명 → `kto_korean_{operationName}`).
- 도구 정의는 `korean-tour-info.tools.ts` 에 메타데이터(이름, 설명, 입력 DTO 클래스, 핸들러 메서드명) 배열로 선언.
- `ToolRegistry.registerAll(server, tools)` 가 배열을 받아 일괄 등록 + JSON Schema 변환 + DTO 검증 래핑.

#### 1.2.3 KTO 공용 클라이언트 설계

```
KtoHttpClient.request<TParams, TResult>({
  serviceName: 'KorService2',           // 다국어 확장 시 변경 지점
  operation: 'areaBasedList2',
  params: TParams,
})
  ↓
- baseURL 결정: BASE_URL_MAP[serviceName]
- URL: `${baseURL}/${operation}`
- 공통 파라미터 자동 주입: serviceKey, MobileOS, MobileApp, _type=json
- axios 호출 → 재시도 미들웨어 → 응답 정규화
- 정상: response.body.items.item → 배열 보정
- 게이트웨이 오류 (XML): fast-xml-parser → KtoApiError throw
```

---

## 2. Phase 별 작업 분해 (Priority-based)

### Phase 1: Foundation [Priority High]

목적: 환경변수·MCP·기본 모듈 골격 구축.

1. `package.json`에 의존성 추가 (`@modelcontextprotocol/sdk`, `axios`, `class-validator`, `class-transformer`, `fast-xml-parser`, dev: `nock`).
2. `.env.example` 생성.
3. `src/env.ts` — `getEnv()` 함수, `KTO_SERVICE_KEY` 누락 시 `Error` throw (REQ-UNW-001).
4. `src/mcp/types/mcp.types.ts` — 공용 타입 (도구 메타데이터, 핸들러 시그니처).
5. `src/mcp/mcp.module.ts`, `src/mcp/mcp.service.ts` — 서버 라이프사이클 관리.

### Phase 2: KTO Common Layer [Priority High]

목적: 모든 도구가 의존하는 HTTP 클라이언트와 공용 인프라.

6. `src/kto/common/constants.ts` — `BASE_URL_MAP`, 공통 파라미터, 에러 코드 매핑.
7. `src/kto/common/kto-error.ts` — `KtoApiError`, `KtoValidationError` 클래스.
8. `src/kto/common/types.ts` — `KtoResponse<T>`, `KtoListItem` 등.
9. `src/kto/common/response-normalizer.ts` — `items.item` → 배열 보정 함수.
10. `src/kto/kto-http.client.ts` — axios 기반 클라이언트, 재시도 인터셉터(REQ-STATE-001), 게이트웨이 오류 파싱(REQ-UNW-002).
11. `src/kto/kto.module.ts`.
12. 단위 테스트: `kto-http.client.spec.ts` (nock 기반, 정상/5xx 재시도/게이트웨이 오류 시나리오).

### Phase 3: Korean Tour Info Module [Priority High]

목적: 15개 오퍼레이션을 DTO·서비스·도구로 매핑.

13. `dto/*.ts` — 각 오퍼레이션별 입력 DTO 15종 + `index.ts` 배럴.
14. `korean-tour-info.service.ts` — 15개 메서드 (각 메서드는 `KtoHttpClient.request()` 호출).
15. `korean-tour-info.tools.ts` — 도구 메타데이터 배열 (이름, 설명, DTO, 메서드명).
16. `korean-tour-info.module.ts`.
17. 단위 테스트: `korean-tour-info.service.spec.ts` (서비스 메서드 정상/엣지 케이스).

### Phase 3.5: MX Tag Application [Priority Medium]

Phase 3 산출물에 MX 태그 적용. 본 SPEC의 MX Tag Plan(아래 5번 섹션) 참조.

### Phase 4: MCP Tool Registry and Transports [Priority High]

목적: MCP 서버 본체와 transport 어댑터 구현.

18. `src/mcp/tool-registry.ts` — `registerAll()` 구현 (DTO 검증 래핑 + JSON Schema 생성, REQ-KTO-005, REQ-KTO-006).
19. `src/mcp/transports/stdio.adapter.ts` — `StdioServerTransport` 결합.
20. `src/mcp/transports/http-streamable.adapter.ts` — Express 라우트 + `StreamableHTTPServerTransport`.
21. `src/mcp/transports/http.adapter.ts` — 단순 JSON-RPC 단일 요청-응답.
22. 단위 테스트: `tool-registry.spec.ts`.

### Phase 5: Bootstrap Integration [Priority High]

목적: `main.ts` 통합 및 graceful shutdown.

23. `src/main.ts` — 환경변수 로드 → 컨테이너 생성 → 도구 등록 → transport 부착 → 시그널 핸들러 (REQ-KTO-007, REQ-EVT-002).
24. `src/app.module.ts` — `McpModule`, `KtoModule`, `KoreanTourInfoModule` import.

### Phase 6: e2e and Verification [Priority Medium]

목적: 통합 검증 및 커버리지 목표 달성.

25. `test/kto.e2e-spec.ts` — stdio 시나리오 (in-process), HTTP streamable 시나리오 (supertest).
26. 커버리지 검증 (`pnpm test:cov`) — 85% 미만이면 보강 테스트 추가.
27. Lint 무에러 + Build 성공 확인.

---

## 3. Reference Implementation Hints

| 항목 | 참고처 |
|------|--------|
| 현재 NestJS 진입 패턴 | `src/main.ts` (현재 `NestFactory.create` + `app.listen(3000)` 단순 패턴) |
| 현재 모듈 등록 패턴 | `src/app.module.ts` (`@Module({ controllers, providers })`) |
| MCP TypeScript SDK 예제 | `https://github.com/modelcontextprotocol/typescript-sdk` README 의 stdio/HTTP 예제 |
| KorService2 응답 스키마 | `research.md` §4 (오퍼레이션 카탈로그) |
| 게이트웨이 오류 처리 | `research.md` §5.3 |
| 페이지네이션 정책 | `research.md` §6 |

---

## 4. Risks and Mitigations

| 위험 | 영향 | 완화 전략 |
|------|------|-----------|
| **R1. KTO API rate limit** — 일일 호출 한도(`returnReasonCode=22`) 초과 시 모든 도구가 실패 | 高 | 클라이언트가 22 코드를 명시적 에러로 분류하고 재시도 안 함(영구적 오류). 운영 가이드에 한도 명시. |
| **R2. XML/JSON 응답 불일치** — `_type=json` 지정해도 게이트웨이 오류는 XML | 中 | 응답 Content-Type 또는 첫 바이트(`<` vs `{`)로 분기, fast-xml-parser는 게이트웨이 오류만 처리. |
| **R3. serviceKey URL 인코딩 이중화** — encoded 키 + 라이브러리 자동 인코딩 → 30 에러 | 高 | 환경변수에 decoded 키 권장 + `KTO_SERVICE_KEY_PREENCODED=true` 옵션 제공. 두 모드 모두 통합 테스트로 검증. |
| **R4. 단일 객체 ↔ 배열 응답 변동** — 결과 1건일 때 `items.item`이 배열 아님 | 中 | `response-normalizer.ts`에서 항상 배열로 보정. 단위 테스트로 두 변체 모두 커버. |
| **R5. 다국어 확장 시 base URL 분기 누락** | 中 | `BASE_URL_MAP` 단일 출처화 + `serviceName` 파라미터 필수화. 클라이언트 인터페이스에 union type 적용. |
| **R6. MCP SDK 버전 비호환** — 1.x 마이너 변경으로 transport API 변동 가능 | 中 | `package.json`에서 `~`(틸드)로 patch만 허용 핀. 업그레이드는 별도 SPEC. |
| **R7. KorService2의 `detailPetTour2` 부재 가능성** | 低 | 통합 테스트에서 404 시 도구를 비활성화 + 사용자 가이드에 비고 추가. SPEC-KTO-002 에서 별도 API ID(15135102)로 분리 검토. |

---

## 5. MX Tag Plan (Phase 3.5)

본 SPEC의 신규 산출물에 적용할 MX 태그 계획. 코딩 표준의 자동화된 태그 정책을 따른다.

### Anchor 태그 (high fan_in 함수)

| 대상 | 태그 | 사유 |
|------|------|------|
| `KtoHttpClient.request()` (`src/kto/kto-http.client.ts`) | `@MX:ANCHOR` | 모든 도구 핸들러가 호출. 예상 fan_in ≥ 15. |
| `ToolRegistry.registerAll()` (`src/mcp/tool-registry.ts`) | `@MX:ANCHOR` | 부트스트랩에서 1회 호출되나 모든 도구의 등록·검증·라우팅 진입점. |
| `normalizeItems()` (`src/kto/common/response-normalizer.ts`) | `@MX:ANCHOR` | 모든 KTO 응답이 통과. |

### Warn 태그 (위험 패턴)

| 대상 | 태그 | 사유 |
|------|------|------|
| 재시도 인터셉터 (`KtoHttpClient` 내부) | `@MX:WARN` | 지수 백오프 + jitter + 영구 오류 분류 로직. 복잡도 ≥ 10 예상. |
| `parseGatewayError()` (`src/kto/kto-http.client.ts`) | `@MX:WARN` | XML 파싱 + 코드 매핑 + 분기. 외부 입력 의존. |

### Note 태그 (의도/계약 명시)

| 대상 | 태그 | 사유 |
|------|------|------|
| `getEnv()` 의 `KTO_SERVICE_KEY` 누락 처리 (`src/env.ts`) | `@MX:NOTE` | REQ-UNW-001의 부트스트랩 실패 계약을 코드에 명시. |
| `BASE_URL_MAP` (`src/kto/common/constants.ts`) | `@MX:NOTE` | 다국어 확장 지점임을 차기 이터레이션 개발자에게 안내. |

### TODO 태그 (테스트 미작성)

- 모든 신규 public 함수에 작성 직후 `@MX:TODO test`를 부여.
- Phase 3 단위 테스트가 통과하면 해당 TODO 는 일괄 제거.

### Legacy 태그

해당 없음 (1차 이터레이션은 신규 코드만 추가; 기존 `app.controller.ts` 등은 유지).

---

## 6. Definition of Done (Plan-level)

본 plan이 "완료"되었다고 선언할 수 있는 조건은 `acceptance.md`에 정의된 모든 시나리오 PASS + Success Criteria(`spec.md`) 충족. 작업 도중 각 Phase 종료 시점에 다음을 점검:

- Phase 1 종료: 환경변수 누락 시 부트스트랩 즉시 실패 동작 확인.
- Phase 2 종료: `KtoHttpClient` 단위 테스트 모두 PASS, 5xx 재시도 동작 검증.
- Phase 3 종료: 15개 도구 메타데이터가 모두 등록 가능한 형태로 export 됨.
- Phase 4 종료: stdio + HTTP 두 transport에서 `tools/list` 응답에 15개 도구 포함.
- Phase 5 종료: SIGTERM 시 graceful shutdown 동작.
- Phase 6 종료: 커버리지 ≥ 85%, e2e 모두 PASS.

---

Version: 0.1.0
Last Updated: 2026-05-09
