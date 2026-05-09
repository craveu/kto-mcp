# SPEC-KTO-009 — Acceptance Criteria

## 0. 기준선

- 베이스: `main` @ fa0a4d0 (SPEC-KTO-001~008 머지, 도구 카운트 55)
- 본 SPEC 적용 후 기대 도구 카운트: **63**
- 신규 도구 prefix: `kto_wellness_*`
- 신규 영향 모듈: `src/kto/wellness-tourism/` + `src/kto/common/constants.ts` + `src/main.ts` + `src/app.module.ts` + `test/kto.e2e-spec.ts`

## 1. Given-When-Then 시나리오 (≥ 7)

### S1. BASE_URL_MAP 확장 회귀 0

**Given** main 브랜치에 `BASE_URL_MAP` 가 8개 KTO 서비스 키를 보유한 상태
**When** SPEC-KTO-009 가 `WellnessTursmService` 키를 1줄 추가
**Then** 기존 8개 키의 값과 라우팅 동작은 무변경이며, 단위 테스트 (`kto-http.client.spec.ts`) 의 모든 케이스가 통과한다.

검증 방법:
- `pnpm test src/kto/kto-http.client.spec.ts` 통과 (변경 전과 동일한 결과)
- `BASE_URL_MAP` 의 9개 키가 모두 존재하며 그 중 `WellnessTursmService` 가 새로 추가된 것임을 grep 으로 확인

### S2. tools/list 도구 카운트 55 → 63

**Given** SPEC-KTO-009 가 `WELLNESS_TOURISM_TOOLS` (8 entries) 를 main.ts 에 9번째 registry 로 등록한 상태
**When** MCP 클라이언트가 `tools/list` 를 호출
**Then** 응답의 `tools` 배열 길이는 정확히 **63** 이며, 그 중 8개의 이름이 `kto_wellness_` prefix 로 시작한다.

검증 방법:
- e2e 테스트 (`test/kto.e2e-spec.ts`) 에서 도구 카운트 단언 (`expect(tools).toHaveLength(63)`)
- 8개 도구 이름 (`kto_wellness_areaBasedList`, `kto_wellness_locationBasedList`, `kto_wellness_searchKeyword`, `kto_wellness_wellnessTursmSyncList`, `kto_wellness_detailCommon`, `kto_wellness_detailIntro`, `kto_wellness_detailInfo`, `kto_wellness_detailImage`) 모두 존재 확인

### S3. areaBasedList 정상 호출 (langDivCd=KOR)

**Given** `WellnessTourismService` 와 `kto_wellness_areaBasedList` 도구가 등록된 상태
**When** MCP 클라이언트가 `kto_wellness_areaBasedList` 를 `langDivCd=KOR` 로 호출
**Then** KTO 가 totalCount = **174** 의 결과 envelope 을 반환하며, MCP 응답에는 `WellnessTursmItem[]` 형태의 항목 배열이 포함된다. 항목의 `langDivCd` 필드는 `KOR` 이며, `title` 은 한국어 (e.g. "가곡유황온천&스파") 이다.

검증 방법:
- 단위 테스트에서 KtoHttpClient mock 응답을 174 totalCount envelope 으로 설정
- MCP 응답이 정규화된 항목 배열을 포함하며 `WellnessTursmItem` 의 모든 필수 필드 (`contentId`, `contentTypeId`, `title`, `langDivCd`, `baseAddr`, `mapX`, `mapY`) 보유

### S4. langDivCd 누락 시 -32602 차단 (8개 도구 모두)

**Given** 8개 `kto_wellness_*` 도구가 등록되고 모두 inputSchema 에 `langDivCd` 를 required 로 정의한 상태
**When** MCP 클라이언트가 임의의 `kto_wellness_*` 도구를 `langDivCd` 없이 호출
**Then** MCP 서버는 `-32602 invalid params` 에러를 반환하며 KTO API 로 외부 호출이 발생하지 않는다.

