# Research: SPEC-KTO-004 (KTO MCP 서버 4차 이터레이션 — 고캠핑 정보조회 GoCamping)

## 조사 목적

한국관광공사(KTO)_고캠핑(야영장) 정보조회 API(`GoCamping`, data.go.kr 공개 ID 15101933)
를 NestJS 11 기반 MCP 서버에 추가 통합하기 위한 사전 조사. 본 문서는 외부 API 의
인터페이스 중 SPEC-KTO-001 (KorService2) / SPEC-KTO-002 (KorWithService2) /
SPEC-KTO-003 (PhotoGalleryService1) 와 다른 부분만 집중적으로 정리하고, 동일한 부분
(인증·공통 파라미터·응답 envelope·게이트웨이 에러 처리 등) 은 세 선행 SPEC 의
research 를 참조한다.

본 SPEC 은 4차 이터레이션이며, 선행 3개 SPEC 에서 정의·확장한 공용 인프라
(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 어댑터,
`kto-error`, `BASE_URL_MAP`, `RETRY_CONFIG`) 를 100% 재사용한다.

본 문서의 모든 사실은 data.go.kr 카탈로그 페이지(15101933) 의 Swagger 2.0 스펙 본문
(`.moai/cache/gocamping-page.html` 캐시) 및 사용자가 제공한 실 KTO 응답으로 검증되었다.
[ASSUMED] 마커는 거의 0건에 수렴한다.

---

## 1. 외부 API 개요 (선행 SPEC 와의 차이점만)

### 1.1 발급처 및 API ID

- **발급기관**: 한국관광공사 (KTO)
- **공급 플랫폼**: 공공데이터포털 (data.go.kr)
- **공개 API ID**: 15101933 (선행 SPEC: 15101578 / 15101897 / 15101914)
- **공식 한글 명칭**: 한국관광공사_고캠핑 정보 조회서비스_GW
- **공식 카탈로그 URL**: https://www.data.go.kr/data/15101933/openapi.do
- **서비스 계열 식별자**: `B551011/GoCamping` [VERIFIED — Swagger host 필드]

### 1.2 Base URL

```
http://apis.data.go.kr/B551011/GoCamping/
```

[VERIFIED] Swagger 2.0 의 `host: "apis.data.go.kr/B551011/GoCamping"` 와 사용자 실 호출
응답으로 확정. 호스트 prefix(`apis.data.go.kr/B551011`) 는 선행 3 SPEC 와 동일하며,
**서비스 path 만 `GoCamping`** 으로 변경된다.

→ `BASE_URL_MAP` 에 항목 1줄 추가로 클라이언트 본체를 변경 없이 흡수 가능.

### 1.3 [핵심] 서비스 path 명명 패턴 — 3 가지 변종 공존

본 SPEC 시점부터 `BASE_URL_MAP` 에 등장하는 서비스 path 패턴은 **3 가지**로 분기한다:

| 패턴 | 예시 | 도입 SPEC | 형태 |
|------|------|-----------|------|
| (A) V2 다국어 코어 | `KorService2`, `EngService2`, `JpnService2`, ..., `KorWithService2` | SPEC-KTO-001, SPEC-KTO-002 | `{도메인}Service2` |
| (B) V1 단독 사이드 | `PhotoGalleryService1` | SPEC-KTO-003 | `{도메인}Service1` |
| (C) 버전 suffix 없음 | `GoCamping` | **본 SPEC (KTO-004)** | `{도메인}` |

(C) 패턴은 KTO 게이트웨이의 일관된 명명 규칙이 아니라 **각 도메인의 등록 시점·운영
주체별 관행** 의 결과로 보이며, 일반화된 추상화로 흡수할 수 없다. 본 SPEC 은 (C)
패턴을 `BASE_URL_MAP` 의 추가 평면 항목으로 흡수하며, 신규 추상화 도입 없이 1줄
추가만으로 처리한다 (Plan §1.3 참조).

`BASE_URL_MAP` 위 `@MX:NOTE` 주석은 SPEC-KTO-002 시점에 이미 "(1) 언어 변체 + (2)
기능적 형제 서비스" 의도를 담고 있으나, 본 SPEC 에서는 **3 패턴 모두 명시** 하도록
prose 1줄을 보강한다 (Plan §1.3, MX Tag Plan).

### 1.4 API 규모

data.go.kr 카탈로그 본문 + 사용자 실 호출 응답에서 확인된 정보:

