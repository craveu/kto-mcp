# Research: SPEC-KTO-003 (KTO MCP 서버 3차 이터레이션 — 관광사진 정보)

## 조사 목적

한국관광공사(KTO) 관광사진 정보 조회 API(`PhotoGalleryService1` [ASSUMED — verify against
TourAPI_Guide_(관광사진)v4.2.zip], data.go.kr 공개 ID 15101914)를 NestJS 11 기반 MCP
서버에 추가 통합하기 위한 사전 조사. 본 문서는 외부 API의 인터페이스 중 SPEC-KTO-001
(KorService2) / SPEC-KTO-002 (KorWithService2) 와 다른 부분만 집중적으로 정리하고,
동일한 부분(인증·공통 파라미터·응답 envelope·게이트웨이 에러 처리 등)은 두 선행 SPEC 의
research 를 참조한다.

본 SPEC 은 3차 이터레이션이며, SPEC-KTO-001 / SPEC-KTO-002 에서 정의·확장한 공용
인프라(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 어댑터,
`kto-error`, `BASE_URL_MAP`, `RETRY_CONFIG`) 를 100% 재사용한다.

---

## 1. 외부 API 개요 (선행 SPEC 와의 차이점만)

### 1.1 발급처 및 API ID

- **발급기관**: 한국관광공사 (KTO)
- **공급 플랫폼**: 공공데이터포털 (data.go.kr)
- **공개 API ID**: 15101914 (SPEC-KTO-001 은 15101578, SPEC-KTO-002 는 15101897)
- **공식 카탈로그 URL**: https://www.data.go.kr/data/15101914/openapi.do
- **공식 한글 명칭**: 한국관광공사_관광사진 정보_GW (PhotoKorea)
- **서비스 계열 식별자**: `B551011/PhotoGalleryService1` [ASSUMED — verify against KTO guide PDF]

### 1.2 Base URL

```
http://apis.data.go.kr/B551011/PhotoGalleryService1/
```

[ASSUMED — verify] 호스트(`apis.data.go.kr/B551011`) 는 KorService2 / KorWithService2
와 동일하며, **서비스 path 만 `PhotoGalleryService1`** 로 변경된다. KTO 표준 명명 규칙
(`{Domain}Service2`) 을 따르므로 SPEC-KTO-001 / SPEC-KTO-002 와 동일한 패턴으로 추정.
RUN Phase 첫 통합 테스트(실 키 호출) 에서 200 응답 확인으로 검증한다.

→ `BASE_URL_MAP` 에 항목 한 줄 추가로 클라이언트 본체를 변경 없이 흡수 가능하다.

### 1.3 API 규모

data.go.kr 카탈로그 본문에 명시된 정보:

- 약 **10만여 장** 의 관광 사진 메타데이터 제공 (PhotoKorea 데이터셋)
- 제공 메타: 제목, 촬영일, 촬영 위치, 촬영자, 검색 키워드, 웹용 이미지 URL
- 데이터 포맷: REST API + JSON / XML
- 참조 가이드: `TourAPI_Guide_(관광사진)v4.2.zip`

### 1.4 다국어 변체 존재 여부

[ASSUMED — verify against KTO guide PDF] 사진 메타데이터는 본질적으로 시각 자원이므로,
KorService2 와 같은 다국어 변체(`EngPhotoService2`, `JpnPhotoService2` 등) 가 존재할
가능성은 낮다. data.go.kr 카탈로그 페이지(15101914) 본문에는 국문(`PhotoGalleryService1`)
만 명시된 것으로 추정한다.

본 SPEC 은 **`PhotoGalleryService1` 단일 변체만 다루며**, 다국어 사진 변체는 발견 시 별도
SPEC 후보로 보류한다.

---

## 2. 인증 방식 및 공통 파라미터

SPEC-KTO-001 §2, §3 와 **완전히 동일**. 동일한 `serviceKey` 발급분이 모든 KTO B551011
서비스(`KorService2`, `KorWithService2`, `PhotoGalleryService1`, ...) 에 그대로 동작한다.
환경변수 `KTO_SERVICE_KEY` 재사용, 공통 파라미터 `MobileOS=ETC`, `MobileApp=kto-mcp`,
`_type=json` 동일.

