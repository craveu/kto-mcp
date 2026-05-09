---
id: SPEC-KTO-004
version: 0.1.0
status: draft
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-004: KTO MCP 서버 4차 이터레이션 (GoCamping 고캠핑 정보조회)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. 한국관광공사 고캠핑 정보조회 API(`GoCamping`, data.go.kr ID 15101933) 5 오퍼레이션을 MCP 도구로 매핑하는 4차 이터레이션 정의. SPEC-KTO-001 (KorService2) / SPEC-KTO-002 (KorWithService2) / SPEC-KTO-003 (PhotoGalleryService1) 의 공용 인프라(`KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종·에러 모델·재시도 정책·`BASE_URL_MAP`) 100% 재사용. Swagger 2.0 스펙 직접 파싱 + 사용자 실 호출 응답으로 [ASSUMED] 마커 0건. 신규 typed item `GoCampingItem` (50+ 필드, 인덱스 시그니처 활용) + `GoCampingImageItem` (5 필드) 도입. |

---

## Overview

SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 에서 구축한 NestJS 11 + TypeScript 5 기반
MCP 서버에 한국관광공사 고캠핑 정보조회 API(`GoCamping`, data.go.kr ID 15101933) 를
추가 통합한다. 본 SPEC 은 선행 3 SPEC 의 공용 인프라(`KtoHttpClient`,
`response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책,
`BASE_URL_MAP`) 를 변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/go-camping/`
를 추가**하고 `BASE_URL_MAP` 에 `GoCamping` 항목 1줄을 추가한다.

선행 3 SPEC 와 다른 점은, GoCamping 의 service path 가 **버전 suffix 없는 평면 형태
(`B551011/GoCamping`)** 라는 사실이다. 이는 `BASE_URL_MAP` 에서 다음과 같은 **3 가지
명명 패턴** 이 공존함을 의미한다:

- (A) V2 다국어 코어: `KorService2`, `EngService2`, ..., `KorWithService2`
- (B) V1 단독 사이드: `PhotoGalleryService1`
- (C) 버전 suffix 없음: **`GoCamping`** (본 SPEC 신규)

본 SPEC 은 (C) 패턴을 평면 항목으로 흡수하며, 신규 추상화 도입 없이 1줄 추가만으로
처리한다. `BASE_URL_MAP` 위 `@MX:NOTE` prose 는 3 패턴을 모두 명시하도록 1줄 보강한다.

또한 GoCamping 응답 item 은 캠핑 도메인 특화 필드 (`facltNm`, `induty`, `lctCl`,
`glampInnerFclty`, `caravInnerFclty`, `siteBottomCl1~5`, `frprvtSandCo`, ...) 를
포함한 **50+ 종 의 풍부한 메타 필드** 를 담는다. 따라서 본 SPEC 은 **신규 typed item
`GoCampingItem` 인터페이스**를 `src/kto/go-camping/types.ts` 에 정의하되, 핵심 식별·
위치·운영 필드만 named property 로 두고 나머지는 `[key: string]: string | undefined`
**인덱스 시그니처** 로 처리한다. 이미지 메타는 별도 5-필드 스키마이므로
`GoCampingImageItem` 인터페이스를 같은 파일에 분리 정의한다.

상위 컨텍스트는 `research.md` (선행 3 SPEC 와의 차이점·5 오퍼레이션 카탈로그·필드
catalog) 에서 확인하고, 구체적 작업 분해는 `plan.md`, 검증 시나리오는 `acceptance.md`
를 참조한다. 본 SPEC 은 패턴 복제(replication) SPEC 이며, 신규 추상화·신규 라이브러리
도입 없이 캠핑 도메인 모듈만 추가한다.

---

## Scope

### In Scope (4차 이터레이션)

- `GoCamping` 5 오퍼레이션의 MCP 도구 매핑 (1:1, **5 도구**):
  - `kto_camping_basedList` — 기본 정보 목록 조회
  - `kto_camping_basedSyncList` — 동기화 목록 조회 (A/U/D 이력)
  - `kto_camping_locationBasedList` — 위치기반정보 목록 조회 (mapX/mapY/radius)
  - `kto_camping_searchList` — 키워드 검색 목록 조회 (keyword)
  - `kto_camping_imageList` — 이미지정보 목록 조회 (contentId)
- 캠핑 도메인 고유 응답 타입 `GoCampingItem` 신규 정의
  (`src/kto/go-camping/types.ts`) — 핵심 필드 named + 나머지 인덱스 시그니처
- 이미지 메타 응답 타입 `GoCampingImageItem` 신규 정의 (5 필드, 같은 파일)
- `BASE_URL_MAP` 에 `GoCamping` 항목 추가 (1줄 수정) + `@MX:NOTE` prose 1줄 보강
  (3 패턴 명시)
- `KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종 변경 없이 재사용
- 도구 이름 prefix `kto_camping_*` (선행 SPEC 의 `kto_korean_*`,
  `kto_barrier_free_*`, `kto_photo_*` 와 네임스페이스 분리)
