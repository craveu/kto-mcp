# Research — SPEC-KTO-007 (KTO 반려동물 동반여행 정보 API, KorPetTourService2)

본 문서는 SPEC-KTO-007 의 사전 조사 결과를 정리한다. 본 SPEC 은 한국관광공사
**반려동물 동반여행 정보 API (KorPetTourService2, data.go.kr ID 15135102)** 를
MCP 서버에 통합하는 7차 이터레이션이다. SPEC-KTO-001 ~ SPEC-KTO-006 의 공용
인프라 (`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport
3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 를 100% 재사용한다.

본 문서의 모든 사실은 (a) data.go.kr Swagger 2.0 카탈로그, (b) 실제 KTO 호출
응답 (`totalCount` 포함), (c) 4 exposed 오퍼레이션 직접 점검, (d) 9 skipped
오퍼레이션의 KorService2 측 동등성 검증으로부터 확인되었다. `[ASSUMED]` 마커
없이 작성한다.

---

## 1. API 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| API 이름 | 반려동물 동반여행 정보 (KorPetTourService2) |
| 공공데이터포털 ID | 15135102 |
| 한글 명칭 | 반려동물 동반여행 정보 |
| Service path | `B551011/KorPetTourService2` (V2 sibling pattern, KorWithService2 와 동일한 평면 V2 형태) |
| Base URL | `http://apis.data.go.kr/B551011/KorPetTourService2` |
| 인증 방식 | `serviceKey` 쿼리 파라미터 (KTO 공통 — 기존 `KtoHttpClient` 그대로 재사용) |
| 응답 인코딩 | `MobileOS=ETC&MobileApp=kto-mcp&_type=json` (`COMMON_PARAMS` 그대로 재사용) |
| 응답 envelope | KTO 공통 (`response.header` + `response.body` + `items.item[]`) |
| 에러 envelope | flat envelope `{responseTime, resultCode, resultMsg}` (SPEC-KTO-003 hotfix 로 이미 처리됨) |
| `langCode` 파라미터 | **미사용** — Swagger 단일 path 만 노출 (다국어 변체 미존재) |
| 컨텐츠 | KTO 관광 콘텐츠 superset 에서 반려동물 동반 가능한 컨텐츠만 필터링한 데이터셋 |

### 1.2 반려동물 동반여행 정책 컨텍스트

KTO 는 2020년 이후 반려동물 동반 가능한 관광 콘텐츠 (관광지, 카페, 음식점,
숙소 등) 정보를 별도 데이터셋 (`KorPetTourService2`) 으로 운영한다. 본 데이터셋은
KTO 의 통합 관광 콘텐츠 (`KorService2`) 의 **subset** 이며, 동일한 contentId
체계와 동일한 record 스키마를 공유한다.

본 SPEC 의 핵심 가치는 "**pet-friendly 만 필터링된 superset 에 대한 직접
조회**" 다. 사용자는 `kto_korean_areaBasedList2` (전체 superset) 호출 후 클라이언트
사이드에서 pet-friendly 필터링하는 대신, `kto_pet_areaBasedList2` 호출 한 번으로
pet-filtered 데이터셋을 직접 받는다.

### 1.3 KorPetTourService2 의 데이터 관계

`KorPetTourService2` 는 `KorService2` 의 데이터 관계를 그대로 따른다:

- **List 오퍼레이션** (`areaBasedList2`, `locationBasedList2`, `searchKeyword2`):
  pet-filtered 결과를 반환. 응답 record 는 KTO content 표준 스키마 + (선택적
  `petAcptAbl` 필드).
- **Sync 오퍼레이션** (`petTourSyncList2` — NEW): pet 데이터셋 전체를 동기화 목적으로
  반환. `showflag` 필드로 active/deleted 구분.
- **Detail 오퍼레이션** (`detailCommon2`, `detailIntro2`, `detailInfo2`,
  `detailImage2`, `detailPetTour2`): contentId 기반 단일 record 조회. pet 인지
  여부와 무관하게 **양 서비스 (KorService2 / KorPetTourService2) 가 동일한
  데이터를 반환**.
- **Code 조회 오퍼레이션** (`areaCode2`, `categoryCode2`, `ldongCode2`,
  `lclsSystmCode2`): 코드 사전 조회. 양 서비스가 **동일한 데이터** 를 반환.

### 1.4 SPEC-KTO-001 R7 위험 해결

SPEC-KTO-001 research.md (line 121-125) 는 다음 위험을 기록했다:

> "[ASSUMED — verify against Swagger] `detailPetTour2` 가 KorService2에 포함
> 되는지 vs 별도 서비스 ID(15135102)로 분리되었는지는 Swagger 확인 시점에
> 재검증한다."

본 SPEC 의 사전 검증 결과:

- **detailPetTour2 는 양 서비스에 모두 존재**: Swagger 2.0 카탈로그 점검 결과
  `B551011/KorService2/detailPetTour2` 와 `B551011/KorPetTourService2/detailPetTour2`
  양 path 모두 노출됨.
- **양 path 의 응답은 동일**: 동일 contentId 로 양 path 호출 시 동일한 record
  (acmpyTypeCd, acmpyPsblCpam, acmpyNeedMtr, etcAcmpyInfo 포함) 반환. 차이 없음.
- **결론**: SPEC-KTO-001 에서 노출한 `kto_korean_detailPetTour2` 단일 도구로
  사용자 요구를 충족한다. 본 SPEC 은 `kto_pet_detailPetTour2` 를 추가로 노출
  하지 **않는다** (중복 회피).

이로써 SPEC-KTO-001 R7 위험 항목은 본 SPEC 시점에 명시적으로 해소된다.

### 1.5 인증·인코딩

`KtoHttpClient` (SPEC-KTO-001 도입, SPEC-KTO-003 에서 flat envelope 검출 hotfix
추가) 는 다음 동작을 수행하며, 본 SPEC 도 동일하게 동작한다:

- `serviceKey` 환경변수 → URL-encoded 쿼리 파라미터로 전달
- `COMMON_PARAMS` (`MobileOS`, `MobileApp`, `_type`) 자동 주입
- 응답 envelope 정규화 (`response.body.items.item[]` → 배열로 평탄화)
- flat error envelope 검출 → `KtoApiError` 발생
- 5xx + 네트워크 에러 → `RETRY_CONFIG` (max 3, base 200ms, factor 2.0,
  jitter ±20%) 적용

본 SPEC 은 위 동작에 대해 어떠한 변경도 가하지 않는다.

---

## 2. 오퍼레이션 카탈로그 (전체 13 — exposed 4 + skipped 9)

### 2.1 전체 13 오퍼레이션 분류

Swagger 2.0 카탈로그에 등록된 KorPetTourService2 의 모든 13 오퍼레이션:

| # | Operation | 분류 | 본 SPEC 노출 여부 | 이유 |
|---|-----------|------|------------------|------|
| 1 | `areaBasedList2` | List | **노출** (`kto_pet_areaBasedList2`) | pet-filtered 지역 기반 목록 — superset 조회의 핵심 가치 |
| 2 | `locationBasedList2` | List | **노출** (`kto_pet_locationBasedList2`) | pet-filtered 위치 기반 목록 — 좌표/반경 기반 직접 조회 |
| 3 | `searchKeyword2` | List | **노출** (`kto_pet_searchKeyword2`) | pet-filtered 키워드 검색 |
| 4 | `petTourSyncList2` | Sync | **노출** (`kto_pet_petTourSyncList2`) | NEW — pet 전용 동기화 목록. KorPetTourService2 고유 오퍼레이션 |
| 5 | `areaCode2` | Code | 미노출 | KorService2 와 동일 응답 → `kto_korean_areaCode2` 로 이미 노출 |
| 6 | `categoryCode2` | Code | 미노출 | KorService2 와 동일 응답 → `kto_korean_categoryCode2` 로 이미 노출 |
| 7 | `ldongCode2` | Code | 미노출 | KorService2 와 동일 응답 → `kto_korean_ldongCode2` 로 이미 노출 |
| 8 | `lclsSystmCode2` | Code | 미노출 | KorService2 와 동일 응답 → `kto_korean_lclsSystmCode2` 로 이미 노출 |
| 9 | `detailCommon2` | Detail | 미노출 | contentId 기반 단일 record 조회 — 양 서비스 동일 응답. `kto_korean_detailCommon2` 로 이미 노출 |
| 10 | `detailIntro2` | Detail | 미노출 | 상동 — `kto_korean_detailIntro2` 로 이미 노출 |
| 11 | `detailInfo2` | Detail | 미노출 | 상동 — `kto_korean_detailInfo2` 로 이미 노출 |
| 12 | `detailImage2` | Detail | 미노출 | 상동 — `kto_korean_detailImage2` 로 이미 노출 |
| 13 | `detailPetTour2` | Detail (pet 전용) | 미노출 | **SPEC-KTO-001 R7 해소** — 양 서비스 동일 응답 검증 완료. `kto_korean_detailPetTour2` 로 이미 노출 (SPEC-KTO-001) |

### 2.2 R1 정책 (SPEC-KTO-002 도입) 의 본 SPEC 적용

SPEC-KTO-002 (KorWithService2) 는 다음 정책을 도입했다:

> "동일 응답을 반환하는 코드 조회 오퍼레이션 (`areaCode2`, `categoryCode2`,
> `ldongCode2`, `lclsSystmCode2`) 은 KorService2 측 (`kto_korean_*`) 으로
> 이미 노출되었으므로 sibling 서비스에서는 노출하지 않는다 — 중복 회피."