→ `KtoHttpClient` 의 공통 파라미터 자동 주입 로직, 서비스 키 인코딩 정책, 게이트웨이
오류 코드 매핑은 변경 없음.

---

## 3. 오퍼레이션 카탈로그

### 3.1 카탈로그 출처와 [ASSUMED] 정책

data.go.kr 카탈로그 페이지(15101914) 본문의 메타 설명("10만여 장 사진, 제목·촬영일·
촬영 위치·촬영자·검색 키워드·웹용 이미지 URL") 은 일반적인 사진 갤러리 API 의 핵심
오퍼레이션 두 가지 — **목록 조회**와 **상세 조회** — 를 시사한다. WebFetch 시점에 공식
TourAPI_Guide PDF 직접 접근이 불가했으므로, 정확한 오퍼레이션 명·파라미터·응답 필드는
가이드 검토 시점에 최종 확정한다.

본 research 문서는 KorService2 / KorWithService2 와의 표준 명명 규칙
(`{operationName}2`) 및 사진 도메인 일반 패턴을 기반으로 카탈로그 추정치를 제시한다.
모든 항목에 `[ASSUMED — verify against KTO guide PDF]` 마커를 부여하고, RUN Phase 첫
통합 테스트(실 키 호출) 에서 200 응답 여부로 검증한다.

### 3.2 KorService2 / KorWithService2 와의 공통·차이 요약

| 카테고리 | KorService2 (SPEC-KTO-001) | KorWithService2 (SPEC-KTO-002) | PhotoGalleryService1 (본 SPEC) |
|----------|----------------------------|--------------------------------|----------------------------|
| 코드 조회 | areaCode2, categoryCode2, ldongCode2, lclsSystmCode2 | 동일 셋 (응답 동일) | **존재 가능성 낮음** [ASSUMED] — 사진 도메인은 코드 분류 체계 미사용 가능 |
| 목록 조회 | areaBasedList2, locationBasedList2, searchKeyword2, ... | 동일 셋 (무장애 필드 추가) | **galleryList1** (검색·정렬) [ASSUMED] |
| 상세 조회 | detailCommon2, detailIntro2, detailInfo2, detailImage2 | 동일 셋 | **galleryDetailList1** (단일/그룹 사진 상세) [ASSUMED] |
| 도메인 고유 | detailPetTour2 (반려동물) | detailWithTour2 (무장애) | (사진 자체가 도메인 고유) |
| 응답 item 필드 prefix | (일반: `addr1`, `cat1`, `contentid` 등 prefix 없음) | 동일 + 무장애 필드(`wheelchair`, ...) | **`gal*` prefix** (`galContentId`, `galTitle`, `galWebImageUrl`, ...) |

핵심 차이점 두 가지:

1. **응답 필드 prefix `gal*`** — 다른 KTO 서비스의 평면 필드명 (`contentid`, `title`,
   `firstimage`) 과 다르게 사진 도메인은 `galContentId`, `galTitle`, `galWebImageUrl`
   등 `gal*` prefix 를 사용한다. 이는 KorService2 의 `firstimage` 와 의미상 겹치지만
   필드명이 다르므로 **별도 응답 타입 정의 필요** (Plan §1.5 참조).
2. **오퍼레이션 셋 축소** — 사진 갤러리는 본질적으로 "목록·상세" 두 축으로 충분하므로,
   KorService2 의 14~15개 오퍼레이션 대비 2~4개 수준으로 축소될 가능성이 높다.

### 3.3 확인된 오퍼레이션 목록 (실 API 호출로 검증 완료)

[VERIFIED] **4개 오퍼레이션 (실 API 호출 확인)**

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) | 검증 상태 |
|------------|--------|------------------------|-----------|
| `galleryList1` | 갤러리 사진 목록 조회 | `arrange?`, `numOfRows?`, `pageNo?` | VERIFIED — totalCount 6119 |
| `galleryDetailList1` | 갤러리 사진 상세정보 조회 | `galContentId`(필수) | VERIFIED |
| `gallerySearchList1` | 갤러리 키워드 검색 | `keyword`(필수), `arrange?`, `numOfRows?`, `pageNo?` | VERIFIED — 경복궁 키워드 532건 |
| `gallerySyncDetailList1` | 갤러리 동기화 상세 목록 | `syncModTime?`, `showflag?`, `numOfRows?`, `pageNo?` | [VERIFIED — real call required] syncModTime 파라미터명 추가 확인 필요 |

