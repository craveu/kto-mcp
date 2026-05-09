---
id: SPEC-KTO-008
version: 1.0.0
status: completed
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-008: KTO MCP 서버 8차 이터레이션 (의료관광 정보 MdclTursmService)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료, 실 키 스모크 검증 통과, main 머지 완료 |
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. 한국관광공사 의료관광 정보 API (`MdclTursmService`, data.go.kr ID 15143913) 8 오퍼레이션 중 7을 MCP 도구로 매핑하는 8차 이터레이션 정의. |

---

## Overview

SPEC-KTO-001 ~ SPEC-KTO-007 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에
한국관광공사 **의료관광 정보 API (`MdclTursmService`, data.go.kr ID 15143913)** 를
추가 통합한다. 본 데이터셋은 KTO 가 외국인 의료관광객 유치 정책의 일환으로
큐레이팅한 의료관광 가능 의료기관 정보 (성형외과·치과·피부과·한의원 등) 로,
응답이 영어 기본 + 한국어 병기 (예: `"1stbutton Rhinoplasty clinic (첫단추의원)"`)
로 구성된다.

본 SPEC 은 선행 7 SPEC 의 공용 인프라 (`KtoHttpClient`, `response-normalizer`,
`tool-registry`, transport 3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 를
변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/medical-tourism/` 를 추가**
하고 `BASE_URL_MAP` 에 `MdclTursmService` 항목 1줄을 추가한다.

본 SPEC 은 MdclTursmService 의 8 오퍼레이션 중 **7 만 노출** 한다:

- **노출 7종**: `areaBasedList`, `locationBasedList`, `searchKeyword`,
  `mdclTursmSyncList` (NEW — 의료관광 전용 sync), `detailMdclTursm` (NEW —
  의료관광 전용 상세), `detailCommon` (KorService2 의 `detailCommon2` 와 응답
  스키마 다름), `detailIntro` (KorService2 의 `detailIntro2` 와 응답 스키마
  다름).
- **미노출 1종**: `ldongCode` (KorService2 의 `kto_korean_ldongCode2` 와 동일
  응답 추정, R1 정책 적용).

본 SPEC 은 KTO API 의 **6번째 service path 패턴** (`langDivCd` 파라미터 +
lang fluid) 을 흡수한다 — 단일 path + 다국어를 파라미터로 처리하지만, 응답
lang 은 server-normalized (ENG 기본). Odii 의 `langCode` 패턴과 third-letter
difference (`langCode` vs `langDivCd`) 로 구분된다. 모든 7 노출 도구에서
`langDivCd` 가 KTO 게이트웨이 강제 required 이며, DTO 에 required 필드로 추가
한다.

도구 수: 7. 전체 도구 카운트: 48 → 55. 신규 추상화 0. 신규 다국어 패턴
1 (`langDivCd` 파라미터 — 6번째 패턴 흡수).

---

## 1. 사용자 시나리오

| Persona | Scenario |
|---------|----------|
| 외국인 의료관광객 / LLM 어시스턴트 | "Find rhinoplasty clinics in Seoul" → MCP 클라이언트가 `kto_medical_searchKeyword({ langDivCd: 'ENG', keyword: 'Rhinoplasty' })` 호출 → 매칭 의료기관 응답 → 사용자에게 영어 의료기관명 + 주소 + 연락처 안내. |
| 의료관광 정보 검색 사용자 / LLM 어시스턴트 | "강남 근처 5km 내 치과 의료관광 의료기관" → MCP 클라이언트가 `kto_medical_locationBasedList({ langDivCd: 'KOR', mapX: 127.0276, mapY: 37.4979, radius: 5000 })` 호출 → 매칭 records 반환 → 거리 정렬·필터링하여 사용자 안내. |
| 의료기관 상세 조회 사용자 / LLM 어시스턴트 | "특정 의료기관 (contentId=1234) 의 진료과목·홈페이지·연락처 알려줘" → MCP 클라이언트가 `kto_medical_detailMdclTursm({ langDivCd: 'ENG', contentId: '1234' })` 호출 → 의료관광 전용 메타 (`treatmentName`, `medicalDept`, `infoCenter`, `homepage`) 응답. |
| 데이터 동기화 작업자 / 외부 시스템 | "KTO 의료관광 컨텐츠 전체 카탈로그를 자체 DB 와 동기화" → MCP 클라이언트가 `kto_medical_mdclTursmSyncList({ langDivCd: 'KOR' })` 호출 → 페이지네이션 반복 → `showflag` / `oldContentId` 필드로 active/deleted/병합 분기 처리. |
| 시스템 운영자 | KTO MdclTursmService 가 5xx 에러를 반환하면 MCP 서버가 자동 재시도 (max 3, base 200ms, factor 2.0, jitter ±20%) 후 그래도 실패하면 MCP 클라이언트로 표준 에러 envelope 전달. |

---

## 2. 요구사항 (5 EARS modules)

본 SPEC 은 EARS 5 모듈 max 정책에 따라 다음 5 모듈로 구성된다.

### 2.1 REQ-KTO8-* (Ubiquitous — 도구 노출 / 인프라 재사용 / typed entity)

- **REQ-KTO8-001**: The system shall expose 의료관광 정보 (`MdclTursmService`)
  API 의 7 오퍼레이션 (`areaBasedList`, `locationBasedList`, `searchKeyword`,
  `mdclTursmSyncList`, `detailMdclTursm`, `detailCommon`, `detailIntro`) 을
  각각 MCP 도구 `kto_medical_areaBasedList`, `kto_medical_locationBasedList`,
  `kto_medical_searchKeyword`, `kto_medical_mdclTursmSyncList`,
  `kto_medical_detailMdclTursm`, `kto_medical_detailCommon`,
  `kto_medical_detailIntro` 로 노출한다. 나머지 1 (`ldongCode`) 은 KorService2
  측 `kto_korean_ldongCode2` 와 동일 응답 추정이므로 본 SPEC 에서 노출하지
  않는다 (R1 중복 회피 정책 적용).
- **REQ-KTO8-002**: The system shall reuse SPEC-KTO-001 ~ SPEC-KTO-007 의 공용
  인프라 (`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport
  3종, 에러 모델, 재시도 정책 `RETRY_CONFIG`, `BASE_URL_MAP`, `COMMON_PARAMS`)
  를 변경 없이 100% 재사용한다.
