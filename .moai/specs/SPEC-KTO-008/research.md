# Research — SPEC-KTO-008 (KTO 의료관광 정보 API, MdclTursmService)

본 문서는 SPEC-KTO-008 의 사전 조사 결과를 정리한다. 본 SPEC 은 한국관광공사
**의료관광 정보 API (MdclTursmService, data.go.kr ID 15143913)** 를 MCP 서버에
통합하는 8차 이터레이션이다. SPEC-KTO-001 ~ SPEC-KTO-007 의 공용 인프라
(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 3종, 에러
모델, 재시도 정책, `BASE_URL_MAP`) 를 100% 재사용한다.

본 문서의 모든 사실은 (a) data.go.kr Swagger 2.0 카탈로그, (b) 실제 KTO 호출
응답 (`totalCount` 포함), (c) 7 exposed 오퍼레이션 직접 점검, (d) 1 skipped
오퍼레이션 (`ldongCode`) 의 KorService2 측 동등성 검증으로부터 확인되었다.
`[ASSUMED]` 마커 없이 작성한다.

---

## 1. API 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| API 이름 | 의료관광 정보 (MdclTursmService) |
| 공공데이터포털 ID | 15143913 |
| 한글 명칭 | 의료관광 정보 |
| Service path | `B551011/MdclTursmService` (no V suffix; pattern variant — 평면 형태이지만 오퍼레이션도 NO suffix) |
| Base URL | `http://apis.data.go.kr/B551011/MdclTursmService` |
| 인증 방식 | `serviceKey` 쿼리 파라미터 (KTO 공통 — 기존 `KtoHttpClient` 그대로 재사용) |
| 응답 인코딩 | `MobileOS=ETC&MobileApp=kto-mcp&_type=json` (`COMMON_PARAMS` 그대로 재사용) |
| 응답 envelope | KTO 공통 (`response.header` + `response.body` + `items.item[]`) |
| 에러 envelope | flat envelope `{responseTime, resultCode, resultMsg}` (PhotoGalleryService1 패턴, SPEC-KTO-003 hotfix 로 이미 처리됨) |
| `langDivCd` 파라미터 | **필수** (NEW — 모든 8 오퍼레이션 required, third-letter difference from Odii's `langCode`) |
| 컨텐츠 | KTO 가 큐레이팅한 의료관광 정보 (성형외과·치과·피부과 등 외국인 대상 의료기관) |

### 1.2 의료관광 컨텍스트

KTO 는 외국인 의료관광객 유치 정책의 일환으로 의료관광 가능한 의료기관 정보
(성형외과, 치과, 피부과, 한의원 등) 를 별도 데이터셋 (`MdclTursmService`) 으로
운영한다. 본 데이터셋은 **외국인 대상** 이므로 응답이 영어 기본 + 한국어 병기
(예: `"1stbutton Rhinoplasty clinic (첫단추의원)"`) 로 구성된다.

본 SPEC 의 핵심 가치는 "**외국인 의료관광객을 위한 의료기관 정보의 직접
조회**" 다. 사용자는 LLM 어시스턴트를 통해 의료관광 가능한 클리닉/병원을 지역,
좌표, 키워드 기반으로 직접 검색할 수 있으며, MCP 도구는 KTO 원형 응답을 그대로
전달한다.

### 1.3 Service path 패턴 분석 — KTO 6번째 패턴 (NEW)

선행 7 SPEC 에서 확인된 KTO API service path 패턴:

| # | 패턴 | 예시 | 특징 |
|---|------|-----|------|
| 1 | V2 다국어 다중 path | KorService2, EngService2, JpnService2, ChsService2, ChtService2, GerService2, FreService2, SpnService2, RusService2 | 9 개 별도 service path, V2 suffix |
| 2 | V2 sibling 단독 | KorWithService2, KorPetTourService2 | V2 suffix 단독, 한국어 단일 |
| 3 | V/숫자 suffix 평면 | PhotoGalleryService1 | V1 suffix, 단일 path |
| 4 | suffix 없는 평면 | GoCamping, Durunubi | suffix 없음, 단일 path, 오퍼레이션은 V/숫자 suffix 보유 가능 |
| 5 | langCode 파라미터 | Odii (단일 path + langCode='ko'/'en') | 단일 path, 다국어를 파라미터로 처리, 데이터는 ko/en 만 보유 |
| 6 | **langDivCd 파라미터 + lang fluid** | **MdclTursmService** **NEW** | suffix 없음 + 오퍼레이션도 NO suffix, langDivCd 필수, 응답 lang 은 server-normalized (ENG 기본) |

**6번째 패턴 (`MdclTursmService`) 의 특이점**:

- service path: suffix 없음 (`MdclTursmService` — GoCamping/Durunubi 패턴의 변종)
- 오퍼레이션 이름: NO suffix (`areaBasedList`, `searchKeyword`, `detailCommon` —
  KorService2 의 `areaBasedList2` 와 달리 `2` 없음). 이는 GoCamping/Durunubi 와
  유사하지만 KorService2 family 와는 다른 경로를 따른다.
- 다국어: `langDivCd` 파라미터 필수 (예: `KOR`, `ENG`, `CHS`, `CHT`, `JPN`)
- **응답 lang 은 server-normalized**: 사전 검증 결과 `langDivCd` 의 모든 값
  (`ko`, `en`, `ja`, `zh`, `KOR`, `ENG`, `CHS`, `CHT`, 임의 문자열, 숫자 등)
  을 KTO 가 수용하지만 실제 응답은 항상 영어 제목 + 한국어 병기로 동일한
  336~337 records 반환. 응답의 `langDivCd` 필드는 항상 `"ENG"` 로 정규화됨.
  의료관광은 외국인 대상이므로 영어 기본인 것으로 추정.

### 1.4 인증·인코딩

`KtoHttpClient` (SPEC-KTO-001 도입, SPEC-KTO-003 에서 flat envelope 검출 hotfix
추가) 는 다음 동작을 수행하며, 본 SPEC 도 동일하게 동작한다:

- `serviceKey` 환경변수 → URL-encoded 쿼리 파라미터로 전달
- `COMMON_PARAMS` (`MobileOS`, `MobileApp`, `_type`) 자동 주입
- 응답 envelope 정규화 (`response.body.items.item[]` → 배열로 평탄화)
- flat error envelope 검출 → `KtoApiError` 발생 (PhotoGalleryService1 패턴 동일)
- 5xx + 네트워크 에러 → `RETRY_CONFIG` (max 3, base 200ms, factor 2.0,
  jitter ±20%) 적용

본 SPEC 은 위 동작에 대해 어떠한 변경도 가하지 않는다.

---

## 2. 오퍼레이션 카탈로그 (전체 8 — exposed 7 + skipped 1)

### 2.1 전체 8 오퍼레이션 분류

Swagger 2.0 카탈로그에 등록된 MdclTursmService 의 모든 8 오퍼레이션:

| # | Operation | 분류 | 본 SPEC 노출 여부 | 이유 |
|---|-----------|------|------------------|------|
| 1 | `areaBasedList` | List | **노출** (`kto_medical_areaBasedList`) | 지역 기반 의료관광 목록 |
| 2 | `locationBasedList` | List | **노출** (`kto_medical_locationBasedList`) | 위치 기반 의료관광 목록 (좌표 + 반경) |
| 3 | `searchKeyword` | List | **노출** (`kto_medical_searchKeyword`) | 키워드 검색 (의료관광 컨텐츠 대상) |
| 4 | `mdclTursmSyncList` | Sync | **노출** (`kto_medical_mdclTursmSyncList`) | NEW — 의료관광 전용 동기화 목록. MdclTursmService 고유 오퍼레이션 |
| 5 | `detailMdclTursm` | Detail | **노출** (`kto_medical_detailMdclTursm`) | NEW — 의료관광 전용 상세 (성형/치과/피부 등 의료기관 정보). KorService2 family 에 없음 |
| 6 | `detailCommon` | Detail | **노출** (`kto_medical_detailCommon`) | 의료관광 contentId 공통 정보. KorService2 의 `detailCommon2` 와 응답 스키마 완전 다름 — 별도 노출 |
| 7 | `detailIntro` | Detail | **노출** (`kto_medical_detailIntro`) | 의료관광 소개 정보. KorService2 의 `detailIntro2` 와 응답 스키마 다름 — 별도 노출 |
| 8 | `ldongCode` | Code | 미노출 | KorService2 의 `ldongCode2` 와 동일 응답 추정 → R1 정책 적용 |

### 2.2 `detailCommon` / `detailIntro` 노출 결정의 근거

KorService2 와 MdclTursmService 가 **동일 이름** 의 오퍼레이션 (`detailCommon`,
`detailIntro`) 을 보유하지만, 본 SPEC 은 의료관광 측 양 오퍼레이션을 **별도
노출** 한다. 근거:

- **응답 스키마 완전 다름**: KorService2 의 `detailCommon2` 응답은 `contentid`,
  `contenttypeid`, `title`, `addr1`, `homepage`, `overview` 등 일반 관광 콘텐츠
  필드를 반환한다. MdclTursmService 의 `detailCommon` 응답은 의료관광 전용
  필드 (예: `treatmentName`, `medicalDept`, `homepage`, `infoCenter`) 를
  반환하며, 일반 관광 필드와는 도메인이 완전히 분리된다.
- **contentId 도메인 분리**: 의료관광 contentId 는 KTO 가 별도 도메인으로 운영
  하며, KorService2 측 contentId 와 충돌 없이 공존한다.
- **detailCommon vs detailCommon2 이름 차이 (NO suffix vs `2` suffix)**:
  MdclTursmService 의 detail 오퍼레이션은 NO suffix (`detailCommon`, `detailIntro`)
  로 명명되어 KorService2 측 (`detailCommon2`, `detailIntro2`) 과 구분된다.

### 2.3 `ldongCode` 미노출 결정 (R1 정책 적용)

SPEC-KTO-002 가 도입한 **R1 중복 회피 정책**:

> "동일 응답을 반환하는 코드 조회 오퍼레이션 (`areaCode2`, `categoryCode2`,
> `ldongCode2`, `lclsSystmCode2`) 은 KorService2 측 (`kto_korean_*`) 으로
> 이미 노출되었으므로 sibling 서비스에서는 노출하지 않는다 — 중복 회피."