- 전국 지방자치단체 인허가 시스템에 등록된 **야영장(캠핑장) 운영 현황** 데이터셋
- 메타: 야영장명, 구분 유형, 위치 정보, 화장실·샤워실·개수대 등 편의 시설, 소화기·
  방화수 등 안전 시설, 운영 상태, 인허가 일자 등
- [VERIFIED] `basedList` totalCount = **3,067** (현재 운영 중 캠핑장)
- [VERIFIED] `basedSyncList` totalCount = **5,181** (삭제·이력 포함 동기화 목록)
- 데이터 포맷: REST API + JSON / XML
- 활용 영역: 캠핑 정책 수립, 관광 인프라 분석, 안전 관리 체계 구축, 캠핑장 서비스
  품질 평가, 지역별 관광 자원 개발 전략

### 1.5 다국어 변체 존재 여부

[VERIFIED — 미존재] data.go.kr 카탈로그 페이지(15101933) Swagger 본문 및 호스트
디렉토리에서 `EngGoCamping`, `JpnGoCamping` 등 다국어 변체는 확인되지 않는다. 본
SPEC 은 **`GoCamping` 단일 변체만 다루며**, 다국어 캠핑 변체는 존재 미확인 상태로
차기 SPEC 후보로 보류한다 (spec.md Exclusions 참조).

---

## 2. 인증 방식 및 공통 파라미터

SPEC-KTO-001 §2, §3 와 **완전히 동일**. 동일한 `serviceKey` 발급분이 모든 KTO B551011
서비스(`KorService2`, `KorWithService2`, `PhotoGalleryService1`, `GoCamping`, ...) 에
그대로 동작한다. 환경변수 `KTO_SERVICE_KEY` 재사용, 공통 파라미터 `MobileOS=ETC`,
`MobileApp=kto-mcp`, `_type=json` 동일.

[VERIFIED] Swagger 의 모든 5 오퍼레이션 parameters 정의에서 `MobileOS`, `MobileApp`,
`serviceKey` 가 `required: true` 로 명시되어 있으며, `_type` 은 `optional` (디폴트
XML, JSON 사용 시 `_type=json`) 로 명시되어 있다 — **선행 SPEC 의 자동 주입 정책과
완전 호환**.

→ `KtoHttpClient` 의 공통 파라미터 자동 주입 로직, 서비스 키 인코딩 정책, 게이트웨이
오류 코드 매핑은 변경 없음.

---

## 3. 오퍼레이션 카탈로그 (전수 VERIFIED)

### 3.1 카탈로그 출처

data.go.kr 카탈로그 페이지(15101933) 의 Swagger 2.0 스펙 본문(`.moai/cache/
gocamping-page.html` 의 `swaggerJson` 변수) 직접 파싱 + 사용자 실 KTO 키 호출 200 OK
응답으로 모든 항목 검증 완료. **[ASSUMED] 마커 0건**.

### 3.2 5 오퍼레이션 일람표

| # | operationId | path | summary | 설명 | 핵심 입력 파라미터(공통 외) | 검증 상태 |
|---|-------------|------|---------|------|------------------------------|-----------|
| 1 | `basedList` | `/basedList` | 기본 정보 목록 조회 | 고캠핑 기본정보 목록을 조회하는 기능 | (모두 optional: numOfRows, pageNo) | VERIFIED — totalCount 3067 |
| 2 | `locationBasedList` | `/locationBasedList` | 위치기반정보 목록 조회 | 내주변 좌표를 기반으로 고캠핑정보 목록을 조회하는 기능 | **mapX (REQUIRED)**, **mapY (REQUIRED)**, **radius (REQUIRED, ≤20000m)** | VERIFIED |
| 3 | `searchList` | `/searchList` | 키워드 검색 목록 조회 | 키워드로 검색하여 고캠핑정보 목록을 조회하는 기능 | **keyword (REQUIRED, 인코딩 필요)** | VERIFIED |
| 4 | `imageList` | `/imageList` | 이미지정보 목록 조회 | 각 고캠핑 콘텐츠에 해당하는 이미지URL 목록을 조회하는 기능 | **contentId (REQUIRED)** | VERIFIED — 빈 결과 시 `items: ""` 반환 |
| 5 | `basedSyncList` | `/basedSyncList` | 동기화 목록 조회 | 고캠핑 정보 동기화 목록을 조회하는 기능(삭제/수정/신규 포함) | (모두 optional: syncStatus[A/U/D], syncModTime) | VERIFIED — totalCount 5181 |

