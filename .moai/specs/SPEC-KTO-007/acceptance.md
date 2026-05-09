# Acceptance — SPEC-KTO-007 (KTO 반려동물 동반여행 정보 KorPetTourService2)

본 문서는 SPEC-KTO-007 의 검증 시나리오를 Given / When / Then 형식으로 정의한다.
모든 시나리오는 `pnpm test` (단위) 또는 `pnpm test:e2e` (e2e) 로 자동화 검증
가능해야 한다. 모든 사실은 사전 KTO 실호출에서 검증되었으며 `[ASSUMED]` 마커는
없다.

---

## Scenario 1: BASE_URL_MAP refactor 후 회귀 0

**Given** SPEC-KTO-001 ~ SPEC-KTO-006 의 367 단위 테스트 + 12 e2e 테스트가 main
branch (commit d92acd7) 에서 모두 PASS 인 상태에서

**When** `src/kto/common/constants.ts` 에 `KorPetTourService2:
'http://apis.data.go.kr/B551011/KorPetTourService2'` 1줄을 추가하고 `@MX:SPEC`
라인에 `SPEC-KTO-007 REQ-OPT-001` 항목을 추가한 뒤 `pnpm test` 와
`pnpm test:e2e` 를 실행하면

**Then** 기존 367 단위 + 12 e2e 모두 PASS 하고 (도구 카운트 assertion 은 `44`
→ `48` 갱신만 적용), 신규 단위 spec (BASE_URL_MAP 의 `KorPetTourService2` 항목
검증) 가 PASS 한다. `@MX:NOTE` prose 는 변경되지 않으므로 SPEC-KTO-005 에서
작성된 4 패턴 명시가 그대로 유지된다.

---

## Scenario 2: tools/list 카운트 44 → 48 (KorPetTourService2 4 도구 추가)

**Given** SPEC-KTO-007 의 `PetTourService` 와 `PET_TOUR_TOOLS` (4 도구) 가
`src/main.ts` 의 `registerAll()` registries 배열에 추가된 상태에서

**When** MCP 클라이언트가 stdio 또는 streamable-http 모드로 서버에 접속하여
`tools/list` 를 호출하면

**Then** 응답의 `tools` 배열은 정확히 **48 개** 도구를 포함하며 (KoreanTour 15
+ BarrierFree 10 + PhotoGallery 4 + GoCamping 5 + AudioGuide 8 + Durunubi 2 +
PetTour 4 = 48), 그 중 `name` 이 `kto_pet_` 로 시작하는 도구가 정확히 **4 개**
이다. 4 도구의 이름은 다음과 같다:

- `kto_pet_areaBasedList2`
- `kto_pet_locationBasedList2`
- `kto_pet_searchKeyword2`
- `kto_pet_petTourSyncList2`

---

## Scenario 3: areaBasedList2 happy path — 서울 pet-friendly 컨텐츠

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `KorPetTourService2`
API 가 정상이며, `kto_pet_areaBasedList2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_areaBasedList2` 를 호출하고
입력 파라미터로 `{ areaCode: '1', numOfRows: 5 }` (서울) 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 50 (사전 검증값 62 부근. 서울 pet-friendly 컨텐츠 카운트)
- `items` 배열 길이 = 5 (numOfRows 영향)
- `items[0].contentid` 필드가 string
- `items[0].title` 필드가 string (한글 컨텐츠명)
- `items[0].areacode === '1'` (KTO areaCode '1' = 서울)
- `items[0].mapx`, `items[0].mapy` 필드가 정의됨 (좌표 string)
- `items[0].addr1` 필드가 string (주소)

---

## Scenario 4: locationBasedList2 happy path — 서울시청 20km 반경

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `KorPetTourService2`
API 가 정상이며, `kto_pet_locationBasedList2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_locationBasedList2` 를 호출
하고 입력 파라미터로 `{ mapX: 126.9779, mapY: 37.5664, radius: 20000,
numOfRows: 10 }` (서울시청 20km) 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 60 (사전 검증값 75 부근)
- `items` 배열 길이 = 10
- 모든 `items[i]` 가 `mapx`, `mapy` 필드 정의됨
- 모든 `items[i].contentid` 가 string
- `items[i].dist` 필드 (KTO 가 거리 계산 결과 추가) 가 정의된 경우 number 또는
  string (KTO 원형 보존)