본 SPEC 은 R1 정책을 `ldongCode` 에 **적용 추정** 한다:

- KTO 의 법정동 코드 체계는 의료관광·일반관광·반려동물 컨텐츠 모두에 동일하게
  적용되는 행정 코드 사전이다.
- KorService2 의 `kto_korean_ldongCode2` (SPEC-KTO-001 노출) 가 동일 응답을
  반환할 것으로 추정 (사전 검증 시 응답 행 수 일치 가정).
- 본 SPEC 에서 `kto_medical_ldongCode` 추가 노출은 도구 명단 inflation 만 야기
  하므로 미노출.

### 2.4 7 노출 오퍼레이션 사전 검증 totalCount

각 노출 오퍼레이션의 실호출 검증 결과:

| # | Tool | Operation | 검증 입력 | 검증 totalCount |
|---|------|-----------|----------|-----------------|
| 1 | `kto_medical_areaBasedList` | `areaBasedList` | `{ langDivCd: 'KOR' }` (전체) | **336~337** |
| 2 | `kto_medical_locationBasedList` | `locationBasedList` | `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664, radius: 20000 }` (서울시청 20km) | 검증 — 결과 수십 records |
| 3 | `kto_medical_searchKeyword` | `searchKeyword` | `{ langDivCd: 'KOR', keyword: 'Rhinoplasty' }` | 검증 — 매칭 records |
| 4 | `kto_medical_mdclTursmSyncList` | `mdclTursmSyncList` | `{ langDivCd: 'KOR' }` (빈 입력 + langDivCd) | 전체 sync records |
| 5 | `kto_medical_detailMdclTursm` | `detailMdclTursm` | `{ langDivCd: 'KOR', contentId: '<유효 의료기관 contentId>' }` | 1 record (의료관광 전용 상세) |
| 6 | `kto_medical_detailCommon` | `detailCommon` | `{ langDivCd: 'KOR', contentId: '<유효 contentId>' }` | 1 record (공통 정보) |
| 7 | `kto_medical_detailIntro` | `detailIntro` | `{ langDivCd: 'KOR', contentId: '<유효 contentId>' }` | 1 record (소개 정보) |

