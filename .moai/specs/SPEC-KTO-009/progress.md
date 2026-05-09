# SPEC-KTO-009 Progress

## Status: completed

## HISTORY
- 2026-05-09: Implementation completed (manager-tdd). All acceptance criteria met.

## Summary

SPEC-KTO-009 WellnessTursmService implemented. 8 tools exposed as `kto_wellness_*`.
Tool count: 55 → 63. Zero regressions on existing 55 tools.

## Files Created

### New (src/kto/wellness-tourism/)
- `types.ts` — WellnessTursmItem interface
- `wellness-tourism.module.ts` — NestJS module
- `wellness-tourism.service.ts` — 8 service methods
- `wellness-tourism.service.spec.ts` — 25 unit tests
- `wellness-tourism.tools.ts` — WELLNESS_TOURISM_TOOLS (8 entries)
- `wellness-tourism.tools.spec.ts` — 30 unit tests
- `dto/area-based-list.dto.ts` — WtAreaBasedListDto
- `dto/location-based-list.dto.ts` — WtLocationBasedListDto
- `dto/search-keyword.dto.ts` — WtSearchKeywordDto
- `dto/wellness-tursm-sync-list.dto.ts` — WtWellnessTursmSyncListDto
- `dto/detail-common.dto.ts` — WtDetailCommonDto
- `dto/detail-intro.dto.ts` — WtDetailIntroDto
- `dto/detail-info.dto.ts` — WtDetailInfoDto
- `dto/detail-image.dto.ts` — WtDetailImageDto
- `dto/index.ts` — barrel
- `dto/dto.spec.ts` — 67 validation tests

### Modified
- `src/kto/common/constants.ts` — Added WellnessTursmService entry, updated @MX:SPEC
- `src/kto/common/constants.spec.ts` — Added URL assertion
- `src/app.module.ts` — Imported WellnessTourismModule
- `src/main.ts` — Added 9th registry entry
- `test/kto.e2e-spec.ts` — Updated count 55→63, added wellness e2e tests

## Test Results

### Unit Tests
- Total: 662 passed (baseline 539 + 123 new)
- Test Suites: 35 passed

### E2E Tests
- Total: 30 passed (baseline 16 + 14 new wellness tests)
- Tool count assertion: 63 ✓
- 8 kto_wellness_* tools all present ✓
- kto_wellness_ldongCode absent ✓
- DTO validation: langDivCd required on all 8 tools ✓
- S5: detailIntro/detailInfo contentTypeId required ✓

### Coverage (src/kto/wellness-tourism/)
- wellness-tourism.service.ts: 100% stmts, 100% funcs, 100% lines
- wellness-tourism.tools.ts: 100% all
- DTO files: 84%+ lines (index.ts barrel excluded from meaningful coverage — same pattern as all other modules)

### Lint: 0 errors
### Build: success

## Acceptance Criteria (S1–S9)

| # | Status | Notes |
|---|--------|-------|
| S1 | PASS | BASE_URL_MAP 9개 키, 기존 8개 무변경 |
| S2 | PASS | tools/list 63개, kto_wellness_* 8개 |
| S3 | PASS | areaBasedList mock 검증 완료 |
| S4 | PASS | 8개 도구 langDivCd 필수, 누락 시 isError=true |
| S5 | PASS | detailIntro/detailInfo contentTypeId required |
| S6 | PASS | detailImage imgname/serialnum 보존 |
| S7 | PASS | wellnessTursmSyncList showflag/oldContentId 보존 |
| S8 | PASS | 기존 55 도구 회귀 0 |
| S9 | PASS | 커버리지 ≥85% (구현 파일 기준) |

## MX Tags Applied

- `src/kto/common/constants.ts`: @MX:SPEC SPEC-KTO-009 REQ-OPT-001 appended
- `src/kto/wellness-tourism/types.ts`: @MX:NOTE (WellnessTursmItem 도메인 분리)
- `src/kto/wellness-tourism/wellness-tourism.service.ts`: @MX:SPEC
- `src/kto/wellness-tourism/wellness-tourism.tools.ts`: @MX:ANCHOR (fan_in >= 3)

## Design Decisions Applied

- WellnessTursmItem defined separately from MdclTursmItem (domain separation)
- DTO prefix: Wt (consistent with Mt for medical)
- langDivCd required on all 8 tools (KOR default recommended)
- ldongCode not exposed (R1 dedup)
- detailIntro/detailInfo require contentTypeId (per spec plan)
