---
id: SPEC-KTO-011
version: 0.1.0
status: draft
created: 2026-05-10
updated: 2026-05-10
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-011: HTTP Transport Multi-Tenant Service Key Injection

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1.0 | 2026-05-10 | Seonho Kim | 초기 draft. SPEC-KTO-001~010 단일 테넌트 인프라(65 도구, 693 unit + 30 e2e tests)를 HTTP 헤더 per-session 키 주입 모델로 확장. stdio backward compat 보장. SessionCredentialsStore 단일 추상화 도입. |

## 1. 배경 및 동기

KTO 통합 시리즈(SPEC-KTO-001~010)는 단일 테넌트 모델로 완성되었다. `KTO_SERVICE_KEY` 환경변수 한 개 = 서버 한 프로세스 = 사용자 한 명. 이 모델은 Claude Desktop처럼 사용자가 stdio 서브프로세스를 자기 환경에서 직접 spawn하는 시나리오에 적합하다.

본 SPEC-KTO-011은 다음 시나리오를 추가로 지원한다:
- SaaS 호스팅 — 한 프로세스가 N명의 사용자를 응대하며 각자 자기 KTO 키를 사용.
- B2B AI 에이전트 통합 — 호스팅 측이 사용자 키를 보관하지 않고 단순 패스스루.
- 멀티 테넌트 게이트웨이 — 사용자별 KTO 할당량/감사 분리.

전환 전략은 **HTTP 헤더 per-session 키 주입 (Pattern B)**이다. 도입의 핵심은 `SessionCredentialsStore`라는 단일 추상화로 stdio와 HTTP 두 경로를 통합하여, tool-registry 단의 분기 없이 transport-agnostic하게 키를 조회할 수 있게 하는 것이다. stdio 사용자(Claude Desktop 등)에게는 backward compatibility가 보장된다.

## 2. EARS 요구사항 (5 모듈)

### REQ-KTO11-001 — Ubiquitous (시스템 항상 만족)

The kto-mcp HTTP transports (`http-streamable`, `http-json`) shall extract the KTO service key from the `Authorization: Bearer <key>` request header on each MCP session and pass it through `SessionCredentialsStore` to downstream KTO API calls.

The kto-mcp stdio transport shall continue to consume `KTO_SERVICE_KEY` from environment variables at bootstrap time, registering the resulting credentials under the fixed session identifier `__stdio_default__` in the same `SessionCredentialsStore` so that downstream consumers (tool-registry, services) operate transport-agnostically.

The `SessionCredentialsStore` shall be the single source of truth for the active service key during a tool-call request, exposing `register(sessionId, credentials)`, `get(sessionId): KtoCredentials | undefined`, and `unregister(sessionId)` operations.

The `KtoHttpClient.request()` method shall accept a `credentials: KtoCredentials` argument per call and shall not retain the service key as constructor state, so that a single client instance can serve multiple tenants concurrently.

### REQ-EVT-001 — Event-driven (이벤트 트리거)

When an HTTP request reaches the `http-streamable` or `http-json` transport adapter and an MCP session identifier is established, the system shall parse the `Authorization` and `X-KTO-Service-Key-Preencoded` headers, build a `KtoCredentials` record, and register it via `SessionCredentialsStore.register(sessionId, credentials)`.

When the MCP framework dispatches a `tools/call` request, the system shall resolve the active session identifier from the SDK's `RequestHandlerExtra` and look up credentials via `SessionCredentialsStore.get(sessionId)` before invoking the target service method, passing the credentials through to `KtoHttpClient.request()`.

When an MCP session terminates (transport `onclose` callback or session close handler), the system shall invoke `SessionCredentialsStore.unregister(sessionId)` immediately to drop the in-memory credentials entry.

When the kto-mcp process boots in `MCP_TRANSPORT_MODE=stdio`, the system shall read `KTO_SERVICE_KEY` and `KTO_SERVICE_KEY_PREENCODED` from environment variables, fail fast if the key is missing, and pre-register the resulting credentials under session id `__stdio_default__`.