본 SPEC 은 R1 정책을 **확장 적용** 한다:

- **코드 4종 미노출**: SPEC-KTO-002 와 동일.
- **상세 5종 미노출**: contentId 기반 detail 오퍼레이션 (`detailCommon2`,
  `detailIntro2`, `detailInfo2`, `detailImage2`, `detailPetTour2`) 도 양 서비스
  동일 응답이므로 미노출. SPEC-KTO-002 는 detail 오퍼레이션 부재로 적용 대상이
  아니었으나, 본 SPEC 은 이 정책을 detail 까지 확장한다.

이 정책의 결과: 13 오퍼레이션 중 **4 만 노출** (List 3 + Sync 1).

### 2.3 4 노출 오퍼레이션 사전 검증 totalCount

각 노출 오퍼레이션의 실호출 검증 결과:

| # | Tool | Operation | 검증 입력 | 검증 totalCount |
|---|------|-----------|----------|-----------------|
| 1 | `kto_pet_areaBasedList2` | `areaBasedList2` | `{ areaCode: '1' }` (서울) | **62** |
| 2 | `kto_pet_locationBasedList2` | `locationBasedList2` | `{ mapX: 126.9779, mapY: 37.5664, radius: 20000 }` (서울시청 20km) | **75** |
| 3 | `kto_pet_searchKeyword2` | `searchKeyword2` | `{ keyword: '카페' }` | **19** |
| 4 | `kto_pet_petTourSyncList2` | `petTourSyncList2` | `{}` (빈 입력) | **10167** |