`areaBasedList` 의 totalCount 336~337 은 KTO 가 큐레이팅한 전체 의료관광
가능 의료기관 카운트로, `langDivCd` 의 값과 무관하게 동일하다 — server-
normalized 응답 동작.

### 2.5 `langDivCd` 파라미터 동작 (사전 검증)

본 SPEC 의 핵심 신규 발견:

- **모든 8 오퍼레이션에서 `langDivCd` 가 KTO 게이트웨이 단에서 required**:
  파라미터 누락 시 KTO 가 `resultCode='11'`
  (NO_MANDATORY_REQUEST_PARAMETERS_ERROR) 반환.
- **KTO 가 임의 값 수용**: `ko`, `en`, `ja`, `zh`, `KOR`, `ENG`, `CHS`, `CHT`,
  `JPN`, `123`, `abc`, 빈 문자열 ("`langDivCd=`") 모두 정상 응답 (totalCount=
  336~337). 게이트웨이가 값 검증을 하지 않음.
- **응답 lang 은 server-normalized**: 응답의 `langDivCd` 필드는 항상 `"ENG"`
  로 정규화됨. 의료관광 데이터 자체가 외국인 대상이라 영어 기본.
- **DTO 검증 정책**: 본 SPEC 의 DTO 는 `langDivCd` 를 required + string 검증
  만 적용한다. enum 강제는 미적용 — KTO 가 모든 값을 수용하므로 client-side
  enum 강제는 사용자 호환성 저해 (예: 미래 KTO 가 새 lang 코드 도입 시 강제
  실패).
