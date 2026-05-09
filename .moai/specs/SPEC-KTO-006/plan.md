# Plan — SPEC-KTO-006 (KTO 두루누비 정보 Durunubi)

본 문서는 SPEC-KTO-006 의 구현 계획을 분해한다. 본 SPEC 은 패턴 복제(replication)
SPEC 이며, SPEC-KTO-001 ~ SPEC-KTO-005 의 공용 인프라를 100% 재사용한다. 신규
라이브러리·신규 추상화·신규 다국어 패턴 도입 없음. 본 SPEC 은 현재까지 가장
작은 KTO SPEC 이다 (오퍼레이션 2 개, 도구 2 개).

방법론: `quality.development_mode` 따라가며 본 작업은 brownfield 확장이므로 TDD
기본 적용 (RED → GREEN → REFACTOR). 선행 SPEC 의 단위 테스트 패턴을 그대로
복제한다.

설계 결정 (lock-in):

- **BASE_URL_MAP key**: `Durunubi` (실제 KTO path 와 일치, suffix 없음)
- **Tool prefix**: `kto_durunubi_*` (KTO 공식 영문 transliteration)
- **Module path**: `src/kto/durunubi/`
- **DTO class prefix**: `Du` (Durunubi)
- **TypeScript Item interfaces**: `DurunubiCourseItem` + `DurunubiRouteItem`
  (in `types.ts`)
- **Tool name format**: `kto_durunubi_<exactOpName>` (camelCase 보존)

---

## Phase 1: BASE_URL_MAP refactor (1줄 추가)

### Phase 1.1: `src/kto/common/constants.ts` 1줄 추가

작업 항목:

- `BASE_URL_MAP` 객체에 `Durunubi: 'http://apis.data.go.kr/B551011/Durunubi'`
  1줄 추가. 기존 9 다국어 V2 + `KorWithService2` + `PhotoGalleryService1` +
  `GoCamping` + `Odii` 항목 뒤에 삽입 (전체 14 → 15 항목).
- `@MX:NOTE` prose 변경하지 않음. SPEC-KTO-005 에서 이미 4 패턴 (V2 다국어,
  V2 단독, suffix 없음, langCode 파라미터) 모두 명시되어 있으며, 두루누비는
  패턴 C (suffix 없는 평면 형태) 에 자연스럽게 흡수된다.
- `@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 추가 (전체 6 SPEC 모두 나열).
- `KtoServiceName` 타입은 `keyof typeof BASE_URL_MAP` 자동 추론으로 `'Durunubi'`
  가 포함됨 — 별도 코드 변경 불필요.

### Phase 1.2: 회귀 검증

작업 항목:

- `pnpm test src/kto/common/` 실행 → 기존 검증 PASS 확인 + `Durunubi` 항목
  1줄에 대한 신규 spec 추가 (URL == `http://apis.data.go.kr/B551011/Durunubi`).
- `pnpm test src/kto/kto-http.client.spec.ts` 실행 → 기존 단위 PASS 유지.
- `pnpm test src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,
  go-camping,audio-guide}` 실행 → 회귀 0 확인.

---

## Phase 2: types.ts + 2 DTOs

### Phase 2.1: `src/kto/durunubi/types.ts` 두 interface 정의

작업 항목:

- `DurunubiCourseItem` interface 정의:
  - 모든 필드 optional 로 선언 (KTO 미보유 케이스 대비)
  - named property: `routeIdx`, `crsIdx`, `crsKorNm`, `crsDstnc`,
    `crsTotlRqrmHour`, `crsLevel`, `crsCycle`, `crsContents`, `crsSummary`,
    `crsTourInfo`, `travelerinfo`, `sigun`, `brdDiv`, `gpxpath`, `createdtime`,
    `modifiedtime` (16 필드)
  - 인덱스 시그니처: `[key: string]: string | undefined`
- `DurunubiRouteItem` interface 정의:
  - 모든 필드 optional 로 선언
  - named property: `routeIdx`, `themeNm`, `linemsg`, `themedescs`,
    `createdtime`, `modifiedtime` (5 필드 외 시간 2 — 총 6)
  - 인덱스 시그니처: `[key: string]: string | undefined`
