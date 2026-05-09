# SPEC-KTO-003 (Compact)

KTO MCP 서버 3차 이터레이션 — PhotoGalleryService1 관광사진 정보 (data.go.kr ID 15101914,
PhotoKorea). SPEC-KTO-001 (KorService2) + SPEC-KTO-002 (KorWithService2) 의
공용 인프라(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 3종,
에러 모델, 재시도 정책, `BASE_URL_MAP`) 100% 재사용. 패턴 복제 SPEC.

핵심 차이점: 응답 item 필드가 `gal*` prefix (`galContentId`, `galTitle`,
`galWebImageUrl`, ...) 사용 → 신규 typed item `PhotoGalleryItem` 도입
(`src/kto/photo-gallery/types.ts`). 서비스 path는 `PhotoGalleryService1` (V1, not V2).

---

## Requirements (5 Modules / EARS)

### Module 1: PhotoGalleryService1 도메인 도구 노출

- **REQ-KTO3-001 (Ubiquitous)** — 모든 PhotoGalleryService1 오퍼레이션(4개)을
  `kto_photo_{operationName}` 이름의 MCP 도구로 노출. 기존 `kto_korean_*` /
  `kto_barrier_free_*` 와 prefix 충돌 없음.
- **REQ-KTO3-002 (Ubiquitous)** — `stdio` / `streamable-http` / `http` transport,
  `KtoHttpClient`, `response-normalizer`, `tool-registry`(이미 `ToolRegistry[]` 다중
  지원), `BASE_URL_MAP` 인프라를 SPEC-KTO-001 / SPEC-KTO-002 에서 변경 없이 재사용.
  `BASE_URL_MAP` 1줄 추가 외 다른 인프라 파일 수정 없음. 선행 SPEC 도구 회귀 무사고.
- **REQ-KTO3-003 (Ubiquitous)** — `src/kto/photo-gallery/types.ts` 에 `PhotoGalleryItem`
  interface 정의 (`galContentId: string` required, `galContentTypeId` 포함 나머지 `gal*` 필드 optional).
  모든 `PhotoGalleryService` 메서드가 `Promise<KtoListResponse<PhotoGalleryItem>>` 반환.
- **REQ-EVT-001 (Event-driven)** — `tools/call` 수신 시 `KtoHttpClient.request({
  service: 'PhotoGalleryService1', operation, params })` 호출 → 정규화 → 응답 반환. 사진
  응답 필드(`galContentId`, `galTitle`, `galWebImageUrl`, `galCreatedtime`,
  `galModifiedtime`, `galPhotographyLocation`, `galPhotographyMonth`,
  `galPhotographer`, `galSearchKeyword`) 를 KTO 원형 표기 그대로 보존.

### Module 2: 5xx 재시도 정책 상속

- **REQ-STATE-001 (State-driven)** — PhotoGalleryService1 5xx/네트워크 transient 에러에
  기존 `RETRY_CONFIG` (max 3, base 200ms, factor 2.0, jitter ±20%) 동일 적용. 별도
  설정 없음.

### Module 3: BASE_URL_MAP 1줄 확장

- **REQ-OPT-001 (Optional)** — `BASE_URL_MAP` 에 `PhotoGalleryService1:
  'http://apis.data.go.kr/B551011/PhotoGalleryService1'` 1줄 추가. `KtoServiceName =
  keyof typeof BASE_URL_MAP` 유지. 단일 flat namespace 에 언어 변체 + 기능적 형제
  서비스(`KorWithService2`, `PhotoGalleryService1`) 공존. 신규 추상화 도입 금지. 기존
  `@MX:NOTE` prose 변경 없음 (이미 일반화 의미 담고 있음), `@MX:SPEC: SPEC-KTO-003
  REQ-OPT-001` 만 추가.

### Module 4: galleryDetailList1 의 galContentId 검증

- **REQ-UNW-001 (Unwanted)** — `kto_photo_galleryDetailList1` 호출 시 `galContentId`
  누락이면 outbound HTTP 발생 X. class-validator(`@IsNotEmpty`) 로 차단, 구조화된 MCP
  도구 에러 반환.

### Module 5: SPEC-KTO-001 + SPEC-KTO-002 회귀 보호

- **REQ-UNW-002 (Unwanted)** — 본 SPEC 구현이 기존 `kto_korean_*` 또는
  `kto_barrier_free_*` 도구 등록·JSON Schema·검증·재시도·정규화 동작을 변경하면
  reject. 선행 SPEC 의 unit + e2e 테스트가 도구 카운트 assertion (25 → ≥29) 갱신 외
  assertion 변경 없이 모두 PASS 해야 함.

---

## Files to Modify

### Modified (4)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 1줄 추가 + `@MX:SPEC` 라인에
  `SPEC-KTO-003 REQ-OPT-001` 추가 (prose 변경 없음)
- `src/app.module.ts` — `PhotoGalleryModule` import 1줄 추가
- `src/main.ts` — `PhotoGalleryService` 주입 1줄 + `registerAll()` registries 배열에
  `{ tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService }` 항목 1개 추가
- `test/kto.e2e-spec.ts` — 도구 카운트 assertion `25` → `≥29` 갱신 + PhotoGalleryService1
  시나리오 추가

### Created — Module (`src/kto/photo-gallery/`)