`petTourSyncList2` 의 totalCount 10167 은 KTO 가 보유한 pet-filtered 전체
컨텐츠 카운트로, 본 SPEC 의 핵심 가치를 정량적으로 보여준다 — 사용자는
`kto_korean_areaBasedList2` 로 superset (수십만) 을 다운로드해 클라이언트에서
필터링하는 대신, `kto_pet_petTourSyncList2` 로 10167 records 만 직접 동기화
가능하다.

---

## 3. 응답 entity (KorPetTourItem)

### 3.1 List/Sync 응답 record 스키마

3 List 오퍼레이션 (`areaBasedList2`, `locationBasedList2`, `searchKeyword2`) 과
`petTourSyncList2` 모두 KTO content 표준 스키마를 공유한다 (KorService2 의
`KoreanTourItem` 과 동일한 골격):

| 필드 | 의미 | List 3종 | petTourSyncList2 |
|------|------|---------|------------------|
| `contentid` | 컨텐츠 ID | O | O |
| `contenttypeid` | 컨텐츠 타입 코드 | O | O |
| `title` | 컨텐츠 한글명 | O | O |
| `addr1` | 주소 1 | O | O |
| `addr2` | 주소 2 | O | O |
| `zipcode` | 우편번호 | O | O |
| `tel` | 전화번호 | O | O |
| `areacode` | 지역 코드 | O | O |
| `sigungucode` | 시군구 코드 | O | O |
| `cat1` | 대분류 코드 | O | O |
| `cat2` | 중분류 코드 | O | O |
| `cat3` | 소분류 코드 | O | O |
| `mapx` | 경도 | O | O |
| `mapy` | 위도 | O | O |
| `mlevel` | 지도 레벨 | O | O |
| `firstimage` | 대표 이미지 URL | O | O |
| `firstimage2` | 대표 이미지 (썸네일) URL | O | O |
| `cpyrhtDivCd` | 저작권 구분 코드 | O | O |
| `createdtime` | 생성 시각 | O | O |
| `modifiedtime` | 수정 시각 | O | O |
| `showflag` | 활성/삭제 플래그 (Sync 전용) | X | O |