- 두 interface 모두 export 키워드로 노출.
- `@MX:NOTE`: "Course = 코스 GPX 단위, Route = 상위 카테고리 (테마)" prose 추가.
- `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-003` 라인 추가.

### Phase 2.2: 2 DTO 작성 (`src/kto/durunubi/dto/`)

공통 베이스 필드 (양 DTO 모두 보유, 모두 optional):

- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

작업 항목 (2 DTO):

- `DuCourseListDto` (`course-list.dto.ts`) — 추가 필드 없음.
- `DuRouteListDto` (`route-list.dto.ts`) — 추가 필드 없음. (totalCount=3 으로
  페이지네이션 사실상 무효이나 KTO 일관성을 위해 numOfRows/pageNo 노출.)

`langCode` 파라미터는 양 DTO 모두 미사용 — 두루누비 API 가 요구하지 않으므로
DTO 에 노출하지 않는다 (SPEC-KTO-005 Odii 와의 차별점).

`dto/index.ts` — barrel export.

`dto/dto.spec.ts` — class-validator 검증 단위 테스트:

- `DuCourseListDto`: 빈 입력 (`{}`) → 통과, `numOfRows=0` → 실패,
  `numOfRows=101` → 실패, `numOfRows="abc"` → 실패, `pageNo=0` → 실패.
- `DuRouteListDto`: 동일 검증.

### Phase 2.3: 회귀 검증

작업 항목:

- `pnpm test src/kto/durunubi/dto` 실행 → 모든 DTO 검증 PASS.
- `pnpm test src/kto/durunubi/types.spec.ts` (선택) → typed item shape 검증.

---

## Phase 3: DurunubiService + tools.ts

### Phase 3.1: `src/kto/durunubi/durunubi.service.ts`

작업 항목:

- `DurunubiService` class 정의 (`@Injectable()`).
- 생성자에서 `KtoHttpClient` 를 DI 로 주입받는다 (선행 5 모듈 동일 패턴).
- 2 메서드 정의 (선행 SPEC 패턴 그대로 복제):
  - `courseList(dto: DuCourseListDto): Promise<{ items: DurunubiCourseItem[];
    totalCount: number; numOfRows: number; pageNo: number }>`
  - `routeList(dto: DuRouteListDto): Promise<{ items: DurunubiRouteItem[];
    totalCount: number; numOfRows: number; pageNo: number }>`
- 각 메서드 내부:
  - `KtoHttpClient.fetch(serviceName='Durunubi', operation, params)` 호출.
  - `response-normalizer` 의 `normalizeListResponse` 적용.
  - `items` 배열을 typed cast (`DurunubiCourseItem[]` 또는
    `DurunubiRouteItem[]`) 으로 반환.
- `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-EVT-001` 라인 추가.

### Phase 3.2: `src/kto/durunubi/durunubi.tools.ts`

작업 항목:

- `DURUNUBI_TOOLS: ToolRegistry` 배열 정의 (2 도구).
- 각 도구 항목 구조 (선행 SPEC 패턴 그대로):
  - `name`: `kto_durunubi_courseList` / `kto_durunubi_routeList`
  - `description`: 한글 1-2 줄 (오퍼레이션 의미 + 단위 + 간단한 사용 안내).
  - `inputSchema`: zod 또는 JSON Schema (DTO 와 1:1 정합).
  - `handler`: `async (input) => service.courseList(dto)` 또는
    `service.routeList(dto)`.
- `description` 예시:
  - `kto_durunubi_courseList`: "코리아둘레길 트래킹 코스 목록을 조회한다.
    각 코스는 한글명, 거리, 소요시간, 난이도, GPX 파일 URL (`gpxpath`) 을
    포함하며 트래킹 워치/외부 앱이 GPX URL 을 받아 처리한다. 사전 검증
    totalCount=228."
  - `kto_durunubi_routeList`: "코리아둘레길 상위 테마 카테고리 목록을 조회한다
    (예: 남파랑길, 해파랑길, 평화누리길). 각 테마는 한글 테마명 (`themeNm`),
    한 줄 설명 (`linemsg`), HTML 포함 상세 설명 (`themedescs`) 을 포함한다.
    사전 검증 totalCount=3 — 페이지네이션 사실상 불필요."
