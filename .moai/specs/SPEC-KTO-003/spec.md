---
id: SPEC-KTO-003
version: 1.0.0
status: completed
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-003: KTO MCP 서버 3차 이터레이션 (PhotoGalleryService1 관광사진 정보)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료, 실 키 스모크 검증 통과, main 머지 완료 |
| 0.2.0 | 2026-05-09 | Seonho Kim | RUN 단계 실 호출로 service path/operation 검증·수정. PhotoGalleryService1 + 4 operations로 변경 (galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1). galContentTypeId 필드 추가. [ASSUMED] 마커 대부분 해소. |
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. PhotoGalleryService1 관광사진 정보 API(data.go.kr ID 15101914) 를 MCP 도구로 매핑하는 3차 이터레이션 정의. |

---

## Overview

SPEC-KTO-001 / SPEC-KTO-002 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에
한국관광공사 관광사진 정보 조회 API(`PhotoGalleryService1`, data.go.kr ID 15101914) 를
추가 통합한다. 본 SPEC 은 두 선행 SPEC 의 공용 인프라(`KtoHttpClient`,
`response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책,
`BASE_URL_MAP`) 를 변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/photo-gallery/`
를 추가**하고 `BASE_URL_MAP` 에 `PhotoGalleryService1` 항목 1줄을 추가한다.

선행 SPEC 두 건과 다른 점은, 사진 응답 item 의 필드명이 `gal*` prefix (예:
`galContentId`, `galTitle`, `galWebImageUrl`) 를 사용한다는 사실이다. 따라서 본 SPEC
은 **신규 typed item `PhotoGalleryItem` 인터페이스**를 `src/kto/photo-gallery/types.ts`
에 정의하고, 서비스 메서드의 반환 타입을 `Promise<KtoListResponse<PhotoGalleryItem>>`
로 명시한다. 이는 KorService2 / KorWithService2 의 평면 필드 응답과 충돌하지 않으며,
`KtoListResponse<T>` 의 `T` parameter 만 instantiate 하는 형태로 기존 타입 인프라를
변경 없이 재사용한다.

상위 컨텍스트는 `research.md` (KorService2 / KorWithService2 와의 차이점·사진 응답
필드 카탈로그) 에서 확인하고, 구체적 작업 분해는 `plan.md`, 검증 시나리오는
`acceptance.md` 를 참조한다.

본 SPEC 은 패턴 복제(replication) SPEC 으로, 신규 추상화·신규 라이브러리 도입 없이
관광사진 도메인 모듈만 추가한다.

---

## Scope

### In Scope (3차 이터레이션)

- `PhotoGalleryService1` 오퍼레이션의 MCP 도구 매핑 (1:1, 최대 4개; 정확한 수는 RUN Phase
  첫 통합 테스트로 확정. 기본값 2개 — `galleryList1`, `galleryDetailList1`)
- 사진 도메인 고유 응답 타입 `PhotoGalleryItem` 신규 정의
  (`src/kto/photo-gallery/types.ts`) — `gal*` prefix 필드 9~13종을 typed interface 로
  표현
- `BASE_URL_MAP` 에 `PhotoGalleryService1` 항목 추가 (1줄 수정)
- `KtoHttpClient`·`response-normalizer`·`tool-registry`·transport 3종 변경 없이 재사용
- 도구 이름 prefix `kto_photo_*` 로 KorService2 도구(`kto_korean_*`) 및
  KorWithService2 도구(`kto_barrier_free_*`) 와 네임스페이스 분리
- Jest 단위 테스트 + e2e 테스트 (커버리지 85% 이상 유지)
- SPEC-KTO-001 / SPEC-KTO-002 회귀 무사고 검증 (`pnpm test` 전수 통과 + e2e 도구
  카운트 25 → 27+ 갱신)

### Out of Scope (Exclusions — What NOT to Build)

본 이터레이션에서 명시적으로 제외하는 항목:

1. **사진 다운로드·바이너리 캐싱·이미지 변환** — 본 SPEC 은 KTO API 가 반환하는
   `galWebImageUrl` 등 이미지 URL **메타데이터만** 노출한다. 이미지 바이너리 fetch,
   썸네일 생성, 로컬 캐싱, 포맷 변환은 모두 SPEC 범위 외.
2. **사진 다국어 변체 본격 구현** — `EngPhotoService2`, `JpnPhotoService2` 등 다국어
   사진 변체는 존재 여부가 불명확하며, 정식 검증·도구 등록은 차기 SPEC 으로 이관.
3. **통합 사진 검색 도구** — KorService2 의 `firstimage` 와 PhotoGalleryService1 의
   `galWebImageUrl` 을 머지하여 콘텐츠별 대표 이미지 + 갤러리 사진을 한 번에 반환하는
   합성 도구는 본 SPEC 범위 외. 별도 SPEC 후보(`SPEC-KTO-MERGE-XXX`).
4. **데이터 캐싱 / 영속 저장소(DB·Redis)** — SPEC-KTO-001 정책 동일. 모든 호출은 KTO
   API 직접 호출.
5. **사진 응답 필드의 한글 번역·정규화** — KorService2 / KorWithService2 정책 동일
   하게 `galContentId`, `galWebImageUrl` 등 KTO 원형 필드명을 보존. `gal*` prefix
   를 평면화하거나 다른 KTO 서비스의 필드명(`contentid`, `firstimage`) 으로 변환하지
   않는다.
6. **자동 페이지네이션** — `numOfRows`, `pageNo` 그대로 노출. 자동 페이지 순회 로직
   미구현.
7. **인증·인가 / 멀티 테넌시** — 단일 `KTO_SERVICE_KEY` 환경변수 운영.
8. **이미지 URL 유효성 외부 검증** — `galWebImageUrl` 이 실제 fetchable 한지, HTTP 200
   응답을 반환하는지 등의 검증은 본 SPEC 범위 외 (KTO 응답 그대로 신뢰).
9. **EXIF / 카메라 메타 추출** — 응답에 포함된 필드만 노출. 외부 EXIF 라이브러리 도입 X.

---

## Requirements (EARS Format)

EARS 5 모듈 한도. 본 SPEC 은 SPEC-KTO-001 / SPEC-KTO-002 의 인프라 요구사항을
상속(reuse) 하므로, PhotoGalleryService1 도메인에 신규로 발생하는 요구사항만 정의한다.

### Module 1: PhotoGalleryService1 도메인 도구 노출 (REQ-KTO3-001 ~ REQ-EVT-001)

#### REQ-KTO3-001 (Ubiquitous)

The MCP server **shall** expose all available `PhotoGalleryService1` operations as MCP
tools whose names follow the pattern `kto_photo_{operationName}` (예:
`kto_photo_galleryList1`, `kto_photo_galleryDetailList1`), without colliding with
existing `kto_korean_*` tool names from SPEC-KTO-001 or `kto_barrier_free_*` tool
names from SPEC-KTO-002.

#### REQ-KTO3-002 (Ubiquitous)

The MCP server **shall** reuse the existing transports (`stdio`, `streamable-http`,
`http`), the shared `KtoHttpClient`, the shared `response-normalizer`, the shared
`tool-registry` (whose `registerAll()` already accepts a `ToolRegistry[]` array
covering multiple tool sets), and the existing `BASE_URL_MAP` infrastructure from
SPEC-KTO-001 / SPEC-KTO-002 without modification of any source file other than a
one-line addition to `BASE_URL_MAP`, ensuring zero regression on `KorService2`
(`kto_korean_*`) and `KorWithService2` (`kto_barrier_free_*`) tools.

#### REQ-KTO3-003 (Ubiquitous)

The MCP server **shall** expose a typed response item `PhotoGalleryItem` defined
at `src/kto/photo-gallery/types.ts` whose required field is `galContentId: string`
and whose optional fields cover `galTitle`, `galWebImageUrl`, `galCreatedtime`,
`galModifiedtime`, `galPhotographyLocation`, `galPhotographyMonth`, `galPhotographer`,
`galSearchKeyword` (and any additional `gal*` fields discovered during RUN Phase
integration testing); all `PhotoGalleryService` methods **shall** return
`Promise<KtoListResponse<PhotoGalleryItem>>` so that downstream MCP clients receive
type information consistent with KTO original field naming.

#### REQ-EVT-001 (Event-driven)

**When** an MCP client sends a `tools/call` request for a registered `kto_photo_*`
tool, the server **shall** invoke the corresponding `PhotoGalleryService1` operation
via `KtoHttpClient.request({ service: 'PhotoGalleryService1', operation, params })`,
normalize the response via the existing `normalizeItems` helper, and return the
result as the tool's response payload preserving original KTO `gal*` field names
(including `galContentId`, `galTitle`, `galWebImageUrl`, `galCreatedtime`,
`galModifiedtime`, `galPhotographyLocation`, `galPhotographyMonth`, `galPhotographer`,
`galSearchKeyword`) without renaming, flattening, or mapping to `KorService2` field
names.

---

### Module 2: 5xx 재시도 정책 상속 (REQ-STATE-001)

#### REQ-STATE-001 (State-driven)

**While** the `PhotoGalleryService1` API returns an HTTP 5xx response or a network-level
transient error, the existing `KtoHttpClient` retry policy (max 3 retries, exponential
backoff with base 200ms, factor 2.0, jitter ±20%, defined in `RETRY_CONFIG`) **shall**
apply identically to `PhotoGalleryService1` requests as it does to `KorService2` and
`KorWithService2` requests, with no separate retry configuration.

---

### Module 3: BASE_URL_MAP 확장 (REQ-OPT-001)

#### REQ-OPT-001 (Optional)

**Where** `KtoHttpClient` selects the base URL via `BASE_URL_MAP[serviceName]`, the
map **shall** be extended to include `PhotoGalleryService1:
'http://apis.data.go.kr/B551011/PhotoGalleryService1'` as an additional flat-namespace
entry alongside existing entries (`KorService2`, language variants, `KorWithService2`),
and the `KtoServiceName` type **shall** continue to derive from `keyof typeof
BASE_URL_MAP` so that the new service path is addressable through the same client
interface without introducing a new abstraction; the existing `@MX:NOTE` comment
above `BASE_URL_MAP` (already covering "language variants + functional sibling
services") **shall** be augmented only with `@MX:SPEC: SPEC-KTO-003 REQ-OPT-001`,
without prose changes.

---

### Module 4: galleryDetailList1 의 galContentId 검증 (REQ-UNW-001)

#### REQ-UNW-001 (Unwanted)

**If** an MCP client invokes the `kto_photo_galleryDetailList1` tool without
supplying a non-empty `galContentId` argument, **then** the tool registry **shall
not** dispatch any outbound HTTP request to the `PhotoGalleryService1/galleryDetailList1`
endpoint; instead it **shall** return a structured MCP tool error citing the
missing `galContentId` field, validated by the corresponding DTO
(`PgGalleryDetailListDto`) via `class-validator` (`@IsNotEmpty`) before reaching
`KtoHttpClient`.

---

### Module 5: SPEC-KTO-001 / SPEC-KTO-002 회귀 보호 (REQ-UNW-002)

#### REQ-UNW-002 (Unwanted)

**If** the introduction of `PhotoGalleryService1` causes any pre-existing `kto_korean_*`
or `kto_barrier_free_*` tool registration, JSON Schema, validation behavior, retry
behavior, or response normalization output to change, **then** the implementation
**shall** be rejected; the SPEC-KTO-001 + SPEC-KTO-002 unit-test suite (including
`src/kto/kto-http.client.spec.ts`,
`src/kto/korean-tour-info/korean-tour-info.service.spec.ts`,
`src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`,
`src/mcp/tool-registry.spec.ts`, `test/kto.e2e-spec.ts`) **shall** continue to pass
without modification of any test assertion, except where (a) the e2e tool count
assertion is updated from `25` to the new total (≥ 29) reflecting added
`kto_photo_*` tools (4개), or (b) a new test file or new assertion is added strictly for
`PhotoGalleryService1` coverage.

---

## Affected Files (Write Targets)

### Modified

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `PhotoGalleryService1` 항목 1줄 추가.
  기존 `@MX:NOTE` prose 변경 없음. `@MX:SPEC` 하단 라인에 `SPEC-KTO-003 REQ-OPT-001`
  추가.
- `src/app.module.ts` — `PhotoGalleryModule` import 1줄 추가.
- `src/main.ts` — `PhotoGalleryService` 주입 1줄 + `registerAll()` 호출의 registries
  배열에 `{ tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService }` 항목 1개 추가.
- `test/kto.e2e-spec.ts` — `tools/list` 도구 카운트 검증 assertion 갱신 (25 → ≥29). PhotoGalleryService1 신규 시나리오 추가.

### Created

#### Photo Gallery Module (3차 구현)

- `src/kto/photo-gallery/photo-gallery.module.ts`
- `src/kto/photo-gallery/photo-gallery.service.ts`
- `src/kto/photo-gallery/photo-gallery.tools.ts`
- `src/kto/photo-gallery/types.ts` (신규 — `PhotoGalleryItem` interface)
- `src/kto/photo-gallery/dto/gallery-list.dto.ts` (`PgGalleryListDto`)
- `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts` (`PgGalleryDetailListDto`,
  `galContentId` 필수)
- `src/kto/photo-gallery/dto/gallery-search-list.dto.ts` (`PgGallerySearchListDto`, `keyword` 필수)
- `src/kto/photo-gallery/dto/gallery-sync-detail-list.dto.ts` (`PgGallerySyncDetailListDto`, 모두 선택)
- `src/kto/photo-gallery/dto/index.ts`

#### Tests

- `src/kto/photo-gallery/photo-gallery.service.spec.ts`
- (선택) `src/kto/photo-gallery/dto/dto.spec.ts` — DTO 검증 단위 테스트
- `test/kto.e2e-spec.ts` 에 PhotoGalleryService1 시나리오 추가 (신규 파일 X, 기존 파일 확장)

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

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 / SPEC-KTO-002 에서 도입한
`@modelcontextprotocol/sdk`, `axios`, `class-validator`, `class-transformer`,
`fast-xml-parser`, dev `nock` 을 그대로 재사용한다.

---

## Success Criteria

| 항목 | 기준 |
|------|------|
| 도구 매핑 완성도 | `PhotoGalleryService1` 의 RUN Phase 검증된 모든 오퍼레이션이 MCP 도구로 노출됨 (`tools/list` 응답에서 `kto_photo_*` prefix 카운트로 검증) |
| `galleryList1` / `galleryDetailList1` 노출 | 도구 카탈로그에 `kto_photo_galleryList1` 와 `kto_photo_galleryDetailList1` 두 도구가 반드시 포함됨 |
| `PhotoGalleryItem` 타입 노출 | `src/kto/photo-gallery/types.ts` 가 export 되며, `PhotoGalleryService` 모든 메서드의 반환 타입이 `Promise<KtoListResponse<PhotoGalleryItem>>` 임 |
| 단위 테스트 커버리지 | 85% 이상 유지 (`pnpm test:cov` statements 기준) — 선행 SPEC 의 커버리지에서 유의미한 하락 금지 |
| 회귀 무사고 | SPEC-KTO-001 + SPEC-KTO-002 의 기존 단위·e2e 테스트가 도구 카운트 갱신 외 변경 없이 모두 PASS |
| Lint | `pnpm lint` 무경고 무에러 |
| Build | `pnpm build` 성공 |
| Transport 검증 | stdio 및 streamable-http 모드에서 `tools/list` 응답에 `kto_korean_*` + `kto_barrier_free_*` + `kto_photo_*` 모두 포함 |
| 도구 카운트 갱신 | e2e 테스트 도구 카운트 assertion 이 25 → ≥27 로 갱신 |

상세 시나리오는 `acceptance.md` 참조.

---

Version: 0.1.0
Last Updated: 2026-05-09