검증된 응답 샘플은 KorService2 의 `KoreanTourItem` 과 동일한 골격을 보유하며,
sync 응답은 추가 `showflag` 필드를 포함할 수 있다 (active/deleted 표시).

본 SPEC 은 두 entity 를 분리하지 않고 **단일 typed interface `KorPetTourItem`**
으로 흡수한다. 이유:

- 두 entity 의 record 골격이 거의 동일 (≥95% 필드 공유).
- TypeScript 인덱스 시그니처 (`[key: string]: string | undefined`) 가 sync
  전용 필드 (`showflag`) 를 자동 흡수.
- entity 분리는 부주의한 over-engineering — 단일 책임 원칙과 충돌하지 않음.

### 3.2 KorPetTourItem 정의

```typescript
export interface KorPetTourItem {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  mapx?: string;
  mapy?: string;
  mlevel?: string;
  firstimage?: string;
  firstimage2?: string;
  cpyrhtDivCd?: string;
  createdtime?: string;
  modifiedtime?: string;
  showflag?: string;       // petTourSyncList2 전용 (active='1' / deleted='0')
  [key: string]: string | undefined;
}
```

KTO 원형 필드명 (`contentid`, `contenttypeid`, `mapx`, `mapy` 등 lowercase
camelless 표기) 을 그대로 보존한다 (선행 SPEC 패턴 동일).

### 3.3 pet 동반 정보 필드의 처리

`detailPetTour2` 응답이 보유하는 pet 동반 가능 여부 필드 (`acmpyTypeCd`,
`acmpyPsblCpam`, `acmpyNeedMtr`, `etcAcmpyInfo`) 는 `KorPetTourService2` 의 List/
Sync 오퍼레이션 응답에는 포함되지 않는다 — 본 데이터셋 자체가 pet-filtered
이므로 모든 record 가 pet 동반 가능. 만약 KTO 가 향후 List 응답에 `petAcptAbl`
같은 필드를 추가하면 인덱스 시그니처가 자동 흡수.

---

## 4. DTO·도구 설계 결정

### 4.1 DTO 4종 (Pt prefix)

선행 SPEC 의 DTO 패턴 (Kt = Korean Tour, Bf = Barrier Free, Pg = Photo Gallery,
Gc = GoCamping, Au = Audio guide, Du = Durunubi) 을 따라 본 SPEC 은 **Pt = Pet
Tour** 를 채택한다.

공통 베이스 필드 (4 DTO 모두 보유, 모두 optional):

- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

각 DTO 추가 필드:

- **`PtAreaBasedListDto`** (`area-based-list.dto.ts`) — 모두 optional:
  - `areaCode?: string`
  - `sigunguCode?: string`
  - `contentTypeId?: string`
  - `cat1?: string`, `cat2?: string`, `cat3?: string`
  - `arrange?: string` — KTO 정렬 코드 (A/C/D/O/Q/R)

- **`PtLocationBasedListDto`** (`location-based-list.dto.ts`):
  - `mapX!: number` — required (좌표 누락 시 -32602)
  - `mapY!: number` — required
  - `radius!: number` — required (KTO 단위 m, 1-20000)
  - `contentTypeId?: string` — optional
  - `arrange?: string` — optional

- **`PtSearchKeywordDto`** (`search-keyword.dto.ts`):
  - `keyword!: string` — required (키워드 누락 시 -32602)
  - `contentTypeId?: string`
  - `areaCode?: string`, `sigunguCode?: string`
  - `arrange?: string`

- **`PtPetTourSyncListDto`** (`pet-tour-sync-list.dto.ts`) — 모두 optional:
  - `showflag?: string` — '1' (active) / '0' (deleted)
  - `syncModTime?: string` — 동기화 기준 시각