- **REQ-KTO8-003**: The system shall expose 응답 entity 1 종 — `MdclTursmItem`
  (의료관광 전용 스키마, camelCase 명명 17 필드 + sync 전용 2 필드 + 인덱스
  시그니처) — 을 typed interface 로 정의하고 export 한다. KTO 원형 필드명
  (`contentId`, `mapX`, `mapY`, `regDt`, `mdfcnDt`, `baseAddr`, `detailAddr`
  등 camelCase) 은 그대로 보존한다. KorService2 family 의 `KoreanTourItem`
  (lowercase 명명) 과는 별도 entity — 응답 스키마 도메인 분리.

### 2.2 REQ-EVT-* (Event-driven — MCP 도구 호출 → KTO 응답)

- **REQ-EVT-001**: When MCP 클라이언트가 `tools/call` 로 7 노출 도구
  (`kto_medical_areaBasedList`, `kto_medical_locationBasedList`,
  `kto_medical_searchKeyword`, `kto_medical_mdclTursmSyncList`,
  `kto_medical_detailMdclTursm`, `kto_medical_detailCommon`,
  `kto_medical_detailIntro`) 중 하나를 호출하면, the system shall (a) 입력 DTO
  검증 통과 후 (b) `KtoHttpClient.fetch(serviceName='MdclTursmService',
  operation, params)` 를 통해 KTO API 호출 (모든 호출에 `langDivCd` 파라미터
  포함), (c) `response-normalizer` 적용, (d) 정규화된 `items` 배열과 `totalCount`,
  `numOfRows`, `pageNo` 를 포함한 MCP 응답을 반환한다. KTO 원형 필드 (영어 +
  한국어 병기 title, `orgImage` URL, `baseAddr` 영문 주소 등) 는 그대로 전달
  한다 (다운로드/파싱/sanitization/번역 미적용).

