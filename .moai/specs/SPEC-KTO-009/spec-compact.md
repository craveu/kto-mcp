# SPEC-KTO-009 — Compact Reference

## 한 줄 요약

KTO `B551011/WellnessTursmService` (data.go.kr 15144030) 의 9 operation 중 8개를 `kto_wellness_*` MCP 도구로 노출. SPEC-KTO-008 (의료관광) 과 동일한 langDivCd 패턴 (KTO 6번째 패턴) 의 두 번째 적용 사례. 도구 카운트 55 → 63. 기존 인프라 100% 재사용, 신규 추상화 0개.

## 핵심 EARS

- **REQ-KTO9-001..005 (Ubiquitous)**: HTTP transport / response normalizer / tool registry 재사용. KtoHttpClient 단일 인스턴스 의존성 주입. `WellnessTursmItem` 별개 타입 정의 (MdclTursmItem 재사용 금지). 도구 이름은 `kto_wellness_<exactOpName>`. `BASE_URL_MAP` 에 `WellnessTursmService` 키 1줄 추가.
- **REQ-EVT-001..004 (Event-driven)**: MCP 호출 → service 라우팅 → KTO 단일 path + langDivCd query. 표준 envelope 정규화. `dist`, `showflag`, `oldContentId` 필드 보존.
- **REQ-STATE-001..002 (State-driven)**: 5xx 시 KtoHttpClient 기존 재시도 정책 답습. flat error envelope 자동 정규화 (PhotoGalleryService1 호환).
- **REQ-OPT-001 (Optional)**: `BASE_URL_MAP` 일반화 — 단일 줄 추가만으로 등록 가능.
- **REQ-UNW-001..006 (Unwanted)**:
  - langDivCd 누락 → -32602 (8 도구 모두)
  - locationBasedList: mapX/mapY/radius 누락 → -32602
  - searchKeyword: keyword 누락 → -32602
  - detailIntro/detailInfo: contentId 또는 contentTypeId 누락 → -32602
  - detailCommon/detailImage: contentId 누락 → -32602
  - `kto_wellness_ldongCode` 노출 금지 (R1 dedup)

## Acceptance (≥ 9 시나리오)

| # | Given | When | Then |
|---|-------|------|------|
| S1 | BASE_URL_MAP 확장 | 1줄 추가 | 기존 8 키 무회귀 |
| S2 | WELLNESS_TOURISM_TOOLS 등록 | tools/list | 길이 63, 8개 `kto_wellness_*` |
| S3 | areaBasedList(KOR) | 정상 호출 | totalCount 174, 한국어 title |
| S4 | langDivCd 누락 | 8 도구 모두 호출 | -32602, 외부 호출 0 |
| S5 | detailIntro/Info | contentTypeId 누락 | -32602 |
| S6 | detailImage(2994116) | 정상 호출 | 7 images, imgname/serialnum |
| S7 | wellnessTursmSyncList | 정상 호출 | 201 records, showflag/oldContentId 보존 |
| S8 | SPEC-KTO-001~008 | 기존 e2e 재실행 | 55 도구 회귀 0 |
| S9 | 신규 파일 | test:cov | ≥ 85% |

## Files to Modify

수정:
- `src/kto/common/constants.ts`
- `src/main.ts`
- `src/app.module.ts`
- `test/kto.e2e-spec.ts`

신규 (`src/kto/wellness-tourism/`):
- `wellness-tourism.module.ts`
- `wellness-tourism.service.ts` + `.spec.ts`
- `wellness-tourism.tools.ts` + `.spec.ts`
- `types.ts` (`WellnessTursmItem`)
- `dto/index.ts`
- `dto/{area-based-list,location-based-list,search-keyword,wellness-tursm-sync-list,detail-common,detail-intro,detail-info,detail-image}.dto.ts`

## Design Decisions

| 항목 | 값 |
|------|-----|
| BASE_URL_MAP key | `WellnessTursmService` |
| Tool prefix | `kto_wellness_*` |
| Module path | `src/kto/wellness-tourism/` |
| DTO class prefix | `Wt` |
| Item interface | `WellnessTursmItem` |
| Tool name format | `kto_wellness_<exactOpName>` (camelCase 보존) |
| 노출 op 수 | 8 of 9 (skip `ldongCode`) |
| 도구 카운트 | 55 → 63 |
| 도메인 타입 분리 | MdclTursmItem 과 별개 |

## Exclusions

- `ldongCode` 미노출 (R1 dedup, KorService2 ldongCode2 와 동일)
- 다국어 path-suffix 변체 미존재 (langDivCd 파라미터 단일 분기)
- 외부 예약 시스템 통합 없음
- 자동 한-영 번역 없음
- MdclTursmItem 재사용 없음 (도메인 분리 우선)
- 신규 추상화 (HTTP client / normalizer / registry / pagination base) 도입 없음

## 패턴 위치

KTO 6 패턴 분류 (SPEC-KTO-008 확립):
- 6번 패턴 = langDivCd 단일 path + 다국어 파라미터 분기
  - 6-1: SPEC-KTO-008 MdclTursmService (의료, ENG 기본)
  - 6-2: **SPEC-KTO-009 WellnessTursmService (웰니스, KOR 기본)** ← 본 SPEC

본 SPEC 의 의의: 6번 패턴의 재현성 검증 + 인프라 재사용성 입증.