---

## Scenario 5: searchKeyword2 happy path — pet-friendly 카페 검색

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `KorPetTourService2`
API 가 정상이며, `kto_pet_searchKeyword2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_searchKeyword2` 를 호출하고
입력 파라미터로 `{ keyword: '카페', numOfRows: 5 }` 를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 15 (사전 검증값 19 — pet-friendly 카페 카운트)
- `items` 배열 길이 = 5
- 모든 `items[i].contentid` 가 string
- 모든 `items[i].title` 이 string (KTO 가 keyword 매칭 결과 반환, 카페 관련
  컨텐츠)

---

## Scenario 6: petTourSyncList2 happy path — 전체 pet 데이터셋 동기화

**Given** `KTO_SERVICE_KEY` 환경변수가 유효한 상태이고 KTO `KorPetTourService2`
API 가 정상이며, `kto_pet_petTourSyncList2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_petTourSyncList2` 를 호출하고
입력 파라미터로 `{ numOfRows: 1 }` (전체 totalCount 검증 목적, 1 record 만 받음)
를 전달하면

**Then** 응답은 다음을 만족한다:

- `totalCount` ≥ 10000 (사전 검증값 10167 — KTO 가 보유한 전체 pet-filtered
  컨텐츠)
- `items` 배열 길이 = 1
- `items[0].contentid` 가 string
- `items[0].title` 이 string
- `items[0].showflag` 필드가 정의된 경우 string ('1' active 또는 '0' deleted)

또한 `numOfRows: 100` 로 호출 시 100 records 가 반환되며, `pageNo: 102` 로
호출 시 (totalCount/100 = 102 페이지) 마지막 페이지의 records 를 정상 수신
가능 — 페이지네이션 정상 동작.

---

## Scenario 7: locationBasedList2 좌표 누락 → MCP -32602 (validation)

**Given** `kto_pet_locationBasedList2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_locationBasedList2` 를 호출
하고 다음 잘못된 입력을 각각 전달하면:

- `{}` (mapX/mapY/radius 모두 누락)
- `{ mapX: 126.9779 }` (mapY/radius 누락)
- `{ mapX: 126.9779, mapY: 37.5664 }` (radius 누락)
- `{ mapX: "abc", mapY: 37.5664, radius: 20000 }` (mapX 가 number 가 아님)
- `{ mapX: 126.9779, mapY: 37.5664, radius: 0 }` (radius < 1)
- `{ mapX: 126.9779, mapY: 37.5664, radius: 25000 }` (radius > 20000)

**Then** 응답은 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을 만족한다:

- KTO API 호출은 발생하지 않는다 (DTO 검증 단계에서 즉시 차단).
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "mapX should not be
  empty", "mapY must be a number", "radius must not be greater than 20000").

---

## Scenario 8: searchKeyword2 keyword 누락 → MCP -32602 (validation)

**Given** `kto_pet_searchKeyword2` 도구가 등록된 상태에서

**When** MCP 클라이언트가 `tools/call` 로 `kto_pet_searchKeyword2` 를 호출하고
다음 잘못된 입력을 각각 전달하면:

- `{}` (keyword 누락)
- `{ keyword: '' }` (keyword 빈 문자열)
- `{ keyword: '카페', numOfRows: 0 }` (numOfRows 잘못된 값 — 베이스 검증)

**Then** 응답은 MCP `-32602` (Invalid params) 에러를 반환하며, 다음을 만족한다:

