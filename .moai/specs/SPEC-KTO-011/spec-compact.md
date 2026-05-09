# SPEC-KTO-011 Compact

## Goal

HTTP transport에 per-session 키 주입을 도입하여 멀티 테넌트 SaaS를 지원. stdio 사용자(Claude Desktop 등) backward compat 100%.

## EARS (5 modules)

- **REQ-KTO11-001 (Ubiquitous)** — HTTP는 `Authorization: Bearer <key>` 헤더로 키 수신, stdio는 env var 그대로. 단일 추상화 `SessionCredentialsStore`로 transport-agnostic 처리. `KtoHttpClient.request()`는 매 호출마다 credentials 받음 (생성자에서 키 제거).
- **REQ-EVT-001 (Event-driven)** — HTTP request → 헤더 추출 + sessionId↔creds 등록. tools/call → sessionId로 creds 조회 + 서비스 호출. 세션 종료 → store unregister. stdio 부트 → fixed sessionId `__stdio_default__`로 env creds 등록.
- **REQ-STATE-001 (State-driven)** — HTTP에서 키 없을 때 initialize/tools/list는 정상, tools/call은 -32603. stdio에서 헤더 무시. store entry 있는 세션은 그 키 재사용.
- **REQ-OPT-001 (Optional)** — `X-KTO-Service-Key-Preencoded: true` 헤더로 per-session preencoded 플래그. 기본 false. 외부 store(Redis 등)는 v1.1 별도 SPEC.
- **REQ-UNW-001 (Unwanted)** — 키 누락 tools/call → silent skip 금지, env fallback 금지, KtoServiceKeyMissingError. 키 전체값 로그/에러/응답 노출 금지 (마지막 4자리 미리보기만 명시적 허용). HTTP 모드에서 env+header 둘 다 있으면 header 우선. stdio + 키 누락 부트 → 즉시 fail (기존 동작 유지).

## Acceptance (highlight)

1. stdio 65 도구 회귀 0 (SPEC-KTO-001~010 호환)
2. HTTP `Authorization: Bearer <key>` → tools/call 정상
3. HTTP 키 누락 tools/call → MCP error -32603
4. HTTP tools/list / initialize는 키 없이도 정상 (lazy validation)
5. HTTP per-session 키 분리 (두 세션 다른 키 → 영향 없음)
6. HTTP 잘못된 키 → 기존 KtoApiError(permanent: true) 경로
7. HTTP `X-KTO-Service-Key-Preencoded: true` 동작
8. stdio adapter는 헤더 처리 코드 없음 (grep 검증)
9. HTTP 세션 종료 → store unregister 즉시
10. 키 전체값 로그/에러 노출 금지 (정규식 검증)
11. coverage ≥ 85%
12. lint/build 0 error

## Files to modify

| 분류 | 경로 |
|---|---|
| 신규 | `src/mcp/session-credentials.store.ts` (+ spec) |
| 수정 (인프라) | `src/env.ts`, `src/kto/kto-http.client.ts`, `src/kto/common/kto-error.ts`, `src/mcp/mcp.module.ts`, `src/mcp/tool-registry.ts`, `src/main.ts` |
| 수정 (transport) | `src/mcp/transports/http-streamable.adapter.ts`, `http.adapter.ts`, `stdio.adapter.ts` |
| 수정 (서비스 65 메서드) | `src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,audio-guide,durunubi,pet-tour,medical-tourism,wellness-tourism,photo-award}/*.service.ts` |
| 수정 (테스트) | 위 모든 파일의 `*.spec.ts` + `test/kto.e2e-spec.ts` |
| 문서 | `README.md` |

## Method count by service

KoreanTourInfo 15 + BarrierFreeTourInfo 10 + MedicalTourism 7 + WellnessTourism 8 + AudioGuide 8 + GoCamping 5 + PhotoGallery 4 + PetTour 4 + Durunubi 2 + PhotoAward 2 = **65 methods**.

## Exclusions

1. 외부 분산 store (Redis/etcd) — v1.1 별도 SPEC
2. 사용자별 rate limit / quota 분리 — 별도 관심사
3. 키 회전/만료 정책 — KTO API 측 정책 그대로
4. 디스크 키 암호화 — 메모리 only이므로 N/A
5. 자동 로그 마스킹 시스템 — 코드 단계 의도적 비출력만 보장
6. TLS 종단 / HTTPS 강제 — 배포 인프라 책임
7. horizontal scaling sticky session — 외부 store와 함께 차기 SPEC
8. Bearer 외 다른 인증 (mTLS, OAuth code flow) — out of scope

## Key design decisions

1. **Pattern B (HTTP header per-session)** 채택. Pattern A (spawn-per-user) SaaS 부적합, Pattern C (tool arg) LLM 컨텍스트에 키 노출.
2. **단일 추상화 `SessionCredentialsStore`**. stdio는 부트 시 fixed sessionId `__stdio_default__`로 env creds 등록. tool-registry는 transport 분기 없이 lookup.
3. **Lazy validation**. initialize/tools/list는 키 없이도 통과, tools/call에서만 강제. AI 에이전트가 도구 카탈로그 발견 후 사용자에게 키 요청 가능.
4. **`KtoHttpClient.request()` stateless 전환**. 생성자에서 키 제거, 매 호출 credentials 수신. 한 인스턴스가 N 사용자 처리.
5. **65 메서드 일괄 변경**. AST-grep 또는 TS Compiler API 자동화. 단일 PR로 묶어 컴파일 무결성 보장.
6. **In-memory only (v1.0)**. 외부 store, sticky session, horizontal scaling은 v1.1 별도 SPEC.

## R1 65-method change scope

- 모든 메서드가 동일 패턴: `(dto)` → `(dto, credentials)` + `request({...})` → `request({...}, credentials)`
- 자동화 가능 (AST-grep / TS Compiler API)
- 컴파일 시점 TypeScript strict가 누락 즉시 검출
- 기존 service.spec.ts 693건이 mock 검증으로 회귀 보호
- e2e 30건이 도구 호출 흐름 끝단 검증
- Phase 2~3 단일 PR로 묶음 (중간 상태 빌드 깨짐 방지)

## Open question (RUN 첫 작업)

[ASSUMED] MCP SDK 1.29 `RequestHandlerExtra.sessionId` 동작 — `node_modules/@modelcontextprotocol/sdk` `.d.ts` 직접 검증. stateless 모드에서 sessionId 부여 안 되면 stateful 전환 (`sessionIdGenerator: randomUUID`).
