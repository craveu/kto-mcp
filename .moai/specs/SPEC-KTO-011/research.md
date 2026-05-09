# Research — SPEC-KTO-011: HTTP Multi-Tenant Service Key Injection

## 1. 배경 및 동기

### 1.1 단일 테넌트 → 멀티 테넌트 전환 필요성

SPEC-KTO-001~010 시리즈는 KTO 공공 API 17개 서비스를 65개 MCP 도구로 노출하는 작업을 main 브랜치에 머지하였다 (693 unit + 30 e2e tests, all green). 그러나 현 아키텍처는 **단일 테넌트(single-tenant)** 모델에 강하게 결합되어 있다.

현재 구조의 핵심 제약:
- `src/env.ts`의 `getEnv()`는 `KTO_SERVICE_KEY` 환경변수가 없거나 빈 값이면 즉시 throw하여 부트스트랩을 실패시킨다.
- `KtoHttpClient` 생성자는 `serviceKey`/`preencoded`를 한 번 받아 인스턴스 필드로 저장하고, 이후 모든 `request()` 호출에서 이를 재사용한다.
- 서버 한 프로세스 = 키 한 개 = 사용자 한 명.

이 모델은 Claude Desktop처럼 **사용자가 자신의 머신에서 stdio 서브프로세스를 직접 spawn**하는 패턴에서는 자연스럽다 (사용자가 자기 환경의 `.env`를 소유). 하지만 다음 시나리오에서는 동작하지 않는다:

| 시나리오 | 문제 |
|---|---|
| SaaS 호스팅 (예: 한 프로세스로 N명 응대) | 모든 사용자가 동일한 KTO 키를 공유 → 할당량/감사/요금 분리 불가 |
| B2B AI 에이전트 통합 | 호스팅 측이 사용자 키를 보관해야 함 → 보안·법적 부담 |
| 멀티 테넌트 게이트웨이 | 키가 부트 시점에 고정되어 사용자별 라우팅 불가 |

### 1.2 본 SPEC의 목표

HTTP 기반 transport(`http-streamable`, `http-json`)에 **per-session 키 주입** 메커니즘을 도입하되, 기존 stdio 사용자(Claude Desktop 등)에게는 **완전한 backward compatibility**를 제공한다. 호스팅 AI 서비스는 사용자 키를 자신의 인프라에 저장할 필요 없이 단순 패스스루(pass-through) 역할만 수행할 수 있게 된다.

## 2. 설계 대안 비교

세 가지 키 주입 패턴을 후보로 검토하였다.

### 2.1 Pattern A — Spawn-per-user (현재 stdio 모델 확장)

각 사용자에 대해 별도 서버 프로세스를 띄우고 그 프로세스의 환경변수에 키를 주입한다.

- 장점: 기존 코드 0줄 변경, 격리성 최고.
- 단점: 프로세스 풀 관리 필요, 메모리 N배, 로컬 환경 외 SaaS에 부적합.
- 결론: HTTP 멀티 테넌트 SaaS에는 **부적합**.

### 2.2 Pattern B — HTTP 헤더 per-session (본 SPEC 채택)

HTTP 요청 헤더 `Authorization: Bearer <key>`로 키를 전달하고 MCP 세션 단위로 인메모리에 저장한다.

- 장점: 표준 HTTP 인증 패턴, AI 에이전트 SDK가 이미 알고 있음, 1 프로세스 N 사용자.
- 단점: 헤더 라이프사이클을 transport adapter 단에서 관리해야 함 (~신규 store 1개 추가).
- 결론: **채택**. SaaS 멀티 테넌트의 사실상 표준이며 AI 도구 카탈로그 패턴과 잘 맞는다.

### 2.3 Pattern C — MCP tool argument

각 도구 호출의 `args`에 `service_key` 필드를 추가한다.

- 장점: transport 변경 없음, MCP 프로토콜 내부에서만 처리.
- 단점: 65개 모든 도구의 inputSchema에 노출 → AI가 매 호출마다 키를 args로 전달해야 하고 LLM 컨텍스트에 키가 노출. 도구 카탈로그 가독성 훼손. 표준 인증 패턴과 거리가 멈.
- 결론: **부적합**. 키는 메타데이터 레벨에서 처리되어야 한다.

### 2.4 채택 근거

Pattern B가 다음 모든 기준을 만족하는 유일한 옵션이다:
- 표준 HTTP 인증 패턴 준수 (`Authorization: Bearer <key>`).
- 단일 프로세스로 N 사용자 처리 (SaaS 친화).
- LLM 도구 args에 키 노출 없음 (보안).
- stdio 경로 변경 최소화 (backward compat).