### 2.3 REQ-STATE-* (State-driven — 5xx 재시도)

- **REQ-STATE-001**: While MdclTursmService API 가 5xx HTTP 상태 또는 네트워크
  에러 (ECONNRESET, ETIMEDOUT 등) 를 반환하면, the system shall `RETRY_CONFIG`
  (max 3 retries, base 200ms, factor 2.0, jitter ±20%) 를 그대로 적용하여 자동
  재시도한다. 재시도 후에도 실패하면 표준 KTO 에러 envelope (PhotoGalleryService1
  flat envelope 동일) 으로 변환하여 MCP 클라이언트에 전달한다.

### 2.4 REQ-OPT-* (Optional — BASE_URL_MAP 일반화 확장)

- **REQ-OPT-001**: Where `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 객체가
  존재하는 경우, the system shall `MdclTursmService:
  'http://apis.data.go.kr/B551011/MdclTursmService'` 1줄을 추가하고, `@MX:SPEC`
  라인에 `SPEC-KTO-008 REQ-OPT-001` 항목을 추가한다. `@MX:NOTE` prose 는
  **5 패턴 → 6 패턴** 으로 갱신 — `MdclTursmService` 가 도입하는 6번째 패턴
  (`langDivCd` 파라미터 + lang fluid, Odii 의 `langCode` 패턴과 third-letter
  difference) 을 명시한다. `KtoServiceName` union 타입은 자동 추론으로
  `'MdclTursmService'` 를 포함한다.

### 2.5 REQ-UNW-* (Unwanted — 잘못된 입력 차단)

- **REQ-UNW-001**: If MCP 클라이언트가 다음 잘못된 입력으로 도구 호출 시,
  then the system shall class-validator 기반 DTO 검증 단계에서 즉시 차단하고
  MCP `-32602` (Invalid params) 에러를 반환한다 (KTO API 호출 발생 안 함):
  - **모든 7 도구**: `langDivCd` 누락 또는 빈 문자열인 경우 (KTO 게이트웨이
    강제 required).
  - `kto_medical_locationBasedList` 호출 시 `mapX`, `mapY`, `radius` 중 하나
    라도 누락 또는 number 가 아닌 경우.
  - `kto_medical_searchKeyword` 호출 시 `keyword` 누락 또는 빈 문자열인 경우.
  - `kto_medical_detailMdclTursm`, `kto_medical_detailCommon`,
    `kto_medical_detailIntro` 호출 시 `contentId` 누락 또는 빈 문자열인 경우.
  - 7 도구 모두 `numOfRows`, `pageNo` 가 잘못된 값 (`numOfRows=0`,
    `numOfRows=101`, `numOfRows="abc"`, `pageNo=0`) 인 경우.

---

## 3. 영향받는 파일 (Affected Files)

### 3.1 Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `MdclTursmService:
  'http://apis.data.go.kr/B551011/MdclTursmService'` 1줄 추가, `@MX:SPEC` 라인
  에 `SPEC-KTO-008 REQ-OPT-001` 추가, `@MX:NOTE` prose 갱신 (5 패턴 → 6 패턴
  — `langDivCd` 파라미터 패턴 명시).
- `src/app.module.ts` — `MedicalTourismModule` import 1줄 추가.
- `src/main.ts` — `medicalTourismService = app.get(MedicalTourismService)`
  라인 추가 + `registerAll()` registries 배열에 `{ tools:
  MEDICAL_TOURISM_TOOLS, service: medicalTourismService }` 1 항목 (registries
  8번째 항목) 추가.
- `test/kto.e2e-spec.ts` — 도구 카운트 assertion 48 → 55 갱신,
  MdclTursmService 시나리오 추가.

### 3.2 Created (`src/kto/medical-tourism/` 모듈 디렉토리)

```
src/kto/medical-tourism/
├── medical-tourism.module.ts
├── medical-tourism.service.ts
├── medical-tourism.tools.ts
├── types.ts                              # MdclTursmItem
├── medical-tourism.service.spec.ts
├── medical-tourism.tools.spec.ts
└── dto/
    ├── area-based-list.dto.ts            # MtAreaBasedListDto
    ├── location-based-list.dto.ts        # MtLocationBasedListDto
    ├── search-keyword.dto.ts             # MtSearchKeywordDto
    ├── mdcl-tursm-sync-list.dto.ts       # MtMdclTursmSyncListDto
    ├── detail-mdcl-tursm.dto.ts          # MtDetailMdclTursmDto
    ├── detail-common.dto.ts              # MtDetailCommonDto
    ├── detail-intro.dto.ts               # MtDetailIntroDto
    ├── index.ts
    └── dto.spec.ts                       # REQ-UNW-001 검증