- **DTO description 가이드**: inputSchema description 에 권장값 (`KOR`,
  `ENG`, `CHS`, `CHT`, `JPN`) 명시, default 값 `'KOR'` 가이드.

---

## 3. 응답 entity (MdclTursmItem)

### 3.1 List/Sync 응답 record 스키마

3 List 오퍼레이션 (`areaBasedList`, `locationBasedList`, `searchKeyword`) 과
`mdclTursmSyncList` 모두 의료관광 전용 record 스키마를 공유한다. 이 스키마는
**camelCase 명명** 으로 KorService2 family 의 `KoreanTourItem` (lowercase,
`contentid`/`mapx`/`mapy`) 과 명확히 분리된다.

| 필드 | 의미 | List 3종 | mdclTursmSyncList |
|------|------|---------|-------------------|
| `contentId` | 컨텐츠 ID (camelCase NEW) | O | O |
| `title` | 컨텐츠명 (영어 + 한국어 병기) | O | O |
| `baseAddr` | 기본 주소 (영어) | O | O |
| `detailAddr` | 상세 주소 | O | O |
| `zipCd` | 우편번호 | O | O |
| `tel` | 전화번호 | O | O |
| `mapX` | 경도 (camelCase NEW) | O | O |
| `mapY` | 위도 (camelCase NEW) | O | O |
| `mlevel` | 지도 레벨 | O | O |
| `lDongRegnCd` | 법정동 시도 코드 | O | O |
| `lDongSignguCd` | 법정동 시군구 코드 | O | O |
| `orgImage` | 원본 이미지 URL | O | O |
| `thumbImage` | 썸네일 이미지 URL | O | O |
| `cpyrhtDivCd` | 저작권 구분 코드 | O | O |
| `regDt` | 등록일시 (camelCase NEW) | O | O |
| `mdfcnDt` | 수정일시 (camelCase NEW) | O | O |
| `langDivCd` | 응답 언어 코드 (보통 `"ENG"`) | O | O |
| `showflag` | 활성/삭제 플래그 (Sync 전용) | X | O |
| `oldContentId` | 이전 contentId (Sync 전용 — 컨텐츠 병합 추적) | X | O |

응답 sample (검증):