## 3. 인증 헤더 표준 vs 커스텀

### 3.1 후보 헤더

| 헤더 | 표준성 | 가독성 | 결론 |
|---|---|---|---|
| `Authorization: Bearer <key>` | RFC 6750 (OAuth 2.0 Bearer Token) | AI 에이전트 SDK 기본 지원 | **채택** |
| `X-KTO-Service-Key: <key>` | 비표준 | 우리만의 커스텀 | 보조용도 미사용 |
| `X-API-Key: <key>` | 사실상 표준 (각 SaaS 자체 정의) | 다양한 의미로 혼용 | 미채택 |

### 3.2 보조 헤더

KTO API의 기존 quirk인 "키가 이미 URL 인코딩된 상태로 발급되는가" 플래그도 per-session 단위로 받을 필요가 있다. 사용자별로 키 발급 시점이 다르고 인코딩 상태도 다를 수 있기 때문이다.

- `X-KTO-Service-Key-Preencoded: true|false` (기본 `false`)

이 헤더는 본 프로젝트 고유이므로 `X-` prefix를 사용한다.

## 4. 백워드 호환성 보장 방법

### 4.1 stdio 경로

stdio transport는 단일 프로세스 = 단일 사용자 모델이 자연스럽다. Claude Desktop 통합 사용자들에게 영향이 없도록 다음을 보장한다:

- `MCP_TRANSPORT_MODE=stdio`일 때 `KTO_SERVICE_KEY`는 여전히 부트 시 필수.
- 부트스트랩이 stdio 모드에서 env로부터 키를 읽어 `SessionCredentialsStore`에 **고정 sessionId** (예: `__stdio_default__`)로 미리 등록.
- stdio adapter는 어떠한 헤더 처리도 하지 않으며, 전달되는 sessionId는 항상 `__stdio_default__` 한 개.
- HTTP 모드에서만 활성화되는 헤더 추출 로직은 stdio 코드 경로를 거치지 않는다.

### 4.2 통합 추상화

Pattern B의 가장 큰 위험은 "transport마다 키 조회 코드 경로가 달라져 tool-registry가 분기 투성이가 되는 것"이다. 이를 방지하기 위해 `SessionCredentialsStore`를 단일 추상화로 도입한다:

- stdio: 부트 시 단일 entry 등록 → `get('__stdio_default__')` → env 키.
- HTTP: 헤더 추출 후 sessionId 단위 등록 → `get(req.sessionId)` → 사용자 키.
- tool-registry는 두 경우 모두 동일한 API (`store.get(sessionId)`)로 처리.

이 설계로 tool-registry 코드가 transport-aware 분기 없이 한 줄짜리 lookup으로 끝난다.

## 5. 65개 메서드 일괄 수정의 현실성

### 5.1 변경 규모

서비스별 async 메서드 수 (코드베이스 grep으로 검증):

| Service | Methods |
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

각 메서드는 현재 `(dto: SomeDto)` 시그니처에서 `(dto: SomeDto, credentials: KtoCredentials)`로 확장된다. 메서드 본문은 `this.httpClient.request({...})` 호출 한 줄에 `credentials`를 추가 전달한다. 패턴이 극도로 단조롭다.

### 5.2 자동화 가능성

서비스 메서드 패턴은 일관되어 있어 다음 자동화 옵션이 모두 적용 가능하다:

- AST-grep (`ast-grep`): TypeScript 함수 시그니처 + body 패턴 매칭 후 일괄 변환.
- TypeScript Compiler API: `ts.transformer`로 정확한 AST 변경.
- 구식 sed: 패턴이 규칙적이므로 가능하나 검증 부담.

선택은 RUN 단계 manager-tdd에 위임하되, 본 SPEC은 "65 메서드 일관 변환 가능"을 가정한다. 각 변환은 테스트 1쌍 (`*.service.spec.ts`)으로 보호된다.

### 5.3 회귀 위험

R1 (HIGH) 위험은 본 SPEC의 가장 큰 리스크이다. 완화책:
- 서비스별 `*.service.spec.ts`가 모든 메서드를 mock 검증하므로 시그니처 누락은 즉시 컴파일 에러.
- e2e 테스트 (`test/kto.e2e-spec.ts`)가 도구 호출 흐름을 끝까지 검증.
- 변환을 한 서비스씩 나누어 적용하면 PR 단위 검증 가능 (단, 단일 SPEC으로 진행할 경우 모든 서비스가 동일 PR에서 변환되어야 컴파일 성공).

## 6. MCP SDK 1.29의 RequestHandlerExtra와 sessionId 노출

