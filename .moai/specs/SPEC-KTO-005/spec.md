---
id: SPEC-KTO-005
version: 0.1.0
status: draft
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-005: KTO MCP 서버 5차 이터레이션 (관광지 오디오 가이드정보 Odii)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. 한국관광공사 관광지 오디오 가이드정보 API(`Odii`, data.go.kr ID 15101971) 8 오퍼레이션을 MCP 도구로 매핑하는 5차 이터레이션 정의. SPEC-KTO-001 (KorService2) / SPEC-KTO-002 (KorWithService2) / SPEC-KTO-003 (PhotoGalleryService1) / SPEC-KTO-004 (GoCamping) 의 공용 인프라(`KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종·에러 모델·재시도 정책·`BASE_URL_MAP`) 100% 재사용. 사전 검증 완료 — `[ASSUMED]` 마커 0건. 신규 typed item `OdiiStoryItem` (12+ 필드, 인덱스 시그니처 활용) + `OdiiThemeItem` (10+ 필드, 인덱스 시그니처 활용) 두 entity 도입. KTO 의 4번째 다국어 패턴 — 단일 path + `langCode` 파라미터 — 첫 흡수. |

---

## Overview

SPEC-KTO-001 ~ SPEC-KTO-004 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에
한국관광공사 **관광지 오디오 가이드정보 API (`Odii`, data.go.kr ID 15101971)** 를
추가 통합한다. 본 SPEC 은 선행 4 SPEC 의 공용 인프라(`KtoHttpClient`,
`response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책,
`BASE_URL_MAP`) 를 변경 없이 재사용하며, **신규 모듈 디렉토리
`src/kto/audio-guide/` 를 추가** 하고 `BASE_URL_MAP` 에 `Odii` 항목 1줄을 추가한다.

선행 4 SPEC 와의 차별점은, Odii 가 KTO 의 **첫 번째 단일 path + `langCode` 파라미터
다국어 API** 라는 점이다. 동일 service path `B551011/Odii` 단일 경로에서
`langCode=ko` 또는 `langCode=en` 입력으로 언어를 분기 응답한다. 이는
`BASE_URL_MAP` 에서 다음 **4 가지 명명 패턴** 의 공존을 의미한다:

- (A) V2 다국어 다중 path: `KorService2`, `EngService2`, `JpnService2` 등 9 path
- (B) V2 단독: `KorWithService2`
- (C) V1 / suffix 없음 단독: `PhotoGalleryService1`, `GoCamping`
- (D) 단일 path + `langCode` 파라미터: **`Odii`** (본 SPEC 신규)

본 SPEC 은 (D) 패턴을 평면 항목 1줄로 흡수하며, 신규 추상화 도입 없이 처리한다.
`BASE_URL_MAP` 위 `@MX:NOTE` prose 는 4 패턴을 모두 명시하도록 1줄 보강한다.

또한 Odii 응답은 두 도메인 entity 로 분리된다:

- **Story** 계열 (오디오 내레이션 위치 단위) — 4 오퍼레이션, 응답에
  `audioUrl` / `script` / `playTime` 등 오디오 메타 포함
- **Theme** 계열 (테마 관광지 카탈로그) — 4 오퍼레이션, 응답에 `themeCategory` /
  `langCheck` 등 카탈로그 메타 포함, 오디오 URL 부착 없음

따라서 본 SPEC 은 **두 typed item interface** `OdiiStoryItem` 과 `OdiiThemeItem`
을 `src/kto/audio-guide/types.ts` 에 정의하되, 핵심 필드만 named property 로
두고 미래 확장 필드는 `[key: string]: string | undefined` **인덱스 시그니처** 로
처리한다 (SPEC-KTO-004 의 `GoCampingItem` 디자인 일관성 상속).

또한 본 SPEC 은 KTO 의 첫 `langCode` 필수 입력 API 이므로, 8 DTO 모두에서
`langCode` 를 `class-validator` 의 `@IsNotEmpty()` 로 강제한다. 가능 입력값
강제는 enum 으로 하지 않으며 (KTO 가 미지원 언어에 대해 0 records 로 응답하므로),
도구 description 에서 `ko` / `en` 권장만 안내한다.