검증 방법:
- 8개 도구 각각에 대해 `langDivCd` 누락 케이스 테스트 (`wellness-tourism.tools.spec.ts`)
- KtoHttpClient mock 의 호출 횟수가 0 인지 확인 (외부 위임 차단)
- 응답 코드가 `-32602` 인지 확인

### S5. detailIntro / detailInfo 의 contentTypeId 누락 차단

**Given** `kto_wellness_detailIntro` 와 `kto_wellness_detailInfo` 도구가 `contentId`, `contentTypeId`, `langDivCd` 모두 required 로 등록된 상태
**When** 클라이언트가 두 도구 중 하나를 `contentTypeId` 없이 호출 (다른 두 파라미터는 정상 제공)
**Then** MCP 서버는 `-32602` 를 반환하며 외부 호출하지 않는다.

검증 방법:
- 두 도구 각각에 대해 `contentTypeId` 누락 단위 테스트
- inputSchema 가 `required: ['contentId', 'contentTypeId', 'langDivCd']` 를 정확히 명시하는지 확인

### S6. detailImage 정상 호출 — 이미지 URL 반환

**Given** `kto_wellness_detailImage` 도구가 등록되고, KTO 가 sample contentId `2994116` 에 대해 7개 이미지 row 를 반환하는 상태
**When** 클라이언트가 `kto_wellness_detailImage` 를 `contentId=2994116`, `langDivCd=KOR` 로 호출
**Then** MCP 응답은 7개 항목의 배열이며, 각 항목은 `imgname`, `serialnum`, `orgImage` (또는 thumbnail URL) 필드를 포함한다.

검증 방법:
- KtoHttpClient mock 응답에 7개 이미지 row 설정
- MCP 응답 배열 길이 = 7
- 각 항목의 `imgname`, `serialnum` 필드 존재 검증

### S7. wellnessTursmSyncList — sync 메타데이터 보존

**Given** `kto_wellness_wellnessTursmSyncList` 도구가 등록되고, KTO 가 totalCount = **201** 의 sync 응답을 반환하는 상태 (일부 항목은 `showflag=0`, 일부는 `oldContentId` 보유)
**When** 클라이언트가 도구를 `langDivCd=KOR` 로 호출
**Then** MCP 응답의 `WellnessTursmItem[]` 항목들은 `showflag` 와 `oldContentId` 필드를 누락 없이 보존하며, 정규화 과정에서 손실되지 않는다.

검증 방법:
- KtoHttpClient mock 에 201 records 응답 (그 중 일부에 `showflag=0`, 일부에 `oldContentId` 포함)
- MCP 응답에서 두 필드의 존재/값 검증
- `WellnessTursmItem` 인터페이스가 두 필드를 옵션으로 선언하는지 확인

### S8. SPEC-KTO-001~008 회귀 0 — 기존 55 도구 정상

**Given** main 브랜치의 55 도구가 모두 정상 등록된 상태
**When** SPEC-KTO-009 머지 후 e2e 테스트 (`test/kto.e2e-spec.ts`) 전체 실행
**Then** 기존 55 도구의 이름, inputSchema, handler 동작 모두 변경 전과 동일하며, 새로 추가된 8개 도구만 추가로 통과한다.

검증 방법:
- e2e 테스트에서 기존 55 도구 이름의 정확한 리스트와 비교
- 기존 도구 호출 케이스 (e.g. `kto_korean_areaBasedList2`, `kto_medical_areaBasedList`) 가 변경 전과 동일하게 통과
- 도구 등록 순서 (registries 배열의 인덱스 0~7) 무변경 확인

### S9. Coverage ≥ 85%

**Given** SPEC-KTO-009 의 신규 파일 (`src/kto/wellness-tourism/**/*.ts`) 들이 작성된 상태
**When** `pnpm test:cov` 실행
**Then** 신규 파일 전체의 line/branch/function coverage 가 모두 **85% 이상** 이며, 미커버 라인은 KtoHttpClient mock 으로 도달 불가능한 방어적 분기에 한정된다.