```

### 3.3 NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,
audio-guide,durunubi,pet-tour}/**/*`.

---

## 4. 도구 명명 규약 (`kto_medical_*`)

### 4.1 도구 prefix 결정

선행 SPEC 의 prefix 패턴:

- SPEC-KTO-001 → `kto_korean_*`
- SPEC-KTO-002 → `kto_barrier_free_*`
- SPEC-KTO-003 → `kto_photo_*`
- SPEC-KTO-004 → `kto_camping_*`
- SPEC-KTO-005 → `kto_audio_*`
- SPEC-KTO-006 → `kto_durunubi_*`
- SPEC-KTO-007 → `kto_pet_*`
- **SPEC-KTO-008 → `kto_medical_*`** (NEW)

"medical" 는 의료관광 (medical tourism) 의 핵심 도메인 (외국인 대상 의료기관
정보) 의 짧고 명확한 영문 표기. 선행 SPEC 의 prefix 가 모두 영문 단어
(korean, barrier_free, photo, camping, audio, durunubi, pet) 로 구성되었으므로
본 SPEC 도 영문 단어 `medical` 을 채택한다.

### 4.2 도구 이름 형식

`kto_medical_<exactOpName>` (camelCase 보존, 선행 SPEC 동일):

- `kto_medical_areaBasedList` — 지역 기반 의료관광 목록 (전체 totalCount=336~337)
- `kto_medical_locationBasedList` — 위치 기반 의료관광 목록 (mapX/mapY/radius required)
- `kto_medical_searchKeyword` — 의료관광 키워드 검색 (keyword required)
- `kto_medical_mdclTursmSyncList` — 의료관광 전체 동기화 (NEW, MdclTursmService 고유)
- `kto_medical_detailMdclTursm` — 의료관광 전용 상세 (NEW, KorService2 family 에 없음)
- `kto_medical_detailCommon` — 의료관광 contentId 공통 정보 (KorService2 의 `detailCommon2` 와 응답 스키마 다름)
- `kto_medical_detailIntro` — 의료관광 소개 정보 (KorService2 의 `detailIntro2` 와 응답 스키마 다름)

### 4.3 `langDivCd` 파라미터 처리

모든 7 도구에서 `langDivCd` 가 required 입력이다 (KTO 게이트웨이 강제). DTO
정의:

- `langDivCd!: string` — `@IsNotEmpty()` + `@IsString()` (enum 미강제, KTO 가
  any string 수용)
- inputSchema description: `"의료관광 응답 언어 코드. 권장값: KOR, ENG, CHS, CHT, JPN. KTO 가 임의 문자열 수용 (server-normalized ENG 응답). default 'KOR' 권장."`

---

## 5. Exclusions (What NOT to Build)

본 SPEC 은 다음 항목을 의도적으로 out-of-scope 로 둔다:

