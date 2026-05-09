# Acceptance Criteria — SPEC-KTO-011

본 문서는 Given-When-Then 형식으로 SPEC-KTO-011의 합격 기준을 정의한다. 모든 기준은 자동화 테스트로 검증 가능해야 하며, e2e + 단위 테스트 조합으로 보장한다.

---

## AC-01: stdio 모드 기존 65 도구 회귀 0

**Given** `MCP_TRANSPORT_MODE=stdio`로 kto-mcp가 부팅되고, `KTO_SERVICE_KEY` env가 유효한 값으로 설정되어 있다.
**When** SPEC-KTO-001~010이 정의한 65개 도구 (`KOREAN_TOUR_INFO_TOOLS`, `BARRIER_FREE_TOUR_INFO_TOOLS`, `PHOTO_GALLERY_TOOLS`, `GO_CAMPING_TOOLS`, `ODII_TOOLS`, `DURUNUBI_TOOLS`, `PET_TOUR_TOOLS`, `MEDICAL_TOURISM_TOOLS`, `WELLNESS_TOURISM_TOOLS`, `PHOTO_AWARD_TOOLS`)을 차례로 호출한다.
**Then** 모든 도구는 SPEC-KTO-001~010의 기존 acceptance 기준을 그대로 충족하며, 본 SPEC 도입에 따른 신규 회귀가 없어야 한다. 기존 단위 테스트 693건 + e2e 30건이 모두 통과한다.

**검증**: `pnpm test`, `pnpm run test:e2e` 모두 통과.

---

## AC-02: HTTP transport에서 Authorization 헤더로 인증

**Given** `MCP_TRANSPORT_MODE=http-streamable` (또는 `http-json`)으로 kto-mcp가 부팅되었고, `KTO_SERVICE_KEY` env는 비어 있어도 부팅이 성공한다.
**When** MCP 클라이언트가 HTTP 요청에 `Authorization: Bearer <valid-kto-key>` 헤더를 동봉하여 임의의 도구를 `tools/call`로 호출한다.
**Then** transport adapter가 헤더에서 키를 추출하고 `SessionCredentialsStore.register(sessionId, credentials)`로 저장한 뒤, tool-registry가 해당 sessionId로 credentials를 조회하여 service 메서드에 전달하고, KTO API 호출이 정상 수행된 결과가 반환된다.

**검증**: e2e 시나리오 — HTTP transport 기동 후 `Authorization` 동봉 호출이 200 응답 + 정상 결과 반환.

---

## AC-03: HTTP transport에서 키 미설정 시 tools/call -32603

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 kto-mcp가 부팅되었다.
**When** MCP 클라이언트가 `Authorization` 헤더 **없이** `tools/call`을 호출한다.
**Then** tool-registry가 `KtoServiceKeyMissingError`를 throw하고, 이는 MCP error code `-32603` (Internal Error)로 변환되어 클라이언트에 반환된다. 에러 메시지는 "Set Authorization: Bearer <KTO service key> header"와 같은 사용자 가이드를 포함한다.

**검증**: e2e — 헤더 없이 도구 호출 시 응답이 isError: true이고 error code -32603, 메시지에 "Authorization" 키워드 포함.

---

## AC-04: HTTP transport에서 tools/list는 키 없이도 65 도구 반환

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅, `Authorization` 헤더 없음.
**When** MCP 클라이언트가 `tools/list` 요청을 보낸다.
**Then** 서버는 정상 응답으로 65개 도구의 카탈로그를 반환한다. 키 검증은 발생하지 않는다.

**검증**: e2e — 헤더 없이 tools/list 호출 시 응답에 65 도구 모두 포함.

---

## AC-05: HTTP transport에서 initialize는 키 없이도 성공

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅, `Authorization` 헤더 없음.
**When** MCP 클라이언트가 `initialize` 핸드셰이크를 수행한다.
**Then** 핸드셰이크는 정상 완료되며 서버 능력 정보가 반환된다. 키 검증은 발생하지 않는다.