### 6.1 가정과 검증 필요 사항

`@modelcontextprotocol/sdk` v1.29에서 도구 핸들러는 다음 시그니처를 가진다 (현재 코드의 `tool-registry.ts` 사용 기준):

```
async (args, extra) => CallToolResult
```

여기서 `extra`는 `RequestHandlerExtra` 타입이며 SDK 문서에 따르면 sessionId, signal, requestId 등을 담는다.

[ASSUMED] `RequestHandlerExtra.sessionId`가 stateful StreamableHTTPServerTransport (sessionIdGenerator 비-undefined)에서 채워지며, stateless 모드(현재 두 HTTP adapter가 모두 `sessionIdGenerator: undefined`로 설정)에서는 `undefined`이거나 매 요청마다 새 ID이다.

본 SPEC의 결론: **HTTP transport를 stateful로 전환** (sessionIdGenerator를 randomUUID 기반 콜백으로 설정)해야 sessionId가 안정적으로 부여되고 store lookup이 가능해진다. 이는 RUN 단계 첫 작업으로 SDK `.d.ts`를 직접 파싱해 검증한다.

### 6.2 fallback 전략

만약 SDK가 sessionId를 노출하지 않거나 stateless 모드에서 사용 불가하면:
- 옵션 A: 헤더 추출 시점에 `randomUUID()`를 부여하고 `req` 객체에 부착, transport adapter가 sessionId를 직접 추적.
- 옵션 B: stateful 모드 사용 (sessionIdGenerator 활성화).

현 SPEC은 옵션 B를 기본 채택으로 가정한다.

## 7. 보안 고려사항

### 7.1 키 누설 방지

`Authorization` 헤더의 키는 **결코** 다음 채널에 출력되어서는 안 된다:
- console.log/error (운영 로그)
- 에러 메시지 (KtoApiError, KtoServiceKeyMissingError)
- HTTP 응답 본문
- MCP 응답 content

[HARD] 디버깅 목적의 키 미리보기가 필요한 경우, 마지막 4자리만 노출하는 헬퍼를 사용한다 (예: `***1234`).

### 7.2 HTTPS 강제

HTTP 헤더로 키를 전달하므로 평문 전송 시 누설 위험이 있다. 운영 환경 가이드라인:
- HTTP 모드는 항상 TLS 종단(reverse proxy 또는 직접) 뒤에서만 노출.
- 개발 모드의 평문 HTTP는 README에서 명시적으로 "loopback only" 경고.

본 SPEC은 TLS 종단 자체를 구현하지 않는다 (배포 인프라 책임). 코드 레벨 보장은 키를 로그에 남기지 않는 것에 한정한다.

### 7.3 세션 만료 시 즉시 삭제

세션이 종료되면 (transport `onclose` 콜백 또는 MCP `session/end` 처리) `SessionCredentialsStore.unregister(sessionId)`를 즉시 호출한다. 메모리 누수도 방지한다.

### 7.4 외부 store 미사용 (v1.0 범위)

Redis/etcd 등 외부 store는 본 SPEC에서 제외한다. 이유:
- 멀티 인스턴스 horizontal scaling은 별도 SPEC이 필요한 큰 결정.
- session affinity (sticky session) 또는 store sharing 중 결정 필요.
- 외부 store는 키 평문 저장 → 암호화·접근제어 정책 동반 필요.

v1.0은 단일 인스턴스 in-memory만 다루고, v1.1에서 별도 SPEC으로 분리한다.

## 8. 키 검증 타이밍 — Lazy 전략

### 8.1 MCP 라이프사이클 단계

| 단계 | 키 필요? | 사유 |
|---|---|---|
| `initialize` (handshake) | NO | 클라이언트 능력 협상은 키 없이 가능해야 한다. AI 에이전트가 도구 카탈로그 발견 단계에서 키를 미리 준비할 필요 없음. |
| `tools/list` | NO | 도구 목록은 누구나 볼 수 있게 한다. 사용자에게 "이 서버에서 어떤 도구가 있고 키가 필요한 시점이 언제인지" 알려준다. |
| `tools/call` | YES | 실제 KTO API 호출 시점. 여기서 키 부재면 즉시 명확한 MCP 에러로 차단. |

### 8.2 누락 시 에러 응답

`tools/call`에서 키 부재가 감지되면:
- 새 에러 클래스 `KtoServiceKeyMissingError`를 throw.
- tool-registry가 catch하여 MCP error code `-32603` (Internal Error)로 변환.
- 메시지에 사용자 친화적 가이드 포함: "Set Authorization: Bearer <KTO service key> header."

### 8.3 잘못된 키 처리

