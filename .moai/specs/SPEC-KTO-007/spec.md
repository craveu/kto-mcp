---
id: SPEC-KTO-007
version: 1.1.0
status: completed
created: 2026-05-09
updated: 2026-05-12
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-007: KTO MCP 서버 7차 이터레이션 (반려동물 동반여행 정보 KorPetTourService2)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.1.0 | 2026-05-12 | Seonho Kim | 레거시 파라미터 제거: `areaCode`/`sigunguCode`/`cat1`/`cat2`/`cat3` → `lDongRegnCd`/`lDongSignguCd`/`lclsSystm1`/`lclsSystm2`/`lclsSystm3` 교체 (areaBasedList2, searchKeyword2 DTO + tools inputSchema) |
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료, 실 키 스모크 검증 통과, main 머지 완료 |
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. 한국관광공사 반려동물 동반여행 정보 API (`KorPetTourService2`, data.go.kr ID 15135102) 13 오퍼레이션 중 4를 MCP 도구로 매핑하는 7차 이터레이션 정의. |

---

## Overview

SPEC-KTO-001 ~ SPEC-KTO-006 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에
한국관광공사 **반려동물 동반여행 정보 API (`KorPetTourService2`, data.go.kr
ID 15135102)** 를 추가 통합한다. 본 데이터셋은 KTO 의 통합 관광 콘텐츠
(`KorService2`) 의 subset 으로, pet 동반 가능 컨텐츠 (관광지, 카페, 음식점,
숙소 등) 만 필터링되어 노출된다.

본 SPEC 은 선행 6 SPEC 의 공용 인프라 (`KtoHttpClient`, `response-normalizer`,
`tool-registry`, transport 3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 를
변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/pet-tour/` 를 추가** 하고
`BASE_URL_MAP` 에 `KorPetTourService2` 항목 1줄을 추가한다.

본 SPEC 은 KorPetTourService2 의 13 오퍼레이션 중 **4 만 노출** 한다:

- **노출 4종**: `areaBasedList2`, `locationBasedList2`, `searchKeyword2`,
  `petTourSyncList2` (NEW — pet 전용 sync 오퍼레이션)
- **미노출 9종**: 코드 조회 4 (`areaCode2`, `categoryCode2`, `ldongCode2`,
  `lclsSystmCode2`) + 상세 5 (`detailCommon2`, `detailIntro2`, `detailInfo2`,
  `detailImage2`, `detailPetTour2`). 모두 KorService2 측에서 이미 동일 응답으로
  노출되었으므로 중복 회피 (R1 정책 확장).

본 SPEC 은 **SPEC-KTO-001 R7 위험을 해소** 한다 — `detailPetTour2` 가 KorService2
측에도 존재하며 KorPetTourService2 측과 동일 응답을 반환함을 사전 검증 완료
하였으므로, `kto_korean_detailPetTour2` (SPEC-KTO-001 노출) 단일 도구로
충분하며 본 SPEC 은 `kto_pet_detailPetTour2` 를 추가 노출하지 않는다.

도구 수: 4. 전체 도구 카운트: 44 → 48. 신규 추상화 0. 신규 다국어 패턴 0.

---

## 1. 사용자 시나리오

| Persona | Scenario |
|---------|----------|
| 반려동물 보호자 / LLM 어시스턴트 | "서울에서 반려견과 갈 수 있는 카페 알려줘" → MCP 클라이언트가 `kto_pet_searchKeyword2({ keyword: '카페' })` 호출 → 19 개 pet-friendly 카페 응답 → 사용자에게 위치/주소/연락처 안내. |
| 여행 기획자 / LLM 어시스턴트 | "강남역 근처 20km 내 반려동물 동반 가능 관광지" → MCP 클라이언트가 `kto_pet_locationBasedList2({ mapX: 127.0276, mapY: 37.4979, radius: 20000 })` 호출 → 75 개 pet-friendly 컨텐츠 반환 → 거리 정렬·필터링하여 사용자 안내. |
| 데이터 동기화 작업자 / 외부 시스템 | "KTO pet 컨텐츠 전체 카탈로그를 자체 DB 와 동기화" → MCP 클라이언트가 `kto_pet_petTourSyncList2({})` 호출 → totalCount=10167 records 페이지네이션 반복 → `showflag` 필드로 active/deleted 분기 처리. |
| 시스템 운영자 | KTO KorPetTourService2 가 5xx 에러를 반환하면 MCP 서버가 자동 재시도 (max 3, base 200ms, factor 2.0, jitter ±20%) 후 그래도 실패하면 MCP 클라이언트로 표준 에러 envelope 전달. |

---

## 2. 요구사항 (5 EARS modules)

본 SPEC 은 EARS 5 모듈 max 정책에 따라 다음 5 모듈로 구성된다.

### 2.1 REQ-KTO7-* (Ubiquitous — 도구 노출 / 인프라 재사용 / typed entity)

- **REQ-KTO7-001**: The system shall expose 반려동물 동반여행 정보
  (`KorPetTourService2`) API 의 4 오퍼레이션 (`areaBasedList2`,
  `locationBasedList2`, `searchKeyword2`, `petTourSyncList2`) 을 각각 MCP 도구
  `kto_pet_areaBasedList2`, `kto_pet_locationBasedList2`, `kto_pet_searchKeyword2`,
  `kto_pet_petTourSyncList2` 로 노출한다. 나머지 9 오퍼레이션 (코드 4 + 상세 5)
  은 KorService2 측에서 이미 동일 응답으로 노출되었으므로 본 SPEC 에서 노출하지
  않는다 (R1 중복 회피 정책 확장).
- **REQ-KTO7-002**: The system shall reuse SPEC-KTO-001 ~ SPEC-KTO-006 의 공용
  인프라 (`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport
  3종, 에러 모델, 재시도 정책 `RETRY_CONFIG`, `BASE_URL_MAP`, `COMMON_PARAMS`)
  를 변경 없이 100% 재사용한다.
