# Research: SPEC-KTO-002 (KTO MCP 서버 2차 이터레이션 — 무장애 여행 정보)

## 조사 목적

한국관광공사(KTO) 무장애 여행 정보 조회 API(`KorWithService2`, data.go.kr 공개 ID 15101897)를
NestJS 11 기반 MCP 서버에 추가 통합하기 위한 사전 조사. 본 문서는 외부 API의 인터페이스
중 SPEC-KTO-001 (KorService2) 와 다른 부분만 집중적으로 정리하고, 동일한 부분은
`SPEC-KTO-001/research.md` 를 참조한다.

본 SPEC은 2차 이터레이션이며, SPEC-KTO-001 에서 정의한 공용 인프라(`KtoHttpClient`,
`response-normalizer`, transport 어댑터, `kto-error`, `tool-registry`) 를 100% 재사용한다.

---

## 1. 외부 API 개요 (SPEC-KTO-001 와의 차이점만)

### 1.1 발급처 및 API ID

- **발급기관**: 한국관광공사 (KTO)
- **공급 플랫폼**: 공공데이터포털 (data.go.kr)
- **공개 API ID**: 15101897 (SPEC-KTO-001 은 15101578)
- **공식 카탈로그 URL**: https://www.data.go.kr/data/15101897/openapi.do
- **서비스 계열 식별자**: `B551011/KorWithService2`

### 1.2 Base URL

```
http://apis.data.go.kr/B551011/KorWithService2/
```

호스트(`apis.data.go.kr/B551011`) 는 KorService2 와 동일하며, **서비스 path 만 `KorWithService2`** 로
변경된다. 즉 `BASE_URL_MAP` 의 항목 한 줄 추가로 클라이언트 본체를 변경 없이 흡수 가능하다.

### 1.3 다국어 변체 존재 여부

[ASSUMED — verify against KTO guide PDF] KTO 표준 명명 규칙에 따르면 무장애 서비스 역시
`EngWithService2`, `JpnWithService2` 등 다국어 변체가 존재할 가능성이 있으나, data.go.kr 카탈로그
페이지(15101897) 본문에는 국문(`KorWithService2`) 만 명시되어 있다.

본 SPEC 은 **`KorWithService2` 단일 변체만 다루며**, 다국어 무장애 변체는 차기 이터레이션의 별도 SPEC
후보로 보류한다 (`/.moai/project/product.md` 향후 로드맵의 "다국어 지원 확대" 섹션 참조).

---

## 2. 인증 방식 및 공통 파라미터

