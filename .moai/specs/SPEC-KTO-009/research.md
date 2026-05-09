# SPEC-KTO-009 — Research: 웰니스관광 정보 API (WellnessTursmService)

## 1. API 개요

- **API 식별자**: `data.go.kr` 서비스 ID 15144030 (한국관광공사 웰니스관광 정보)
- **공식 서비스 경로**: `B551011/WellnessTursmService`
- **버전 표기**: `V` 접미사 없음 (KorService2/AreaBasedSyncList2 와 다른 명명 정책)
- **명명 일관성**: 동일한 접미사-부재 정책을 사용하는 SPEC-KTO-008 `MdclTursmService` (의료관광)와 같은 KTO 6번째 패턴 계열에 속함
- **공식 약어 보존**: `Tursm` 은 KTO 가 사용하는 정식 축약형이므로 BASE_URL_MAP 키와 모듈/타입 명명에 그대로 채택한다 (`MdclTursm` 과 동일한 정책)

## 2. 도메인 컨텍스트 — 웰니스관광

KTO 웰니스관광 카탈로그는 한국 내 웰니스 (스파, 온천, 한방, 명상, 자연치유) 관광 자원을 단일 도메인으로 묶어 제공한다. 의료관광과 달리 **한국어가 기본 언어**이며 (의료관광은 ENG default), 결과 데이터는 일반 한국 관광객과 인바운드 외국인 모두를 대상으로 한다.

대표 데이터 샘플 (실 API 호출):
- areaBasedList(langDivCd=KOR) → totalCount = **174**
- locationBasedList(서울 좌표, radius=20000m) → 9 hits (`dist` 필드 포함)
- searchKeyword(keyword="스파") → 31 hits
- wellnessTursmSyncList(langDivCd=KOR) → totalCount = **201** (sync 누적이 areaBased 보다 큼; `showflag=0` 항목 포함)
- detailImage(contentId=2994116) → 7 image rows (`imgname`, `serialnum`)

## 3. Operation 카탈로그 (9 total, 8 노출, 1 SKIP)

| # | Operation | 노출 | 비고 |
|---|-----------|------|------|
| 1 | `areaBasedList` | YES | 지역기반 목록. 표준 페이지네이션. |
| 2 | `locationBasedList` | YES | 위치 기반. `mapX`, `mapY`, `radius` 필수. 응답에 `dist` 포함. |
| 3 | `searchKeyword` | YES | 키워드 검색. `keyword` 필수. |
| 4 | `wellnessTursmSyncList` | YES | sync 목록. `showflag`, `oldContentId` 필드. 본 서비스 고유. |
| 5 | `detailCommon` | YES | 공통 상세. KorService2 `detailCommon2` 와 응답 shape 다름 → 별도 노출. |
| 6 | `detailIntro` | YES | 소개 상세. `contentId`, `contentTypeId`, `langDivCd` 모두 필수. |
| 7 | `detailInfo` | YES | 반복 상세. `contentId`, `contentTypeId`, `langDivCd` 모두 필수. |
| 8 | `detailImage` | YES | 이미지 목록. `contentId`, `langDivCd` 필수. |
| 9 | `ldongCode` | **SKIP** | KorService2 `ldongCode2` 와 응답/시맨틱 동일 → R1 dedup 정책 적용 (SPEC-KTO-007/008 과 동일 결정). |

## 4. 필수 파라미터 — `langDivCd`

본 서비스는 KTO 6번째 패턴 (langDivCd 패턴)의 **두 번째 적용 사례**이다 (첫 번째는 SPEC-KTO-008 의료관광).

- `langDivCd` 는 9개 operation 전부에서 필수
- 빈 문자열 / 임의 비표준 값 (e.g. `"FOO"`) 도 422 반환 없이 통과 — KTO 측 검증이 lenient 함
- 권장 사용 값: `KOR`, `ENG`, `JPN`, `CHS`, `CHT`, `GER`, `FRE`, `SPN`, `RUS`
- `numOfRows`, `pageNo`, `MobileOS`, `MobileApp`, `_type=json` 은 KtoHttpClient 가 공통 처리

의료관광과 비교 (도메인 정책 차이):
- 의료관광: 인바운드 외국인 환자 타겟 → ENG 가 기본 보급 언어
- 웰니스: 국내 + 인바운드 → **KOR 가 기본 보급 언어** (e.g. 샘플 title "가곡유황온천&스파")

## 5. 응답 엔티티 — `WellnessTursmItem`

`response.body.items.item[]` 표준 envelope. KtoHttpClient 의 response-normalizer 재사용 가능.

### 5.1 필드 카탈로그 (camelCase, MdclTursmItem 과 유사 + 일부 추가)

공통 식별자 / 텍스트:
- `contentId: string`
- `contentTypeId: string`
- `title: string` (한국어 기본 — "가곡유황온천&스파" 등)

주소 / 우편 / 연락처:
- `baseAddr: string`
- `detailAddr: string`
- `zipCd: string`
- `tel: string`
- `telname: string` (의료관광 대비 추가됨)
- `homepage: string` (의료관광 대비 추가됨; HTML 문자열이 들어올 수 있음)

좌표 / 지도:
- `mapX: string` (longitude)
- `mapY: string` (latitude)
- `mlevel: string`
- `dist?: string` (locationBasedList 응답에서만 포함)

이미지 / 저작권:
- `orgImage: string` (원본 URL)
- `thumbImage: string` (썸네일 URL)
- `cpyrhtDivCd: string` (저작권 구분 코드)