- Jest 단위 테스트 + e2e 테스트 (커버리지 85% 이상 유지)
- SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 회귀 무사고 검증 (`pnpm test` 전수
  통과 + e2e 도구 카운트 29 → 34 갱신)

### Out of Scope (Exclusions — What NOT to Build)

본 이터레이션에서 명시적으로 제외하는 항목:

1. **캠핑장 사진 다운로드·바이너리 캐싱·이미지 변환** — 본 SPEC 은 `imageList`
   응답의 `imageUrl` 필드 등 이미지 URL **메타데이터만** 노출한다. 이미지 바이너리
   fetch, 썸네일 생성, 로컬 캐싱, 포맷 변환은 모두 SPEC 범위 외.
2. **예약 시스템 통합** — KTO GoCamping API 자체에 예약 기능 (실시간 가용 사이트
   조회·예약 생성·결제) 이 존재하지 않는다. 응답의 `resveUrl` 필드는 외부 예약 페이지
   URL 만 노출하며, 본 SPEC 은 해당 URL 을 그대로 노출할 뿐 통합 예약 워크플로우
   미구현.
3. **다국어 캠핑 변체 본격 구현** — `EngGoCamping`, `JpnGoCamping` 등 다국어 캠핑
   변체는 카탈로그 페이지에서 존재 미확인. 정식 검증·도구 등록은 차기 SPEC 으로 이관.
4. **데이터 캐싱 / 영속 저장소(DB·Redis)** — SPEC-KTO-001 정책 동일. 모든 호출은 KTO
   API 직접 호출.
5. **캠핑 응답 필드의 한글 번역·정규화** — 선행 SPEC 정책 동일하게 `facltNm`,
   `induty`, `lctCl`, `glampInnerFclty` 등 KTO 원형 필드명을 보존. 평면화·다른 KTO
   서비스 필드명(`title`, `cat1`) 으로의 변환·코드값(`Y`/`N` → `true`/`false`)
   변환 등 미실시.
6. **자동 페이지네이션** — `numOfRows`, `pageNo` 그대로 노출. 자동 페이지 순회 로직
   미구현.
7. **인증·인가 / 멀티 테넌시** — 단일 `KTO_SERVICE_KEY` 환경변수 운영.
8. **이미지 URL 유효성 외부 검증** — `imageUrl`, `firstImageUrl` 이 실제 fetchable
   한지 검증은 본 SPEC 범위 외 (KTO 응답 그대로 신뢰).
9. **`basedList` ↔ KorService2 `areaBasedList2` 머지 통합 도구** — 캠핑장과 일반
   관광지를 혼합 검색하는 합성 도구는 본 SPEC 범위 외. 별도 SPEC 후보.
10. **인허가 데이터 검증·정책 분석 기능** — `prmisnDe`, `manageSttus`, `bizrno` 등
    필드는 그대로 노출. 인허가 만료 알림·운영 상태 통계·정책 리포트 자동 생성
    등은 SPEC 범위 외.

---

## Requirements (EARS Format)

EARS 5 모듈 한도. 본 SPEC 은 SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 의 인프라
요구사항을 상속(reuse) 하므로, GoCamping 도메인에 신규로 발생하는 요구사항만
정의한다.

### Module 1: GoCamping 도메인 도구 노출 (REQ-KTO4-001 ~ REQ-EVT-001)

#### REQ-KTO4-001 (Ubiquitous)

The MCP server **shall** expose all 5 `GoCamping` operations as MCP tools whose
names follow the pattern `kto_camping_{operationName}` (예: `kto_camping_basedList`,
`kto_camping_locationBasedList`, `kto_camping_searchList`, `kto_camping_imageList`,
`kto_camping_basedSyncList`), without colliding with existing `kto_korean_*` (15
tools, SPEC-KTO-001), `kto_barrier_free_*` (10 tools, SPEC-KTO-002), or
`kto_photo_*` (4 tools, SPEC-KTO-003) tool names.

