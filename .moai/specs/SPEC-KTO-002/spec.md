---
id: SPEC-KTO-002
version: 0.1.0
status: draft
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-002: KTO MCP 서버 2차 이터레이션 (KorWithService2 무장애 여행 정보)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. KorWithService2 무장애 여행 정보 API(data.go.kr ID 15101897) 를 MCP 도구로 매핑하는 2차 이터레이션 정의. SPEC-KTO-001 의 KtoHttpClient·response-normalizer·tool-registry·transport 인프라 100% 재사용. |

---

## Overview

SPEC-KTO-001 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에 한국관광공사
무장애 여행 정보 조회 API(`KorWithService2`, data.go.kr ID 15101897) 를 추가
통합한다. 본 SPEC 은 SPEC-KTO-001 의 공용 인프라(`KtoHttpClient`,
`response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책)를
변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/barrier-free-tour-info/` 를 추가**하고
`BASE_URL_MAP` 에 `KorWithService2` 항목 1줄을 추가한다.

상위 컨텍스트는 `research.md` (KorService2 와의 차이점·무장애 응답 필드 카탈로그) 에서
확인하고, 구체적 작업 분해는 `plan.md`, 검증 시나리오는 `acceptance.md` 를 참조한다.

본 SPEC 은 패턴 복제(replication) SPEC 으로, 신규 추상화·신규 라이브러리 도입 없이
무장애 도메인 모듈만 추가한다.

---

## Scope

### In Scope (2차 이터레이션)

- `KorWithService2` 오퍼레이션의 MCP 도구 매핑 (1:1, 최대 15개; 정확한 수는 RUN Phase 첫 통합 테스트로 확정)
- 무장애 고유 오퍼레이션 `detailWithTour2` 도구 등록 (필수)
- `BASE_URL_MAP` 에 `KorWithService2` 항목 추가 (1줄 수정)
- `KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종 변경 없이 재사용
- 도구 이름 prefix `kto_barrier_free_*` 로 KorService2 도구(`kto_korean_*`) 와 네임스페이스 분리
- Jest 단위 테스트 + e2e 테스트 (커버리지 85% 이상 유지)
- KorService2 회귀 무사고 검증 (`pnpm test` 전수 통과)

### Out of Scope (Exclusions — What NOT to Build)

본 이터레이션에서 명시적으로 제외하는 항목:

1. **무장애 다국어 변체 본격 구현** — `EngWithService2`, `JpnWithService2` 등 무장애 다국어 변체는 존재 여부가 불명확하며, 정식 검증·도구 등록은 차기 SPEC 으로 이관.
2. **데이터 캐싱 / 영속 저장소(DB·Redis)** — SPEC-KTO-001 정책 동일. 모든 호출은 KTO API 직접 호출.
3. **KorService2 와 KorWithService2 응답을 머지하는 통합 검색 도구** — 예: "특정 contentId 의 일반 정보 + 무장애 정보 한 번에 조회" 같은 합성 도구. 별도 SPEC 후보(`SPEC-KTO-MERGE-XXX`).
4. **무장애 응답 필드의 한글 번역·정규화** — KorService2 정책(SPEC-KTO-001 Exclusion 5)과 동일하게 `wheelchair`, `braileblock`(가능 오타 그대로) 등 KTO 원형 필드명을 보존.
5. **자동 페이지네이션** — `numOfRows`, `pageNo` 그대로 노출.
6. **인증·인가 / 멀티 테넌시** — 단일 `KTO_SERVICE_KEY` 환경변수 운영.
7. **`detailWithTour2` 응답 검증 도구** — 무장애 정보의 신뢰도/최신성 검증, 외부 데이터(예: 지자체 무장애 시설 DB) 와 교차검증은 본 SPEC 범위 외.

---

## Requirements (EARS Format)

EARS 5 모듈 한도. 본 SPEC 은 SPEC-KTO-001 의 인프라 요구사항을 상속(reuse) 하므로,
KorWithService2 도메인에 신규로 발생하는 요구사항만 정의한다.

### Module 1: KorWithService2 도메인 도구 노출 (REQ-KTO2-001 ~ REQ-EVT-001)

#### REQ-KTO2-001 (Ubiquitous)

The MCP server **shall** expose all available `KorWithService2` operations as MCP tools whose names follow the pattern `kto_barrier_free_{operationName}` (예: `kto_barrier_free_areaBasedList2`, `kto_barrier_free_detailWithTour2`), without colliding with existing `kto_korean_*` tool names from SPEC-KTO-001.

#### REQ-KTO2-002 (Ubiquitous)

The MCP server **shall** reuse the existing transports (`stdio`, `streamable-http`, `http`), the shared `KtoHttpClient`, the shared `response-normalizer`, and the shared `tool-registry` from SPEC-KTO-001 without modification, ensuring zero regression on `KorService2` tools.

#### REQ-EVT-001 (Event-driven)

**When** an MCP client sends a `tools/call` request for a registered `kto_barrier_free_*` tool, the server **shall** invoke the corresponding `KorWithService2` operation via `KtoHttpClient.request({ service: 'KorWithService2', operation, params })`, normalize the response via the existing `normalizeItems` helper, and return the result as the tool's response payload preserving original KTO field names (including barrier-free fields such as `wheelchair`, `exit`, `elevator`, `parking`, `restroom`, `guidesystem`, `signguide`, `videoguide`, `audioguide`, `braileblock`, `helpdog`, `stroller`).

---

### Module 2: 5xx 재시도 정책 상속 (REQ-STATE-001)

#### REQ-STATE-001 (State-driven)

**While** the `KorWithService2` API returns an HTTP 5xx response or a network-level transient error, the existing `KtoHttpClient` retry policy (max 3 retries, exponential backoff with base 200ms, factor 2.0, jitter ±20%, defined in `RETRY_CONFIG`) **shall** apply identically to `KorWithService2` requests as it does to `KorService2` requests, with no separate retry configuration.

---

### Module 3: BASE_URL_MAP 일반화 (REQ-OPT-001)

#### REQ-OPT-001 (Optional)

**Where** `KtoHttpClient` selects the base URL via `BASE_URL_MAP[serviceName]`, the map **shall** be extended to include `KorWithService2: 'http://apis.data.go.kr/B551011/KorWithService2'` as a single flat namespace alongside existing language-variant entries (`KorService2`, `EngService2`, ...), and the `KtoServiceName` type **shall** continue to derive from `keyof typeof BASE_URL_MAP` so that all KTO B551011 service paths — language variants and functional siblings alike — are addressable through the same client interface without introducing a new abstraction.

---

### Module 4: detailWithTour2 의 contentId 검증 (REQ-UNW-001)

#### REQ-UNW-001 (Unwanted)

**If** an MCP client invokes the `kto_barrier_free_detailWithTour2` tool without supplying a non-empty `contentId` argument, **then** the tool registry **shall not** dispatch any outbound HTTP request to the KTO API; instead it **shall** return a structured MCP tool error citing the missing `contentId` field, validated by the corresponding DTO via `class-validator` before reaching `KtoHttpClient`.

---

### Module 5: SPEC-KTO-001 회귀 보호 (REQ-UNW-002)

#### REQ-UNW-002 (Unwanted)

**If** the introduction of `KorWithService2` causes any pre-existing `kto_korean_*` tool registration, JSON Schema, validation behavior, retry behavior, or response normalization output to change, **then** the implementation **shall** be rejected; the SPEC-KTO-001 unit-test suite (`src/kto/kto-http.client.spec.ts`, `src/kto/korean-tour-info/korean-tour-info.service.spec.ts`, `src/mcp/tool-registry.spec.ts`, `test/kto.e2e-spec.ts`) **shall** continue to pass without modification of any test assertion, except where a new test file or a new assertion is added strictly for `KorWithService2` coverage.

---

## Affected Files (Write Targets)

### Modified

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `KorWithService2` 항목 1줄 추가. `BASE_URL_MAP` 위 `@MX:NOTE` 주석을 갱신하여 "language variants + functional sibling services" 의도 명시.
- `src/app.module.ts` — `BarrierFreeTourInfoModule` import 1줄 추가.

### Created

#### Barrier-Free Tour Info Module (2차 구현)

- `src/kto/barrier-free-tour-info/barrier-free-tour-info.module.ts`
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.ts`
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.tools.ts`
- `src/kto/barrier-free-tour-info/dto/area-based-list.dto.ts`
- `src/kto/barrier-free-tour-info/dto/area-code.dto.ts` *(KorService2 코드 조회 셋 재정의 — 무장애 도구 카탈로그에서도 노출)*
- `src/kto/barrier-free-tour-info/dto/category-code.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-common.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-image.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-info.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-intro.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-with-tour.dto.ts` *(KorWithService2 고유)*
- `src/kto/barrier-free-tour-info/dto/lcls-systm-code.dto.ts`
- `src/kto/barrier-free-tour-info/dto/ldong-code.dto.ts`
- `src/kto/barrier-free-tour-info/dto/location-based-list.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-festival.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-keyword.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-stay.dto.ts`
- `src/kto/barrier-free-tour-info/dto/index.ts`

> 위 DTO 셋 중 `area-based-sync-list.dto.ts` 는 KorWithService2 측 존재 여부가 불명확하여
> RUN Phase 통합 테스트 결과에 따라 추가/제거한다 (Plan R3 참조).

#### Tests

- `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`
- (선택) `src/kto/barrier-free-tour-info/dto/dto.spec.ts` — DTO 검증 단위 테스트
- `test/kto.e2e-spec.ts` 에 KorWithService2 시나리오 추가 (신규 파일 X, 기존 파일 확장)

### Optional Type Extension

- `src/kto/common/types.ts` — `BarrierFreeFields` interface 추가(검토용; 응답 정규화에는 영향 없음). 응답 객체에 무장애 필드를 그대로 노출하기 위한 **타입 힌트 전용** 으로, 런타임 변환 없음. 도입 여부는 RUN Phase 결정.

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 에서 도입한 `@modelcontextprotocol/sdk`, `axios`, `class-validator`,
`class-transformer`, `fast-xml-parser`, dev `nock` 을 그대로 재사용한다.

---

## Success Criteria

| 항목 | 기준 |
|------|------|
| 도구 매핑 완성도 | `KorWithService2` 의 RUN Phase 검증된 모든 오퍼레이션이 MCP 도구로 노출됨 (`tools/list` 응답에서 `kto_barrier_free_*` prefix 카운트로 검증) |
| `detailWithTour2` 노출 | 도구 카탈로그에 `kto_barrier_free_detailWithTour2` 가 반드시 포함됨 |
| 단위 테스트 커버리지 | 85% 이상 유지 (`pnpm test:cov` statements 기준) — SPEC-KTO-001 기준 95.41% 에서 유의미한 하락 금지 |
| KorService2 회귀 무사고 | SPEC-KTO-001 의 76 unit + 6 e2e 테스트가 변경 없이 모두 PASS |
| Lint | `pnpm lint` 무경고 무에러 |
| Build | `pnpm build` 성공 |
| Transport 검증 | stdio 및 streamable-http 모드에서 `tools/list` 응답에 `kto_korean_*` + `kto_barrier_free_*` 모두 포함 |

상세 시나리오는 `acceptance.md` 참조.

---

Version: 0.1.0
Last Updated: 2026-05-09