- **REQ-KTO7-003**: The system shall expose 응답 entity 1 종 — `KorPetTourItem`
  (KTO content 표준 스키마, 20 필드 + 인덱스 시그니처) — 을 typed interface
  로 정의하고 export 한다. 4 노출 오퍼레이션의 응답 record 가 동일한 골격
  (≥95% 필드 공유) 을 갖고 `petTourSyncList2` 의 추가 필드 (`showflag`) 는
  인덱스 시그니처가 흡수한다. KTO 원형 필드명 (`contentid`, `contenttypeid`,
  `mapx`, `mapy` 등) 은 그대로 보존한다.

### 2.2 REQ-EVT-* (Event-driven — MCP 도구 호출 → KTO 응답)

- **REQ-EVT-001**: When MCP 클라이언트가 `tools/call` 로 `kto_pet_areaBasedList2`,
  `kto_pet_locationBasedList2`, `kto_pet_searchKeyword2`, 또는
  `kto_pet_petTourSyncList2` 를 호출하면, the system shall (a) 입력 DTO 검증
  통과 후 (b) `KtoHttpClient.fetch(serviceName='KorPetTourService2', operation,
  params)` 를 통해 KTO API 호출, (c) `response-normalizer` 적용, (d) 정규화된
  `items` 배열과 `totalCount`, `numOfRows`, `pageNo` 를 포함한 MCP 응답을 반환
  한다. KTO 원형 필드 (`firstimage` URL, `addr1` 주소 텍스트 등) 는 그대로
  전달한다 (다운로드/파싱/sanitization 미적용).

### 2.3 REQ-STATE-* (State-driven — 5xx 재시도)

- **REQ-STATE-001**: While KorPetTourService2 API 가 5xx HTTP 상태 또는 네트워크
  에러 (ECONNRESET, ETIMEDOUT 등) 를 반환하면, the system shall `RETRY_CONFIG`
  (max 3 retries, base 200ms, factor 2.0, jitter ±20%) 를 그대로 적용하여 자동
  재시도한다. 재시도 후에도 실패하면 표준 KTO 에러 envelope 으로 변환하여 MCP
  클라이언트에 전달한다.

### 2.4 REQ-OPT-* (Optional — BASE_URL_MAP 일반화 확장)