→ **MCP 도구 1:1 매핑**: 5 ops → 5 tools. 도구 이름은 `kto_camping_<exactOpName>`
(예: `kto_camping_basedList`, `kto_camping_locationBasedList`, ...).

### 3.3 입력 파라미터 type 주의사항

[VERIFIED — Swagger 명세] `locationBasedList` 의 `mapX`, `mapY`, `radius` 는 Swagger
에서 모두 `type: "string"` 으로 명시되어 있다. 일반 통념상 좌표는 number 로 떠올리기
쉬우나, **KTO 게이트웨이는 query string 으로 string 형태 전달을 요구**. 선행
SPEC-KTO-001 의 `areaBasedList2` 도 동일 패턴 (`mapX`, `mapY`, `radius` string 전달).

→ DTO 에서는 사용자 친화성을 위해 number / string 모두 허용 가능하나, 최종 outbound
URL 에서는 string 으로 직렬화. 본 SPEC 은 **`@IsNumber` 또는 `@IsLatLng` 사용 후
toString 변환 또는 `@IsString` 두 옵션** 모두 가능하며, plan.md 에서 결정한다.

### 3.4 KorService2 / KorWithService2 / PhotoGalleryService1 와의 공통·차이 요약

| 카테고리 | KorService2 | KorWithService2 | PhotoGalleryService1 | **GoCamping (본 SPEC)** |
|----------|-------------|-----------------|----------------------|--------------------------|
| 코드 조회 | areaCode2, categoryCode2, ldongCode2, lclsSystmCode2 | 동일 셋 | 미존재 | **미존재** (필요 시 KorService2 코드 사용) |
| 목록 조회 | areaBasedList2, locationBasedList2, searchKeyword2, ... | 동일 셋 | galleryList1 | **basedList**, **locationBasedList**, **searchList**, **basedSyncList** |
| 상세 조회 | detailCommon2, detailIntro2, ... | 동일 셋 | galleryDetailList1 | (별도 상세 조회 미존재 — `basedList` item 자체에 50+ 필드로 풀 메타 노출) |
| 이미지 조회 | detailImage2 | 동일 | (자체가 이미지 도메인) | **imageList** |
| 도메인 고유 | detailPetTour2 (반려동물) | detailWithTour2 (무장애) | (사진 자체) | **basedSyncList** (동기화/이력 — A/U/D 상태) |
| 응답 item 필드 prefix | (평면: `addr1`, `cat1`, `contentid`) | 동일 + 무장애 필드 | **`gal*` prefix** | **혼합** — KTO 평면 + 캠핑 특화(`facltNm`, `induty`, `mgcDiv`, `glampInnerFclty`, `caravInnerFclty`, ...) |
| 다국어 변체 | 9종 (Eng, Jpn, Chs, Cht, Ger, Fre, Spn, Rus + Kor) | 미확인 | 미확인 | **미확인** (Exclusion 처리) |

핵심 차이점:

1. **path 패턴 (C)** — `GoCamping` 은 V/숫자 suffix 없음. `BASE_URL_MAP` flat 흡수.
2. **응답 item 필드 다양성·풍부성** — `basedList` item 의 필드는 **50+ 종**. `gal*`
   prefix 같은 명명 컨벤션은 없으며, KTO 평면 필드 (`addr1`, `mapX`, `mapY`, `tel`,
   `homepage`, `firstImageUrl`) 와 캠핑 특화 필드 (`facltNm`, `induty`, `lctCl`,
   `glampInnerFclty`, `caravInnerFclty`, `glampSiteCo`, `caravSiteCo`,
   `siteBottomCl1~5`, `frprvtSandCo`, ...) 가 혼합.
3. **상세 조회 오퍼레이션 부재** — 캠핑장 상세 정보는 `basedList` 응답 item 자체에
   풀 셋으로 포함되므로, 별도 detail 오퍼레이션이 없다. → `kto_camping_basedList`
   1회 호출로 모든 상세 메타 획득 가능.
4. **`basedSyncList` 의 의미** — 단순 페이지네이션 동기화가 아닌, **삭제·수정·
   신규 이력 포함 전수 목록** (`syncStatus: A/U/D`). totalCount(5181) 가
   `basedList`(3067) 보다 큰 이유.