- `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-UNW-001` 라인 추가.

### Phase 3.3: `durunubi.service.spec.ts` + `durunubi.tools.spec.ts`

작업 항목 (선행 SPEC 패턴 그대로 복제):

- `durunubi.service.spec.ts`:
  - mock `KtoHttpClient` 로 정상 응답 / flat error / 5xx + 재시도 / 잘못된
    envelope 시나리오 검증.
  - `courseList` / `routeList` 양 메서드 별도 검증.
- `durunubi.tools.spec.ts`:
  - 도구 등록 카운트 (`DURUNUBI_TOOLS.length === 2`) 검증.
  - 도구 이름 prefix 정합성 (`kto_durunubi_` 시작) 검증.
  - 각 도구 `inputSchema` 와 DTO 1:1 정합 검증.
  - `handler` 가 service 의 올바른 메서드 호출 검증.

---

## Phase 4: Module wiring

### Phase 4.1: `src/kto/durunubi/durunubi.module.ts`

작업 항목:

- `@Module({ providers: [DurunubiService, KtoHttpClient], exports:
  [DurunubiService] })` 패턴 (선행 5 모듈 동일).
- `KtoHttpClient` 는 `KtoModule` 에서 export 되므로 import 시 재사용.

### Phase 4.2: `src/app.module.ts`

작업 항목:

- `import { DurunubiModule } from './kto/durunubi/durunubi.module';` 1줄 추가.
- `imports` 배열에 `DurunubiModule` 추가 (전체 6 KTO 모듈).

### Phase 4.3: `src/main.ts`

작업 항목:

- `const durunubiService = app.get(DurunubiService);` 라인 추가 (선행 5 service
  획득 패턴 동일).
- `registerAll()` 의 `registries` 배열에 `{ tools: DURUNUBI_TOOLS, service:
  durunubiService }` 1 항목 추가 (전체 6 등록).

### Phase 4.4: 회귀 검증

작업 항목:

- `pnpm build` 실행 → TypeScript 컴파일 PASS.
- `pnpm test` 실행 → 단위 회귀 0 + 신규 단위 PASS.
- `pnpm start:dev` 실행 → NestJS 부트스트랩 정상 (로그에 6 KTO 모듈 모두 등록
  표시).

---

## Phase 5: e2e 검증

### Phase 5.1: `test/kto.e2e-spec.ts` 갱신

작업 항목:

- 도구 카운트 assertion 갱신: `expect(tools.length).toBe(42)` → `toBe(44)`.
- `kto_durunubi_` prefix 도구 카운트 assertion 추가 (`expect(durunubiTools.length).toBe(2)`).
- `kto_durunubi_courseList` 호출 시나리오 추가:
  - 입력: `{ numOfRows: 1 }`
  - 응답 검증: `totalCount > 200` (사전 검증 228), `items[0].crsKorNm`
    string, `items[0].gpxpath` URL pattern.
- `kto_durunubi_routeList` 호출 시나리오 추가:
  - 입력: `{}` (빈 입력 — totalCount=3 이므로 페이지네이션 불필요)
  - 응답 검증: `totalCount === 3`, `items.length === 3`,
    `items.every(i => i.themeNm && i.linemsg)`.
- 잘못된 입력 시나리오 추가:
  - `kto_durunubi_courseList({ numOfRows: 0 })` → MCP `-32602`.

### Phase 5.2: 전체 회귀 검증

작업 항목:

- `pnpm test:e2e` 실행 → 신규 시나리오 + 선행 시나리오 (SPEC-KTO-001 ~ 005) 모두
  PASS.