상위 컨텍스트는 `research.md` (4 패턴 비교·8 오퍼레이션 카탈로그·필드 catalog·
`langCode` 동작) 에서 확인하고, 구체적 작업 분해는 `plan.md`, 검증 시나리오는
`acceptance.md` 를 참조한다. 본 SPEC 은 패턴 복제(replication) SPEC 이며, 신규
추상화·신규 라이브러리 도입 없이 오디오 가이드 도메인 모듈만 추가한다.

---

## Scope

### In Scope (5차 이터레이션)

- `Odii` 8 오퍼레이션의 MCP 도구 매핑 (1:1, **8 도구**):
  - **Story 계열 4 도구**:
    - `kto_audio_storyBasedList` — 전체 스토리 위치 목록 조회
    - `kto_audio_storyBasedSyncList` — 스토리 동기화 목록 조회
    - `kto_audio_storyLocationBasedList` — 위치기반 스토리 목록 조회 (`mapX` /
      `mapY` / `radius` 필수)
    - `kto_audio_storySearchList` — 스토리 키워드 검색 (`keyword` 필수)
  - **Theme 계열 4 도구**:
    - `kto_audio_themeBasedList` — 전체 테마 카탈로그 조회
    - `kto_audio_themeBasedSyncList` — 테마 동기화 목록 조회
    - `kto_audio_themeLocationBasedList` — 위치기반 테마 목록 조회 (`mapX` /
      `mapY` / `radius` 필수)
    - `kto_audio_themeSearchList` — 테마 키워드 검색 (`keyword` 필수)
- `langCode` 파라미터를 8 도구 모두 필수로 노출 (DTO `@IsNotEmpty`).
  유효값 권장: `ko` 또는 `en` (도구 description 에서 안내). enum 강제는 미적용.
- 두 도메인 응답 타입을 `src/kto/audio-guide/types.ts` 에 분리 정의:
  - `OdiiStoryItem` — Story 계열 응답
  - `OdiiThemeItem` — Theme 계열 응답
  - 두 인터페이스 모두 `[key: string]: string | undefined` 인덱스 시그니처 보유
- `BASE_URL_MAP` 에 `Odii` 항목 추가 (1줄 수정) + `@MX:NOTE` prose 1줄 보강
  (4 패턴 명시)
- `KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종 변경 없이 재사용
- 도구 이름 prefix `kto_audio_*` (선행 SPEC 의 `kto_korean_*`,
  `kto_barrier_free_*`, `kto_photo_*`, `kto_camping_*` 와 네임스페이스 분리)
- Jest 단위 테스트 + e2e 테스트 (커버리지 85% 이상 유지)
- SPEC-KTO-001 ~ SPEC-KTO-004 회귀 무사고 검증 (`pnpm test` 전수 통과 + e2e 도구
  카운트 34 → 42 갱신)

### Out of Scope (Exclusions — What NOT to Build)

본 이터레이션에서 명시적으로 제외하는 항목:

1. **오디오 바이너리 다운로드·캐싱·변환** — 본 SPEC 은 Story 응답의 `audioUrl`
   필드 (예: `https://sfj608538-sfj608538.ktcdn.co.kr/file/audio/56/1381.mp3`)
   를 **URL 문자열로만** 노출한다. MP3 fetch, 로컬 캐싱, 포맷 변환, 자막 생성,
   waveform 분석은 모두 SPEC 범위 외.
2. **미보유 언어 더미 데이터 채움** — `langCode=ja` / `langCode=zh` / `langCode=KOR`
   등 KTO 가 0 records 로 응답하는 케이스에 대해 **본 SPEC 은 KTO 응답을 그대로
   전달한다**. 한국어 번역 자동 생성, 기계 번역 fallback, 다른 언어 record 채움
   등은 SPEC 범위 외.
3. **Story / Theme 머지 통합 검색 도구** — 한 도구 호출로 Story 와 Theme 양쪽을
   동시 검색·머지하는 합성 도구 (예: `kto_audio_unifiedSearch`) 는 본 SPEC 범위
   외. 별도 SPEC 후보.
4. **다국어 Theme 자동 보강** — `themeBasedList?langCode=en` 이 0 records 로
   응답하는 한계에 대해, 한국어 Theme 의 자동 영어 번역 / 다른 KTO 다국어 service
   (`EngService2`) 와의 머지·교차 참조는 SPEC 범위 외.
5. **데이터 캐싱 / 영속 저장소 (DB·Redis)** — SPEC-KTO-001 정책 동일. 모든
   호출은 KTO API 직접 호출.