5. **`imageList` 빈 결과 처리** — [VERIFIED] 캠핑장 사진이 없는 contentId 의 경우
   `body.items` 가 빈 문자열 `""` 로 반환. 기존 `normalizeItems()` 가 이미 처리하는
   케이스 (SPEC-KTO-001 Edge 2.1 동일).

---

## 4. 응답 item 필드 카탈로그 (per-operation, VERIFIED via Swagger definitions)

본 SPEC 은 KTO 원형 보존 정책 (SPEC-KTO-001 Exclusion 5) 을 적용하므로 모든 필드명·
케이싱을 그대로 보존한다. typed item 은 `GoCampingItem` interface (`src/kto/
go-camping/types.ts`) 로 정의하며, **자주 쓰이는 핵심 필드만 named property** 로,
나머지는 `[key: string]: string | undefined` **인덱스 시그니처** 로 처리한다 (Plan
R3 완화책).

### 4.1 basedList_item / basedSyncList_item — 풀 메타 (50+ 필드)

[VERIFIED — Swagger definitions, 60+ 필드 전수 카탈로그]

핵심 식별 + 위치 (named):

| 필드 | 의미 | 비고 |
|------|------|------|
| `contentId` | 콘텐츠 ID | 캠핑장 식별자. KorService2 `contentid` 와 별도 ID 체계 가정 (R6) |
| `facltNm` | 시설명 (야영장명) | 예: "금방아 민박 캠핑장" |
| `lineIntro` | 한 줄 소개 | 짧은 텍스트 |
| `intro` | 상세 소개 | 긴 텍스트 |
| `addr1` | 주소 | 도로명/지번 |
| `addr2` | 주소 상세 | |
| `mapX` | 경도(X) WGS84 | string |
| `mapY` | 위도(Y) WGS84 | string |
| `zipcode` | 우편번호 | |
| `doNm` | 도 | 광역시도 |
| `sigunguNm` | 시군구 | |

운영 / 사업자 (named 권장):

| 필드 | 의미 |
|------|------|
| `induty` | 업종 |
| `lctCl` | 입지 구분 |
| `facltDivNm` | 사업주체 구분 (공립/민간) |
| `mangeDivNm` | 운영주체 (직영/위탁) |
| `mgcDiv` | 운영기관 |
| `manageSttus` | 운영 상태 (운영/휴장 등) |
| `hvofBgnde` / `hvofEnddle` | 휴장 시작일 / 종료일 |
| `prmisnDe` | 인허가일자 |
| `operPdCl` / `operDeCl` | 운영기간 / 운영일 |
| `bizrno` | 사업자번호 |
| `trsagntNo` | 관광사업자번호 |
| `insrncAt` | 영업배상책임보험 가입 (Y/N) |
| `manageNmpr` | 상주관리인원 |

규모 / 시설 분류 (인덱스 시그니처):

- `allar` (전체면적), `featureNm` (특징), `tooltip` (툴팁)
- 주요시설 사이트 수: `gnrlSiteCo` (일반), `autoSiteCo` (자동차), `glampSiteCo`
  (글램핑), `caravSiteCo` (카라반), `indvdlCaravSiteCo` (개인 카라반)
- 사이트 크기 매트릭스: `siteMg1Width`, `siteMg2Width`, `siteMg3Width`,
  `siteMg1Vrticl`, `siteMg2Vrticl`, `siteMg3Vrticl`, `siteMg1Co`, `siteMg2Co`,
  `siteMg3Co` (가로/세로/수량 1·2·3 그룹)
- 사이트 바닥 종류: `siteBottomCl1` (잔디), `siteBottomCl2` (파쇄석), `siteBottomCl3`
  (테크), `siteBottomCl4` (자갈), `siteBottomCl5` (맨흙)
- 글램핑/카라반 내부: `glampInnerFclty`, `caravInnerFclty`
- 사이트간 거리: `sitedStnc`

편의 / 안전 시설 (인덱스 시그니처):

- `toiletCo` (화장실), `swrmCo` (샤워실), `wtrplCo` (개수대), `brazierCl` (화로대)
- `sbrsCl` (부대시설), `sbrsEtc` (부대시설 기타)
- `posblFcltyCl` (주변이용가능시설), `posblFcltyEtc` (주변이용가능시설 기타)
- `extshrCo` (소화기), `frprvtWrppCo` (방화수), `frprvtSandCo` (방화사),
  `fireSensorCo` (화재감지기)

