# Acceptance — SPEC-KTO-005 (KTO 관광지 오디오 가이드정보 Odii)

본 문서는 SPEC-KTO-005 의 검증 시나리오를 Given / When / Then 형식으로 정의한다.
모든 시나리오는 `pnpm test` (단위) 또는 `pnpm test:e2e` (e2e) 로 자동화 검증
가능해야 한다. 모든 사실은 사전 KTO 실호출에서 검증되었으며 `[ASSUMED]` 마커는
없다.

---

## Scenario 1: BASE_URL_MAP refactor 후 회귀 0

**Given** SPEC-KTO-001 ~ SPEC-KTO-004 의 234 단위 테스트 + 7 e2e 테스트가 main
branch (commit 4f40b1a) 에서 모두 PASS 인 상태에서

**When** `src/kto/common/constants.ts` 에 `Odii:
'http://apis.data.go.kr/B551011/Odii'` 1줄을 추가하고 `@MX:NOTE` prose 를 4
패턴으로 보강한 뒤 `pnpm test` 와 `pnpm test:e2e` 를 실행하면

**Then** 기존 234 단위 + 7 e2e 모두 PASS (도구 카운트 assertion 는 `34` → `42`
갱신만 적용) 하고, 신규 단위 spec (BASE_URL_MAP 의 `Odii` 항목 검증) 가 PASS
한다.

---

## Scenario 2: tools/list 카운트 34 → 42

**Given** SPEC-KTO-005 의 `AudioGuideService` 와 `ODII_TOOLS` (8 도구) 가
`src/main.ts` 의 `registerAll()` registries 배열에 추가된 상태에서

**When** MCP 클라이언트가 stdio 또는 streamable-http 모드로 서버에 접속하여
`tools/list` 를 호출하면

**Then** 응답의 `tools` 배열은 정확히 **42 개** 도구를 포함하며 (KoreanTour 15
+ BarrierFree 10 + PhotoGallery 4 + GoCamping 5 + AudioGuide 8 = 42), 그 중
`name` 이 `kto_audio_` 로 시작하는 도구가 정확히 **8 개** 다.

---

## Scenario 3: storyBasedList(langCode='ko') happy path

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `Odii` API 가
정상이며, `kto_audio_storyBasedList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_audio_storyBasedList` 를 호출하고
입력 파라미터로 `{ langCode: 'ko', numOfRows: 1 }` 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 6,000 (사전 검증값 6,281 부근)
- `items` 배열 길이 = 1 (numOfRows 영향)
- `items[0].audioUrl` 필드가 `https://` 로 시작하는 URL 문자열
- `items[0].title`, `items[0].audioTitle`, `items[0].script`, `items[0].playTime`
  필드 모두 정의됨 (string)
- `items[0].langCode === 'ko'`

---

## Scenario 4: storyLocationBasedList 좌표 누락 → MCP -32602

**Given** `kto_audio_storyLocationBasedList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_audio_storyLocationBasedList` 를
호출하면서 `{ langCode: 'ko' }` 만 전달 (`mapX` / `mapY` / `radius` 누락) 하면

**Then** 다음을 모두 만족한다:

- 서버는 KTO endpoint 로 outbound HTTP 요청을 0회 수행 (DTO 단계 차단).
- 응답은 MCP 표준 도구 에러 (JSON-RPC `-32602` Invalid params 또는 동등).
- 에러 메시지는 누락된 `mapX` / `mapY` / `radius` 중 최소 하나를 명시.

---

## Scenario 5: themeSearchList keyword 누락 → MCP -32602

**Given** `kto_audio_themeSearchList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_audio_themeSearchList` 를
호출하면서 `{ langCode: 'ko' }` 만 전달 (`keyword` 누락) 하면

**Then** 다음을 모두 만족한다:

- 서버는 KTO endpoint 로 outbound HTTP 요청을 0회 수행.
- 응답은 MCP 표준 도구 에러 (`-32602` 또는 동등).
- 에러 메시지는 `keyword` 누락을 명시.

---

## Scenario 6: langCode 누락 → MCP -32602 (8 도구 모두)

**Given** `kto_audio_*` prefix 의 8 도구가 모두 등록된 상태에서

**When** MCP 클라이언트가 다음 8 도구 각각에 대해 `langCode` 누락 입력으로
`tools/call` 을 수행하면 (`kto_audio_storyBasedList` 는 `{}` 입력,
`kto_audio_storyLocationBasedList` 는 `{ mapX: '127', mapY: '37', radius: '1000' }`
입력 등 — 다른 필수 필드는 채우되 `langCode` 만 누락):

- `kto_audio_storyBasedList`
- `kto_audio_storyBasedSyncList`
- `kto_audio_storyLocationBasedList`
- `kto_audio_storySearchList`
- `kto_audio_themeBasedList`
- `kto_audio_themeBasedSyncList`
- `kto_audio_themeLocationBasedList`
- `kto_audio_themeSearchList`

**Then** 8 도구 호출 모두에 대해:

- 서버는 KTO endpoint 로 outbound HTTP 요청을 0회 수행.
- 응답은 MCP 표준 도구 에러 (`-32602` 또는 동등).
- 에러 메시지는 `langCode` 누락을 명시.

---

## Scenario 7: langCode='ja' → 정상 응답 (KTO 0 records 정책 통과)

