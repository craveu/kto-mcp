# Progress: SPEC-KTO-003 (KTO MCP 서버 3차 이터레이션 — 관광사진 정보)

## Status: COMPLETE (v0.2.0 — 실 API 검증 후 수정)

모든 Phase 완료. 실 KTO API 호출로 service path 및 operation 이름 수정 완료.

---

## Hotfix: 실 API 호출 결과 반영 (v0.1.0 → v0.2.0)

- Initial impl: KorPhotoService2 (assumed) — 실 키 스모크에서 HTTP 500 발생
- Discovery: 실제 서비스는 `PhotoGalleryService1` (V1 패턴, not V2)
- 4 operations 확인: galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1
- [VERIFIED] galleryList1 returns real photos (totalCount 6119)
- [VERIFIED] gallerySearchList1 keyword='경복궁' returns 532 hits
- All [ASSUMED] markers resolved except gallerySyncDetailList1 syncModTime param name (low impact)

---

## Phase Results

### Phase 1: BASE_URL_MAP refactor — COMPLETE
- `src/kto/common/constants.ts`: `PhotoGalleryService1` 1줄 추가 + `@MX:SPEC` 라인에 `SPEC-KTO-003 REQ-OPT-001` 추가
- `src/kto/common/constants.spec.ts`: PhotoGalleryService1 URL 검증, 기존 URL 회귀 보호
- 기존 unit tests 전수 PASS 확인 (REQ-UNW-002)

### Phase 2: Photo Gallery DTOs + types.ts — COMPLETE
- `src/kto/photo-gallery/types.ts`: `PhotoGalleryItem` interface (galContentId required, galContentTypeId 추가, gal* 9개 optional)
- `src/kto/photo-gallery/dto/gallery-list.dto.ts`: `PgGalleryListDto` (arrange, numOfRows, pageNo — 전 필드 optional)
- `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts`: `PgGalleryDetailListDto` (galContentId 필수)
- `src/kto/photo-gallery/dto/gallery-search-list.dto.ts`: `PgGallerySearchListDto` (keyword 필수)
- `src/kto/photo-gallery/dto/gallery-sync-detail-list.dto.ts`: `PgGallerySyncDetailListDto` (전 필드 optional)
- `src/kto/photo-gallery/dto/index.ts`: 배럴 export (4 DTO)
- `src/kto/photo-gallery/dto/dto.spec.ts`: 4 DTO 검증 테스트

### Phase 3: PhotoGalleryService + tools.ts — COMPLETE
- `src/kto/photo-gallery/photo-gallery.service.ts`: 4개 메서드 (galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1), PhotoGalleryService1
- `src/kto/photo-gallery/photo-gallery.tools.ts`: `PHOTO_GALLERY_TOOLS` 4개
- `src/kto/photo-gallery/photo-gallery.service.spec.ts`: 4 메서드 전체 테스트, PhotoGalleryService1 검증
- `src/kto/photo-gallery/photo-gallery.tools.spec.ts`: 4 도구 구조 검증

### Phase 4: Module wiring — COMPLETE
- `src/app.module.ts`: PhotoGalleryModule import 추가
- `src/main.ts`: PhotoGalleryService 주입 + PHOTO_GALLERY_TOOLS 등록
- `pnpm build` 성공

### Phase 5: Verification — COMPLETE
- Unit tests: 167 tests passed (기존 140 + 신규 27)
- E2E tests: 7 tests passed
- Coverage: 95.04% statements (≥85% 충족)
- Lint: 0 errors
- Build: 성공

---

## File Counts

### Created (11 files)
- `src/kto/photo-gallery/types.ts`
- `src/kto/photo-gallery/photo-gallery.module.ts`
- `src/kto/photo-gallery/photo-gallery.service.ts`
- `src/kto/photo-gallery/photo-gallery.tools.ts`
- `src/kto/photo-gallery/dto/gallery-list.dto.ts`
- `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts`
- `src/kto/photo-gallery/dto/gallery-search-list.dto.ts`
- `src/kto/photo-gallery/dto/gallery-sync-detail-list.dto.ts`
- `src/kto/photo-gallery/dto/index.ts`
- `src/kto/photo-gallery/photo-gallery.service.spec.ts`
- `src/kto/photo-gallery/photo-gallery.tools.spec.ts`
- `src/kto/photo-gallery/dto/dto.spec.ts`
- `src/kto/common/constants.spec.ts`