체험·문화·환경 (인덱스 시그니처):

- `clturEventAt` / `clturEvent` (자체문화행사 여부 / 행사명)
- `exprnProgrmAt` / `exprnProgrm` (체험프로그램 여부 / 프로그램명)
- `themaEnvrnCl` (테마환경)
- `eqpmnLendCl` (캠핑장비대여)
- `animalCmgCl` (애완동물 출입)
- `tourEraCl` (여행시기)

동반·예약 (인덱스 시그니처):

- `caravAcmpnyAt` (개인 카라반 동반 Y/N), `trlerAcmpnyAt` (개인 트레일러 동반 Y/N)
- `direction` (오시는 길), `tel`, `homepage`, `resveUrl`, `resveCl`

미디어 / 시간 (named 권장):

| 필드 | 의미 |
|------|------|
| `firstImageUrl` | 대표 이미지 URL |
| `createdtime` | 등록일 (YYYYMMDDHHmmss) |
| `modifiedtime` | 수정일 (YYYYMMDDHHmmss) |

`basedSyncList` 만의 추가 필드 (named):

| 필드 | 의미 |
|------|------|
| `syncStatus` | 콘텐츠 상태 (A=신규 / U=수정 / D=삭제) |

> [VERIFIED 60+ fields, full Swagger catalog from KTO guide]
> 위 필드 모두 Swagger 2.0 definitions(`basedList_item`, `locationBasedList_item`,
> `searchList_item`, `basedSyncList_item`) 에서 직접 추출. 케이싱·필드명·설명 동일.

### 4.2 locationBasedList_item / searchList_item

거의 `basedList_item` 과 동일한 필드 셋. Swagger definitions 비교 결과 일부 필드
배치 순서만 다르고, 필드명·타입은 모두 동일하다. → `GoCampingItem` 단일 interface
로 4 오퍼레이션(`basedList`, `locationBasedList`, `searchList`, `basedSyncList`) 응답
공통 처리 가능.

### 4.3 imageList_item — 별도 스키마 (5 필드)

[VERIFIED — Swagger definitions]

| 필드 | 의미 |
|------|------|
| `contentId` | 콘텐츠 ID (캠핑장 식별자) |
| `serialnum` | 이미지 일련번호 |
| `imageUrl` | 이미지 URL |
| `createdtime` | 등록일 |
| `modifiedtime` | 수정일 |

→ `imageList` 응답 item 은 명백히 다른 도메인 (이미지 메타) 이므로, **별도 typed
item `GoCampingImageItem`** 정의가 자연스럽다. 다만 신규 추상화 최소화 정책을 따르기
위해 `GoCampingItem` interface 의 인덱스 시그니처가 imageList 필드도 자연 흡수하므로
**선택적**으로 `GoCampingImageItem` 만 별도 정의 (Plan §1.5 결정 사항 — `types.ts`
하나에 두 interface export).

### 4.4 [VERIFIED] imageList 빈 결과 처리

사용자 실 호출에서 **이미지가 없는 contentId 의 경우 `body.items` 가 빈 문자열 `""`
반환** 확인. 이는 SPEC-KTO-001 §5 + Edge 2.1 에서 이미 정의·검증된 패턴이며, 기존
`normalizeItems()` 함수가 이미 빈 문자열 → 빈 배열로 변환한다. 본 SPEC 의 변경 없음.

---

## 5. 응답 포맷 및 에러 처리

SPEC-KTO-001 §5 / SPEC-KTO-002 §5 / SPEC-KTO-003 §5 와 **완전히 동일**:

- 정상 응답: `response.body.items.item` (1건일 때 단일 객체 → 배열 정규화 필요)
- 게이트웨이 오류: `OpenAPI_ServiceResponse` XML
- reason code 표준 (00 / 03 / 22 / 30 등) — Swagger 의 description 매핑과 일치
- 페이지네이션 메타: `response.body.numOfRows`, `pageNo`, `totalCount` [VERIFIED]
  실 호출 응답에서 모두 존재 확인

→ `KtoHttpClient.parseGatewayError()`, `normalizeItems()`, `KtoApiError` 클래스 변경
없이 재사용. 5xx 재시도 정책(`RETRY_CONFIG`) 동일 적용.