6. **응답 필드의 한글 번역·정규화** — 선행 SPEC 정책 동일하게 KTO 원형 필드명을
   보존 (`tid`, `tlid`, `stid`, `stlid`, `audioTitle`, `playTime`,
   `themeCategory`, `langCheck` 등). 평면화·다른 KTO 서비스 필드명으로의 변환·
   `audioUrl` URL parsing·`langCheck` 비트 마스크 디코딩 등 미실시.
7. **자동 페이지네이션** — `numOfRows`, `pageNo` 그대로 노출. 자동 페이지 순회
   로직 미구현.
8. **인증·인가 / 멀티 테넌시** — 단일 `KTO_SERVICE_KEY` 환경변수 운영.
9. **`audioUrl` / `imageUrl` 외부 검증** — URL 이 실제 fetchable 한지·MP3
   포맷이 유효한지 검증은 본 SPEC 범위 외 (KTO 응답 그대로 신뢰).
10. **`langCode` 입력값 enum 강제** — 본 SPEC 은 `langCode` 를 `string` 으로
    받고 KTO 가 0 records 로 응답하는 정책을 그대로 유통한다. `ko` / `en`
    이외값을 DTO 단계에서 거부하지 않는다 (KTO 의 향후 신규 언어 추가 가능성에
    대비).

---

## Requirements (EARS Format)

EARS 5 모듈 한도. 본 SPEC 은 SPEC-KTO-001 ~ SPEC-KTO-004 의 인프라 요구사항을
상속(reuse) 하므로, Odii 도메인에 신규로 발생하는 요구사항만 정의한다.

### Module 1: Odii 도메인 도구 노출 (REQ-KTO5-001 ~ REQ-EVT-001)

#### REQ-KTO5-001 (Ubiquitous)

The MCP server **shall** expose all 8 `Odii` operations as MCP tools whose names
follow the pattern `kto_audio_{operationName}` (예: `kto_audio_storyBasedList`,
`kto_audio_storyLocationBasedList`, `kto_audio_storySearchList`,
`kto_audio_storyBasedSyncList`, `kto_audio_themeBasedList`,
`kto_audio_themeLocationBasedList`, `kto_audio_themeSearchList`,
`kto_audio_themeBasedSyncList`), without colliding with existing
`kto_korean_*` (15 tools, SPEC-KTO-001), `kto_barrier_free_*` (10 tools,
SPEC-KTO-002), `kto_photo_*` (4 tools, SPEC-KTO-003), or `kto_camping_*` (5
tools, SPEC-KTO-004) tool names.

#### REQ-KTO5-002 (Ubiquitous)

The MCP server **shall** reuse the existing transports (`stdio`, `streamable-http`,
`http`), the shared `KtoHttpClient` (including the flat-error envelope detection
introduced by SPEC-KTO-003 hotfix), the shared `response-normalizer` (including
empty-string `items: ""` → empty array normalization), the shared `tool-registry`
(whose `registerAll()` already accepts a `ToolRegistry[]` array covering multiple
tool sets), and the existing `BASE_URL_MAP` infrastructure from SPEC-KTO-001 ~
SPEC-KTO-004 without modification of any source file other than (a) a one-line
`Odii` entry addition to `BASE_URL_MAP` and (b) a one-line prose augmentation in
the `@MX:NOTE` comment above `BASE_URL_MAP` to document the four-pattern
coexistence (V2 multilingual multi-path + V2 standalone + V1/no-suffix single +
single-path-with-langCode), ensuring zero regression on `KorService2`
(`kto_korean_*`), `KorWithService2` (`kto_barrier_free_*`),
`PhotoGalleryService1` (`kto_photo_*`), and `GoCamping` (`kto_camping_*`) tools.

#### REQ-KTO5-003 (Ubiquitous)

The MCP server **shall** expose two typed response items in
`src/kto/audio-guide/types.ts`:

- `OdiiStoryItem` whose named optional fields cover the core story metadata
  (`tid`, `tlid`, `stid`, `stlid`, `title`, `mapX`, `mapY`, `audioTitle`,
  `script`, `playTime`, `audioUrl`, `langCode`, `imageUrl`, `createdtime`,
  `modifiedtime`), and an index signature `[key: string]: string | undefined`
  covers any additional Story fields KTO may add; and
