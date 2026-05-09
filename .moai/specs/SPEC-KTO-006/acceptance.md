# Acceptance — SPEC-KTO-006 (KTO 두루누비 정보 Durunubi)

본 문서는 SPEC-KTO-006 의 검증 시나리오를 Given / When / Then 형식으로 정의한다.
모든 시나리오는 `pnpm test` (단위) 또는 `pnpm test:e2e` (e2e) 로 자동화 검증
가능해야 한다. 모든 사실은 사전 KTO 실호출에서 검증되었으며 `[ASSUMED]` 마커는
없다.

---

## Scenario 1: BASE_URL_MAP refactor 후 회귀 0

**Given** SPEC-KTO-001 ~ SPEC-KTO-005 의 332 단위 테스트 + 10 e2e 테스트가 main
branch (commit c62168a) 에서 모두 PASS 인 상태에서

**When** `src/kto/common/constants.ts` 에 `Durunubi:
'http://apis.data.go.kr/B551011/Durunubi'` 1줄을 추가하고 `@MX:SPEC` 라인에
`SPEC-KTO-006 REQ-OPT-001` 항목을 추가한 뒤 `pnpm test` 와 `pnpm test:e2e` 를
실행하면

**Then** 기존 332 단위 + 10 e2e 모두 PASS 하고 (도구 카운트 assertion 은 `42` →
`44` 갱신만 적용), 신규 단위 spec (BASE_URL_MAP 의 `Durunubi` 항목 검증) 가
PASS 한다. `@MX:NOTE` prose 는 변경되지 않으므로 SPEC-KTO-005 에서 작성된 4
패턴 명시가 그대로 유지된다.

---

## Scenario 2: tools/list 카운트 42 → 44 (Durunubi 2 도구 추가)

**Given** SPEC-KTO-006 의 `DurunubiService` 와 `DURUNUBI_TOOLS` (2 도구) 가
`src/main.ts` 의 `registerAll()` registries 배열에 추가된 상태에서

**When** MCP 클라이언트가 stdio 또는 streamable-http 모드로 서버에 접속하여
`tools/list` 를 호출하면

**Then** 응답의 `tools` 배열은 정확히 **44 개** 도구를 포함하며 (KoreanTour
15 + BarrierFree 10 + PhotoGallery 4 + GoCamping 5 + AudioGuide 8 + Durunubi 2
= 44), 그 중 `name` 이 `kto_durunubi_` 로 시작하는 도구가 정확히 **2 개** 이다.
2 도구의 이름은 `kto_durunubi_courseList`, `kto_durunubi_routeList` 이다.

---

## Scenario 3: courseList happy path — gpxpath URL 포함

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `Durunubi` API 가
정상이며, `kto_durunubi_courseList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_durunubi_courseList` 를 호출하고
입력 파라미터로 `{ numOfRows: 1 }` 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 200 (사전 검증값 228 부근. Swagger description 표기치 284 와
  무관)
- `items` 배열 길이 = 1 (numOfRows 영향)
- `items[0].crsKorNm` 필드가 string (예: "남파랑길 1코스")
- `items[0].gpxpath` 필드가 `https://` 또는 `http://` 로 시작하는 URL 문자열
- `items[0].crsIdx`, `items[0].routeIdx`, `items[0].crsDstnc`,
  `items[0].crsTotlRqrmHour`, `items[0].crsLevel`, `items[0].crsCycle` 필드
  모두 정의됨 (string)

---