- 도구 카운트 42 → 44 갱신 확인.
- `kto_korean_*` / `kto_barrier_free_*` / `kto_photo_*` / `kto_camping_*` /
  `kto_audio_*` 의 등록·JSON Schema·검증·재시도·정규화·flat-error 검출 동작 모두
  변경 없음 확인.

---

## 기술 결정

- 100% 재사용 — 신규 라이브러리, 신규 패턴, 신규 추상화 도입 없음.
- 본 SPEC 은 현재까지 가장 작은 KTO SPEC (오퍼레이션 2 개).
- `langCode` 파라미터 미사용 — 두루누비 API 가 요구하지 않음.
- `gpxpath` URL / `themedescs` HTML 텍스트는 KTO 원형 그대로 전달 (다운로드/
  파싱/sanitization 미적용).
- DTO 의 모든 파라미터 optional — 빈 입력 (`{}`) 으로 호출 가능.
- DTO `DuCourseListDto`, `DuRouteListDto` 모두 베이스 필드 (`numOfRows?`,
  `pageNo?`) 외 추가 필드 없음.

---

## 위험·완화

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | Swagger description 은 "284 코스" 이나 실 응답 `totalCount=228`. 사용자가 카탈로그를 신뢰하다 실제 데이터 부족을 오인할 가능성. | research.md 와 spec.md 노트에 양쪽 수치 모두 명시. 코드에는 어떤 숫자도 박지 않고 응답값 그대로 전달. |
| R2 | LOW | `themedescs` 는 HTML 태그 (`<p>`, `<br>`) 포함. | XSS 위험 평가 — MCP 클라이언트는 LLM 응답을 HTML 렌더링하지 않으므로 표면 없음. 노트만 추가. |
| R3 | LOW | `routeList` totalCount=3 으로 페이지네이션 사실상 무효. 사용자가 페이지 파라미터를 의미 있게 지정해도 효과 없음. | SPEC 노트로 기록. DTO 호환성 보존 — 빈 입력으로 호출 시 KTO 기본값 사용. |
| R4 | LOW | KTO 가 향후 두루누비 API 에 다국어 변체 (예: `EngDurunubi`) 또는 `langCode` 파라미터를 추가할 가능성. | 현재 카탈로그·실호출에서 미확인. 발생 시 별도 SPEC (`SPEC-KTO-006-i18n` 후보) 으로 흡수. 본 SPEC 의 typed interface 설계는 인덱스 시그니처를 보유하므로 응답 새 필드 자동 흡수 가능. |

---

## MX Tag Plan

본 SPEC 의 변경에 따른 MX 태그 갱신:

- `src/kto/common/constants.ts`:
  - `@MX:NOTE` prose 변경 없음 (SPEC-KTO-005 에서 이미 4 패턴 명시됨).
  - `@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 추가.
- `src/kto/durunubi/types.ts`:
  - `@MX:NOTE`: "Course = 코스 GPX 단위, Route = 상위 카테고리 (테마)" 명시.
  - `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-003` 라인 추가.
- `src/kto/durunubi/durunubi.service.ts`:
  - `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-EVT-001` 라인 추가.
  - 2 service 메서드 → `@MX:TODO test` 마커는 단위 테스트 작성 후 제거.
- `src/kto/durunubi/durunubi.tools.ts`:
  - `@MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-UNW-001` 라인 추가.

---

## 적용 순서 요약

1. Phase 1 — `constants.ts` 1줄 + `@MX:SPEC` 갱신, 회귀 0 확인.
2. Phase 2 — `types.ts` 2 interface + 2 DTO + `dto/index.ts` + `dto.spec.ts`.
3. Phase 3 — `DurunubiService` + `DURUNUBI_TOOLS` + 2 spec 파일.
4. Phase 4 — `durunubi.module.ts` + `app.module.ts` + `main.ts` 등록.
5. Phase 5 — `kto.e2e-spec.ts` 도구 카운트 42 → 44 + 시나리오 추가.

각 Phase 완료 후 `pnpm test` 와 `pnpm test:e2e` 실행하여 회귀 0 유지 확인.