#### REQ-KTO4-002 (Ubiquitous)

The MCP server **shall** reuse the existing transports (`stdio`, `streamable-http`,
`http`), the shared `KtoHttpClient` (including the flat-error envelope detection
introduced by SPEC-KTO-003 hotfix), the shared `response-normalizer` (including
empty-string `items: ""` → empty array normalization), the shared `tool-registry`
(whose `registerAll()` already accepts a `ToolRegistry[]` array covering multiple
tool sets), and the existing `BASE_URL_MAP` infrastructure from SPEC-KTO-001 /
SPEC-KTO-002 / SPEC-KTO-003 without modification of any source file other than (a)
a one-line `GoCamping` entry addition to `BASE_URL_MAP` and (b) a one-line prose
augmentation in the `@MX:NOTE` comment above `BASE_URL_MAP` to document the
three-pattern coexistence (V2 multilingual + V1 standalone + no-suffix), ensuring
zero regression on `KorService2` (`kto_korean_*`), `KorWithService2`
(`kto_barrier_free_*`), and `PhotoGalleryService1` (`kto_photo_*`) tools.

#### REQ-KTO4-003 (Ubiquitous)

The MCP server **shall** expose two typed response items in
`src/kto/go-camping/types.ts`:

- `GoCampingItem` whose required field is `contentId: string`, named optional
  fields cover the core identification and operational metadata (`facltNm`,
  `lineIntro`, `intro`, `addr1`, `addr2`, `mapX`, `mapY`, `zipcode`, `doNm`,
  `sigunguNm`, `induty`, `lctCl`, `facltDivNm`, `mangeDivNm`, `mgcDiv`,
  `manageSttus`, `hvofBgnde`, `hvofEnddle`, `prmisnDe`, `firstImageUrl`,
  `createdtime`, `modifiedtime`, `syncStatus`, `bizrno`, `trsagntNo`,
  `insrncAt`, `tel`, `homepage`, `resveUrl`, `allar`), and an index signature
  `[key: string]: string | undefined` covers the remaining 30+ camping-specific
  fields (site dimensions, facility counts, safety equipment, theme classes)
  documented in the Swagger 2.0 schema; and
- `GoCampingImageItem` with named fields `contentId: string` (required),
  `serialnum?: string`, `imageUrl?: string`, `createdtime?: string`,
  `modifiedtime?: string`.

All `GoCampingService` methods **shall** return
`Promise<KtoListResponse<GoCampingItem>>` for `basedList`, `basedSyncList`,
`locationBasedList`, `searchList`, and `Promise<KtoListResponse<GoCampingImageItem>>`
for `imageList`, so that downstream MCP clients receive type information consistent
with KTO original field naming.

#### REQ-EVT-001 (Event-driven)

**When** an MCP client sends a `tools/call` request for a registered
`kto_camping_*` tool, the server **shall** invoke the corresponding `GoCamping`
operation via `KtoHttpClient.request({ service: 'GoCamping', operation, params })`,
normalize the response via the existing `normalizeItems` helper, and return the
result as the tool's response payload preserving original KTO field names
(including `contentId`, `facltNm`, `lineIntro`, `intro`, `addr1`, `mapX`, `mapY`,
`induty`, `lctCl`, `glampInnerFclty`, `caravInnerFclty`, `siteBottomCl1`–
`siteBottomCl5`, `frprvtSandCo`, `firstImageUrl`, `imageUrl`, `serialnum`,
`syncStatus`, and all other fields) without renaming, flattening, value
normalization (e.g., `Y`/`N` → boolean), or mapping to `KorService2` field names
(e.g., `firstImageUrl` to `firstimage`).

---

### Module 2: 5xx 재시도 정책 상속 (REQ-STATE-001)

#### REQ-STATE-001 (State-driven)

**While** the `GoCamping` API returns an HTTP 5xx response or a network-level
transient error, the existing `KtoHttpClient` retry policy (max 3 retries,
exponential backoff with base 200ms, factor 2.0, jitter ±20%, defined in
`RETRY_CONFIG`) **shall** apply identically to `GoCamping` requests as it does
to `KorService2`, `KorWithService2`, and `PhotoGalleryService1` requests, with
no separate retry configuration.

---