- `OdiiThemeItem` whose named optional fields cover the core theme metadata
  (`tid`, `tlid`, `themeCategory`, `addr1`, `addr2`, `title`, `mapX`, `mapY`,
  `langCheck`, `langCode`, `imageUrl`, `createdtime`, `modifiedtime`), and an
  index signature `[key: string]: string | undefined` covers any additional
  Theme fields KTO may add.

All `AudioGuideService` Story methods (`storyBasedList`, `storyBasedSyncList`,
`storyLocationBasedList`, `storySearchList`) **shall** return
`Promise<KtoListResponse<OdiiStoryItem>>`; all Theme methods (`themeBasedList`,
`themeBasedSyncList`, `themeLocationBasedList`, `themeSearchList`) **shall**
return `Promise<KtoListResponse<OdiiThemeItem>>`. Both types preserve KTO
original field naming.

#### REQ-EVT-001 (Event-driven)

**When** an MCP client sends a `tools/call` request for a registered
`kto_audio_*` tool, the server **shall** invoke the corresponding `Odii`
operation via `KtoHttpClient.request({ service: 'Odii', operation, params })`
where `params` includes the tool's validated `langCode` value verbatim (e.g.,
`ko`, `en`, or any other string), normalize the response via the existing
`normalizeItems` helper, and return the result as the tool's response payload
preserving all original KTO field names (including `tid`, `tlid`, `stid`,
`stlid`, `title`, `audioTitle`, `script`, `playTime`, `audioUrl`,
`themeCategory`, `langCheck`, `langCode`, `imageUrl`, and any other fields)
without renaming, flattening, value normalization, audio URL fetching, or
mapping to other KTO service field names.

---

### Module 2: 5xx 재시도 정책 상속 (REQ-STATE-001)

#### REQ-STATE-001 (State-driven)

**While** the `Odii` API returns an HTTP 5xx response or a network-level
transient error, the existing `KtoHttpClient` retry policy (max 3 retries,
exponential backoff with base 200ms, factor 2.0, jitter ±20%, defined in
`RETRY_CONFIG`) **shall** apply identically to `Odii` requests as it does to
`KorService2`, `KorWithService2`, `PhotoGalleryService1`, and `GoCamping`
requests, with no separate retry configuration.

---

### Module 3: BASE_URL_MAP 확장 + 4 패턴 prose 보강 (REQ-OPT-001)

#### REQ-OPT-001 (Optional)

**Where** `KtoHttpClient` selects the base URL via `BASE_URL_MAP[serviceName]`,
the map **shall** be extended to include `Odii:
'http://apis.data.go.kr/B551011/Odii'` as an additional flat-namespace entry
alongside existing entries (`KorService2` family, `KorWithService2`,
`PhotoGalleryService1`, `GoCamping`), and the `KtoServiceName` type **shall**
continue to derive from `keyof typeof BASE_URL_MAP` so that the new service path
is addressable through the same client interface without introducing a new
abstraction; the existing `@MX:NOTE` comment above `BASE_URL_MAP` **shall** be
augmented with a one-line prose addition documenting the four coexisting naming
patterns (V2 multilingual multi-path, V2 standalone, V1/no-suffix single-path,
single-path-with-langCode-parameter) and the `@MX:SPEC` line **shall** include
`SPEC-KTO-005 REQ-OPT-001` alongside existing SPEC IDs.

---

### Module 4: 필수 입력 파라미터 검증 (REQ-UNW-001)

#### REQ-UNW-001 (Unwanted)

**If** an MCP client invokes any `kto_audio_*` tool without supplying the
required parameter, **then** the tool registry **shall not** dispatch any
outbound HTTP request to the `Odii` endpoint; instead it **shall** return a
structured MCP tool error (JSON-RPC `-32602` Invalid params or equivalent
MCP-standard tool error) citing the missing required field. The required
parameters are:

- All 8 `kto_audio_*` tools require non-empty `langCode` (validated by
  `class-validator` `@IsNotEmpty()` decorator on the corresponding DTO field).
  유효 값 권장은 `ko` / `en` 이며 도구 description 에 명시한다. KTO 가 0 records
  로 응답하는 다른 입력값 (예: `ja`, `zh`, `KOR`) 은 DTO 차원에서 거부하지
  않는다.
- `kto_audio_storyLocationBasedList` 추가 요건: 비어 있지 않은 `mapX`,
  비어 있지 않은 `mapY`, 비어 있지 않은 `radius` (radius 값 ≤ 20000 enforced).