- `photo-gallery.module.ts`
- `photo-gallery.service.ts` (4 methods: galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1)
- `photo-gallery.tools.ts` (4 tools: kto_photo_galleryList1, kto_photo_galleryDetailList1, kto_photo_gallerySearchList1, kto_photo_gallerySyncDetailList1)
- `types.ts` (신규 — `PhotoGalleryItem` interface with galContentTypeId)
- `dto/gallery-list.dto.ts` (`PgGalleryListDto`)
- `dto/gallery-detail-list.dto.ts` (`PgGalleryDetailListDto`, `galContentId` 필수)
- `dto/gallery-search-list.dto.ts` (`PgGallerySearchListDto`, `keyword` 필수)
- `dto/gallery-sync-detail-list.dto.ts` (`PgGallerySyncDetailListDto`, 모두 선택)
- `dto/index.ts`

### Created — Tests

- `src/kto/photo-gallery/photo-gallery.service.spec.ts`
- `src/kto/photo-gallery/photo-gallery.tools.spec.ts`
- `src/kto/photo-gallery/dto/dto.spec.ts`

### NOT Modified (must remain unchanged)

- `src/kto/kto-http.client.ts`
- `src/kto/common/response-normalizer.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/types.ts`
- `src/mcp/tool-registry.ts` (이미 `ToolRegistry[]` 다중 지원)
- `src/mcp/transports/*.ts`
- `src/env.ts`
- `src/kto/korean-tour-info/**/*` (모두 변경 없음)
- `src/kto/barrier-free-tour-info/**/*` (모두 변경 없음)

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 / SPEC-KTO-002 핀 그대로 재사용.

---

## Acceptance (Test Coverage Map)

| # | 시나리오 | REQ |
|---|----------|-----|
| 1 | BASE_URL_MAP refactor 후 SPEC-KTO-001 + SPEC-KTO-002 unit + e2e 회귀 무사고 (도구 카운트 assertion 갱신 외) | REQ-UNW-002 |
| 2 | tools/list 응답에 `kto_korean_*` (15) + `kto_barrier_free_*` (10) + `kto_photo_*` (4) 모두 포함, 도구 카운트 = 29 | REQ-KTO3-001, REQ-KTO3-002 |
| 3 | galleryList1 정상 호출 → `gal*` 필드 KTO 원형 보존 + 페이지네이션 필드 노출 | REQ-EVT-001, REQ-KTO3-003 |
| 4 | galleryDetailList1 galContentId 누락 → outbound 0회 + MCP 검증 에러 | REQ-UNW-001 |
| 5 | PhotoGalleryService1 5xx → 4회 호출 (1+3 retry) + 백오프 단조 증가 | REQ-STATE-001 |
| 6 | BASE_URL_MAP refactor 후 KorService2 / KorWithService2 outbound URL 변경 없음 | REQ-OPT-001, REQ-UNW-002 |
| 7 | 게이트웨이 XML 오류(reasonCode=30) → KtoApiError 재시도 X | (재사용 검증) |
| 8 | streamable-http transport 에서 사진 도구 정상 노출 | REQ-KTO3-002 |
| 9 | 커버리지 ≥ 85% 유지 | (Quality Gate) |
| 10 | `PhotoGalleryItem` typed item 노출 — 반환 타입 `Promise<KtoListResponse<PhotoGalleryItem>>` | REQ-KTO3-003 |

### Edge Cases (10)

- 빈 결과 / galleryDetailList1 단일 객체 응답 / `gal*` 필드 일부 누락 / 보조 코드
  조회 도구 미등록(R1) / 30·404 발생 오퍼레이션 도구 제외 / 한글 keyword 인코딩 /
  KorService2·KorWithService2·PhotoGalleryService1 재시도 격리 / `galContentId` vs
  `contentid` ID 체계 차이(R6) / 페이지네이션 필드 부재(R8) / 도구 카운트 assertion
  정확성

---

## Exclusions

1. 사진 다운로드·바이너리 캐싱·이미지 변환 — 메타데이터(URL) 만 노출.
2. 사진 다국어 변체(`EngPhotoService2` 등) 본격 구현 — 차기 SPEC.
3. KorService2 `firstimage` + PhotoGalleryService1 `galWebImageUrl` 머지 통합 검색 도구
   — 별도 SPEC 후보.
4. 데이터 캐싱 / DB / Redis — 모든 호출 KTO API 직접 호출.
5. 사진 응답 필드 한글 번역·정규화 — KTO 원형 (`gal*` prefix) 보존.
6. 자동 페이지네이션 — `numOfRows`/`pageNo` 그대로 노출.
7. MCP 클라이언트 인증·인가 / 멀티 테넌시 — 단일 `KTO_SERVICE_KEY` 운영.
8. 이미지 URL 유효성 외부 검증 — KTO 응답 그대로 신뢰.
9. EXIF / 카메라 메타 추출 — 응답에 포함된 필드만 노출.

---

## Verified API Facts (v0.2.0)

| 항목 | 확인 결과 |
|------|-----------|
| service path | `B551011/PhotoGalleryService1` (V1) |
| operations | galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1 |
| galleryList1 totalCount | 6,119 |
| gallerySearchList1 (경복궁) | 532건 |
| galContentTypeId | 존재 |
| gallerySyncDetailList1 syncModTime | 파라미터명 추가 확인 필요 |

---

Version: 0.2.0
Last Updated: 2026-05-09