**Given** `kto_audio_storyBasedList` 도구가 등록된 상태이고 KTO `Odii` API 가
정상인 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_audio_storyBasedList` 를 호출하고
입력 파라미터로 `{ langCode: 'ja' }` 를 전달하면 (KTO 가 일본어 콘텐츠를
미보유)

**Then** 다음을 만족한다:

- 서버는 outbound HTTP 1회 수행 (DTO 검증 통과).
- 응답은 정상 envelope (`-32602` 또는 다른 에러가 아님).
- 응답의 `totalCount === 0` 또는 `'0'` (KTO 정책 그대로 통과).
- 응답의 `items` 배열 길이 = 0 (정규화로 빈 배열).
- DTO 단계에서 `langCode` 값을 enum 으로 거부하지 않음을 검증.

---

## Scenario 8: SPEC-KTO-001 ~ SPEC-KTO-004 회귀 보호

**Given** SPEC-KTO-001 ~ SPEC-KTO-004 가 main branch 에 머지된 상태에서

**When** SPEC-KTO-005 의 모든 변경 (`BASE_URL_MAP` 1줄 + `audio-guide` 모듈 신규
+ `app.module.ts` 1줄 + `main.ts` registries 1 항목 + e2e 카운트 assertion
갱신) 이 적용된 후 `pnpm test` 와 `pnpm test:e2e` 를 실행하면

**Then** 다음을 모두 만족한다:

- 기존 `kto_korean_*` 15 도구의 등록·JSON Schema·검증 동작·재시도 동작·정규화
  출력 모두 변경 없음.
- 기존 `kto_barrier_free_*` 10 도구의 등록·JSON Schema·검증 동작·재시도 동작·
  정규화 출력 모두 변경 없음.
- 기존 `kto_photo_*` 4 도구의 등록·JSON Schema·검증 동작·재시도 동작·정규화
  출력 모두 변경 없음.
- 기존 `kto_camping_*` 5 도구의 등록·JSON Schema·검증 동작·재시도 동작·정규화
  출력 모두 변경 없음.
- `KtoHttpClient` 의 flat-error envelope 검출 동작 모두 변경 없음.
- `src/kto/kto-http.client.spec.ts`,
  `src/kto/korean-tour-info/korean-tour-info.service.spec.ts`,
  `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`,
  `src/kto/photo-gallery/photo-gallery.service.spec.ts`,
  `src/kto/go-camping/go-camping.service.spec.ts`,
  `src/mcp/tool-registry.spec.ts` 의 모든 assertion 이 변경 없이 PASS.

---

## Scenario 9: Coverage ≥ 85%

**Given** SPEC-KTO-005 의 모든 신규 파일이 작성되고 단위 테스트가 동반된 상태에서

**When** `pnpm test:cov` 명령을 실행하면

**Then** 다음을 만족한다:

- statements 커버리지 ≥ 85%
- branches 커버리지 ≥ 80%
- functions 커버리지 ≥ 85%
- lines 커버리지 ≥ 85%
- 신규 디렉토리 `src/kto/audio-guide/` 의 statements 커버리지 ≥ 85%
- 선행 4 SPEC 의 모듈별 커버리지가 본 SPEC 적용 전후 비교 시 유의미한 하락 없음
  (delta ≥ -2%).

---

## Scenario 10: themeBasedList(langCode='en') 0 records 정상 통과

**Given** `kto_audio_themeBasedList` 도구가 등록된 상태이고 KTO `Odii` API 가
정상이며, KTO 가 영어 Theme 카탈로그를 미정비 (totalCount=0) 한 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_audio_themeBasedList` 를 호출하고
입력 파라미터로 `{ langCode: 'en' }` 를 전달하면

**Then** 다음을 만족한다:

- 응답은 정상 envelope (에러 아님).
- `totalCount === 0` 또는 `'0'`.
- `items` 배열 길이 = 0 (response-normalizer 가 `items: ""` → `[]` 정규화).
- KTO 의 콘텐츠 미보유를 에러로 변환하지 않고 그대로 통과시킴 (Exclusions 정책
  4번 — "다국어 Theme 자동 보강 미실시" 검증).

---

## Definition of Done

본 SPEC 의 완료 기준 (모두 만족 필수):

- [ ] Scenario 1 ~ 10 모두 PASS
- [ ] `pnpm lint` 무경고 무에러
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 단위 테스트 모두 PASS
- [ ] `pnpm test:e2e` e2e 테스트 모두 PASS
- [ ] `pnpm test:cov` statements ≥ 85%
- [ ] `tools/list` 응답 도구 카운트 = 42
- [ ] `kto_audio_*` prefix 도구 카운트 = 8
- [ ] `OdiiStoryItem` 과 `OdiiThemeItem` 양 interface 가 `src/kto/audio-guide/types.ts`
      에서 export 되며, 양쪽 모두 인덱스 시그니처 보유
- [ ] `BASE_URL_MAP` 의 `@MX:NOTE` prose 가 4 패턴 모두 명시
- [ ] `BASE_URL_MAP` 의 `@MX:SPEC` 라인에 `SPEC-KTO-005 REQ-OPT-001` 포함
- [ ] 신규 라이브러리 의존성 0건
- [ ] 신규 추상화 (베이스 클래스, 추상 인터페이스) 0건
- [ ] 본 SPEC 의 Exclusions 10 항목 모두 미구현 (책임 경계 준수)

---

## Quality Gate Criteria

| Gate | 기준 | 측정 방법 |
|------|-----|----------|
| Tested | statements 커버리지 ≥ 85% | `pnpm test:cov` |
| Readable | 명명·주석 일관성 | `pnpm lint` 통과 + 코드 리뷰 |
| Unified | 선행 SPEC 패턴 일관성 (DTO 패턴·service 패턴·tools 패턴) | `pnpm format` + diff 리뷰 |
| Secured | 입력 검증 (DTO `class-validator`) | DTO `dto.spec.ts` PASS |
| Trackable | `@MX:SPEC` 라인에 SPEC ID 포함 | constants.ts diff 검증 |

---

Version: 0.1.0
Last Updated: 2026-05-09