**검증**: e2e — 헤더 없이 initialize 호출 시 정상 응답.

---

## AC-06: HTTP transport per-session 키 분리

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅되어 두 개의 독립된 MCP 세션이 동시에 활성화되어 있다 (각자 다른 sessionId).
**When** 세션 A는 `Authorization: Bearer KEY-A`로 도구를 호출하고, 동시에 세션 B는 `Authorization: Bearer KEY-B`로 도구를 호출한다.
**Then** 두 호출은 각자 자신의 키로 KTO API에 전달되며 서로 영향을 미치지 않는다. `SessionCredentialsStore`의 두 entry는 독립적으로 유지된다.

**검증**: e2e 또는 단위 테스트 — 두 세션의 client mock 호출에 각자의 credentials가 정확히 전달되는지 검증.

---

## AC-07: HTTP transport 잘못된 키 → KtoApiError 영구 에러

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅, 사용자가 `Authorization: Bearer <invalid-key>` 헤더 동봉.
**When** 도구를 호출한다.
**Then** KTO 게이트웨이가 코드 30/31/32 (등록 미상/만료/할당량 초과)를 반환하고, 기존 `KtoApiError(permanent: true)` 경로가 동작하여 재시도 없이 즉시 클라이언트에 에러 응답이 반환된다.

**검증**: e2e — 의도적 invalid 키로 호출 → 응답 isError + KtoApiError code 30/31/32 메시지 포함.

---

## AC-08: HTTP transport pre-encoded 키 헤더 처리

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅. 사용자가 이미 URL 인코딩된 KTO 키를 보유.
**When** `Authorization: Bearer <preencoded-key>` + `X-KTO-Service-Key-Preencoded: true` 헤더를 동봉하여 도구를 호출한다.
**Then** `SessionCredentialsStore`에 등록된 credentials의 `preencoded`가 `true`로 설정되고, `KtoHttpClient.request()`는 키를 추가 URL 인코딩 없이 그대로 KTO API에 전달한다. KTO API 호출이 정상 수행된다.

**검증**: 단위 테스트 — adapter spec에서 preencoded 헤더가 true로 설정될 때 store register 호출에 `preencoded: true`가 전달되는지 검증. http client spec에서 preencoded 분기가 동작하는지 검증.

---

## AC-09: stdio backward compat (헤더 무시)

**Given** `MCP_TRANSPORT_MODE=stdio`로 부팅, `KTO_SERVICE_KEY=ENV-KEY` env 설정.
**When** 부트스트랩이 `__stdio_default__` sessionId로 ENV-KEY를 store에 등록하고, 이후 도구 호출 시 stdio adapter는 어떠한 헤더도 처리하지 않는다.
**Then** 모든 도구 호출은 ENV-KEY로 동작한다. stdio adapter 코드 경로에는 `Authorization` 헤더 추출 로직이 존재하지 않는다.

**검증**: 단위 테스트 — stdio.adapter.spec.ts에서 부트 시 store.register가 `__stdio_default__` 인자로 정확히 호출되는지 검증. stdio adapter 코드에 `authorization` 문자열 grep 시 부재 확인.

---

## AC-10: HTTP 세션 종료 시 store entry 즉시 삭제

**Given** `MCP_TRANSPORT_MODE=http-streamable`로 부팅, 한 사용자가 세션을 열고 `Authorization` 헤더로 키를 등록하였다.
**When** 사용자가 MCP 세션을 종료하거나 transport `onclose` 콜백이 트리거된다.
**Then** `SessionCredentialsStore.unregister(sessionId)`가 즉시 호출되고, 이후 `store.get(sessionId)`은 `undefined`를 반환한다. 메모리에 키가 잔존하지 않는다.

**검증**: 단위 테스트 — adapter spec에서 close 콜백 시뮬레이션 후 store.unregister mock 호출 검증.

---