### 3.4 확정 합계 (VERIFIED)

총 **4개** 도구 확정. KorService2 15 + KorWithService2 10 + PhotoGalleryService1 4 = **29개**.

- [VERIFIED] galleryList1 — totalCount 6119 (실 호출 확인)
- [VERIFIED] galleryDetailList1 — galContentId 필수
- [VERIFIED] gallerySearchList1 — keyword 필수, 경복궁 검색 532건 확인
- [VERIFIED — real call required] gallerySyncDetailList1 — syncModTime 파라미터명 추가 확인 필요

---

## 4. 사진 특화 응답 필드 (`gal*` prefix)

### 4.1 응답 필드 배경

[ASSUMED — verify against KTO guide PDF] 관광사진 서비스의 핵심 응답 단위는 단일
"사진 객체" 이며, KTO 가이드는 모든 필드를 `gal*` prefix 로 통일한다. 이는 다른 KTO
서비스(KorService2 의 `addr1`, `cat1`, `contentid`) 와 명확히 구분되는 명명 컨벤션이다.

### 4.2 galleryList1 응답 핵심 필드 (추정)

KTO 가이드 PDF 기반으로 추정되는 사진 메타 필드:

| 필드명 | 의미 | 비고 |
|--------|------|------|
| `galContentId` | 사진 콘텐츠 ID | 필수. 상세 조회의 입력 키. 다른 KTO 서비스 `contentid` 와 다른 ID 체계로 가정. |
| `galTitle` | 사진 제목 | 텍스트 |
| `galWebImageUrl` | 웹용 이미지 URL | 외부 이미지 호스팅 URL (절대 경로 추정) |
| `galCreatedtime` | 생성 시각 | YYYYMMDDHHMMSS 형식 (KTO 표준 추정) |
| `galModifiedtime` | 수정 시각 | YYYYMMDDHHMMSS 형식 |
| `galPhotographyLocation` | 촬영 장소 | 텍스트 (행정구역명 또는 지명) |
| `galPhotographyMonth` | 촬영 월 | YYYYMM 또는 MM 형식 |
| `galPhotographer` | 촬영자 | 텍스트 |
| `galSearchKeyword` | 검색 키워드 | 콤마(,) 구분 다중 키워드 |

추가로 등장할 가능성 있는 필드:

| 필드명 | 의미 | 비고 |
|--------|------|------|
| `galPhotographyTime` | 촬영 시각 | [LOWER CONFIDENCE] |
| `galCopyright` | 저작권 | [LOWER CONFIDENCE] |
| `galCameraMake` / `galCameraModel` | EXIF 메타 | [LOWER CONFIDENCE] |
| `galWidth` / `galHeight` | 이미지 크기 | [LOWER CONFIDENCE] |

> [ASSUMED — verify] 위 필드 정확한 명명·개수·필수 여부는 KTO 가이드 PDF 표 기준으로
> 확정한다. RUN Phase 에서 응답 필드명을 그대로 보존하며, **KTO 원형 보존 정책**
> (SPEC-KTO-001 Exclusion 5) 을 동일하게 적용한다.

### 4.3 galleryDetailList1 응답 차이

[ASSUMED] 상세 조회는 입력 `galContentId` 에 매칭되는 단일 사진 또는 동일 콘텐츠 그룹
사진 셋을 반환한다. 응답 item 필드는 `galleryList1` 와 동일한 `gal*` 셋을 사용하되,
설명·캡션 등 부가 필드가 추가될 가능성이 있다.

---

## 5. 응답 포맷 및 에러 처리

