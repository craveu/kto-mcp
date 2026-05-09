# SPEC-KTO-002 Progress

Status: COMPLETE
Date: 2026-05-09

## Phase Results

### Phase 1 — BASE_URL_MAP refactor (DONE)
- `src/kto/common/constants.ts`: `KorWithService2` 항목 추가 (`http://apis.data.go.kr/B551011/KorWithService2`)
- `@MX:NOTE` 주석 갱신: "language variants + functional sibling services share this map" 의도 명시
- `@MX:SPEC` 에 `SPEC-KTO-002 REQ-OPT-001` 추가
- SPEC-KTO-001 76 unit tests 회귀 무사고 확인

### Phase 2 — Barrier-free DTOs (DONE)
- `src/kto/barrier-free-tour-info/dto/` 생성
- 10개 DTO 작성 (Bf prefix 사용, 모듈 격리로 클래스명 충돌 방지):
  - BfAreaBasedListDto, BfLocationBasedListDto, BfSearchKeywordDto
  - BfSearchFestivalDto, BfSearchStayDto
  - BfDetailCommonDto, BfDetailIntroDto, BfDetailInfoDto, BfDetailImageDto
  - BfDetailWithTourDto (KorWithService2 고유, `@IsNotEmpty` contentId 검증)
- dto.spec.ts: 16개 검증 테스트 (통과)
- `areaBasedSyncList2` 제외 결정: research §3.2 "LOWER CONFIDENCE" 표시, data.go.kr "13개" 언급으로 미포함. [ASSUMED — verify against KTO guide PDF]

### Phase 3 — Service + tools.ts (DONE)
- `barrier-free-tour-info.service.ts`: 10개 메서드, 모두 `service: 'KorWithService2'` 사용
- `barrier-free-tour-info.tools.ts`: 10개 도구 메타데이터 (BARRIER_FREE_TOUR_INFO_TOOLS)
- 코드 조회 4개(areaCode2, categoryCode2, ldongCode2, lclsSystmCode2) 제외 (plan.md R1)
- barrier-free-tour-info.service.spec.ts: 11개 테스트 (통과)

### Phase 4 — Tool registry + Module wiring (DONE)
- `tool-registry.ts` 리팩터: `registerAll(server, registries: ToolRegistry[])` 시그니처로 일반화
- `barrier-free-tour-info.module.ts` 생성
- `app.module.ts`: BarrierFreeTourInfoModule import 추가
- `main.ts`: 복수 레지스트리 패턴으로 업데이트
- tool-registry.spec.ts: 25개 도구 등록 검증 포함 8개 테스트 업데이트

### Phase 5 — E2E + Verification (DONE)
- `test/kto.e2e-spec.ts`: 25개 도구 등록 검증, barrier-free 서비스 참조 추가
- 기존 6개 e2e 테스트 회귀 무사고

### Phase 5.5 — MX Tags (DONE)
- `constants.ts` @MX:NOTE 갱신 (language variants + functional sibling services)
- `barrier-free-tour-info.service.ts` detailWithTour2 @MX:NOTE 추가
- `BfDetailWithTourDto.contentId` @MX:NOTE 추가
- `tool-registry.ts` @MX:ANCHOR REASON 갱신 (복수 레지스트리 지원)
- @MX:TODO 태그: 테스트 통과 후 제거 완료

## File Summary

### Created (14 files)
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.module.ts`
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.ts`
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.tools.ts`
- `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`
- `src/kto/barrier-free-tour-info/dto/area-based-list.dto.ts`
- `src/kto/barrier-free-tour-info/dto/location-based-list.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-keyword.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-festival.dto.ts`
- `src/kto/barrier-free-tour-info/dto/search-stay.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-common.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-intro.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-info.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-image.dto.ts`
- `src/kto/barrier-free-tour-info/dto/detail-with-tour.dto.ts`
- `src/kto/barrier-free-tour-info/dto/index.ts`
- `src/kto/barrier-free-tour-info/dto/dto.spec.ts`

### Modified (6 files)
- `src/kto/common/constants.ts` — KorWithService2 추가, @MX:NOTE 갱신
- `src/app.module.ts` — BarrierFreeTourInfoModule import
- `src/main.ts` — 복수 레지스트리 registerAll 호출
- `src/mcp/tool-registry.ts` — registerAll 시그니처 일반화 (ToolRegistry[])
- `src/mcp/tool-registry.spec.ts` — 25개 도구 검증 업데이트
- `test/kto.e2e-spec.ts` — barrier-free 서비스 참조, 25개 도구 검증

## Test Results

- Unit tests: 111 passed (76 기존 + 35 신규)
- E2E tests: 6 passed (기존 6개 회귀 무사고)
- Coverage: 95.96% statements (목표 ≥ 85%)
- Lint: 0 errors
- Build: 성공

## Tool Count
- kto_korean_* 도구: 15개
- kto_barrier_free_* 도구: 10개
- 합계: 25개

## Divergence Report

1. **areaBasedSyncList2 제외**: research §3.3 "LOWER CONFIDENCE" 표시 및 data.go.kr "13개" 표현 근거로 제외. 실제 RUN Phase 통합 테스트에서 확인 후 포함 여부 결정 필요 [ASSUMED].
2. **DTO 클래스명 prefix**: `Bf` prefix 사용 (`BfAreaBasedListDto` 등) — 클래스명 충돌 방지 목적. plan.md §2 Phase 2에서 "Bf prefix 또는 동일 이름 + 모듈 격리" 중 RUN Phase 결정 사항이었으며 Bf prefix 선택.
3. **tool-registry.ts 시그니처**: plan.md Approach A "generalize registerAll to accept multiple sources" 완전 구현. `KoreanTourInfoService` 타입 의존성 제거, 범용 `Record<string, ...>` 패턴 적용.

## [ASSUMED] Items (verify against KTO guide PDF)
- KorWithService2 정확한 오퍼레이션 셋 (13개 추정, 미확인)
- detailWithTour2 응답 필드 정확한 명칭 (braileblock 오타 가능성)
- areaBasedSyncList2 KorWithService2 측 존재 여부
- 각 오퍼레이션의 정확한 필수 파라미터 셋