검증 규칙은 SPEC-KTO-001 ~ SPEC-KTO-006 의 패턴 그대로 적용. required 필드는
`@IsNotEmpty()` + 타입별 검증 (number/string).

### 4.2 도구 명명

선행 SPEC 의 prefix 패턴 (`kto_korean_*`, `kto_barrier_free_*`, `kto_photo_*`,
`kto_camping_*`, `kto_audio_*`, `kto_durunubi_*`) 을 따라 본 SPEC 은
**`kto_pet_*`** 를 채택한다.

도구 이름 형식: `kto_pet_<exactOpName>` (camelCase 보존, 선행 SPEC 동일):

- `kto_pet_areaBasedList2`
- `kto_pet_locationBasedList2`
- `kto_pet_searchKeyword2`
- `kto_pet_petTourSyncList2`

본 SPEC 의 도구 수: 4 (전체 도구 카운트: 44 → 48).

---

## 5. 위험·미해결 항목

### 5.1 위험

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | detail/code 9 오퍼레이션을 노출하지 않은 것에 대한 사용자 혼란 — `kto_pet_detailCommon2` 같은 도구가 없는 것에 대한 의문 가능성 | research.md / spec.md / README 에 "pet content 의 상세는 `kto_korean_detail*` 도구를 사용. KorService2 와 KorPetTourService2 의 detail 응답은 동일." 명시 |
| R2 | LOW | `petTourSyncList2` 의 `syncModTime` 형식 (ISO 8601 vs YYYYMMDDHHMMSS) 미확인 — KTO Swagger description 미명시 | DTO 에서 `string` 으로만 검증하고 KTO 에 그대로 전달. 빈 입력 (`{}`) 호출이 default 동작으로 정상 작동함을 사전 검증 (totalCount=10167). |
| R3 | LOW | KTO 가 향후 KorPetTourService2 다국어 변체 (예: `EngPetTourService2`) 출시 가능성 | 현재 카탈로그·실호출 모두 다국어 변체 미확인. 향후 출시 시 별도 SPEC (예: `SPEC-KTO-007-i18n`) 으로 흡수. typed interface 의 인덱스 시그니처가 응답 새 필드 자동 흡수. |

### 5.2 미해결 항목

본 SPEC 범위 내에 미해결 항목 없음. KorPetTourService2 의 13 오퍼레이션 중
4 가 노출되고, 나머지 9 는 R1 정책에 따라 의도적으로 미노출이며, 그 사유가
명시되었다.

---

## 6. 결론

SPEC-KTO-007 은 한국관광공사 반려동물 동반여행 정보 API (KorPetTourService2)
의 **13 오퍼레이션 중 4 를 노출** 하는 7차 이터레이션이다 (List 3 + Sync 1).
나머지 9 오퍼레이션 (Code 4 + Detail 5) 은 KorService2 와 동일 응답을 반환
하므로 SPEC-KTO-002 가 도입한 **R1 중복 회피 정책의 자연스러운 확장** 으로
미노출한다.

본 SPEC 의 노출 4 도구 중 `kto_pet_petTourSyncList2` 는 KorPetTourService2 의
**고유 오퍼레이션** (`petTourSyncList2`) 으로 KorService2 측에 동등 도구가
없다 — pet 데이터셋 전체 (totalCount=10167) 를 단일 호출로 동기화 목적 조회
가능.

본 SPEC 은 SPEC-KTO-001 의 R7 위험 항목 (`detailPetTour2` 의 KorService2 포함
여부) 을 명시적으로 해소한다 — 양 서비스에 모두 존재하며 동일 응답을 반환하
므로 `kto_korean_detailPetTour2` 단일 도구로 충분, 본 SPEC 에서 `kto_pet_
detailPetTour2` 추가 노출 없음.

선행 6 SPEC 의 공용 인프라 (`KtoHttpClient`, `response-normalizer`,
`tool-registry`, transport 3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 100%
재사용. 신규 추상화 0건. 신규 다국어 패턴 0건. 단일 path + 다국어 변체 미존재
(SPEC-KTO-006 두루누비와 동일한 흡수 패턴이지만, BASE_URL_MAP 키는 V2 sibling
패턴 (`KorPetTourService2`) 으로 분류된다).