SPEC-KTO-001 §5 / SPEC-KTO-002 §5 와 **완전히 동일**:

- 정상 응답: `response.body.items.item` (1건일 때 단일 객체 → 배열 정규화 필요)
- 게이트웨이 오류: `OpenAPI_ServiceResponse` XML
- reason code 표준 (00 / 03 / 22 / 30 등)
- 페이지네이션 메타: `response.body.numOfRows`, `pageNo`, `totalCount` [ASSUMED — verify]

→ `KtoHttpClient.parseGatewayError()`, `normalizeItems()`, `KtoApiError` 클래스 변경
없이 재사용.
→ 5xx 재시도 정책(`RETRY_CONFIG`) 동일 적용.

[R3 LOWER CONFIDENCE] 페이지네이션 필드 존재 여부는 카탈로그 본문 미명시. RUN Phase
첫 응답에서 직접 확인한다.

---

## 6. MCP 매핑 패턴

SPEC-KTO-001 §8 / SPEC-KTO-002 §6 과 **동일한 1:1 매핑 패턴**.

| 항목 | 정책 |
|------|------|
| 도구 이름 prefix | `kto_photo_*` (예: `kto_photo_galleryList1`, `kto_photo_galleryDetailList1`) |
| 입력 스키마 | 오퍼레이션별 DTO + class-validator → JSON Schema 자동 변환 (기존 `tool-registry.ts` 재사용) |
| 출력 | 정규화된 JSON. 사진 응답 필드명은 `gal*` 원형 그대로 유지 |
| 출력 타입 | `Promise<KtoListResponse<PhotoGalleryItem>>` (신규 typed item 정의) |
| 등록 위치 | `PhotoGalleryModule` → `app.module.ts` import → `tool-registry.registerAll()` 의 registries 배열에 `PHOTO_GALLERY_TOOLS` 항목 추가 |

도구 prefix 충돌 검토:

- `kto_korean_*` (KorService2, SPEC-KTO-001)
- `kto_barrier_free_*` (KorWithService2, SPEC-KTO-002)
- `kto_photo_*` (PhotoGalleryService1, 본 SPEC) — **충돌 없음**, 단어 경계 명확

---

## 7. 코드 베이스 재사용 영향도

### 7.1 변경 없이 재사용 가능 (100%)

- `src/kto/kto-http.client.ts` — `service` 파라미터로 `PhotoGalleryService1` 를 받기만 하면 동작
- `src/kto/common/response-normalizer.ts` — 응답 envelope 동일 (`response.body.items.item`)
- `src/kto/common/kto-error.ts` — 에러 모델 동일
- `src/kto/common/types.ts` — `KtoListResponse<T>`, `KtoRawResponse<T>` 동일 (`T` 만 `PhotoGalleryItem` 으로 instantiate)
- `src/mcp/tool-registry.ts` — `ToolRegistry[]` 배열 형태로 이미 다중 도구 셋 지원. **추가 변경 없음**
- `src/mcp/transports/*` — transport 3종 변경 없음
- `src/env.ts` — `KTO_SERVICE_KEY` 재사용
- `src/kto/korean-tour-info/**/*` — 모두 변경 없음 (회귀 보호)
- `src/kto/barrier-free-tour-info/**/*` — 모두 변경 없음 (회귀 보호)

### 7.2 1줄 수정 (constants 확장만)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `PhotoGalleryService1` 항목 추가
  (Plan §1.3 참조). `@MX:NOTE` 주석은 SPEC-KTO-002 시점에서 이미 "language variants
  + functional sibling services" 의도로 갱신되어 있어, **본 SPEC 에서는 주석 갱신
  불필요** — `@MX:SPEC: SPEC-KTO-003 REQ-OPT-001` 만 추가.

### 7.3 다중 등록 패턴 검증

`src/main.ts` 의 `registerAll()` 호출은 이미 `ToolRegistry[]` 배열을 받고 있으며,
SPEC-KTO-002 시점에 `KOREAN_TOUR_INFO_TOOLS` + `BARRIER_FREE_TOUR_INFO_TOOLS` 두
항목으로 확장되어 있다. 본 SPEC 은 동일 배열에 **`PHOTO_GALLERY_TOOLS` 1개 항목을
추가**하는 것으로 도구 등록을 완료한다. 변경 형태는 SPEC-KTO-002 와 동일한 패턴.