- `kto_audio_themeLocationBasedList` 추가 요건: 동일 (`mapX` / `mapY` /
  `radius`, radius ≤ 20000).
- `kto_audio_storySearchList` 추가 요건: 비어 있지 않은 `keyword`.
- `kto_audio_themeSearchList` 추가 요건: 비어 있지 않은 `keyword`.

Validation **shall** be performed by the corresponding DTOs
(`AgStoryBasedListDto`, `AgStoryBasedSyncListDto`, `AgStoryLocationBasedListDto`,
`AgStorySearchListDto`, `AgThemeBasedListDto`, `AgThemeBasedSyncListDto`,
`AgThemeLocationBasedListDto`, `AgThemeSearchListDto`) via `class-validator`
decorators (`@IsNotEmpty`, `@Max(20000)` for radius) before reaching
`KtoHttpClient`. The other two tools (`kto_audio_storyBasedList`,
`kto_audio_storyBasedSyncList`, `kto_audio_themeBasedList`,
`kto_audio_themeBasedSyncList`) have no operation-specific required parameters
beyond `langCode`.

---

### Module 5: SPEC-KTO-001 ~ SPEC-KTO-004 회귀 보호 (REQ-UNW-002)

#### REQ-UNW-002 (Unwanted)

**If** the introduction of `Odii` causes any pre-existing `kto_korean_*`,
`kto_barrier_free_*`, `kto_photo_*`, or `kto_camping_*` tool registration, JSON
Schema, validation behavior, retry behavior, response normalization output, or
`KtoHttpClient` flat-error envelope detection to change, **then** the
implementation **shall** be rejected; the SPEC-KTO-001 + SPEC-KTO-002 +
SPEC-KTO-003 + SPEC-KTO-004 unit-test suite (including
`src/kto/kto-http.client.spec.ts`,
`src/kto/korean-tour-info/korean-tour-info.service.spec.ts`,
`src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`,
`src/kto/photo-gallery/photo-gallery.service.spec.ts`,
`src/kto/go-camping/go-camping.service.spec.ts`,
`src/mcp/tool-registry.spec.ts`, `test/kto.e2e-spec.ts`) **shall** continue to
pass without modification of any test assertion, except where (a) the e2e tool
count assertion is updated from `34` to the new total `42` reflecting added
`kto_audio_*` tools (8 개), or (b) a new test file or new assertion is added
strictly for `Odii` coverage.

---

## Affected Files (Write Targets)

### Modified

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `Odii` 항목 1줄 추가.
  위 `@MX:NOTE` prose 1줄 보강 (4 패턴 — V2 다국어 다중 + V2 단독 + V없음 단일 +
  langCode 파라미터 — 명시). `@MX:SPEC` 라인에 `SPEC-KTO-005 REQ-OPT-001` 추가.
- `src/app.module.ts` — `AudioGuideModule` import 1줄 추가.
- `src/main.ts` — `AudioGuideService` 주입 1줄 + `registerAll()` 호출의
  registries 배열에 `{ tools: ODII_TOOLS, service: audioGuideService }` 항목
  1개 추가.
- `test/kto.e2e-spec.ts` — `tools/list` 도구 카운트 검증 assertion 갱신
  (34 → 42). Odii 신규 시나리오 추가.

### Created

#### Audio Guide Module (5차 구현, KTO Odii service path 매핑)

- `src/kto/audio-guide/audio-guide.module.ts`
- `src/kto/audio-guide/audio-guide.service.ts`
- `src/kto/audio-guide/audio-guide.tools.ts`
- `src/kto/audio-guide/types.ts` (신규 — `OdiiStoryItem` interface +
  `OdiiThemeItem` interface, 양쪽 모두 인덱스 시그니처)
- `src/kto/audio-guide/dto/story-based-list.dto.ts` (`AgStoryBasedListDto`,
  `langCode` 필수)
- `src/kto/audio-guide/dto/story-based-sync-list.dto.ts`
  (`AgStoryBasedSyncListDto`, `langCode` 필수, `syncStatus?`)
- `src/kto/audio-guide/dto/story-location-based-list.dto.ts`
  (`AgStoryLocationBasedListDto`, `langCode` / `mapX` / `mapY` / `radius`
  필수, radius ≤ 20000)