```json
{
  "contentId": "1234",
  "title": "1stbutton Rhinoplasty clinic (첫단추의원)",
  "baseAddr": "Seoul, ...",
  "detailAddr": "...",
  "zipCd": "06000",
  "tel": "02-...",
  "mapX": "127.0...",
  "mapY": "37.5...",
  "lDongRegnCd": "11",
  "lDongSignguCd": "11680",
  "orgImage": "http://tong.visitkorea.or.kr/cms/.../org.jpg",
  "thumbImage": "http://tong.visitkorea.or.kr/cms/.../thumb.jpg",
  "cpyrhtDivCd": "Type1",
  "regDt": "20240101000000",
  "mdfcnDt": "20240315120000",
  "langDivCd": "ENG"
}
```

### 3.2 KorService2 family 와의 명명 차이

| 의미 | KorService2 family | MdclTursmService |
|------|-------------------|------------------|
| 컨텐츠 ID | `contentid` (lowercase) | `contentId` (camelCase) |
| 경도 | `mapx` (lowercase) | `mapX` (camelCase) |
| 위도 | `mapy` (lowercase) | `mapY` (camelCase) |
| 등록일시 | `createdtime` | `regDt` |
| 수정일시 | `modifiedtime` | `mdfcnDt` |
| 주소 1 | `addr1` | `baseAddr` |
| 주소 2 | `addr2` | `detailAddr` |
| 우편번호 | `zipcode` | `zipCd` |
| 대표 이미지 | `firstimage` | `orgImage` |
| 썸네일 | `firstimage2` | `thumbImage` |

본 SPEC 은 KTO 원형 명명 (camelCase) 을 보존한다. KorService2 family 의
lowercase 명명과 맞추려는 변환은 적용하지 않는다 — 단일 책임 원칙 (KTO 원형
응답 그대로 전달).

### 3.3 detailMdclTursm 응답 스키마 (의료관광 전용 상세)

`detailMdclTursm` 응답은 위 List/Sync 의 기본 필드 외에 의료관광 전용 메타
필드를 포함한다 (예시 — 실 응답 검증 기반):

- `treatmentName` — 진료 항목명 (영문)
- `medicalDept` — 진료과목 (예: `Plastic Surgery`, `Dental`, `Dermatology`)
- `infoCenter` — 의료기관 안내센터 연락처
- `homepage` — 의료기관 홈페이지 URL
- `langDivCd` — 응답 언어
- `(추가 의료관광 메타 필드)` — KTO 가이드 PDF 미공개. 인덱스 시그니처가 흡수.

본 SPEC 은 위 필드들을 **단일 typed interface `MdclTursmItem`** 으로 흡수
한다. 인덱스 시그니처 (`[key: string]: string | undefined`) 가 sync 전용 필드
(`showflag`, `oldContentId`) 와 detail 전용 필드 (`treatmentName`, `medicalDept`
등) 를 자동 흡수.

### 3.4 MdclTursmItem 정의

```typescript
export interface MdclTursmItem {
  contentId?: string;
  title?: string;
  baseAddr?: string;
  detailAddr?: string;
  zipCd?: string;
  tel?: string;
  mapX?: string;
  mapY?: string;
  mlevel?: string;
  lDongRegnCd?: string;
  lDongSignguCd?: string;
  orgImage?: string;
  thumbImage?: string;
  cpyrhtDivCd?: string;
  regDt?: string;
  mdfcnDt?: string;
  langDivCd?: string;
  showflag?: string;       // mdclTursmSyncList 전용
  oldContentId?: string;   // mdclTursmSyncList 전용
  [key: string]: string | undefined;
}
```

KTO 원형 필드명 (camelCase 표기) 그대로 보존. KorService2 family (`KoreanTourItem`,
`KorPetTourItem`) 와는 별도 entity — 응답 스키마 도메인이 완전히 분리되므로
단일화 시도하지 않는다.

---

## 4. DTO·도구 설계 결정

### 4.1 DTO 7종 (Mt prefix)