검증 방법:
- coverage 리포트에서 `src/kto/wellness-tourism/` 하위 파일들의 metric 확인
- 미커버 라인 리뷰 — 모든 미커버가 정당한 방어 코드인지 확인

## 2. Edge Cases

| # | 케이스 | 기대 동작 |
|---|--------|----------|
| E1 | `langDivCd=""` (빈 문자열) | inputSchema `minLength: 1` 검증 → `-32602` |
| E2 | `langDivCd="FOO"` (비표준 값) | KTO 측이 lenient 하게 통과 → 빈 또는 정상 응답. MCP 는 차단하지 않음 (KTO 정책 존중). |
| E3 | `searchKeyword.keyword=""` | inputSchema 검증 → `-32602` |
| E4 | `locationBasedList.radius=0` | inputSchema 검증 (positive integer) → `-32602` |
| E5 | KTO 5xx 응답 | KtoHttpClient 의 기존 재시도 정책 적용 (본 SPEC 에서 별도 처리 없음) |
| E6 | KTO flat error envelope 반환 | response normalizer 가 기존 처리 경로로 통과 (PhotoGalleryService1 와 동일) |
| E7 | item 배열 대신 단일 객체 반환 | response normalizer 의 단일→배열 정규화 적용 |
| E8 | 응답 항목에 인덱스 시그니처 외 필드 추가 (KTO 측 확장) | `[key: string]: unknown` 인덱스 시그니처로 그대로 보존 |

## 3. Quality Gate Criteria

- [ ] TypeScript 컴파일 에러 0
- [ ] `pnpm run lint` 경고/에러 0
- [ ] `pnpm run test` 모든 단위 테스트 통과
- [ ] `pnpm run test:e2e` 모든 e2e 테스트 통과 (도구 카운트 63)
- [ ] `pnpm run test:cov` 신규 파일 커버리지 ≥ 85%
- [ ] 기존 55개 도구 회귀 0
- [ ] 노출 도구 8개 모두 `kto_wellness_` prefix
- [ ] `ldongCode` 미노출 (R1 dedup)
- [ ] `BASE_URL_MAP` 의 기존 8 키 무변경
- [ ] `WellnessTursmItem` 이 별개 interface 로 정의 (MdclTursmItem 재사용 없음)

## 4. Definition of Done

본 SPEC 은 다음 모든 항목이 충족되었을 때 완료된 것으로 간주한다:

1. Phase 1~5 의 모든 산출물 (수정 파일 4개 + 신규 파일 12+개) 이 main 브랜치에 머지됨
2. Section 1 의 9 개 G/W/T 시나리오가 모두 자동 테스트로 검증됨
3. Section 2 의 Edge Case 8 종이 단위 테스트로 커버됨
4. Section 3 의 Quality Gate 11 항목이 모두 통과
5. SPEC-KTO-001~008 의 기존 55 도구가 동작에 회귀 없이 유지됨
6. e2e 테스트의 도구 카운트 단언이 `63` 으로 갱신되고 통과함
7. MX 태그 (`@MX:SPEC SPEC-KTO-009`) 가 `BASE_URL_MAP` 와 신규 service/tools 에 부착됨
8. 본 SPEC 의 `status` 가 `draft` → `completed` 로 갱신되고 HISTORY 항목이 추가됨

## 5. 검증 우선순위

테스트 실행 순서 (실패 시 후속 단계 차단):

1. **단위**: BASE_URL_MAP 확장 → DTO 검증 → Service 메서드 → Tools handler
2. **통합**: Module 와이어링 → tools/list 응답 카운트
3. **e2e**: 8개 신규 도구 호출 + 기존 55개 회귀
4. **회귀**: SPEC-KTO-001~008 의 기존 e2e 케이스 전수 통과
5. **커버리지**: 신규 파일 ≥ 85%
