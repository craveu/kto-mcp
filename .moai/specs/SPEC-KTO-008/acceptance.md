# Acceptance — SPEC-KTO-008 (KTO 의료관광 정보 MdclTursmService)

본 문서는 SPEC-KTO-008 의 검증 시나리오를 Given / When / Then 형식으로 정의한다.
모든 시나리오는 `pnpm test` (단위) 또는 `pnpm test:e2e` (e2e) 로 자동화 검증
가능해야 한다. 모든 사실은 사전 KTO 실호출에서 검증되었으며 `[ASSUMED]` 마커는
없다.

---

## Scenario 1: BASE_URL_MAP refactor 후 회귀 0

**Given** SPEC-KTO-001 ~ SPEC-KTO-007 의 단위 테스트 + e2e 테스트가 main branch
(commit 52e0e6d) 에서 모두 PASS 인 상태에서

**When** `src/kto/common/constants.ts` 에 `MdclTursmService:
'http://apis.data.go.kr/B551011/MdclTursmService'` 1줄을 추가하고 `@MX:NOTE`
prose 를 5 패턴 → 6 패턴 으로 갱신 (`langDivCd` 파라미터 패턴 명시), `@MX:SPEC`
라인에 `SPEC-KTO-008 REQ-OPT-001` 항목을 추가한 뒤 `pnpm test` 와 `pnpm test:e2e`
를 실행하면

**Then** 기존 단위 + e2e 모두 PASS 하고 (도구 카운트 assertion 은 `48` → `55`
갱신만 적용), 신규 단위 spec (BASE_URL_MAP 의 `MdclTursmService` 항목 검증) 가
PASS 한다. `@MX:NOTE` 갱신 prose 가 6 패턴을 명시하며 (V2 다국어, V2 단독,
suffix 없음, langCode 파라미터, **langDivCd 파라미터** 추가), 기존 SPEC-KTO-001
~ SPEC-KTO-007 의 BASE_URL_MAP 회귀 0.

---

## Scenario 2: tools/list 카운트 48 → 55 (MdclTursmService 7 도구 추가)

**Given** SPEC-KTO-008 의 `MedicalTourismService` 와 `MEDICAL_TOURISM_TOOLS`
(7 도구) 가 `src/main.ts` 의 `registerAll()` registries 배열에 추가된 상태에서

**When** MCP 클라이언트가 stdio 또는 streamable-http 모드로 서버에 접속하여
`tools/list` 를 호출하면

**Then** 응답의 `tools` 배열은 정확히 **55 개** 도구를 포함하며 (KoreanTour 15
+ BarrierFree 10 + PhotoGallery 4 + GoCamping 5 + AudioGuide 8 + Durunubi 2 +
PetTour 4 + MedicalTourism 7 = 55), 그 중 `name` 이 `kto_medical_` 로 시작하는
도구가 정확히 **7 개** 이다. 7 도구의 이름은 다음과 같다:

- `kto_medical_areaBasedList`
- `kto_medical_locationBasedList`
- `kto_medical_searchKeyword`
- `kto_medical_mdclTursmSyncList`
- `kto_medical_detailMdclTursm`
- `kto_medical_detailCommon`
- `kto_medical_detailIntro`

또한 모든 7 도구의 inputSchema 가 `langDivCd` 를 required field 로 명시하며,
description 에 권장값 (`KOR`/`ENG`/`CHS`/`CHT`/`JPN`) + default `'KOR'` 가이드
포함.

---

## Scenario 3: areaBasedList happy path — 의료관광 의료기관 목록

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `MdclTursmService`
API 가 정상이며, `kto_medical_areaBasedList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_medical_areaBasedList` 를 호출
하고 입력 파라미터로 `{ langDivCd: 'KOR', numOfRows: 5 }` 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 300 (사전 검증값 336~337 — KTO 가 큐레이팅한 전체 의료관광
  의료기관 카운트)
- `items` 배열 길이 = 5 (numOfRows 영향)
- `items[0].contentId` 필드가 string (camelCase 명명, NOT `contentid`)
- `items[0].title` 필드가 string (영어 + 한국어 병기 형식, 예:
  `"1stbutton Rhinoplasty clinic (첫단추의원)"`)
- `items[0].mapX`, `items[0].mapY` 필드가 정의됨 (camelCase 좌표 string,
  NOT `mapx`/`mapy`)
- `items[0].baseAddr` 필드가 string (영문 주소)
- `items[0].langDivCd` 필드가 string (server-normalized, 보통 `"ENG"`)

---

## Scenario 4: 모든 7 도구에서 langDivCd 누락 → MCP -32602 (validation)

**Given** `kto_medical_*` 7 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 다음 7 호출을 각각 시도하면 (모두
`langDivCd` 누락):