### Module 3: BASE_URL_MAP 확장 + 3 패턴 prose 보강 (REQ-OPT-001)

#### REQ-OPT-001 (Optional)

**Where** `KtoHttpClient` selects the base URL via `BASE_URL_MAP[serviceName]`,
the map **shall** be extended to include `GoCamping:
'http://apis.data.go.kr/B551011/GoCamping'` as an additional flat-namespace
entry alongside existing entries (`KorService2` family, `KorWithService2`,
`PhotoGalleryService1`), and the `KtoServiceName` type **shall** continue to
derive from `keyof typeof BASE_URL_MAP` so that the new service path is
addressable through the same client interface without introducing a new
abstraction; the existing `@MX:NOTE` comment above `BASE_URL_MAP` **shall** be
augmented with a one-line prose addition documenting the three coexisting
naming patterns (V2 multilingual core, V1 standalone sibling, no-version-suffix
flat) and the `@MX:SPEC` line **shall** include `SPEC-KTO-004 REQ-OPT-001`
alongside existing SPEC IDs.

---

### Module 4: 필수 입력 파라미터 검증 (REQ-UNW-001)

#### REQ-UNW-001 (Unwanted)

**If** an MCP client invokes any of the following tools without supplying the
required parameter, **then** the tool registry **shall not** dispatch any
outbound HTTP request to the `GoCamping` endpoint; instead it **shall** return
a structured MCP tool error (JSON-RPC `-32602` Invalid params or equivalent
MCP-standard tool error) citing the missing required field:

- `kto_camping_locationBasedList` requires non-empty `mapX`, non-empty `mapY`,
  and non-empty `radius` (radius value ≤ 20000 enforced at the DTO layer).
- `kto_camping_searchList` requires non-empty `keyword`.
- `kto_camping_imageList` requires non-empty `contentId`.

Validation **shall** be performed by the corresponding DTOs
(`GcLocationBasedListDto`, `GcSearchListDto`, `GcImageListDto`) via
`class-validator` decorators (`@IsNotEmpty`, `@Max(20000)` for radius) before
reaching `KtoHttpClient`. The other two tools (`kto_camping_basedList`,
`kto_camping_basedSyncList`) have no required operation-specific parameters
and **shall not** trigger this validation rejection.

---

### Module 5: SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 회귀 보호 (REQ-UNW-002)

#### REQ-UNW-002 (Unwanted)

**If** the introduction of `GoCamping` causes any pre-existing `kto_korean_*`,
`kto_barrier_free_*`, or `kto_photo_*` tool registration, JSON Schema, validation
behavior, retry behavior, response normalization output, or `KtoHttpClient`
flat-error envelope detection to change, **then** the implementation **shall**
be rejected; the SPEC-KTO-001 + SPEC-KTO-002 + SPEC-KTO-003 unit-test suite
(including `src/kto/kto-http.client.spec.ts`,
`src/kto/korean-tour-info/korean-tour-info.service.spec.ts`,
`src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`,
`src/kto/photo-gallery/photo-gallery.service.spec.ts`,
`src/mcp/tool-registry.spec.ts`, `test/kto.e2e-spec.ts`) **shall** continue to
pass without modification of any test assertion, except where (a) the e2e tool
count assertion is updated from `29` to the new total `34` reflecting added
`kto_camping_*` tools (5개), or (b) a new test file or new assertion is added
strictly for `GoCamping` coverage.

---

## Affected Files (Write Targets)