- **REQ-OPT-001**: Where `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 객체가
  존재하는 경우, the system shall `KorPetTourService2:
  'http://apis.data.go.kr/B551011/KorPetTourService2'` 1줄을 추가하고, `@MX:SPEC`
  라인에 `SPEC-KTO-007 REQ-OPT-001` 항목을 추가한다. `@MX:NOTE` prose (4 패턴
  명시) 는 SPEC-KTO-005 에서 이미 보강되었고 KorPetTourService2 는 V2 sibling
  pattern (KorWithService2 와 동일 형태, 패턴 B 의 자연스러운 확장) 에 속하
  므로 prose 변경하지 않는다. `KtoServiceName` union 타입은 자동 추론으로
  `'KorPetTourService2'` 를 포함한다.

### 2.5 REQ-UNW-* (Unwanted — 잘못된 입력 차단)

- **REQ-UNW-001**: If MCP 클라이언트가 다음 잘못된 입력으로 도구 호출 시,
  then the system shall class-validator 기반 DTO 검증 단계에서 즉시 차단하고
  MCP `-32602` (Invalid params) 에러를 반환한다 (KTO API 호출 발생 안 함):
  - `kto_pet_locationBasedList2` 호출 시 `mapX`, `mapY`, `radius` 중 하나라도
    누락 또는 number 가 아닌 경우.
  - `kto_pet_searchKeyword2` 호출 시 `keyword` 누락 또는 빈 문자열인 경우.
  - 4 도구 모두 `numOfRows`, `pageNo` 가 잘못된 값 (`numOfRows=0`,
    `numOfRows=101`, `numOfRows="abc"`, `pageNo=0`) 인 경우.

---

## 3. 영향받는 파일 (Affected Files)

### 3.1 Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `KorPetTourService2:
  'http://apis.data.go.kr/B551011/KorPetTourService2'` 1줄 추가, `@MX:SPEC`
  라인에 `SPEC-KTO-007 REQ-OPT-001` 추가. `@MX:NOTE` prose 미변경 (V2 sibling
  pattern 확장, 패턴 B 의 자연스러운 흡수).
- `src/app.module.ts` — `PetTourModule` import 1줄 추가.
- `src/main.ts` — `petTourService = app.get(PetTourService)` 라인 추가 +
  `registerAll()` registries 배열에 `{ tools: PET_TOUR_TOOLS, service:
  petTourService }` 1 항목 (registries 7번째 항목) 추가.
- `test/kto.e2e-spec.ts` — 도구 카운트 assertion 44 → 48 갱신, KorPetTourService2
  시나리오 추가.

### 3.2 Created (`src/kto/pet-tour/` 모듈 디렉토리)

```
src/kto/pet-tour/
├── pet-tour.module.ts
├── pet-tour.service.ts
├── pet-tour.tools.ts
├── types.ts                       # KorPetTourItem
├── pet-tour.service.spec.ts
├── pet-tour.tools.spec.ts
└── dto/
    ├── area-based-list.dto.ts     # PtAreaBasedListDto
    ├── location-based-list.dto.ts # PtLocationBasedListDto
    ├── search-keyword.dto.ts      # PtSearchKeywordDto
    ├── pet-tour-sync-list.dto.ts  # PtPetTourSyncListDto
    ├── index.ts
    └── dto.spec.ts                # REQ-UNW-001 검증
```

### 3.3 NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,
audio-guide,durunubi}/**/*`.

---

## 4. 도구 명명 규약 (`kto_pet_*`)

### 4.1 도구 prefix 결정

선행 SPEC 의 prefix 패턴:

- SPEC-KTO-001 → `kto_korean_*`
- SPEC-KTO-002 → `kto_barrier_free_*`
- SPEC-KTO-003 → `kto_photo_*`
- SPEC-KTO-004 → `kto_camping_*`
- SPEC-KTO-005 → `kto_audio_*`
- SPEC-KTO-006 → `kto_durunubi_*`
- **SPEC-KTO-007 → `kto_pet_*`** (NEW)

"pet" 은 KTO API 의 핵심 도메인 (반려동물 동반) 의 짧고 명확한 영문 표기이며
도구 식별자로 가독성이 우수하다. 선행 SPEC 의 prefix 가 모두 영문 단어 (korean,
barrier_free, photo, camping, audio, durunubi) 로 구성되었으므로 본 SPEC 도
영문 단어 `pet` 를 채택한다.

### 4.2 도구 이름 형식

`kto_pet_<exactOpName>` (camelCase 보존, 선행 SPEC 동일):