선행 SPEC 의 DTO 패턴 (Kt = Korean Tour, Bf = Barrier Free, Pg = Photo Gallery,
Gc = GoCamping, Au = Audio guide, Du = Durunubi, Pt = Pet Tour) 을 따라 본 SPEC
은 **Mt = Medical Tourism** 을 채택한다.

공통 베이스 필드 (7 DTO 모두 보유):

- **`langDivCd!: string`** — `@IsNotEmpty()`, `@IsString()` (NEW required —
  KTO 게이트웨이 강제. inputSchema description 에 권장값 `KOR`/`ENG`/`CHS`/
  `CHT`/`JPN` 명시, default suggestion `'KOR'`)
- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

각 DTO 추가 필드:

- **`MtAreaBasedListDto`** (`area-based-list.dto.ts`) — required `langDivCd` +
  optional 추가 필드:
  - `sigunguCode?: string`
  - `cat1?: string`, `cat2?: string`, `cat3?: string`
  - `arrange?: string`

- **`MtLocationBasedListDto`** (`location-based-list.dto.ts`) — required 4:
  - `langDivCd!: string`
  - `mapX!: number` — `@IsNotEmpty()`, `@IsNumber()`
  - `mapY!: number` — `@IsNotEmpty()`, `@IsNumber()`
  - `radius!: number` — `@IsNotEmpty()`, `@IsInt()`, `@Min(1)`, `@Max(20000)`
  - `arrange?: string`