### Modified

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `GoCamping` 항목 1줄 추가.
  위 `@MX:NOTE` prose 1줄 보강 (3 패턴 — V2 다국어 + V1 단독 + V없음 — 명시).
  `@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 추가.
- `src/app.module.ts` — `GoCampingModule` import 1줄 추가.
- `src/main.ts` — `GoCampingService` 주입 1줄 + `registerAll()` 호출의 registries
  배열에 `{ tools: GO_CAMPING_TOOLS, service: goCampingService }` 항목 1개 추가.
- `test/kto.e2e-spec.ts` — `tools/list` 도구 카운트 검증 assertion 갱신 (29 → 34).
  GoCamping 신규 시나리오 추가.

### Created

#### Go Camping Module (4차 구현)

- `src/kto/go-camping/go-camping.module.ts`
- `src/kto/go-camping/go-camping.service.ts`
- `src/kto/go-camping/go-camping.tools.ts`
- `src/kto/go-camping/types.ts` (신규 — `GoCampingItem` interface + `GoCampingImageItem`
  interface)
- `src/kto/go-camping/dto/based-list.dto.ts` (`GcBasedListDto`, 모두 선택)
- `src/kto/go-camping/dto/based-sync-list.dto.ts` (`GcBasedSyncListDto`, 모두 선택,
  `syncStatus` enum A/U/D)
- `src/kto/go-camping/dto/location-based-list.dto.ts` (`GcLocationBasedListDto`,
  `mapX` / `mapY` / `radius` 필수, radius ≤ 20000)
- `src/kto/go-camping/dto/search-list.dto.ts` (`GcSearchListDto`, `keyword` 필수)
- `src/kto/go-camping/dto/image-list.dto.ts` (`GcImageListDto`, `contentId` 필수)
- `src/kto/go-camping/dto/index.ts`

#### Tests

- `src/kto/go-camping/go-camping.service.spec.ts`
- `src/kto/go-camping/go-camping.tools.spec.ts`
- `src/kto/go-camping/dto/dto.spec.ts` — DTO 검증 단위 테스트 (REQ-UNW-001)
- `test/kto.e2e-spec.ts` 에 GoCamping 시나리오 추가 (신규 파일 X, 기존 파일 확장)

### NOT Modified (must remain unchanged)

- `src/kto/kto-http.client.ts`
- `src/kto/common/response-normalizer.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/types.ts` (`KtoListResponse<T>`, `KtoRawResponse<T>` 그대로 재사용)
- `src/mcp/tool-registry.ts` (배열 기반 `registerAll()` 이미 다중 도구 셋 지원)
- `src/mcp/transports/*.ts`
- `src/env.ts`
- `src/kto/korean-tour-info/**/*` (모두 변경 없음)
- `src/kto/barrier-free-tour-info/**/*` (모두 변경 없음)
- `src/kto/photo-gallery/**/*` (모두 변경 없음)

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 / SPEC-KTO-002 / SPEC-KTO-003 에서 도입한
`@modelcontextprotocol/sdk`, `axios`, `class-validator`, `class-transformer`,
`fast-xml-parser`, dev `nock` 을 그대로 재사용한다.

---

## Success Criteria

| 항목 | 기준 |
|------|------|
| 도구 매핑 완성도 | `GoCamping` 의 5 오퍼레이션이 모두 MCP 도구로 노출됨 (`tools/list` 응답에서 `kto_camping_*` prefix 카운트 = 5 로 검증) |
| 5 도구 노출 | 도구 카탈로그에 `kto_camping_basedList`, `kto_camping_basedSyncList`, `kto_camping_locationBasedList`, `kto_camping_searchList`, `kto_camping_imageList` 모두 포함 |
| `GoCampingItem` / `GoCampingImageItem` 타입 노출 | `src/kto/go-camping/types.ts` 두 interface 모두 export. 4 list ops 반환 타입 = `Promise<KtoListResponse<GoCampingItem>>`. imageList 반환 타입 = `Promise<KtoListResponse<GoCampingImageItem>>` |
| 단위 테스트 커버리지 | 85% 이상 유지 (`pnpm test:cov` statements 기준) — 선행 SPEC 의 커버리지에서 유의미한 하락 금지 |
| 회귀 무사고 | SPEC-KTO-001 + SPEC-KTO-002 + SPEC-KTO-003 의 기존 단위·e2e 테스트가 도구 카운트 갱신 외 변경 없이 모두 PASS |
| Lint | `pnpm lint` 무경고 무에러 |
| Build | `pnpm build` 성공 |
| Transport 검증 | stdio 및 streamable-http 모드에서 `tools/list` 응답에 `kto_korean_*` + `kto_barrier_free_*` + `kto_photo_*` + `kto_camping_*` 모두 포함 |
| 도구 카운트 갱신 | e2e 테스트 도구 카운트 assertion 이 29 → 34 로 갱신 |
| imageList 빈 결과 처리 | `body.items === ""` 응답이 `items: []` 로 정규화되어 MCP 응답 반환 |
| 필수 파라미터 검증 | `kto_camping_locationBasedList` (mapX/mapY/radius), `kto_camping_searchList` (keyword), `kto_camping_imageList` (contentId) 누락 시 outbound 0회 + 구조화된 MCP 에러 |

상세 시나리오는 `acceptance.md` 참조.

---

Version: 0.1.0
Last Updated: 2026-05-09