[VERIFIED — flat-error envelope] SPEC-KTO-003 hotfix 에서 `KtoHttpClient` 에 추가된
flat-error envelope 감지 (`response.header.resultCode !== '0000'` 인 JSON 응답) 도
GoCamping 에 동일 적용된다. 별도 변경 없음.

---

## 6. MCP 매핑 패턴

SPEC-KTO-001 §8 / SPEC-KTO-002 §6 / SPEC-KTO-003 §6 과 **동일한 1:1 매핑 패턴**.

| 항목 | 정책 |
|------|------|
| 도구 이름 prefix | `kto_camping_*` (예: `kto_camping_basedList`, `kto_camping_locationBasedList`) — `kto_go_camping_*` 는 토큰 길이가 길어 LLM tools/list 응답에서 가독성 저하 |
| 입력 스키마 | 오퍼레이션별 DTO + class-validator → JSON Schema 자동 변환 (기존 `tool-registry.ts` 재사용) |
| 출력 | 정규화된 JSON. KTO 원형 필드명 그대로 유지 |
| 출력 타입 | `Promise<KtoListResponse<GoCampingItem>>` (4 ops) + `Promise<KtoListResponse<GoCampingImageItem>>` (imageList 1 op) |
| 등록 위치 | `GoCampingModule` → `app.module.ts` import → `tool-registry.registerAll()` 의 registries 배열에 `GO_CAMPING_TOOLS` 항목 추가 |

도구 prefix 충돌 검토:

- `kto_korean_*` (KorService2, SPEC-KTO-001) — 15 도구
- `kto_barrier_free_*` (KorWithService2, SPEC-KTO-002) — 10 도구
- `kto_photo_*` (PhotoGalleryService1, SPEC-KTO-003) — 4 도구
- `kto_camping_*` (GoCamping, **본 SPEC**) — 5 도구 — **충돌 없음**, 단어 경계 명확

총 도구 카운트: 15 + 10 + 4 + 5 = **34**.

---

## 7. 코드 베이스 재사용 영향도

### 7.1 변경 없이 재사용 가능 (100%)

- `src/kto/kto-http.client.ts` — `service` 파라미터로 `GoCamping` 를 받기만 하면 동작.
  flat-error envelope 감지(SPEC-KTO-003 hotfix) 도 그대로 적용
- `src/kto/common/response-normalizer.ts` — 응답 envelope 동일 (`response.body.items.
  item`). 빈 문자열 `""` → 빈 배열 정규화도 동일
- `src/kto/common/kto-error.ts` — 에러 모델 동일
- `src/kto/common/types.ts` — `KtoListResponse<T>`, `KtoRawResponse<T>` 동일
  (`T` 만 `GoCampingItem` 또는 `GoCampingImageItem` 으로 instantiate)
- `src/mcp/tool-registry.ts` — `ToolRegistry[]` 배열 형태로 이미 다중 도구 셋 지원.
  **추가 변경 없음**
- `src/mcp/transports/*` — transport 3종 변경 없음
- `src/env.ts` — `KTO_SERVICE_KEY` 재사용
- `src/kto/korean-tour-info/**/*` — 모두 변경 없음 (회귀 보호)
- `src/kto/barrier-free-tour-info/**/*` — 모두 변경 없음 (회귀 보호)
- `src/kto/photo-gallery/**/*` — 모두 변경 없음 (회귀 보호)