- `kto_pet_areaBasedList2` — pet-friendly 지역 기반 컨텐츠 목록 (서울 → 62 hits 검증)
- `kto_pet_locationBasedList2` — pet-friendly 위치 기반 컨텐츠 목록 (서울시청 20km → 75 hits 검증)
- `kto_pet_searchKeyword2` — pet-friendly 키워드 검색 ("카페" → 19 hits 검증)
- `kto_pet_petTourSyncList2` — pet 전용 전체 동기화 목록 (totalCount=10167 검증, KorPetTourService2 고유)

---

## 5. Exclusions (What NOT to Build)

본 SPEC 은 다음 항목을 의도적으로 out-of-scope 로 둔다:

1. **detail 5 오퍼레이션 미노출**: `detailCommon2`, `detailIntro2`,
   `detailInfo2`, `detailImage2`, `detailPetTour2` 는 KorService2 측 (`kto_korean_*`)
   에서 이미 노출되었으며, KorPetTourService2 측의 응답과 동일하다 (사전 검증
   완료). 본 SPEC 은 이를 노출하지 않는다 — 중복 회피. pet content 의 상세
   조회는 `kto_korean_detailCommon2`, `kto_korean_detailPetTour2` 등 기존 도구
   를 사용한다. 이는 SPEC-KTO-001 R7 위험 (`detailPetTour2` 의 KorService2 포함
   여부) 을 명시적으로 해소한다.
2. **코드 4 오퍼레이션 미노출**: `areaCode2`, `categoryCode2`, `ldongCode2`,
   `lclsSystmCode2` 는 KorService2 와 동일 응답을 반환하며, SPEC-KTO-001 의
   `kto_korean_*` 도구로 이미 노출되었다. SPEC-KTO-002 가 도입한 R1 중복 회피
   정책의 자연스러운 확장.
3. **다국어 변체**: KorPetTourService2 는 한국어 단일 응답만 제공한다. KTO
   카탈로그·실호출 모두에서 영어/일본어/중국어 변체 service path (예:
   `EngPetTourService2`) 또는 `langCode` 파라미터가 미확인이다. 다국어 지원은
   본 SPEC 범위 외이며, 향후 KTO 가 다국어 변체를 출시하는 경우 별도 SPEC
   (`SPEC-KTO-007-i18n` 후보) 으로 흡수.
4. **통합 검색 도구 (KorService2 + KorPetTourService2 머지)**: 사용자가
   "전체 superset 에서 pet-friendly 만 추가 표시" 같은 머지 시나리오를 원할
   경우, `kto_korean_*` + `kto_pet_*` 양 도구를 클라이언트 사이드에서 조합
   하는 것이 정상 흐름이다. 단일 통합 도구는 별도 SPEC 후보이며 본 SPEC 범위
   외다 — KTO 원형 응답을 그대로 전달하는 단일 책임 원칙 준수.

---

## 6. 검증 기준 (요약)

상세 시나리오는 `acceptance.md` 참조. 핵심:

- BASE_URL_MAP refactor 후 회귀 0 (선행 6 SPEC 의 367 단위 + 12 e2e 모두 PASS)
- `tools/list` 카운트 44 → 48 (KorPetTourService2 4 도구 추가)
- `kto_pet_*` prefix 도구 정확히 4 개
- `areaBasedList2(areaCode='1')` → totalCount=62 (서울 pet-friendly)
- `locationBasedList2(서울시청 20km)` → totalCount=75
- `searchKeyword2(keyword='카페')` → totalCount=19 pet-friendly 카페
- `petTourSyncList2({})` → totalCount=10167 (전체 pet 데이터셋)
- `locationBasedList2` 좌표 누락 시 MCP `-32602` 즉시 반환
- `searchKeyword2` keyword 누락 시 MCP `-32602` 즉시 반환
- 단위 테스트 커버리지 ≥ 85%

---

## 7. 참고

- `research.md` — API 개요, 13 오퍼레이션 카탈로그 (4 노출 + 9 미노출 분류 +
  사유), 검증된 totalCount, 응답 entity 비교, R1 정책 확장 근거,
  SPEC-KTO-001 R7 해소 검증 결과.
- `plan.md` — 5 단계 Phase 분해 및 기술 결정.
- `acceptance.md` — Given / When / Then 시나리오.
- `spec-compact.md` — 압축본.