- `kto_medical_areaBasedList({})`
- `kto_medical_locationBasedList({ mapX: 126.9779, mapY: 37.5664, radius: 20000 })`
- `kto_medical_searchKeyword({ keyword: 'Rhinoplasty' })`
- `kto_medical_mdclTursmSyncList({})`
- `kto_medical_detailMdclTursm({ contentId: '1234' })`
- `kto_medical_detailCommon({ contentId: '1234' })`
- `kto_medical_detailIntro({ contentId: '1234' })`

**Then** 모든 7 호출이 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을
만족한다:

- KTO API 호출은 발생하지 않는다 (DTO 검증 단계에서 즉시 차단).
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "langDivCd should
  not be empty").

또한 `langDivCd: ''` (빈 문자열) 전달 시도 동일하게 `-32602` 반환 (`@IsNotEmpty()`
검증).

---

## Scenario 5: locationBasedList 좌표 누락 → MCP -32602 (validation)

**Given** `kto_medical_locationBasedList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_medical_locationBasedList` 를
호출하고 다음 잘못된 입력을 각각 전달하면:

- `{ langDivCd: 'KOR' }` (mapX/mapY/radius 모두 누락)
- `{ langDivCd: 'KOR', mapX: 126.9779 }` (mapY/radius 누락)
- `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664 }` (radius 누락)
- `{ langDivCd: 'KOR', mapX: "abc", mapY: 37.5664, radius: 20000 }` (mapX 가
  number 가 아님)
- `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664, radius: 0 }` (radius < 1)
- `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664, radius: 25000 }` (radius
  > 20000)

**Then** 응답은 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을 만족한다:

- KTO API 호출은 발생하지 않는다 (DTO 검증 단계에서 즉시 차단).
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "mapX should not
  be empty", "mapY must be a number", "radius must not be greater than
  20000").

---

## Scenario 6: searchKeyword keyword 누락 → MCP -32602 (validation)

