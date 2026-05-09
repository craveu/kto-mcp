# SPEC-KTO-008 Progress

Status: COMPLETE
Date: 2026-05-09

## Summary

SPEC-KTO-008 (KTO 의료관광 정보 MdclTursmService) 구현 완료.

## Files Created (14)

```
src/kto/medical-tourism/
├── medical-tourism.module.ts
├── medical-tourism.service.ts
├── medical-tourism.tools.ts
├── types.ts
├── medical-tourism.service.spec.ts
├── medical-tourism.tools.spec.ts
└── dto/
    ├── area-based-list.dto.ts
    ├── location-based-list.dto.ts
    ├── search-keyword.dto.ts
    ├── mdcl-tursm-sync-list.dto.ts
    ├── detail-mdcl-tursm.dto.ts
    ├── detail-common.dto.ts
    ├── detail-intro.dto.ts
    ├── index.ts
    └── dto.spec.ts
```

## Files Modified (5)

- `src/kto/common/constants.ts` — MdclTursmService 추가, @MX:NOTE 5→6패턴 갱신, @MX:SPEC 갱신
- `src/kto/common/constants.spec.ts` — MdclTursmService URL assertion 추가
- `src/app.module.ts` — MedicalTourismModule import 추가
- `src/main.ts` — medicalTourismService 획득 + registries 8번째 항목 추가
- `test/kto.e2e-spec.ts` — 도구 카운트 48→55, kto_medical_* 7개 assertion + validation 테스트 추가

## Quality Gates

| Gate | Result |
|------|--------|
| pnpm test (unit) | PASS — 539 tests (430 existing + 109 new) |
| pnpm test:e2e | PASS — 24 tests |
| pnpm test:cov | PASS — 89.9% statements, 92.49% lines (≥85% target) |
| pnpm lint | PASS — 0 errors |
| pnpm build | PASS — nest build succeeds |

## Tool Count

48 (SPEC-KTO-001~007) + 7 (SPEC-KTO-008) = **55 tools**

## SPEC-KTO-008 Tools

| Tool | Operation | Required Fields |
|------|-----------|-----------------|
| kto_medical_areaBasedList | areaBasedList | langDivCd |
| kto_medical_locationBasedList | locationBasedList | langDivCd, mapX, mapY, radius |
| kto_medical_searchKeyword | searchKeyword | langDivCd, keyword |
| kto_medical_mdclTursmSyncList | mdclTursmSyncList | langDivCd |
| kto_medical_detailMdclTursm | detailMdclTursm | langDivCd, contentId |
| kto_medical_detailCommon | detailCommon | langDivCd, contentId |
| kto_medical_detailIntro | detailIntro | langDivCd, contentId |

## Acceptance Criteria Status

| # | Scenario | Status |
|---|----------|--------|
| 1 | BASE_URL_MAP refactor 후 회귀 0 | PASS |
| 2 | tools/list 카운트 48→55, kto_medical_* 정확히 7개 | PASS |
| 3 | areaBasedList happy path (unit) | PASS |
| 4 | 모든 7 도구 langDivCd 누락 → MCP -32602 | PASS |
| 5 | locationBasedList mapX/mapY/radius 누락 → MCP -32602 | PASS |
| 6 | searchKeyword keyword 누락/빈값 → MCP -32602 | PASS |
| 7 | detail* 3 도구 contentId 누락/빈값 → MCP -32602 | PASS |
| 8 | mdclTursmSyncList showflag/oldContentId 인덱스 시그니처 흡수 | PASS |
| 9 | SPEC-KTO-001~007 회귀 — 기존 48 도구 정상 | PASS |
| 10 | 단위 커버리지 ≥ 85% | PASS (89.9%) |
| 11 | MdclTursmItem camelCase 필드 보존 | PASS |

## Key Decisions

- BASE_URL_MAP key: `MdclTursmService` (실 KTO path와 일치)
- Module path: `src/kto/medical-tourism/`
- DTO class prefix: `Mt`
- Item interface: `MdclTursmItem` (camelCase, KoreanTourItem과 도메인 분리)
- Tool name format: `kto_medical_<exactOpName>` (NO suffix — KTO 오퍼레이션 명명 그대로)
- 노출 오퍼레이션: 7 (ldongCode 미노출 — R1 정책)
- langDivCd enum 미강제 — @IsNotEmpty() + @IsString()만 적용
- KTO 6번째 service path 패턴 (langDivCd 파라미터) 흡수