### REQ-STATE-001 — State-driven (상태 조건)

While the active transport is `http-streamable` or `http-json` and no credentials are registered for the resolved session identifier, the system shall accept `initialize` and `tools/list` requests normally (returning the tool catalogue), but shall reject any `tools/call` request by raising a `KtoServiceKeyMissingError` and converting it to an MCP error response with code `-32603`.

While the active transport is `stdio`, the system shall ignore any `Authorization` or `X-KTO-Service-Key-Preencoded` header that may appear in upstream request payloads, since the stdio adapter does not parse HTTP headers and credentials are sourced exclusively from the environment-derived `__stdio_default__` entry.

While `SessionCredentialsStore` holds an entry for a given session identifier, the system shall reuse the stored credentials for every tool-call request bound to that session until the session is unregistered.

### REQ-OPT-001 — Optional (확장 기능)

Where the HTTP request includes the optional header `X-KTO-Service-Key-Preencoded: true`, the system shall mark the session credentials as pre-encoded so that `KtoHttpClient.request()` skips its URL-encoding step for the service key on every call within that session.

Where the HTTP request omits the `X-KTO-Service-Key-Preencoded` header, the system shall default the `preencoded` flag to `false` for that session.

Where future deployments need to share session credentials across multiple kto-mcp instances (horizontal scaling), they may introduce an external store; this SPEC explicitly defers that capability to a follow-up SPEC and provides only an in-memory implementation.

### REQ-UNW-001 — Unwanted (금지 동작)

If a `tools/call` request is dispatched in HTTP transport mode and `SessionCredentialsStore.get(sessionId)` returns `undefined`, then the system shall not silently skip the request, shall not fall back to environment variables, and shall not invoke the downstream service method; it shall instead raise `KtoServiceKeyMissingError` with a user-facing guidance message instructing the caller to set the `Authorization: Bearer <KTO service key>` header.

If at any point during request handling the system needs to log or expose credential material, it shall not write the full service key to any log channel, error message, MCP response body, or telemetry sink; only the last four characters may be included for debugging when explicitly requested by a maintainer (`***1234` style preview).

If both `KTO_SERVICE_KEY` environment variable and an `Authorization` header are present in HTTP transport mode, the system shall not mix the two; the per-session header value shall take precedence and the environment variable shall be ignored for that session.

If `MCP_TRANSPORT_MODE=stdio` and `KTO_SERVICE_KEY` is missing or empty at bootstrap, then the process shall not start; the existing `getEnv()` fail-fast behavior is preserved.

## 3. 영향 받는 파일