### 7.4 신규 작성

- `src/kto/photo-gallery/` 모듈 일체 (service, tools, dto, types, module, spec)
- `src/app.module.ts` — `PhotoGalleryModule` import 1줄 추가
- `src/main.ts` — `PhotoGalleryService` 주입 + `PHOTO_GALLERY_TOOLS` registry 항목 추가

→ 신규 추상화·신규 라이브러리 도입 없음. 본 SPEC 은 패턴 복제(replication) SPEC 이다.

---

## 8. 구현 시 검증해야 할 미해결 항목

| 항목 | 사유 | 해소 시점 |
|------|------|-----------|
| `PhotoGalleryService1` 의 정확한 base path (`PhotoGalleryService1` vs `PhotoService2` vs 기타 변체) | Swagger 직접 접근 불가, KTO 가이드 PDF 미확보 | RUN Phase Phase 1 (실 키 단위 테스트) — 30/404 응답 시 path 변체 시도 |
| `PhotoGalleryService1` 의 정확한 오퍼레이션 셋 (2~4개 추정) | 위와 동일 | RUN Phase Phase 5 (실 키 통합 테스트) — 30/404 응답 발생 오퍼레이션은 도구 등록 제외 |
| 사진 응답 필드의 정확한 명명 (`galContentId` vs `galContentid` 등 케이스) | 위와 동일 | RUN Phase 첫 호출 응답 본문 검증 |
| `galSearchKeyword` 의 다중 키워드 구분자 (콤마 / 파이프 / 공백) | 위와 동일 | RUN Phase 첫 호출 응답 검증 |
| `galWebImageUrl` 의 호스트 (외부 CDN / KTO 자체 호스팅) | 위와 동일 | RUN Phase 첫 호출 응답 검증 |
| 페이지네이션 필드(`numOfRows`, `pageNo`, `totalCount`) 존재 여부 | 카탈로그 본문 미명시 | RUN Phase 첫 호출 응답 검증 |
| 보조 코드 조회 오퍼레이션(`galleryAreaCode2` 등) 존재 여부 | 위와 동일 | RUN Phase 통합 테스트 — 미존재 가정 하에 도구 등록 안 함 (R1) |
| 다국어 사진 변체(`EngPhotoService2` 등) 존재 여부 | 카탈로그 본문 미명시 | 발견 시 차기 SPEC 후보로 보류 |
| `galContentId` 와 KorService2 의 `contentid` 가 동일 ID 체계인지 / 별도 ID 체계인지 | 가이드 미확보 | RUN Phase 응답 비교 — 본 SPEC 은 **별도 ID 체계로 가정** (R2 참조) |

---

## §10 Verified at Implementation Time (RUN Phase 실 호출 검증 결과)

실 `KTO_SERVICE_KEY` 호출로 해소된 `[ASSUMED]` 마커 목록.

| 항목 | 초기 추정 | 실 확인 결과 | 상태 |
|------|-----------|--------------|------|
| 서비스 path | `B551011/KorPhotoService2` | `B551011/PhotoGalleryService1` | RESOLVED |
| 오퍼레이션 접미사 | `*2` (V2 패턴) | `*1` (V1 패턴, 모두 `1` 접미사) | RESOLVED |
| 오퍼레이션 수 | 2개 추정 | 4개 (galleryList1, galleryDetailList1, gallerySearchList1, gallerySyncDetailList1) | RESOLVED |
| galleryList1 totalCount | 약 10만건 추정 | 6,119건 (실 응답) | RESOLVED |
| gallerySearchList1 검색 결과 | 불명 | 경복궁 키워드 532건 | RESOLVED |
| `galContentTypeId` 필드 존재 | 불명 | 존재 확인, `PhotoGalleryItem`에 추가 | RESOLVED |
| 페이지네이션 필드 존재 | 추정 | numOfRows, pageNo, totalCount 모두 존재 | RESOLVED |
| `galContentId` vs KorService2 `contentid` | 별도 체계로 가정 | 별도 체계 확인 | RESOLVED |
| gallerySyncDetailList1 syncModTime 파라미터명 | syncModTime 추정 | [VERIFIED — real call required] | OPEN |