SPEC-KTO-001 §2, §3 와 **완전히 동일**. 동일한 `serviceKey` 발급분이 모든 KTO B551011 서비스
(`KorService2`, `KorWithService2`, ...) 에 그대로 동작한다. 환경변수 `KTO_SERVICE_KEY` 재사용,
공통 파라미터 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json` 동일.

→ `KtoHttpClient` 의 공통 파라미터 자동 주입 로직, 서비스 키 인코딩 정책, 게이트웨이 오류 코드 매핑은
변경 없음.

---

## 3. 오퍼레이션 카탈로그

### 3.1 카탈로그 출처와 [ASSUMED] 정책

data.go.kr 카탈로그 페이지(15101897) 본문에는 무장애 여행 정보 API 가 **"13개 데이터 유형"** 으로
약 6만 건의 콘텐츠를 제공한다고 명시되어 있다. WebFetch 시점에 Swagger UI 직접 접근이 불가했으므로,
정확한 오퍼레이션 명·파라미터는 KorService2 와의 표준 명명 규칙(`{operationName}2`) 및 KTO 가이드 PDF 검토
시점에 최종 확정한다.

본 research 문서는 KorService2 의 15개 오퍼레이션 중 무장애 도메인에 의미가 있는 항목 + 무장애 고유
오퍼레이션을 합한 카탈로그 추정치를 제시한다. 모든 항목에 `[ASSUMED — verify against KTO guide PDF]`
마커를 부여하고, RUN Phase 첫 통합 테스트(실 키 호출) 에서 200 응답 여부로 검증한다.

### 3.2 KorService2 와의 공통·차이 요약

| 카테고리 | KorService2 (SPEC-KTO-001) | KorWithService2 (본 SPEC) | 차이 |
|----------|----------------------------|----------------------------|------|
| 코드 조회 | areaCode2, categoryCode2, ldongCode2, lclsSystmCode2 | 동일 셋 존재 추정 | 응답 동일(코드는 언어·도메인 무관 공통 자원) |
| 목록 조회 | areaBasedList2, areaBasedSyncList2, locationBasedList2, searchKeyword2, searchFestival2, searchStay2 | 동일 셋 존재 추정 | 응답 item 에 무장애 필드(아래 §4) 가 추가로 채워짐 |
| 상세 조회 | detailCommon2, detailIntro2, detailInfo2, detailImage2 | 동일 셋 존재 추정 | 응답 동일 또는 일부 무장애 메타 추가 |
| 무장애 고유 | (없음) | **detailWithTour2** | KorWithService2 의 핵심 오퍼레이션. contentId 기준 무장애 시설 상세 |
| 반려동물 | detailPetTour2 | (해당 없음) | KorService2 측 도메인 |

### 3.3 추정 오퍼레이션 목록 (모두 [ASSUMED — verify against KTO guide PDF])

[ASSUMED] **코드/메타데이터 조회 (4)**

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) |
|------------|--------|------------------------|
| `areaCode2` | 지역 코드 조회 | `areaCode?` |
| `categoryCode2` | 서비스 분류 코드 조회 | `cat1?`, `cat2?`, `cat3?`, `contentTypeId?` |
| `ldongCode2` | 법정동 코드 조회 | `lDongRegnCd?`, `lDongSignguCd?` |
| `lclsSystmCode2` | 분류체계 코드 조회 | `lclsSystm1?`, `lclsSystm2?`, `lclsSystm3?` |

[ASSUMED] **목록 조회 (5~6)**

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) |
|------------|--------|------------------------|
| `areaBasedList2` | 지역기반 무장애 관광정보 목록 | `arrange?`, `contentTypeId?`, `areaCode?`, `sigunguCode?`, `cat1?`, `cat2?`, `cat3?`, `modifiedtime?` |
| `locationBasedList2` | 위치기반 무장애 정보 목록 | `mapX`, `mapY`, `radius`(최대 20000m), `contentTypeId?`, `arrange?` |
| `searchKeyword2` | 키워드 검색 | `keyword`, `contentTypeId?`, `areaCode?`, `cat1?`, `cat2?`, `cat3?`, `arrange?` |
| `searchFestival2` | 무장애 행사정보 검색 | `eventStartDate`(YYYYMMDD, 필수), `eventEndDate?`, `areaCode?`, `sigunguCode?` |
| `searchStay2` | 무장애 숙박정보 검색 | `areaCode?`, `sigunguCode?`, `arrange?` |
| `areaBasedSyncList2` | 동기화 목록 [LOWER CONFIDENCE] | `showflag?`, `arrange?`, `contentTypeId?`, `areaCode?`, `modifiedtime?` |

> data.go.kr 본문의 "13개 데이터 유형" 표현이 코드 4 + 목록 6 + 상세 5 = 15 보다 작은 것을 시사하므로,
> `areaBasedSyncList2` 와 같이 KorService2 고유 오퍼레이션이 무장애 측에는 미존재할 가능성이 있다.
> RUN Phase 통합 테스트에서 404/30 코드 발생 시 도구 비활성화한다.

[ASSUMED] **상세 조회 (4~5)**

| 오퍼레이션 | 한글명 | 핵심 파라미터(공통 외) | 비고 |
|------------|--------|------------------------|------|
| `detailCommon2` | 공통정보 상세 | `contentId`(필수) | KorService2 와 동일 응답 구조 |
| `detailIntro2` | 소개 정보 | `contentId`, `contentTypeId` | contentTypeId 별 필드 상이 |
| `detailInfo2` | 반복 상세정보 | `contentId`, `contentTypeId` | 반복 행 배열 |
| `detailImage2` | 이미지 정보 | `contentId`, `imageYN?` | 동일 |
| `detailWithTour2` | **무장애 정보 상세** | `contentId`(필수) | KorWithService2 고유. 무장애 시설 메타 |

### 3.4 추정 합계

코드 4 + 목록 5~6 + 상세 5 = **14~15개**. 본 SPEC 은 보수적으로 **최대 15개** 도구를 등록 가능 상한으로
잡고, RUN Phase 첫 통합 테스트에서 30 (서비스 키 미등록) 또는 404 응답이 나오는 오퍼레이션은
도구 등록에서 제외한다. 실제 등록 도구 수는 plan.md `Phase 5: e2e 검증` 의 산출물로 확정된다.

---

## 4. 무장애 특화 응답 필드

### 4.1 응답 필드 배경

[ASSUMED — verify against KTO guide PDF] 무장애 서비스의 핵심 부가가치는 일반 관광정보 응답에 더해
**시설별 무장애 접근성 메타데이터**를 함께 제공하는 점이다. KTO 가이드는 contentTypeId 별로 적용 가능한
무장애 항목 셋을 다르게 정의한다(예: 관광지 12 / 숙박 32 / 음식점 39).

### 4.2 detailWithTour2 응답 핵심 필드 (추정)

KTO 가이드 PDF 기반으로 추정되는 대표 무장애 메타 필드:

| 필드명 | 의미 | 비고 |
|--------|------|------|
| `wheelchair` | 휠체어 대여 여부 / 휠체어 접근 가능 동선 안내 | Y/N 또는 텍스트 설명 |
| `exit` | 주출입구 접근성 (단차·경사·자동문) | 텍스트 |
| `elevator` | 엘리베이터 유무 / 휠체어 접근 가능 여부 | Y/N + 보충 |
| `parking` | 장애인 전용 주차 공간 | 면 수 또는 Y/N |
| `restroom` | 장애인 화장실 유무 | Y/N + 위치 |
| `guidesystem` | 안내 시스템 (인포메이션, 점자 안내도 등) | 텍스트 |
| `signguide` | 수어 안내 | Y/N |
| `videoguide` | 영상 안내 / 자막 제공 | Y/N |
| `audioguide` | 음성 안내 / 오디오 가이드 | Y/N |
| `braileblock` | 점자 블록 | Y/N (필드명 KTO 표기 그대로 — `braileblock` 오타 가능성 있음) |
| `helpdog` | 보조견 동반 가능 여부 | Y/N |
| `stroller` | 유모차 대여 여부 (보조 정보) | Y/N |
| `ticketoffice` | 매표소 휠체어 접근성 | 텍스트 |
| `route` | 휠체어 동선 안내 | 텍스트 |
| `publictransport` | 대중교통 접근성 | 텍스트 |

> [ASSUMED — verify] 위 필드 정확한 명명·개수·필수 여부는 KTO 가이드 PDF 표 기준으로 확정한다.
> RUN Phase 에서 응답 필드명을 그대로 보존하며, **KTO 원형 보존 정책**(SPEC-KTO-001 Exclusion 5) 을 동일하게 적용한다.

### 4.3 areaBasedList2 / locationBasedList2 / searchKeyword2 의 응답 차이

[ASSUMED] 목록 조회 응답의 item 단위는 KorService2 와 동일한 베이스 필드(`contentid`, `title`, `addr1`, `mapx`,
`mapy`, `firstimage`, `cat1` 등) 를 가진다. 단 무장애 도메인 콘텐츠만 포함되며, 일부 응답에서 무장애 요약
플래그(`barrierfree`, `wheelchair` 등) 가 함께 채워질 수 있다. detailWithTour2 가 권위 있는 정보원이며,
목록 응답의 무장애 플래그는 보조 인덱스 용도로 본다.

---

## 5. 응답 포맷 및 에러 처리

SPEC-KTO-001 §5 와 **완전히 동일**:

- 정상 응답: `response.body.items.item` (1건일 때 단일 객체 → 배열 정규화 필요)
- 게이트웨이 오류: `OpenAPI_ServiceResponse` XML
- reason code 표준 (00 / 03 / 22 / 30 등)

→ `KtoHttpClient.parseGatewayError()`, `normalizeItems()`, `KtoApiError` 클래스 변경 없이 재사용.
→ 5xx 재시도 정책(`RETRY_CONFIG`) 동일 적용.

---

## 6. MCP 매핑 패턴

SPEC-KTO-001 §8 과 **동일한 1:1 매핑 패턴**.

| 항목 | 정책 |
|------|------|
| 도구 이름 prefix | `kto_barrier_free_*` (예: `kto_barrier_free_areaBasedList2`, `kto_barrier_free_detailWithTour2`) |
| 입력 스키마 | 오퍼레이션별 DTO + class-validator → JSON Schema 자동 변환 (기존 `tool-registry.ts` 재사용) |
| 출력 | 정규화된 JSON. 무장애 응답 필드명은 KTO 원형 유지 |
| 등록 위치 | `BarrierFreeTourInfoModule` → `app.module.ts` import → `tool-registry.registerAll()` 일괄 등록 |

이름 prefix 가 `kto_korean_*` (KorService2) 와 충돌하지 않으므로 도구 카탈로그 합산 시 중복 없음.

---

## 7. 코드 베이스 재사용 영향도

### 7.1 변경 없이 재사용 가능 (100%)

- `src/kto/kto-http.client.ts` — `service` 파라미터로 `KorWithService2` 를 받기만 하면 동작
- `src/kto/common/response-normalizer.ts` — 응답 구조 동일
- `src/kto/common/kto-error.ts` — 에러 모델 동일
- `src/kto/common/types.ts` — `KtoListResponse<T>`, `KtoRawResponse<T>` 동일
- `src/mcp/tool-registry.ts` — DTO → Zod/JSON Schema 변환 로직 동일
- `src/mcp/transports/*` — transport 3종 변경 없음
- `src/env.ts` — `KTO_SERVICE_KEY` 재사용

### 7.2 1줄 수정

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `KorWithService2` 항목 추가 (Plan §1.3 참조)

### 7.3 신규 작성

- `src/kto/barrier-free-tour-info/` 모듈 일체 (service, tools, dto, module, spec)
- `src/app.module.ts` — `BarrierFreeTourInfoModule` import 1줄 추가

→ 신규 추상화·신규 라이브러리 도입 없음. 본 SPEC 은 패턴 복제 SPEC 이다.

---

## 8. 구현 시 검증해야 할 미해결 항목

| 항목 | 사유 | 해소 시점 |
|------|------|-----------|
| `KorWithService2` 의 정확한 오퍼레이션 셋 (13개 추정) | Swagger 직접 접근 불가, KTO 가이드 PDF 미확보 | RUN Phase Phase 5 (실 키 통합 테스트) — 30/404 응답 발생 오퍼레이션은 도구 등록 제외 |
| `detailWithTour2` 의 정확한 응답 필드명 (`braileblock` 오타 가능성 등) | 위와 동일 | RUN Phase 첫 호출 응답 본문 검증 |
| 무장애 도메인의 다국어 변체(`EngWithService2` 등) 존재 여부 | 카탈로그 본문 미명시 | 차기 SPEC 후보로 보류 |
| 목록 응답에 무장애 요약 플래그가 포함되는지 (`barrierfree` 등) | 가이드 PDF 미확보 | RUN Phase 첫 통합 테스트 |
| `areaBasedSyncList2` 의 KorWithService2 측 존재 여부 | data.go.kr "13개" 표현이 시사하는 누락 가능성 | RUN Phase 통합 테스트 |

---

## 9. 외부 참고 자료

- 공공데이터포털 카탈로그 (대상): https://www.data.go.kr/data/15101897/openapi.do
- 공공데이터포털 카탈로그 (KorService2, 비교): https://www.data.go.kr/data/15101578/openapi.do
- KTO 통합 API 안내(한국관광콘텐츠랩): https://api.visitkorea.or.kr/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP 사양: https://modelcontextprotocol.io/specification
- SPEC-KTO-001 (참조 베이스라인): `.moai/specs/SPEC-KTO-001/spec.md`, `plan.md`, `research.md`, `acceptance.md`

---

Version: 0.1.0
Last Updated: 2026-05-09
Author: Seonho Kim