- KTO API 호출은 발생하지 않는다.
- 에러 메시지는 class-validator 위반 항목을 명시한다 (예: "keyword should not
  be empty", "numOfRows must not be less than 1").

---

## Scenario 9: SPEC-KTO-001 ~ SPEC-KTO-006 회귀 — 기존 44 도구 정상 동작

**Given** SPEC-KTO-007 의 모든 변경 (BASE_URL_MAP 1줄 + `src/kto/pet-tour/`
디렉토리 + `app.module.ts` + `main.ts` 갱신) 이 적용된 상태에서

**When** MCP 클라이언트가 다음 도구들을 각각 호출하면:

- `kto_korean_areaCode2` (SPEC-KTO-001)
- `kto_korean_detailPetTour2` (SPEC-KTO-001 — R7 해소 검증)
- `kto_barrier_free_areaBasedList2` (SPEC-KTO-002)
- `kto_photo_galleryList1` (SPEC-KTO-003)
- `kto_camping_basedList` (SPEC-KTO-004)
- `kto_audio_storyBasedList` (SPEC-KTO-005)
- `kto_durunubi_courseList` (SPEC-KTO-006)

**Then** 모든 도구가 SPEC-KTO-007 적용 이전과 동일한 응답을 반환한다:

- 응답 envelope 구조 변경 없음 (`items`, `totalCount`, `numOfRows`, `pageNo`
  모두 존재).
- 재시도 정책 변경 없음 (`RETRY_CONFIG` 그대로 적용).
- DTO 검증 변경 없음.
- flat error envelope 검출 변경 없음.
- 특히 `kto_korean_detailPetTour2` 가 정상 동작함을 확인 — SPEC-KTO-007 이
  추가 도구 (`kto_pet_detailPetTour2`) 를 노출하지 않은 결정의 정합성 검증.

이 시나리오는 SPEC-KTO-007 가 비파괴 (non-breaking) 확장이며, SPEC-KTO-001 R7
위험을 본 SPEC 시점에 명시적으로 해소했음을 검증한다.

---

## Scenario 10: 단위 테스트 커버리지 ≥ 85%

**Given** SPEC-KTO-007 의 모든 코드 변경 (`src/kto/pet-tour/**/*.ts` +
`src/kto/common/constants.ts` 1줄 + `src/app.module.ts` + `src/main.ts`) 이
적용된 상태에서

**When** `pnpm test:cov` (단위 테스트 + coverage) 를 실행하면

**Then** 다음 커버리지 임계치를 만족한다:

- `src/kto/pet-tour/pet-tour.service.ts` — line coverage ≥ 85%, branch
  coverage ≥ 80%
- `src/kto/pet-tour/pet-tour.tools.ts` — line coverage ≥ 85%, branch
  coverage ≥ 80%
- `src/kto/pet-tour/dto/*.ts` — line coverage ≥ 90% (DTO 는 단순 검증 클래스)
- `src/kto/pet-tour/types.ts` — type-only 파일이므로 runtime 커버리지 측정
  대상 외 (TypeScript declaration only).
- 전체 프로젝트 라인 커버리지 ≥ 85% (선행 SPEC 정책 그대로).

---

## Scenario 11: 5xx 재시도 — RETRY_CONFIG 그대로 적용

**Given** mock `KtoHttpClient` 가 첫 호출에서 `503 Service Unavailable` 을, 2번째
호출에서 `503` 을, 3번째 호출에서 정상 응답을 반환하도록 설정된 상태에서

**When** `PetTourService.areaBasedList2({ areaCode: '1' })`,
`PetTourService.locationBasedList2({ mapX: 126.9779, mapY: 37.5664, radius:
20000 })`, `PetTourService.searchKeyword2({ keyword: '카페' })`, 또는
`PetTourService.petTourSyncList2({})` 중 하나를 호출하면

**Then** 다음을 만족한다:

- 총 호출 횟수 = 3 (초기 1 + 재시도 2)
- 최종 응답은 정상 envelope 으로 반환됨
- 재시도 간격은 `RETRY_CONFIG` (base 200ms, factor 2.0, jitter ±20%) 적용
- 4번째 호출도 5xx 인 경우 `KtoApiError` 발생 (max 3 retries 초과)

이 시나리오는 SPEC-KTO-007 의 service 가 선행 SPEC 의 재시도 정책을 변경 없이
재사용함을 검증한다 (REQ-STATE-001).

---

## Scenario 12: KorPetTourItem 응답 원형 전달 — 필드 보존

**Given** mock `KtoHttpClient` 가 다음 응답을 반환하도록 설정된 상태에서:

- `areaBasedList2` 응답: `items[0] = { contentid: '125266', contenttypeid: '12',
  title: '서울숲', addr1: '서울특별시 성동구', mapx: '127.0379', mapy: '37.5443',
  firstimage: 'http://tong.visitkorea.or.kr/cms/...jpg', cat1: 'A01',
  cat2: 'A0101', cat3: 'A01010100' }`
- `petTourSyncList2` 응답: `items[0] = { contentid: '125266', showflag: '1',
  modifiedtime: '20240115120000' }`

**When** `PetTourService.areaBasedList2()` / `petTourSyncList2()` 를 호출하고
응답을 받으면

**Then** 다음을 만족한다:

- 모든 KTO 원형 필드가 `KorPetTourItem` 의 typed property 또는 인덱스
  시그니처를 통해 노출됨.
- `items[0].showflag` (sync 응답 전용) 가 인덱스 시그니처 또는 typed property
  로 접근 가능.
- 필드명 변형 없음 (`contentid` 그대로, camelCase 변환 없음).
- URL 인코딩 변경 없음 (`firstimage` URL 그대로).

이 시나리오는 본 SPEC 이 KTO 원형 응답을 그대로 전달함을 검증한다 (REQ-EVT-001).

---

## Definition of Done (DoD)

다음 항목이 모두 PASS 일 때 SPEC-KTO-007 의 구현이 완료된 것으로 간주한다:

- [ ] 모든 12 시나리오 (Scenario 1~12) PASS
- [ ] `pnpm test` (단위) 회귀 0 + 신규 PASS
- [ ] `pnpm test:e2e` (e2e) 회귀 0 + 신규 PASS
- [ ] `pnpm build` (TypeScript 컴파일) PASS
- [ ] `pnpm lint` (ESLint type-aware) PASS
- [ ] 단위 테스트 라인 커버리지 ≥ 85%
- [ ] `kto_pet_areaBasedList2`, `kto_pet_locationBasedList2`,
      `kto_pet_searchKeyword2`, `kto_pet_petTourSyncList2` 도구가 stdio 와
      streamable-http 양 transport 에서 정상 동작
- [ ] 선행 6 SPEC 의 44 도구 동작 변경 없음 (회귀 0)
- [ ] `BASE_URL_MAP` `@MX:NOTE` prose 변경 없음 (SPEC-KTO-005 에서 이미 4 패턴
      명시) + `@MX:SPEC` 라인에 `SPEC-KTO-007 REQ-OPT-001` 추가
- [ ] `src/kto/pet-tour/types.ts` 의 `KorPetTourItem` interface export 정상
- [ ] `kto_korean_detailPetTour2` 가 정상 동작 (SPEC-KTO-001 R7 해소 정합성
      검증) 하며, `kto_pet_detailPetTour2` 는 노출되지 않음 (R1 정책 확장
      검증)

---

## Quality Gate

- **TRUST 5 — Tested**: 단위 + e2e 커버리지 ≥ 85%, 회귀 0
- **TRUST 5 — Readable**: 한글 주석 / 영문 식별자, 선행 SPEC 패턴 그대로 복제
- **TRUST 5 — Unified**: 선행 6 SPEC 의 모듈/DTO/도구 명명 패턴과 100% 일치
- **TRUST 5 — Secured**: DTO 검증으로 잘못된 입력 차단 (좌표·반경·키워드
  required 필드 검증), 외부 입력 sanitization 은 LLM 클라이언트 책임
- **TRUST 5 — Trackable**: `@MX:SPEC` 마커로 SPEC ID 와 REQ ID 연결, 모든
  변경이 EARS REQ 와 1:1 매핑됨, SPEC-KTO-001 R7 해소가 본 SPEC 의 HISTORY 와
  research.md 에 명시됨