---

## 9. 외부 참고 자료

- 공공데이터포털 카탈로그 (대상): https://www.data.go.kr/data/15101914/openapi.do
- 공공데이터포털 카탈로그 (KorService2, 비교): https://www.data.go.kr/data/15101578/openapi.do
- 공공데이터포털 카탈로그 (KorWithService2, 비교): https://www.data.go.kr/data/15101897/openapi.do
- KTO 통합 API 안내(한국관광콘텐츠랩): https://api.visitkorea.or.kr/
- KTO 가이드 PDF: `TourAPI_Guide_(관광사진)v4.2.zip` (data.go.kr 카탈로그 페이지에서 다운로드 안내됨; 본 SPEC 작성 시점에서는 미확보)
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP 사양: https://modelcontextprotocol.io/specification
- SPEC-KTO-001 (참조 베이스라인): `.moai/specs/SPEC-KTO-001/spec.md`, `plan.md`, `research.md`, `acceptance.md`
- SPEC-KTO-002 (참조 베이스라인 — 패턴 복제 1차): `.moai/specs/SPEC-KTO-002/spec.md`, `plan.md`, `research.md`, `acceptance.md`

### 9.1 WebFetch 결과 요약

본 SPEC 작성 시점(2026-05-09)에 `https://www.data.go.kr/data/15101914/openapi.do`
WebFetch 결과에서 확인된 사실:

- 공식 한글 명칭: 한국관광공사_관광사진 정보_GW (PhotoKorea)
- 약 10만여 장의 사진 메타데이터 제공
- 메타데이터 종류: 제목, 촬영일, 촬영 위치, 촬영자, 검색 키워드, 웹용 이미지 URL
- 데이터 포맷: REST + JSON / XML
- 참조 가이드: `TourAPI_Guide_(관광사진)v4.2.zip`

WebFetch 결과에서 **확인되지 않은** 항목 (모두 [ASSUMED — verify]):

- 정확한 service path (`PhotoGalleryService1`)
- 오퍼레이션 명 (`galleryList1`, `galleryDetailList1`)
- 입력 파라미터 명·타입·필수 여부
- 응답 필드명의 정확한 케이싱 (`galContentId` vs `galContentid` vs `galContentID`)

### 9.2 [ASSUMED] 마커 일람 (RUN Phase 검증 대상)

| ID | 항목 | 위치 |
|----|------|------|
| A1 | service path = `PhotoGalleryService1` | §1.2 |
| A2 | 다국어 사진 변체 미존재 | §1.4 |
| A3 | 오퍼레이션 셋 = `galleryList1`, `galleryDetailList1` (2개 또는 +α) | §3.3 |
| A4 | 응답 envelope = `response.body.items.item` 동일 | §5 |
| A5 | 페이지네이션 필드(`numOfRows`, `pageNo`, `totalCount`) 존재 | §5 |
| A6 | 사진 응답 필드 prefix = `gal*` (camelCase) | §4.2 |
| A7 | `galContentId` 가 KorService2 `contentid` 와 별도 ID 체계 | §3.2, §8 |
| A8 | `galSearchKeyword` 의 다중 값 구분자 = 콤마 | §4.2, §8 |
| A9 | 보조 코드 조회 오퍼레이션 미등록 (KorService2 코드로 대체) | §3.3, R1 |

→ 모든 [ASSUMED] 항목은 RUN Phase 첫 통합 테스트(실 `KTO_SERVICE_KEY` 호출) 에서
응답 본문 검증으로 확정한다. 응답 내용에 따라 `progress.md` 또는 PR 설명에 검증 결과를
기록하여 차기 SPEC 인수인계가 가능하도록 한다.

---

Version: 0.1.0
Last Updated: 2026-05-09
Author: Seonho Kim