**Given** `kto_medical_searchKeyword` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_medical_searchKeyword` 를 호출
하고 다음 잘못된 입력을 각각 전달하면:

- `{ langDivCd: 'KOR' }` (keyword 누락)
- `{ langDivCd: 'KOR', keyword: '' }` (keyword 빈 문자열)
- `{ langDivCd: 'KOR', keyword: 'Rhinoplasty', numOfRows: 0 }` (numOfRows 잘못된
  값)

**Then** 응답은 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을 만족한다:

- KTO API 호출은 발생하지 않는다.
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "keyword should not
  be empty", "numOfRows must not be less than 1").

---

## Scenario 7: detail* 3 도구 contentId 누락 → MCP -32602 (validation)

**Given** `kto_medical_detailMdclTursm`, `kto_medical_detailCommon`,
`kto_medical_detailIntro` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 다음 6 호출을 각각 시도하면:

- `kto_medical_detailMdclTursm({ langDivCd: 'KOR' })` (contentId 누락)
- `kto_medical_detailMdclTursm({ langDivCd: 'KOR', contentId: '' })` (contentId 빈 문자열)
- `kto_medical_detailCommon({ langDivCd: 'KOR' })` (contentId 누락)
- `kto_medical_detailCommon({ langDivCd: 'KOR', contentId: '' })` (contentId 빈 문자열)
- `kto_medical_detailIntro({ langDivCd: 'KOR' })` (contentId 누락)
- `kto_medical_detailIntro({ langDivCd: 'KOR', contentId: '' })` (contentId 빈 문자열)

**Then** 모든 6 호출이 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을
만족한다:

- KTO API 호출은 발생하지 않는다.
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "contentId should
  not be empty").

---

## Scenario 8: mdclTursmSyncList happy path — 전체 의료관광 데이터셋 동기화

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `MdclTursmService`
API 가 정상이며, `kto_medical_mdclTursmSyncList` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_medical_mdclTursmSyncList` 를
호출하고 입력 파라미터로 `{ langDivCd: 'KOR', numOfRows: 1 }` 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` > 0 (의료관광 sync 전체 records)
- `items` 배열 길이 = 1
- `items[0].contentId` 가 string (camelCase)
- `items[0].title` 이 string
- 응답 record 가 `showflag` 또는 `oldContentId` 필드를 정의한 경우 string
  타입 (sync 전용 필드 — 활성/삭제/병합 추적).

또한 `numOfRows: 100` 로 호출 시 100 records 가 반환되며, 페이지네이션 정상
동작.

---

## Scenario 9: SPEC-KTO-001 ~ SPEC-KTO-007 회귀 — 기존 48 도구 정상 동작

**Given** SPEC-KTO-008 의 모든 변경 (BASE_URL_MAP 1줄 + `@MX:NOTE` prose 갱신
+ `src/kto/medical-tourism/` 디렉토리 + `app.module.ts` + `main.ts` 갱신) 이
적용된 상태에서

**When** MCP 클라이언트가 다음 도구들을 각각 호출하면:

- `kto_korean_areaCode2` (SPEC-KTO-001)
- `kto_korean_detailPetTour2` (SPEC-KTO-001 — R7 해소 검증)
- `kto_barrier_free_areaBasedList2` (SPEC-KTO-002)
- `kto_photo_galleryList1` (SPEC-KTO-003)
- `kto_camping_basedList` (SPEC-KTO-004)
- `kto_audio_storyBasedList` (SPEC-KTO-005)
- `kto_durunubi_courseList` (SPEC-KTO-006)
- `kto_pet_areaBasedList2` (SPEC-KTO-007)
- `kto_pet_petTourSyncList2` (SPEC-KTO-007)

**Then** 모든 도구가 SPEC-KTO-008 적용 이전과 동일한 응답을 반환한다:

- 응답 envelope 구조 변경 없음 (`items`, `totalCount`, `numOfRows`, `pageNo`
  모두 존재).
- 재시도 정책 변경 없음 (`RETRY_CONFIG` 그대로 적용).
- DTO 검증 변경 없음.
- flat error envelope 검출 변경 없음.
- BASE_URL_MAP 회귀 0 — 기존 16 항목 모두 변경 없음.

이 시나리오는 SPEC-KTO-008 가 비파괴 (non-breaking) 확장임을 검증한다.

---

## Scenario 10: 단위 테스트 커버리지 ≥ 85%

**Given** SPEC-KTO-008 의 모든 코드 변경 (`src/kto/medical-tourism/**/*.ts` +
`src/kto/common/constants.ts` 1줄 + `src/app.module.ts` + `src/main.ts`) 이
적용된 상태에서

**When** `pnpm test:cov` (단위 테스트 + coverage) 를 실행하면

**Then** 다음 커버리지 임계치를 만족한다:

- `src/kto/medical-tourism/medical-tourism.service.ts` — line coverage ≥ 85%,
  branch coverage ≥ 80%
- `src/kto/medical-tourism/medical-tourism.tools.ts` — line coverage ≥ 85%,
  branch coverage ≥ 80%
- `src/kto/medical-tourism/dto/*.ts` — line coverage ≥ 90% (DTO 는 단순 검증
  클래스)
- `src/kto/medical-tourism/types.ts` — type-only 파일이므로 runtime 커버리지
  측정 대상 외 (TypeScript declaration only).
- 전체 프로젝트 라인 커버리지 ≥ 85% (선행 SPEC 정책 그대로).

---

## Scenario 11: 5xx 재시도 — RETRY_CONFIG 그대로 적용

**Given** mock `KtoHttpClient` 가 첫 호출에서 `503 Service Unavailable` 을, 2번째
호출에서 `503` 을, 3번째 호출에서 정상 응답을 반환하도록 설정된 상태에서

**When** `MedicalTourismService.areaBasedList({ langDivCd: 'KOR' })`,
`MedicalTourismService.locationBasedList({ langDivCd: 'KOR', mapX: 126.9779,
mapY: 37.5664, radius: 20000 })`, `MedicalTourismService.searchKeyword({
langDivCd: 'KOR', keyword: 'Rhinoplasty' })`,
`MedicalTourismService.mdclTursmSyncList({ langDivCd: 'KOR' })`,
`MedicalTourismService.detailMdclTursm({ langDivCd: 'KOR', contentId: '1234' })`,
`MedicalTourismService.detailCommon({ langDivCd: 'KOR', contentId: '1234' })`,
또는 `MedicalTourismService.detailIntro({ langDivCd: 'KOR', contentId: '1234' })`
중 하나를 호출하면

**Then** 다음을 만족한다:

- 총 호출 횟수 = 3 (초기 1 + 재시도 2)
- 최종 응답은 정상 envelope 으로 반환됨
- 재시도 간격은 `RETRY_CONFIG` (base 200ms, factor 2.0, jitter ±20%) 적용
- 4번째 호출도 5xx 인 경우 `KtoApiError` 발생 (max 3 retries 초과)

이 시나리오는 SPEC-KTO-008 의 service 가 선행 SPEC 의 재시도 정책을 변경 없이
재사용함을 검증한다 (REQ-STATE-001).

---

## Scenario 12: MdclTursmItem 응답 원형 전달 — camelCase 필드 보존

**Given** mock `KtoHttpClient` 가 다음 응답을 반환하도록 설정된 상태에서:

- `areaBasedList` 응답: `items[0] = { contentId: '1234', title: '1stbutton
  Rhinoplasty clinic (첫단추의원)', baseAddr: 'Seoul, ...', mapX: '127.0276',
  mapY: '37.4979', orgImage: 'http://tong.visitkorea.or.kr/cms/.../org.jpg',
  thumbImage: 'http://tong.visitkorea.or.kr/cms/.../thumb.jpg', regDt:
  '20240101000000', mdfcnDt: '20240315120000', langDivCd: 'ENG' }`
- `mdclTursmSyncList` 응답: `items[0] = { contentId: '1234', showflag: '1',
  oldContentId: '1233', mdfcnDt: '20240315120000' }`
- `detailMdclTursm` 응답: `items[0] = { contentId: '1234', treatmentName:
  'Rhinoplasty', medicalDept: 'Plastic Surgery', infoCenter: '02-...',
  homepage: 'http://example.com/' }`

**When** `MedicalTourismService.areaBasedList()` /
`mdclTursmSyncList()` / `detailMdclTursm()` 를 호출하고 응답을 받으면

**Then** 다음을 만족한다:

- 모든 KTO 원형 필드가 `MdclTursmItem` 의 typed property 또는 인덱스 시그니처
  를 통해 노출됨.
- camelCase 명명 보존 — `contentId` (NOT `contentid`), `mapX` (NOT `mapx`),
  `mapY` (NOT `mapy`), `regDt` (NOT `createdtime`), `mdfcnDt` (NOT
  `modifiedtime`).
- `items[0].showflag` (sync 응답 전용), `items[0].oldContentId` (sync 전용),
  `items[0].treatmentName`/`medicalDept`/`infoCenter`/`homepage` (detail
  전용) 가 인덱스 시그니처 또는 typed property 로 접근 가능.
- 영어 + 한국어 병기 title 그대로 보존 (예: `"1stbutton Rhinoplasty clinic
  (첫단추의원)"` 변환 없음).
- URL 인코딩 변경 없음 (`orgImage`/`thumbImage` URL 그대로).

이 시나리오는 본 SPEC 이 KTO 원형 응답을 그대로 전달하며, KorService2 family
와 명명 도메인이 분리됨을 검증한다 (REQ-EVT-001, REQ-KTO8-003).

---

## Definition of Done (DoD)

다음 항목이 모두 PASS 일 때 SPEC-KTO-008 의 구현이 완료된 것으로 간주한다:

- [ ] 모든 12 시나리오 (Scenario 1~12) PASS
- [ ] `pnpm test` (단위) 회귀 0 + 신규 PASS
- [ ] `pnpm test:e2e` (e2e) 회귀 0 + 신규 PASS
- [ ] `pnpm build` (TypeScript 컴파일) PASS
- [ ] `pnpm lint` (ESLint type-aware) PASS
- [ ] 단위 테스트 라인 커버리지 ≥ 85%
- [ ] `kto_medical_*` 7 도구 (areaBasedList / locationBasedList /
      searchKeyword / mdclTursmSyncList / detailMdclTursm / detailCommon /
      detailIntro) 가 stdio 와 streamable-http 양 transport 에서 정상 동작
- [ ] 모든 7 도구의 inputSchema 가 `langDivCd` 를 required field 로 명시 +
      description 에 권장값 가이드 포함
- [ ] 선행 7 SPEC 의 48 도구 동작 변경 없음 (회귀 0)
- [ ] `BASE_URL_MAP` `@MX:NOTE` prose 갱신 (5 패턴 → 6 패턴, langDivCd
      파라미터 패턴 명시) + `@MX:SPEC` 라인에 `SPEC-KTO-008 REQ-OPT-001` 추가
- [ ] `src/kto/medical-tourism/types.ts` 의 `MdclTursmItem` interface export
      정상 (camelCase 명명 보존, KorService2 family 와 분리)
- [ ] `kto_korean_ldongCode2` 가 정상 동작 (`kto_medical_ldongCode` 미노출
      결정의 정합성 검증, R1 정책 적용)

---

## Quality Gate

- **TRUST 5 — Tested**: 단위 + e2e 커버리지 ≥ 85%, 회귀 0
- **TRUST 5 — Readable**: 한글 주석 / 영문 식별자, 선행 SPEC 패턴 그대로 복제
- **TRUST 5 — Unified**: 선행 7 SPEC 의 모듈/DTO/도구 명명 패턴과 100% 일치
- **TRUST 5 — Secured**: DTO 검증으로 잘못된 입력 차단 (`langDivCd`·좌표·반경·
  키워드·contentId required 필드 검증), 외부 입력 sanitization 은 LLM 클라
  이언트 책임
- **TRUST 5 — Trackable**: `@MX:SPEC` 마커로 SPEC ID 와 REQ ID 연결, 모든
  변경이 EARS REQ 와 1:1 매핑됨, KTO API 의 6번째 service path 패턴
  (`langDivCd` 파라미터 + lang fluid) 흡수가 본 SPEC 의 HISTORY 와 research.md
  에 명시됨