타임스탬프 / 언어:
- `regDt: string`
- `mdfcnDt: string`
- `langDivCd: string`

Sync 응답 추가 필드 (`wellnessTursmSyncList` 전용):
- `showflag: string` (0 = hidden / 1 = visible)
- `oldContentId?: string`

DetailImage 응답 추가 필드:
- `imgname: string`
- `serialnum: string`

확장성:
- 인덱스 시그니처 `[key: string]: unknown` 포함 (KTO 의 비공식 추가 필드 대응)

### 5.2 의료관광(MdclTursmItem) 와의 비교

| 항목 | MdclTursmItem (의료) | WellnessTursmItem (웰니스) |
|------|------------------------|------------------------------|
| 기본 언어 | ENG | KOR |
| `title` 예시 | "Eyereum Eye Clinic" | "가곡유황온천&스파" |
| 공통 필드 | contentId, contentTypeId, baseAddr, detailAddr, zipCd, tel, mapX/Y, regDt, mdfcnDt, langDivCd | (동일) |
| 추가 필드 (웰니스만) | — | `telname`, `homepage`, `dist`, `imgname`, `serialnum` (응답별) |
| Sync 의미 | 의료기관 인증 갱신 | 웰니스 시설 등록/표시 변경 |

도메인 분리 원칙: 두 타입은 구조적으로 75% 이상 중첩되지만, 의료 vs 웰니스의 비즈니스 의미가 다르므로 **별개의 interface 로 정의**한다 (재사용 금지). 이는 SPEC-KTO-007/008 에서 확립한 도메인-단위 타입 분리 정책의 연장이다.

## 6. detailIntro / detailInfo 의 contentTypeId 요구사항

`detailIntro`, `detailInfo` 두 operation 은 KorService2 의 `detailIntro2`/`detailInfo2` 패턴과 동일하게 `contentTypeId` 를 필수로 요구한다 (관광 타입에 따라 추출 schema 가 달라지기 때문).

KTO 표준 contentTypeId 값:
- 12 = 관광지, 14 = 문화시설, 15 = 축제공연행사, 25 = 여행코스
- 28 = 레포츠, 32 = 숙박, 38 = 쇼핑, 39 = 음식점

DTO 에서는 enum 강제하지 않고 `string` 으로 받되, 누락 시 `-32602 invalid params` 로 차단한다.

## 7. 에러 / Envelope 형태

- **정상 응답**: 표준 envelope (`response.header.resultCode`, `response.body.items.item[]`)
- **에러 응답**: PhotoGalleryService1 (SPEC-KTO-006) 에서 발견된 **flat error envelope** 와 동일한 변형 가능 — `KtoHttpClient` 가 이미 두 envelope 형태를 모두 정규화하므로 추가 작업 불필요

## 8. 인프라 재사용 매트릭스 (main 브랜치 fa0a4d0 기준, 55 도구 머지 완료)

| 컴포넌트 | 위치 | 재사용 방식 |
|----------|------|--------------|
| `KtoHttpClient` | `src/kto/kto-http.client.ts` | 그대로 주입 (BASE_URL_MAP 추가만 필요) |
| `BASE_URL_MAP` | `src/kto/common/constants.ts` | `WellnessTursmService` 키 1줄 추가 |
| Response normalizer | `src/kto/common/response-normalizer.ts` | 그대로 사용 (item[] 정규화) |
| Tool registry pattern | `src/kto/common/tool-registry.ts` | `ToolRegistry[]` 9th entry 등록 |
| Pagination DTO 베이스 | `src/kto/common/dto/*` | DTO 의 `pageNo`/`numOfRows` 공통화 패턴 답습 |
| MdclTursm 모듈 구조 | `src/kto/medical-tourism/` | **참고용** — 동일한 8-DTO + 1-types + 1-service + 1-tools 구성 그대로 복제 |

## 9. KTO 6 패턴 분류 내 위치

SPEC-KTO-008 에서 확립한 KTO 6 패턴 분류:

1. KorService2 (V2 suffix, 다국어 path)
2. AreaBasedSyncList2 (V2 suffix, sync 전용)
3. KorPetTourService (펫 도메인)
4. GoCamping (캠핑 도메인, 비표준 envelope)
5. PhotoGalleryService1 (V1 suffix, flat-error envelope)
6. **langDivCd 패턴** — 단일 path, langDivCd 파라미터로 다국어 분기
   - 6-1: SPEC-KTO-008 `MdclTursmService` (의료, ENG 기본)
   - 6-2: **SPEC-KTO-009 `WellnessTursmService` (웰니스, KOR 기본)** ← 본 SPEC

본 SPEC 은 신규 패턴을 도입하지 않으며, 6번째 패턴의 두 번째 적용 사례로서 **재현성 검증**의 의미를 갖는다.

## 10. 도구 카운트 변화

- 머지 전 (main 기준): **55 tools** (SPEC-KTO-001~008 누적)
- 머지 후 (SPEC-KTO-009 적용): **55 + 8 = 63 tools**
- 9개 operation 중 `ldongCode` 미노출 → 8개 도구

## 11. 미해결 항목 / 가정 없음

이 SPEC 의 모든 사실 (operation 목록, totalCount, 필드명, 필수 파라미터, error envelope 형태) 은 실 KTO API 호출 + Swagger 2.0 스펙으로 사전 검증되었다. `[ASSUMED]` 마커가 적용되는 항목 없음.