## Scenario 4: routeList happy path — 3 테마 카탈로그

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `Durunubi` API 가
정상이며, `kto_durunubi_routeList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_durunubi_routeList` 를 호출하고
입력 파라미터로 `{}` (빈 입력) 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount === 3` (사전 검증값. 페이지네이션 사실상 불필요)
- `items` 배열 길이 === 3
- `items.every(i => typeof i.themeNm === 'string')` (모든 항목에 `themeNm`
  필드 존재)
- `items.every(i => typeof i.linemsg === 'string')` (모든 항목에 `linemsg`
  필드 존재)
- `items.some(i => i.themeNm === '남파랑길')` (남파랑길이 응답에 포함됨)
- `items[?].themedescs` 가 정의된 경우 string 이며 HTML 태그 (`<p>` 또는 `<br>`)
  를 포함할 수 있음 (KTO 원형 그대로 전달, sanitization 미적용)

---

## Scenario 5: courseList numOfRows=0 → MCP -32602 (validation)

**Given** `kto_durunubi_courseList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_durunubi_courseList` 를 호출하고
입력 파라미터로 `{ numOfRows: 0 }` (또는 `{ numOfRows: 101 }`, `{ numOfRows:
"abc" }`, `{ pageNo: 0 }`) 를 전달하면

**Then** 응답은 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을 만족한다:

- KTO API 호출은 발생하지 않는다 (DTO 검증 단계에서 즉시 차단).
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "numOfRows must not
  be less than 1").
- 동일 검증이 `kto_durunubi_routeList` 에도 적용된다.

---

## Scenario 6: SPEC-KTO-001 ~ SPEC-KTO-005 회귀 — 기존 42 도구 정상 동작

**Given** SPEC-KTO-006 의 모든 변경 (BASE_URL_MAP 1줄 + `src/kto/durunubi/`
디렉토리 + `app.module.ts` + `main.ts` 갱신) 이 적용된 상태에서

**When** MCP 클라이언트가 다음 도구들을 각각 호출하면:

- `kto_korean_areaCode2` (SPEC-KTO-001)
- `kto_barrier_free_areaBasedList2` (SPEC-KTO-002)
- `kto_photo_galleryList1` (SPEC-KTO-003)
- `kto_camping_basedList` (SPEC-KTO-004)
- `kto_audio_storyBasedList` (SPEC-KTO-005)

**Then** 모든 도구가 SPEC-KTO-006 적용 이전과 동일한 응답을 반환한다:

- 응답 envelope 구조 변경 없음 (`items`, `totalCount`, `numOfRows`, `pageNo` 모두
  존재).
- 재시도 정책 변경 없음 (`RETRY_CONFIG` 그대로 적용).
- DTO 검증 변경 없음.
- flat error envelope 검출 변경 없음.

이 시나리오는 SPEC-KTO-006 가 비파괴(non-breaking) 확장임을 검증한다.

---

## Scenario 7: 단위 테스트 커버리지 ≥ 85%

**Given** SPEC-KTO-006 의 모든 코드 변경 (`src/kto/durunubi/**/*.ts` +
`src/kto/common/constants.ts` 1줄 + `src/app.module.ts` + `src/main.ts`) 이
적용된 상태에서

**When** `pnpm test:cov` (단위 테스트 + coverage) 를 실행하면

**Then** 다음 커버리지 임계치를 만족한다:

- `src/kto/durunubi/durunubi.service.ts` — line coverage ≥ 85%, branch
  coverage ≥ 80%
- `src/kto/durunubi/durunubi.tools.ts` — line coverage ≥ 85%, branch
  coverage ≥ 80%
- `src/kto/durunubi/dto/*.ts` — line coverage ≥ 90% (DTO 는 단순 검증 클래스)
- `src/kto/durunubi/types.ts` — type-only 파일이므로 runtime 커버리지 측정
  대상 외 (TypeScript declaration only).
- 전체 프로젝트 라인 커버리지 ≥ 85% (선행 SPEC 정책 그대로).

---

## Scenario 8: 5xx 재시도 — RETRY_CONFIG 그대로 적용

**Given** mock `KtoHttpClient` 가 첫 호출에서 `503 Service Unavailable` 을, 2번째
호출에서 `503` 을, 3번째 호출에서 정상 응답을 반환하도록 설정된 상태에서

**When** `DurunubiService.courseList({ numOfRows: 10 })` 또는
`DurunubiService.routeList({})` 를 호출하면

**Then** 다음을 만족한다:

- 총 호출 횟수 = 3 (초기 1 + 재시도 2)
- 최종 응답은 정상 envelope 으로 반환됨
- 재시도 간격은 `RETRY_CONFIG` (base 200ms, factor 2.0, jitter ±20%) 적용
- 4번째 호출도 5xx 인 경우 `KtoApiError` 발생 (max 3 retries 초과)

이 시나리오는 SPEC-KTO-006 의 service 가 선행 SPEC 의 재시도 정책을 변경 없이
재사용함을 검증한다 (REQ-STATE-001).

---

## Scenario 9: gpxpath / themedescs 원형 전달 — sanitization 미적용

**Given** mock `KtoHttpClient` 가 다음 응답을 반환하도록 설정된 상태에서:

- `courseList` 응답: `items[0].gpxpath = 'https://example.com/test.gpx?param=1&other=2'`
- `routeList` 응답: `items[0].themedescs = '<p>남파랑길은 <br/>부산에서</p>'`

**When** `DurunubiService.courseList()` / `routeList()` 를 호출하고 응답을
받으면

**Then** 다음을 만족한다:

- `items[0].gpxpath === 'https://example.com/test.gpx?param=1&other=2'` (URL
  query string 인코딩 변경 없음, KTO 원형 그대로)
- `items[0].themedescs === '<p>남파랑길은 <br/>부산에서</p>'` (HTML 태그 보존,
  sanitization 미적용)

이 시나리오는 SPEC `Exclusions` 의 GPX 다운로드/파싱 미적용 + HTML
sanitization 미적용 정책을 검증한다.

---

## Definition of Done (DoD)

다음 항목이 모두 PASS 일 때 SPEC-KTO-006 의 구현이 완료된 것으로 간주한다:

- [ ] 모든 9 시나리오 (Scenario 1~9) PASS
- [ ] `pnpm test` (단위) 회귀 0 + 신규 PASS
- [ ] `pnpm test:e2e` (e2e) 회귀 0 + 신규 PASS
- [ ] `pnpm build` (TypeScript 컴파일) PASS
- [ ] `pnpm lint` (ESLint type-aware) PASS
- [ ] 단위 테스트 라인 커버리지 ≥ 85%
- [ ] `kto_durunubi_courseList`, `kto_durunubi_routeList` 도구가 stdio 와
      streamable-http 양 transport 에서 정상 동작
- [ ] 선행 5 SPEC 의 42 도구 동작 변경 없음 (회귀 0)
- [ ] `BASE_URL_MAP` `@MX:NOTE` prose 변경 없음 (SPEC-KTO-005 에서 이미 4 패턴
      명시) + `@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 추가
- [ ] `src/kto/durunubi/types.ts` 의 두 interface (`DurunubiCourseItem`,
      `DurunubiRouteItem`) export 정상

---

## Quality Gate

- **TRUST 5 — Tested**: 단위 + e2e 커버리지 ≥ 85%, 회귀 0
- **TRUST 5 — Readable**: 한글 주석 / 영문 식별자, 선행 SPEC 패턴 그대로 복제
- **TRUST 5 — Unified**: 선행 5 SPEC 의 모듈/DTO/도구 명명 패턴과 100% 일치
- **TRUST 5 — Secured**: DTO 검증으로 잘못된 입력 차단, 외부 입력 sanitization
  은 LLM 클라이언트 책임 (XSS 표면 없음)
- **TRUST 5 — Trackable**: `@MX:SPEC` 마커로 SPEC ID 와 REQ ID 연결, 모든 변경이
  EARS REQ 와 1:1 매핑됨