## AC-11: 키 누설 금지

**Given** kto-mcp가 임의의 transport 모드로 동작 중이다.
**When** 다음 시나리오가 발생한다:
- 정상 도구 호출
- KtoApiError 발생
- KtoServiceKeyMissingError 발생
- KtoValidationError 발생
- transport 부트/종료 라이프사이클
**Then** 다음 채널 어디에도 service key 전체가 출력되지 않는다:
- `console.log`, `console.error` 출력
- `KtoApiError`, `KtoServiceKeyMissingError`, `KtoValidationError`의 message 필드
- MCP 응답 본문 (`CallToolResult.content[*].text`)
- 단위 테스트 / e2e 출력

마지막 4자리만 `***1234` 형태로 표시하는 것은 디버깅 시점에서 **명시적으로** 허용된다.

**검증**: 단위 테스트 — 모든 에러 클래스의 `toString()` / `message` 필드를 키 패턴으로 검사하여 부재 확인. e2e 테스트 출력 로그를 정규식으로 스캔하여 키 전체값이 노출되지 않음을 검증.

---

## AC-12: Coverage ≥ 85%

**Given** SPEC-KTO-011 RUN 단계가 완료되었다.
**When** `pnpm run test:cov`를 실행한다.
**Then** 전체 라인 커버리지가 85% 이상이다. 신규/변경된 파일 (Phase 1~5에서 영향 받은 모든 파일)은 개별적으로 80% 이상이다.

**검증**: coverage 리포트 자동 검증.

---

## AC-13: 빌드 + Lint 통과

**Given** SPEC-KTO-011 RUN 단계가 완료되었다.
**When** `pnpm run build`, `pnpm run lint` 실행한다.
**Then** 모두 0 error / 0 warning.

**검증**: CI 통합. lint는 type-aware ESLint이므로 시그니처 불일치도 잡아낸다.

---

## Definition of Done

다음 모든 항목이 충족되어야 본 SPEC을 `completed` 상태로 전환한다:

- [ ] AC-01 ~ AC-13 모두 검증 통과
- [ ] 65개 service 메서드 시그니처 일괄 변경 완료
- [ ] `SessionCredentialsStore` + `KtoServiceKeyMissingError` 신규 구현
- [ ] 3개 transport adapter 변경 (http-streamable, http, stdio)
- [ ] tool-registry 신규 흐름 동작
- [ ] env.ts + main.ts 부트 분기 동작
- [ ] 단위 테스트 (기존 693 + 신규/갱신) 모두 통과
- [ ] e2e 테스트 (기존 30 + 신규 HTTP 시나리오 5+) 모두 통과
- [ ] Coverage ≥ 85%
- [ ] README 멀티 테넌트 가이드 추가
- [ ] [ASSUMED] 마커(SDK RequestHandlerExtra.sessionId) 검증으로 해소
- [ ] MX tag 계획 적용 (ANCHOR/NOTE/WARN)
- [ ] 키 누설 금지 검증 통과 (AC-11)

## 검증 방법 요약

| AC | 주요 검증 메커니즘 |
|---|---|
| AC-01 | 기존 e2e + unit 테스트 회귀 |
| AC-02 | HTTP e2e 신규 시나리오 |
| AC-03 | HTTP e2e + tool-registry 단위 테스트 |
| AC-04 | HTTP e2e |
| AC-05 | HTTP e2e |
| AC-06 | HTTP e2e + transport 단위 테스트 |
| AC-07 | HTTP e2e (mock 또는 실제 invalid 키) |
| AC-08 | http-client + adapter 단위 테스트 |
| AC-09 | stdio adapter 단위 테스트 + grep 검증 |
| AC-10 | adapter 단위 테스트 (close 콜백 mock) |
| AC-11 | 에러 message + 출력 로그 정규식 스캔 |
| AC-12 | `pnpm run test:cov` |
| AC-13 | `pnpm run build`, `pnpm run lint` |
