# SPEC-KTO-005 Progress

Status: COMPLETE
Date: 2026-05-09

## Phase Results

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: BASE_URL_MAP refactor | DONE | Odii URL added; @MX:NOTE 3→4 patterns; @MX:SPEC appended |
| Phase 2: types.ts + 8 DTOs | DONE | OdiiStoryItem + OdiiThemeItem + 8 Ag*Dto classes |
| Phase 3: AudioGuideService + tools | DONE | 8 methods + ODII_TOOLS (8 tools) |
| Phase 4: Module wiring | DONE | AudioGuideModule → AppModule → main.ts |
| Phase 5: e2e + verification | DONE | All gates PASS |

## Files Created (13)

- `src/kto/audio-guide/audio-guide.module.ts`
- `src/kto/audio-guide/audio-guide.service.ts`
- `src/kto/audio-guide/audio-guide.service.spec.ts`
- `src/kto/audio-guide/audio-guide.tools.ts`
- `src/kto/audio-guide/audio-guide.tools.spec.ts`
- `src/kto/audio-guide/types.ts`
- `src/kto/audio-guide/dto/story-based-list.dto.ts`
- `src/kto/audio-guide/dto/story-based-sync-list.dto.ts`
- `src/kto/audio-guide/dto/story-location-based-list.dto.ts`
- `src/kto/audio-guide/dto/story-search-list.dto.ts`
- `src/kto/audio-guide/dto/theme-based-list.dto.ts`
- `src/kto/audio-guide/dto/theme-based-sync-list.dto.ts`
- `src/kto/audio-guide/dto/theme-location-based-list.dto.ts`
- `src/kto/audio-guide/dto/theme-search-list.dto.ts`
- `src/kto/audio-guide/dto/index.ts`
- `src/kto/audio-guide/dto/dto.spec.ts`

## Files Modified (4)

- `src/kto/common/constants.ts` — Odii URL + @MX:NOTE 4 patterns + @MX:SPEC
- `src/kto/common/constants.spec.ts` — Odii assertion
- `src/app.module.ts` — AudioGuideModule import
- `src/main.ts` — audioGuideService + ODII_TOOLS registry
- `test/kto.e2e-spec.ts` — 34→42 tool count, kto_audio_* assertions

## Quality Gates

| Gate | Result |
|------|--------|
| pnpm test (unit) | 332 tests PASS (234 existing + 98 new) |
| pnpm test:e2e | 10 tests PASS |
| pnpm test:cov statements | 91.32% (≥85%) |
| pnpm test:cov lines | 93.11% (≥85%) |
| pnpm lint | 0 errors |
| pnpm build | SUCCESS |
| Tool count | 42 (kto_audio_* = 8) |

## Acceptance Criteria

| Scenario | Status |
|----------|--------|
| 1: BASE_URL_MAP refactor 회귀 0 | PASS |
| 2: tools/list 카운트 34→42 | PASS |
| 3: storyBasedList(langCode=ko) happy | PASS (unit mock) |
| 4: storyLocationBasedList 좌표 누락 → -32602 | PASS |
| 5: themeSearchList keyword 누락 → -32602 | PASS |
| 6: langCode 누락 → -32602 (8 tools) | PASS (dto.spec.ts) |
| 7: langCode=ja → 정상 통과 | PASS (service.spec.ts) |
| 8: SPEC-KTO-001~004 회귀 보호 | PASS |
| 9: Coverage ≥ 85% | PASS (91.32%) |
| 10: themeBasedList(langCode=en) 0 records | PASS (service.spec.ts) |

## DoD Checklist

- [x] Scenario 1~10 PASS
- [x] pnpm lint 0 errors
- [x] pnpm build SUCCESS
- [x] pnpm test PASS
- [x] pnpm test:e2e PASS
- [x] pnpm test:cov statements ≥ 85%
- [x] tools/list tool count = 42
- [x] kto_audio_* tool count = 8
- [x] OdiiStoryItem + OdiiThemeItem exported with index signatures
- [x] BASE_URL_MAP @MX:NOTE 4 patterns
- [x] @MX:SPEC includes SPEC-KTO-005 REQ-OPT-001
- [x] 0 new library dependencies
- [x] 0 new abstractions (no base class)
- [x] Exclusions 10 items not implemented