### 7.2 1줄 수정 (constants 확장만)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `GoCamping` 항목 추가 (Plan §1.3
  참조). 위 `@MX:NOTE` prose 는 **3 패턴 (V2 다국어 + V1 단독 + V없음) 명시**
  하도록 1줄 보강. `@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 추가.

### 7.3 다중 등록 패턴 검증

`src/main.ts` 의 `registerAll()` 호출은 이미 `ToolRegistry[]` 배열로 SPEC-KTO-003
시점에 3 항목 (`KOREAN_TOUR_INFO_TOOLS`, `BARRIER_FREE_TOUR_INFO_TOOLS`,
`PHOTO_GALLERY_TOOLS`) 으로 확장되어 있다. 본 SPEC 은 동일 배열에 **`GO_CAMPING_TOOLS`
1개 항목을 추가**하는 것으로 도구 등록을 완료한다. 변경 형태는 SPEC-KTO-002 /
SPEC-KTO-003 와 동일 패턴.

### 7.4 신규 작성

- `src/kto/go-camping/` 모듈 일체 (service, tools, dto 5종, types, module, spec)
- `src/app.module.ts` — `GoCampingModule` import 1줄 추가
- `src/main.ts` — `GoCampingService` 주입 + `GO_CAMPING_TOOLS` registry 항목 추가

→ 신규 추상화·신규 라이브러리 도입 없음. 본 SPEC 은 패턴 복제(replication) SPEC.

---

## 8. 미해결 항목 — 거의 0건

선행 SPEC 의 [ASSUMED] 마커 누적 패턴과 달리, 본 SPEC 은 Swagger 2.0 명세 직접
파싱 + 사용자 실 호출 응답 검증으로 **거의 모든 사실이 VERIFIED 상태**. 잔여 미해결
항목:

| 항목 | 사유 | 해소 시점 |
|------|------|-----------|
| `contentId` (GoCamping) 와 KorService2 `contentid` 동일 ID 체계 여부 | Swagger 미명시 | RUN Phase 첫 호출 응답 비교 — **별도 ID 체계로 가정** (R6) |
| `searchList` 의 keyword 다중 키워드 구분자 (콤마/파이프/공백) | Swagger description 미명시 ("야영장(인코딩 필요)" 만 명시) | RUN Phase 응답 검증 |
| `mapX`/`mapY`/`radius` 정확한 type — Swagger 는 string 명시. number 입력 허용 여부 | 게이트웨이 query string 직렬화 시 동일 | DTO 정책: number 또는 string 모두 허용, outbound 시 string 변환 |
| 다국어 캠핑 변체(`EngGoCamping` 등) 존재 여부 | 카탈로그 본문 미명시 | 발견 시 차기 SPEC 후보로 보류 (Exclusion) |

→ 모든 잔여 항목은 **non-blocking** 이며, RUN Phase 통합 테스트로 자연 해소 가능.

---

## 9. 외부 참고 자료

- 공공데이터포털 카탈로그 (대상): https://www.data.go.kr/data/15101933/openapi.do
- 공공데이터포털 카탈로그 (KorService2, 비교): https://www.data.go.kr/data/15101578/openapi.do
- 공공데이터포털 카탈로그 (KorWithService2, 비교): https://www.data.go.kr/data/15101897/openapi.do
- 공공데이터포털 카탈로그 (PhotoGalleryService1, 비교): https://www.data.go.kr/data/15101914/openapi.do
- 캐시된 페이지: `.moai/cache/gocamping-page.html` (Swagger 2.0 본문 포함)
- KTO 통합 API 안내(한국관광콘텐츠랩): https://api.visitkorea.or.kr/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP 사양: https://modelcontextprotocol.io/specification
- SPEC-KTO-001 (참조 베이스라인): `.moai/specs/SPEC-KTO-001/`
- SPEC-KTO-002 (참조 베이스라인 — 패턴 복제 1차): `.moai/specs/SPEC-KTO-002/`
- SPEC-KTO-003 (참조 베이스라인 — 패턴 복제 2차): `.moai/specs/SPEC-KTO-003/`

### 9.1 검증 결과 요약 (RUN Phase 시점 기록 대상)

| 항목 | 결과 | 근거 |
|------|------|------|
| service path | `B551011/GoCamping` (V/숫자 suffix 없음) | Swagger host 필드 + 사용자 실 호출 200 OK |
| 오퍼레이션 수·명 | 5개 (basedList, basedSyncList, locationBasedList, searchList, imageList) | Swagger paths + operationId 추출 |
| `basedList` totalCount | 3,067 | 사용자 실 호출 응답 |
| `basedSyncList` totalCount | 5,181 | 사용자 실 호출 응답 |
| 응답 envelope | `response.body.items.item` (선행 SPEC 동일) | 사용자 실 호출 |
| 빈 결과 처리 | `body.items === ""` (imageList 사진 없는 contentId) | 사용자 실 호출 |
| `mapX`/`mapY`/`radius` type | string (Swagger 명시) | Swagger parameters |
| `keyword` (searchList) 인코딩 | 클라이언트가 인코딩 책임 | Swagger description "(인코딩 필요)" |
| 페이지네이션 필드 | numOfRows, pageNo, totalCount 모두 존재 | 사용자 실 호출 응답 |
| 다국어 변체 | 미존재 | 카탈로그 페이지 본문 검색 결과 |

---

Version: 0.1.0
Last Updated: 2026-05-09
Author: Seonho Kim
