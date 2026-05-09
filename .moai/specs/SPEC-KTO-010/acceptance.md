# SPEC-KTO-010 Acceptance: PhokoAwrdService 검수 시나리오

## Definition of Done

- 5개 EARS 모듈(REQ-KTO10-001, REQ-EVT-001, REQ-STATE-001, REQ-OPT-001, REQ-UNW-001) 충족
- 신규/변경 코드 라인 테스트 커버리지 ≥ 85%
- 기존 SPEC-KTO-001~009의 63개 도구 회귀 0건
- 누적 도구 카운트 65개 (이전 63 + 2)
- ESLint type-aware 규칙(`tseslint.configs.recommendedTypeChecked`) 위반 0건
- `pnpm run build` 성공
- KTO 통합 시리즈 마일스톤 (10/10) 완료 명시 (research.md / spec.md / plan.md)
- KTO 다국어 7가지 패턴 분류 체계 완성 명시 (`BASE_URL_MAP` `@MX:NOTE`)

## Given/When/Then 검수 시나리오

### Scenario 1 — BASE_URL_MAP 회귀 0건 (REQ-OPT-001)

**Given** SPEC-KTO-001~009가 머지된 main 브랜치 (commit 735e846)에서 기존 9개 KTO 모듈이 정상 동작한다,

**When** `src/kto/common/constants.ts`의 `BASE_URL_MAP`에 `PhokoAwrdService` 1줄이 추가되고 `@MX:NOTE` 주석이 7-패턴 분류로 갱신된다,

**Then** `pnpm run lint`, `pnpm run build`, `pnpm run test`가 모두 성공하며, 기존 63개 도구의 응답이 변하지 않고 신규 매핑만 추가됨을 보장한다.

### Scenario 2 — MCP `tools/list` 도구 카운트 63 → 65 (REQ-EVT-001)

**Given** PhotoAward 모듈이 `app.module.ts`에 등록되고 `main.ts` registries 배열에 10번째 항목으로 추가된 빌드 결과가 존재한다,

**When** MCP 클라이언트가 `tools/list` 요청을 보낸다,

**Then** 응답의 도구 배열 길이가 정확히 65이며, 그 중 `kto_contest_phokoAwrdList`와 `kto_contest_phokoAwrdSyncList` 두 도구가 등장한다. 각 도구의 inputSchema에는 `langCode` / `langDivCd` / `lang` 어떠한 언어 파라미터도 존재하지 않는다.

### Scenario 3 — `kto_contest_phokoAwrdList` 정상 호출 (REQ-EVT-001, REQ-KTO10-001)

**Given** 유효한 `serviceKey`가 환경 변수에 설정되어 있고 KTO 게이트웨이가 응답한다,

**When** MCP 클라이언트가 `kto_contest_phokoAwrdList`를 `numOfRows=100, pageNo=1`로 호출한다,

**Then** 응답 envelope의 `totalCount`가 95이며, `items` 배열의 모든 항목이 `koTitle`(한국어 제목)과 `enTitle`(영어 제목)을 동시에 포함한다. 각 항목의 `contentId`는 6자리 base62-like 문자열이며 `orgImage` / `thumbImage`는 `https://tong.visitkorea.or.kr/cms/resource_photo/...` URL 형식이다. 응답 항목에는 `showflag` 필드가 부재한다 (sync 전용).

### Scenario 4 — `kto_contest_phokoAwrdSyncList` 정상 호출 + showflag 검증 (REQ-EVT-001, REQ-KTO10-001)

**Given** 유효한 `serviceKey`와 KTO 게이트웨이 정상 응답 상태,

**When** MCP 클라이언트가 `kto_contest_phokoAwrdSyncList`를 `numOfRows=100, pageNo=1`로 호출한다,

**Then** 응답 envelope의 `totalCount`가 96이며 (List보다 1건 많음 — 삭제/이력 항목 포함), 모든 항목이 `showflag` 필드를 포함한다 (`'0'` 또는 `'1'`). `koTitle`/`enTitle` 페어도 정상 노출된다.

### Scenario 5 — 언어 파라미터 거부 검증 (REQ-UNW-001)

**Given** TypeScript 타입 시스템과 `class-validator`로 보호된 DTO 경계,

**When** 개발자가 코드 상에서 `PaPhokoAwrdListDto`에 `langCode: 'EN'` 또는 `langDivCd: '2'`를 전달하려 시도한다,

**Then** TypeScript 컴파일러가 `Object literal may only specify known properties` 에러를 던지며, 강제로 우회하여 KTO에 전달된 경우에도 게이트웨이가 `INVALID_REQUEST_PARAMETER_ERROR` (`resultCode=10`)를 반환하고, 이 에러가 MCP 응답에 그대로 노출된다 (throw하지 않음).

### Scenario 6 — SPEC-KTO-001~009 회귀 0건 (REQ-KTO10-001)