1. **`ldongCode` 미노출 (R1 정책 적용)**: KTO 의 법정동 코드 체계는 일반관광·
   반려동물·의료관광 모두 동일하게 적용되는 행정 코드 사전이다. KorService2
   측 `kto_korean_ldongCode2` (SPEC-KTO-001 노출) 가 동일 응답을 반환할 것으로
   추정 — SPEC-KTO-002 가 도입한 R1 정책 적용. 의료관광 컨텐츠 의 법정동 코드
   조회는 `kto_korean_ldongCode2` 사용.
2. **의료관광 영문 → 한국어 자동 번역**: 응답의 영어 제목 + 한국어 병기 형식
   (예: `"1stbutton Rhinoplasty clinic (첫단추의원)"`) 은 KTO 원형 그대로
   전달한다. MCP 도구는 KTO 응답을 변형/번역/sanitization 하지 않는다 (단일
   책임 원칙). 추가 번역이 필요한 경우 LLM 클라이언트 측 책임.
3. **의료기관 평점·리뷰**: KTO API 가 의료기관 평점·환자 리뷰 데이터를 제공
   하지 않는다 — 본 데이터셋의 본질은 KTO 가 큐레이팅한 의료기관 메타정보.
   평점·리뷰는 KTO 외부 시스템 (예: HiraMed, Naver/Google Maps) 에서 조회.
4. **다국어 변체 별도 path**: MdclTursmService 는 `langDivCd` 파라미터로
   다국어를 처리한다 (6번째 패턴). KorService2 의 9 다국어 별도 path
   (KorService2/EngService2/JpnService2/ChsService2/...) 패턴은 본 SPEC 적용
   범위 외 — 단일 path + 파라미터 처리가 KTO 의 의료관광 API 설계 의도.
5. **`detailMdclTursm` 의료관광 전용 메타 필드 강제 typing**: 의료관광 전용
   메타 (`treatmentName`, `medicalDept`, `infoCenter`, `homepage` 등) 는
   `MdclTursmItem` 의 인덱스 시그니처가 흡수한다. 향후 KTO 가 추가 의료관광
   필드를 도입해도 별도 SPEC 변경 불필요.

---

## 6. 검증 기준 (요약)

상세 시나리오는 `acceptance.md` 참조. 핵심:

- BASE_URL_MAP refactor 후 회귀 0 (선행 7 SPEC 의 단위 + e2e 모두 PASS)
- `tools/list` 카운트 48 → 55 (MdclTursmService 7 도구 추가)
- `kto_medical_*` prefix 도구 정확히 7 개
- `areaBasedList(langDivCd='KOR')` → totalCount ≥ 300 (사전 검증값 336~337)
- `langDivCd` 누락 시 모든 7 도구에서 MCP `-32602` 즉시 반환
- `locationBasedList` 좌표 누락 시 MCP `-32602` 즉시 반환
- `searchKeyword` keyword 누락 시 MCP `-32602` 즉시 반환
- `detail*` 3 도구 contentId 누락 시 MCP `-32602` 즉시 반환
- `mdclTursmSyncList` 응답 record 의 `showflag` 또는 `oldContentId` 필드 보존
- 단위 테스트 커버리지 ≥ 85%

---

## 7. 참고

- `research.md` — API 개요 (15143913), 의료관광 컨텍스트 (외국인 대상 의료
  기관), 8 오퍼레이션 카탈로그 (7 노출 + 1 미노출 분류 + 사유), 검증된
  totalCount (336~337), 응답 entity 카탈로그 (camelCase 명명, KorService2 family
  와 차이 표), `langDivCd` 동작 (any value tolerated, server-normalized ENG),
  KTO 다국어 처리 6 패턴 정리, R1 정책 적용 근거, prefix `kto_medical_*` 채택
  근거.
- `plan.md` — 5 단계 Phase 분해 및 기술 결정.
- `acceptance.md` — Given / When / Then 시나리오 (10 시나리오).
- `spec-compact.md` — 압축본.