| 분류 | 경로 | 변경 유형 | 비고 |
|---|---|---|---|
| 환경 검증 | `src/env.ts` | 수정 | HTTP 모드일 때 `KTO_SERVICE_KEY` 선택적으로 처리 |
| HTTP 클라이언트 | `src/kto/kto-http.client.ts` | 수정 | `request(opts, credentials)` 시그니처. 생성자에서 키 제거 |
| 에러 클래스 | `src/kto/common/kto-error.ts` | 수정 | `KtoServiceKeyMissingError` 추가 |
| 신규 인프라 | `src/mcp/session-credentials.store.ts` | 신규 | `@Injectable` 싱글톤 |
| MCP 모듈 | `src/mcp/mcp.module.ts` | 수정 | `SessionCredentialsStore` provider 등록 + export |
| 도구 라우팅 | `src/mcp/tool-registry.ts` | 수정 | `extra.sessionId` 추출 → store lookup → service 호출 시 credentials 전달 |
| HTTP transport (SSE) | `src/mcp/transports/http-streamable.adapter.ts` | 수정 | 헤더 추출 + store register/unregister |
| HTTP transport (JSON) | `src/mcp/transports/http.adapter.ts` | 수정 | 동일 |
| stdio transport | `src/mcp/transports/stdio.adapter.ts` | 수정 | 부트 시 고정 sessionId로 env creds 등록 |
| 부트스트랩 | `src/main.ts` | 수정 | 모드별 env 검증 분기 + stdio creds 사전 등록 |
| 서비스 (10개) | `src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,audio-guide,durunubi,pet-tour,medical-tourism,wellness-tourism,photo-award}/*.service.ts` | 수정 | 65개 메서드 모두 `(dto, credentials)` 시그니처로 확장 |
| 서비스 단위 테스트 | 위 10개 폴더의 `*.service.spec.ts` | 수정 | 모든 호출에 credentials 전달 |
| HTTP 클라이언트 테스트 | `src/kto/kto-http.client.spec.ts` | 수정 | 새 시그니처 반영 |
| tool-registry 테스트 | `src/mcp/tool-registry.spec.ts` | 수정 | creds lookup 시나리오 추가 |
| HTTP adapter 테스트 | `src/mcp/transports/http-streamable.adapter.spec.ts`, `http.adapter.spec.ts` | 수정 | 헤더 추출 + register 검증 |
| stdio adapter 테스트 | `src/mcp/transports/stdio.adapter.spec.ts` | 수정 | 사전 등록 동작 검증 |
| env 테스트 | `src/env.spec.ts` | 수정 | HTTP 모드에서 키 선택적 허용 검증 |
| e2e | `test/kto.e2e-spec.ts` | 수정 | HTTP 헤더 인증 시나리오 추가 |
| 문서 | `README.md` | 수정 | 멀티 테넌트 사용 가이드 추가 |

## 4. Exclusions (의도적 비범위)

본 SPEC은 다음 항목을 **포함하지 않는다**. 각 항목은 별도 SPEC으로 다룬다:

1. **외부 분산 store (Redis, etcd 등)** — v1.1 별도 SPEC. 본 SPEC은 단일 인스턴스 in-memory `Map`만 다룬다.
2. **사용자별 rate limit / quota 분리** — KTO 게이트웨이가 키 단위로 자체 제한을 두므로 본 SPEC에서는 추가 분리 로직을 도입하지 않는다.
3. **키 회전/만료 정책** — KTO API 측 정책을 그대로 따른다. 만료 시 다음 호출에서 30/31/32 코드로 자연스럽게 거부된다.
4. **서버 디스크 키 암호화 저장** — 메모리에만 보관하므로 N/A.
5. **자동 로그 마스킹 시스템** — 본 SPEC은 코드 단계에서 키를 의도적으로 비출력하는 것만 보장한다. 별도의 PII 스캐너 도입은 본 SPEC 범위 밖이다.
6. **TLS 종단 / HTTPS 강제** — 배포 인프라(reverse proxy 등)의 책임. 본 SPEC은 README에 가이드만 추가한다.
7. **horizontal scaling을 위한 sticky session 구성** — 외부 store와 함께 다음 SPEC에서 다룬다.
8. **`Authorization` 외 다른 인증 스킴 (mTLS, OAuth 인증 코드 흐름 등)** — 본 SPEC은 Bearer 토큰만 지원한다.

## 5. Non-Goals (혼동 방지용 명시)

- 본 SPEC은 신규 도구를 추가하지 않는다. 기존 65 도구의 동작은 그대로 유지된다.
- 본 SPEC은 KTO API 응답 정규화·재시도 로직을 변경하지 않는다.
- 본 SPEC은 도구 inputSchema에 service_key 필드를 추가하지 않는다 (Pattern C 거부).

## 6. 의존 SPEC

- 선행: SPEC-KTO-001 ~ SPEC-KTO-010 (모두 main 머지 완료)
- 본 SPEC은 위 시리즈의 인프라 (`KtoHttpClient`, `tool-registry`, transport adapters, 10개 service 모듈)를 직접 변경한다.