**Given** SPEC-KTO-001~009의 63개 기존 도구 (KorService2 외 8개 V2 다국어, KorWithService2, PhotoGalleryService1, GoCamping, Odii, Durunubi, KorPetTourService2, MdclTursmService, WellnessTursmService),

**When** SPEC-KTO-010 패치가 적용된 후 e2e 테스트(`pnpm run test:e2e`)가 실행된다,

**Then** 기존 도구 모든 호출 시나리오가 통과하며, 응답 형식, 페이지네이션, 에러 처리에 변경이 없다. 신규 PhokoAwrdService 도구 2개만 추가된다.

### Scenario 7 — 5xx 재시도 검증 (REQ-STATE-001)

**Given** KTO 게이트웨이가 `phokoAwrdList` 호출에 대해 첫 시도에 503을 반환하고 두 번째 시도에 200을 반환하도록 모킹된 환경,

**When** MCP 클라이언트가 `kto_contest_phokoAwrdList`를 호출한다,

**Then** `RETRY_CONFIG`(maxRetries=3, initialDelayMs=200)에 따라 최대 3회 재시도하며, 두 번째 시도에서 정상 응답을 받아 `PhotoAwardItem[]`을 반환한다. 영구 에러 코드(22/30/31/32)가 반환된 경우에는 재시도하지 않고 즉시 에러를 propagate한다.

### Scenario 8 — `numOfRows` 음수/0 거부 (REQ-UNW-001)

**Given** `class-validator` `@Min(1)` 데코레이터가 적용된 DTO,

**When** MCP 클라이언트가 `kto_contest_phokoAwrdList`를 `numOfRows=0`로 호출한다,

**Then** DTO 검증 단계에서 요청이 거부되며 KTO 게이트웨이로 HTTP 호출이 발생하지 않는다. MCP 응답에 검증 에러 메시지가 포함된다.

### Scenario 9 — `ldongCode` 미노출 (Exclusion 1)

**Given** PhokoAwrdService Swagger에 `ldongCode` operation이 존재함에도 본 SPEC이 이를 SKIP한다는 결정,

**When** MCP 클라이언트가 `tools/list`를 조회한다,

**Then** 도구 목록에 `kto_contest_ldongCode` 또는 유사 이름의 도구가 부재하며, 사용자가 법정동 코드를 조회하려면 SPEC-KTO-001에서 노출한 `kto_korean_ldongCode2` 도구를 사용하도록 안내된다.

### Scenario 10 — 마일스톤: 10/10 KTO API 통합 완성 + 7-패턴 분류 완성

**Given** 본 SPEC-KTO-010이 머지된 main 브랜치,

**When** `src/kto/common/constants.ts`의 `BASE_URL_MAP` `@MX:NOTE` 주석을 확인한다,

**Then** 주석에 KTO 다국어 처리 7가지 패턴(V2 다중 path × 9 / V2 sibling 단독 / V1 단독 / no-suffix / langCode / langDivCd + lang fluid / **응답 필드 prefix `ko*` / `en*` (NEW)**)이 모두 명시되어 있다. `@MX:SPEC` 라인에 `SPEC-KTO-001 REQ-OPT-001 ... SPEC-KTO-010 REQ-OPT-001`까지 누적 10개 SPEC ID가 나열되어 있다. 누적 도구 카운트는 65이며 KTO 통합 시리즈는 본 SPEC으로 마무리된다.

## 품질 게이트 (TRUST 5)

- **Tested**: 신규 모듈 단위 테스트 ≥ 85% line coverage. e2e가 65 도구 카운트 검증.
- **Readable**: `class-validator` 데코레이터로 DTO 의도 명시, 한국어 prose 주석으로 도메인 용어 정리.
- **Unified**: 기존 9개 KTO 모듈과 동일 디렉토리/네이밍 컨벤션 (`src/kto/<domain>/`, `Pa*` DTO prefix, `kto_contest_*` 도구 prefix).
- **Secured**: `serviceKey` 환경 변수 노출 금지, 에러 메시지에 키 미포함 (기존 `KtoHttpClient` 정책 상속).
- **Trackable**: 본 SPEC ID(`SPEC-KTO-010`)와 REQ ID들(`REQ-KTO10-001`, `REQ-EVT-001`, `REQ-STATE-001`, `REQ-OPT-001`, `REQ-UNW-001`)이 커밋 메시지/PR 본문에 명시.

## Edge Cases

- 동일 작가의 여러 수상작이 페이지에 걸쳐 존재할 때 `koCmanNm` 중복 정상 노출
- `koCmanNm == enCmanNm` (영문명 미제공) 케이스 그대로 통과
- `phokoAwrdSyncList`에서 `showflag='0'` (삭제/이력) 항목은 응답에 포함하되 클라이언트가 필터링
- KTO 응답에 신규 prefix 페어가 추가되더라도 index signature로 안전 통과 (R1 완화)
- `filmDay`가 `YYYYMM` (6자리)이며 일자 정보 부재 — 응답 그대로 통과