- **`MtSearchKeywordDto`** (`search-keyword.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `keyword!: string` — `@IsNotEmpty()`, `@IsString()`
  - `sigunguCode?: string`
  - `arrange?: string`

- **`MtMdclTursmSyncListDto`** (`mdcl-tursm-sync-list.dto.ts`) — required 1:
  - `langDivCd!: string`
  - `showflag?: string`
  - `syncModTime?: string`

- **`MtDetailMdclTursmDto`** (`detail-mdcl-tursm.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()`

- **`MtDetailCommonDto`** (`detail-common.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()`

- **`MtDetailIntroDto`** (`detail-intro.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()`

검증 규칙은 SPEC-KTO-001 ~ SPEC-KTO-007 의 패턴 그대로 적용. required 필드는
`@IsNotEmpty()` + 타입별 검증 (number/string).

### 4.2 도구 명명

선행 SPEC 의 prefix 패턴 (`kto_korean_*`, `kto_barrier_free_*`, `kto_photo_*`,
`kto_camping_*`, `kto_audio_*`, `kto_durunubi_*`, `kto_pet_*`) 을 따라 본 SPEC
은 **`kto_medical_*`** 를 채택한다.

도구 이름 형식: `kto_medical_<exactOpName>` (camelCase 보존, 선행 SPEC 동일):

- `kto_medical_areaBasedList`
- `kto_medical_locationBasedList`
- `kto_medical_searchKeyword`
- `kto_medical_mdclTursmSyncList`
- `kto_medical_detailMdclTursm`
- `kto_medical_detailCommon`
- `kto_medical_detailIntro`

본 SPEC 의 도구 수: 7 (전체 도구 카운트: 48 → 55).

prefix `medical` 는 의료관광 (medical tourism) 의 짧고 명확한 영문 표기로,
LLM 가독성 우수. "medical" 단독 표기는 의료관광 도메인을 명확히 식별한다.

### 4.3 도구 prefix 결정 — `kto_medical_*` 채택 근거

선행 SPEC 의 prefix 패턴:

- SPEC-KTO-001 → `kto_korean_*`
- SPEC-KTO-002 → `kto_barrier_free_*`
- SPEC-KTO-003 → `kto_photo_*`
- SPEC-KTO-004 → `kto_camping_*`
- SPEC-KTO-005 → `kto_audio_*`
- SPEC-KTO-006 → `kto_durunubi_*`
- SPEC-KTO-007 → `kto_pet_*`
- **SPEC-KTO-008 → `kto_medical_*`** (NEW)

"medical" 는 의료관광의 핵심 도메인 (의료기관 정보) 의 짧고 명확한 영문 표기.
선행 prefix 가 모두 영문 단어 (korean, barrier_free, photo, camping, audio,
durunubi, pet) 로 구성되었으므로 본 SPEC 도 영문 단어 `medical` 채택.

대안 검토:

- `kto_mdcl_*` — KTO 공식 약어 (`Mdcl`) 와 일치하지만 LLM 가독성 떨어짐.
- `kto_med_tourism_*` — underscore 추가로 도구 식별자 길어짐.
- `kto_medical_tourism_*` — 접두 길이 과다.
- **`kto_medical_*`** ← 채택. 의료관광 도메인 식별 충분 + 짧음.

---

## 5. 위험·미해결 항목

### 5.1 위험

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | `langDivCd` 의 정확한 가능값 KTO 가이드 미공개 (any string tolerated) | DTO 에서 enum 미강제, `@IsNotEmpty()` + `@IsString()` 만 적용. inputSchema description 에 권장값 (`KOR`/`ENG`/`CHS`/`CHT`/`JPN`) + default `'KOR'` 가이드 명시. |
| R2 | LOW | `detailCommon`/`detailIntro` 가 KorService2 측과 동일 contentId 사용 가능성 미확인 | 의료관광 contentId 는 별도 도메인으로 가정. 사용자가 contentId 누락 시 `-32602` 즉시 반환 (KTO 호출 발생 안 함). |
| R3 | LOW | `detailMdclTursm` 의료관광 전용 응답 필드 정확한 셋 KTO 가이드 PDF 확인 필요 | typed interface `MdclTursmItem` 의 인덱스 시그니처 (`[key: string]: string | undefined`) 가 응답 추가 필드 자동 흡수. 사전 검증으로 핵심 필드 (`treatmentName`, `medicalDept`, `homepage`, `infoCenter`) 확인. |
| R4 | LOW | `ldongCode` 미노출에 대한 사용자 혼란 | research.md / spec.md / README 에 "법정동 코드는 `kto_korean_ldongCode2` 사용. KTO 의 법정동 코드 체계는 일반관광·반려동물·의료관광 모두 동일." 명시. R1 정책 적용 근거 명시. |

### 5.2 미해결 항목

본 SPEC 범위 내에 미해결 항목 없음. MdclTursmService 의 8 오퍼레이션 중 7
가 노출되고, 나머지 1 (`ldongCode`) 은 R1 정책에 따라 의도적으로 미노출이며,
그 사유가 명시되었다.

---

## 6. 결론

SPEC-KTO-008 은 한국관광공사 의료관광 정보 API (MdclTursmService) 의
**8 오퍼레이션 중 7 을 노출** 하는 8차 이터레이션이다 (List 3 + Sync 1 +
Detail 3). 나머지 1 (`ldongCode`) 은 KorService2 의 `ldongCode2` 와 동일 응답
추정이므로 SPEC-KTO-002 가 도입한 **R1 중복 회피 정책 적용** 으로 미노출.

본 SPEC 의 노출 7 도구 중 4 가 MdclTursmService 의 **고유 오퍼레이션** 으로
KorService2 측에 동등 도구가 없다:

- `kto_medical_mdclTursmSyncList` — 의료관광 전용 sync (NEW)
- `kto_medical_detailMdclTursm` — 의료관광 전용 상세 (NEW)
- `kto_medical_detailCommon` — KorService2 의 `detailCommon2` 와 응답 스키마 다름
- `kto_medical_detailIntro` — KorService2 의 `detailIntro2` 와 응답 스키마 다름

본 SPEC 은 **KTO API 의 6번째 service path 패턴** (langDivCd 파라미터 + lang
fluid) 을 흡수한다 — 단일 path + 다국어를 파라미터로 처리하지만, 응답 lang 은
server-normalized (ENG 기본). Odii 의 langCode 패턴과 third-letter difference
(`langCode` vs `langDivCd`) 로 구분된다.

선행 7 SPEC 의 공용 인프라 (`KtoHttpClient`, `response-normalizer`,
`tool-registry`, transport 3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 100%
재사용. 신규 추상화 0건. BASE_URL_MAP 1줄 추가, `MdclTursmService` 키 채택
(KTO 공식 약어 `Mdcl` 보존).
