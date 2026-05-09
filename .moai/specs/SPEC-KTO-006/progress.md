# SPEC-KTO-006 Progress — KTO 두루누비 (Durunubi)

Status: COMPLETE
Date: 2026-05-09
Methodology: TDD (RED-GREEN-REFACTOR)

## Acceptance Criteria Completion

| # | Scenario | Status |
|---|----------|--------|
| 1 | BASE_URL_MAP refactor 후 회귀 0 (332 단위 + e2e PASS) | PASS |
| 2 | tools/list 카운트 42 → 44, kto_durunubi_* 정확히 2개 | PASS |
| 3 | courseList happy path — unit test (gpxpath URL 보존) | PASS |
| 4 | routeList happy path — unit test (themedescs HTML 보존) | PASS |
| 5 | courseList({numOfRows:0}) → MCP -32602 (KTO 호출 차단) | PASS |
| 6 | SPEC-KTO-001 ~ 005 회귀 — 기존 42 도구 정상 | PASS |
| 7 | 단위 커버리지 ≥ 85% | PASS (91.14%) |
| 8 | gpxpath URL / themedescs HTML 원형 전달 | PASS |

## Quality Gates

| Gate | Result |
|------|--------|
| `pnpm test` | 367 tests, 26 suites — all pass |
| `pnpm test:e2e` | 12 tests, 2 suites — all pass |
| `pnpm test:cov` | 91.14% overall coverage |
| `pnpm lint` | 0 errors |
| `pnpm build` | nest build succeeds |

## Files Created (9)

- `src/kto/durunubi/types.ts`
- `src/kto/durunubi/durunubi.service.ts`
- `src/kto/durunubi/durunubi.service.spec.ts`
- `src/kto/durunubi/durunubi.tools.ts`
- `src/kto/durunubi/durunubi.tools.spec.ts`
- `src/kto/durunubi/durunubi.module.ts`
- `src/kto/durunubi/dto/course-list.dto.ts`
- `src/kto/durunubi/dto/route-list.dto.ts`
- `src/kto/durunubi/dto/index.ts`
- `src/kto/durunubi/dto/dto.spec.ts`

## Files Modified (5)

- `src/kto/common/constants.ts` — Durunubi URL + @MX:SPEC 갱신
- `src/kto/common/constants.spec.ts` — Durunubi assertion 추가
- `src/app.module.ts` — DurunubiModule import
- `src/main.ts` — DurunubiService + DURUNUBI_TOOLS 등록 (6th entry)
- `test/kto.e2e-spec.ts` — 도구 카운트 42 → 44, durunubi 시나리오 추가

## MX Tags Applied

- `constants.ts`: @MX:SPEC에 SPEC-KTO-006 REQ-OPT-001 추가
- `types.ts`: @MX:NOTE (Course/Route 구분), @MX:SPEC
- `durunubi.service.ts`: @MX:SPEC, 메서드별 @MX:NOTE
- `durunubi.tools.ts`: @MX:NOTE, @MX:SPEC

## Iteration Log

| Iteration | Phase | Status |
|-----------|-------|--------|
| 1 | Phase 1 constants RED→GREEN | PASS |
| 2 | Phase 2 types + DTOs RED→GREEN | PASS |
| 3 | Phase 3 service + tools RED→GREEN | PASS |
| 4 | Phase 4 module wiring | PASS |
| 5 | Phase 5 e2e + full suite | PASS |

Scope drift: 0% — all files within SPEC-defined boundaries.