키가 헤더로 들어왔지만 KTO 서버가 30/31/32 (등록 안 됨/만료/할당량) 코드를 반환하면 기존 `KtoApiError(permanent: true)` 경로가 그대로 동작한다. 별도 분기가 필요하지 않다 — 본 SPEC의 변경 영향에서 자유롭다.

## 9. SessionCredentialsStore 설계 상세

### 9.1 책임 범위 (단일 책임 원칙)

`SessionCredentialsStore`는 다음만 한다:
- `register(sessionId: string, creds: KtoCredentials): void`
- `get(sessionId: string): KtoCredentials | undefined`
- `unregister(sessionId: string): void`

다음은 하지 않는다 (다른 모듈 책임):
- 헤더 파싱 → transport adapter
- 키 형식 검증 → `KtoHttpClient.request()` 동작 시 KTO API 응답으로 위임
- 키 암호화 → 메모리 only
- 영속화 → out of scope

### 9.2 구현체

NestJS `@Injectable()` 싱글톤. 내부 `Map<string, KtoCredentials>` 한 개. lock 불필요 (Node.js 단일 스레드).

### 9.3 KtoCredentials 타입

```ts
interface KtoCredentials {
  serviceKey: string;
  preencoded: boolean;
}
```

기존 `AppEnv` 인터페이스의 `ktoServiceKey` + `ktoServiceKeyPreencoded`와 동일한 구조이다. env 기반 stdio 부트와 헤더 기반 HTTP 부트 모두 같은 타입을 만들어 `register()`로 넘긴다.

## 10. KtoHttpClient signature 변경 영향도

### 10.1 현재 시그니처

```ts
class KtoHttpClient {
  constructor(serviceKey: string, preencoded: boolean, ...)
  async request<T>(opts: KtoRequestOptions): Promise<KtoListResponse<T>>
}
```

### 10.2 신규 시그니처 (제안)

```ts
class KtoHttpClient {
  constructor(...) // serviceKey/preencoded 제거
  async request<T>(
    opts: KtoRequestOptions,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<T>>
}
```

생성자에서 키를 빼고 매 호출마다 credentials를 받는다. 이로써 동일 인스턴스가 여러 사용자의 요청을 처리 가능해진다 (stateless).

### 10.3 영향 범위

- `KtoHttpClient` 자체: 생성자 변경, request signature 변경.
- 65개 service 메서드 전부: dto에 더해 credentials를 받아 request에 전달.
- `kto-http.client.spec.ts`: mock setup이 새 시그니처로 갱신.
- 10개 `*.service.spec.ts`: 모든 mock service method 호출 시 credentials 전달.
- `tool-registry.ts`: `serviceMethod.call(service, dto)` → `serviceMethod.call(service, dto, credentials)`로 변경.

## 11. 운영 측면 결정 사항

### 11.1 v1.0 범위 명시

| 결정 | 이유 |
|---|---|
| in-memory only | 멀티 인스턴스 미고려, 단순성 |
| 외부 store (Redis 등) 제외 | v1.1 별도 SPEC |
| 사용자별 quota/rate limit 제외 | 별도 관심사, 다음 SPEC |
| 키 회전/만료 정책 제외 | KTO API 측 정책 그대로 따름 |
| 디스크 키 암호화 제외 | 메모리 only이므로 N/A |
| 자동 로그 마스킹 제외 | 코드 레벨에서 의도적 비출력만 보장 (자동 PII 스캐너 미도입) |

### 11.2 모니터링 후속 과제

본 SPEC 외에 별도 다룰 항목:
- 활성 세션 수 메트릭 (Prometheus 등)
- 키 누락 에러 발생률 알림
- 세션 평균 수명 추적

## 12. 결론

본 SPEC-KTO-011은 SPEC-KTO-001~010이 구축한 단일 테넌트 인프라를 **최소 침습적**으로 멀티 테넌트화한다.

핵심 설계 결정 요약:
1. HTTP 헤더 `Authorization: Bearer <key>` per-session (Pattern B 채택).
2. 단일 추상화 `SessionCredentialsStore`로 stdio + HTTP 통합.
3. stdio는 부트 시 고정 sessionId로 env 키 등록 → backward compat 100%.
4. 키 검증은 lazy: tools/call 시점에서만 강제.
5. `KtoHttpClient.request()`가 매 호출마다 credentials 수신 → 65 메서드 시그니처 일괄 변경.
6. 외부 store는 v1.1로 분리.

다음 RUN 단계의 첫 작업은 [ASSUMED] 마커가 붙은 SDK 1.29의 `RequestHandlerExtra.sessionId` 동작 검증이다.