Total: **13 files created**

### Modified (4 files)
- `src/kto/common/constants.ts` (PhotoGalleryService1 1줄 + @MX:SPEC 갱신)
- `src/app.module.ts` (PhotoGalleryModule import)
- `src/main.ts` (PhotoGalleryService 주입 + registries 배열 확장)
- `test/kto.e2e-spec.ts` (25 → ≥29 assertion + kto_photo_*1 도구 4개 검증 추가)

---

## Tool Count
- kto_korean_* : 15개
- kto_barrier_free_* : 10개
- kto_photo_* : 4개
- **합계: 29개** (≥29 acceptance criterion 충족)

---

## Coverage
- All files: 95.04% statements / 77.7% branches / 95% functions / 95.54% lines
- photo-gallery module: 100% statements/lines (tools.ts, service.ts, dto/*.ts)
- Target ≥85%: **충족**

---

## Divergence from Plan

v0.1.0 초안과의 차이:
- service path: `KorPhotoService2` → `PhotoGalleryService1` (실 API 호출로 확인)
- operation suffix: `*2` → `*1` (V1 패턴)
- operation count: 2 → 4 (gallerySearchList1, gallerySyncDetailList1 추가)
- galContentTypeId 필드 추가

---

## MX Tag Changes

- `src/kto/common/constants.ts`: `@MX:SPEC` 라인에 `SPEC-KTO-003 REQ-OPT-001` 추가
- `src/kto/photo-gallery/types.ts`: `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-003 REQ-KTO3-003` 추가
- `src/kto/photo-gallery/photo-gallery.service.ts`: `@MX:NOTE` + `@MX:SPEC` (4 메서드)
- `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts`: `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-003 REQ-UNW-001`
- `src/kto/photo-gallery/dto/gallery-sync-detail-list.dto.ts`: `@MX:NOTE` (syncModTime VERIFIED 필요 표시)
- `src/kto/photo-gallery/photo-gallery.tools.ts`: `@MX:NOTE` (카탈로그 진입점)
- fan_in 증가: `KtoHttpClient.request()` 이제 29개 도구에서 호출됨 (기존 25 → 29)

---

## Hotfix 2 (post-smoke 2nd round)

- galleryDetailList1: required param is `title` (verified by KTO error msg), DTO and tool schema corrected
- KtoHttpClient: added flat-error envelope detection (some KTO ops return {responseTime,resultCode,resultMsg} without `response` wrapper)
- Added galUseFlag to PhotoGalleryItem (observed in gallerySyncDetailList1)
- All [VERIFIED] markers resolved except syncModTime exact name (gallerySyncDetailList1 returns 200 OK with no params, so the param is fully optional or named differently — kept inline note)

### Files modified in Hotfix 2
- `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts`: replaced `galContentId` with `title` (required); added optional `numOfRows`, `pageNo`
- `src/kto/photo-gallery/photo-gallery.tools.ts`: updated `kto_photo_galleryDetailList1` inputSchema to `required: ['title']`
- `src/kto/kto-http.client.ts`: flat-error envelope detection before normal response.header check
- `src/kto/photo-gallery/types.ts`: added `galUseFlag?: string` to PhotoGalleryItem
- `src/kto/photo-gallery/dto/dto.spec.ts`: replaced galContentId tests with title tests for PgGalleryDetailListDto
- `src/kto/photo-gallery/photo-gallery.service.spec.ts`: updated galleryDetailList1 mock call args to use title
- `src/kto/photo-gallery/photo-gallery.tools.spec.ts`: updated schema assertions to title
- `src/kto/kto-http.client.spec.ts`: added 1 new flat-envelope test (nock, 200, code='11')
- `test/kto.e2e-spec.ts`: updated validation error message assertion from galContentId to title

### Verification (Hotfix 2)
- Unit tests: 170 passed (170 total, +1 flat-envelope test)
- E2E tests: 7 passed
- Coverage: 95.28% statements (≥85% 충족)
- Lint: 0 errors
- Build: 성공

---

Version: 2.1.0
Completed: 2026-05-09