- `src/kto/audio-guide/dto/story-search-list.dto.ts` (`AgStorySearchListDto`,
  `langCode` / `keyword` 필수)
- `src/kto/audio-guide/dto/theme-based-list.dto.ts` (`AgThemeBasedListDto`,
  `langCode` 필수)
- `src/kto/audio-guide/dto/theme-based-sync-list.dto.ts`
  (`AgThemeBasedSyncListDto`, `langCode` 필수, `syncStatus?`)
- `src/kto/audio-guide/dto/theme-location-based-list.dto.ts`
  (`AgThemeLocationBasedListDto`, `langCode` / `mapX` / `mapY` / `radius`
  필수, radius ≤ 20000)
- `src/kto/audio-guide/dto/theme-search-list.dto.ts` (`AgThemeSearchListDto`,
  `langCode` / `keyword` 필수)
- `src/kto/audio-guide/dto/index.ts`

#### Tests

- `src/kto/audio-guide/audio-guide.service.spec.ts`
- `src/kto/audio-guide/audio-guide.tools.spec.ts`
- `src/kto/audio-guide/dto/dto.spec.ts` — DTO 검증 단위 테스트 (REQ-UNW-001 —
  langCode 누락, 좌표 누락, keyword 누락 케이스 모두 커버)
- `test/kto.e2e-spec.ts` 에 Odii 시나리오 추가 (신규 파일 X, 기존 파일 확장)

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
- `src/kto/go-camping/**/*` (모두 변경 없음)

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 ~ SPEC-KTO-004 에서 도입한
`@modelcontextprotocol/sdk`, `axios`, `class-validator`, `class-transformer`,
`fast-xml-parser`, dev `nock` 을 그대로 재사용한다.

---

## Success Criteria

| 항목 | 기준 |
|------|------|
| 도구 매핑 완성도 | `Odii` 의 8 오퍼레이션이 모두 MCP 도구로 노출됨 (`tools/list` 응답에서 `kto_audio_*` prefix 카운트 = 8 로 검증) |
| 8 도구 노출 | 도구 카탈로그에 `kto_audio_storyBasedList`, `kto_audio_storyBasedSyncList`, `kto_audio_storyLocationBasedList`, `kto_audio_storySearchList`, `kto_audio_themeBasedList`, `kto_audio_themeBasedSyncList`, `kto_audio_themeLocationBasedList`, `kto_audio_themeSearchList` 모두 포함 |
| `OdiiStoryItem` / `OdiiThemeItem` 타입 노출 | `src/kto/audio-guide/types.ts` 두 interface 모두 export. Story 4 ops 반환 타입 = `Promise<KtoListResponse<OdiiStoryItem>>`. Theme 4 ops 반환 타입 = `Promise<KtoListResponse<OdiiThemeItem>>` |
| `langCode` 필수 검증 | 8 도구 전체에서 `langCode` 누락 시 outbound 0회 + MCP `-32602` |
| 단위 테스트 커버리지 | 85% 이상 유지 (`pnpm test:cov` statements 기준) — 선행 SPEC 의 커버리지에서 유의미한 하락 금지 |
| 회귀 무사고 | SPEC-KTO-001 + SPEC-KTO-002 + SPEC-KTO-003 + SPEC-KTO-004 의 기존 단위·e2e 테스트가 도구 카운트 갱신 외 변경 없이 모두 PASS |
| Lint | `pnpm lint` 무경고 무에러 |
| Build | `pnpm build` 성공 |
| Transport 검증 | stdio 및 streamable-http 모드에서 `tools/list` 응답에 `kto_korean_*` + `kto_barrier_free_*` + `kto_photo_*` + `kto_camping_*` + `kto_audio_*` 모두 포함 |
| 도구 카운트 갱신 | e2e 테스트 도구 카운트 assertion 이 34 → 42 로 갱신 |
| 빈 결과 처리 | `langCode=ja` 등 미지원 언어 입력 시 `totalCount=0` 응답이 `items: []` 로 정규화되어 MCP 응답 반환 (에러 아님) |
| `audioUrl` 보존 | `kto_audio_storyBasedList?langCode=ko` 응답의 첫 항목에 `audioUrl` 필드가 KTO CDN URL 문자열 그대로 포함 |

상세 시나리오는 `acceptance.md` 참조.

---

Version: 0.1.0
Last Updated: 2026-05-09
