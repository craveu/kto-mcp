# Plan — SPEC-KTO-008 (KTO 의료관광 정보 MdclTursmService)

본 문서는 SPEC-KTO-008 의 구현 계획을 분해한다. 본 SPEC 은 패턴 복제(replication)
SPEC 이며, SPEC-KTO-001 ~ SPEC-KTO-007 의 공용 인프라를 100% 재사용한다. 신규
라이브러리·신규 추상화 도입 없음. 신규 다국어 패턴 1 (`langDivCd` 파라미터 —
KTO 의 6번째 service path 패턴 흡수).

방법론: `quality.development_mode` 따라가며 본 작업은 brownfield 확장이므로 TDD
기본 적용 (RED → GREEN → REFACTOR). 선행 SPEC 의 단위 테스트 패턴을 그대로
복제한다.

설계 결정 (lock-in):

- **BASE_URL_MAP key**: `MdclTursmService` (실제 KTO path 와 일치, KTO 공식
  약어 `Mdcl` 보존)
- **Tool prefix**: `kto_medical_*` (LLM-friendly, "의료관광" 영어화)
- **Module path**: `src/kto/medical-tourism/`
- **DTO class prefix**: `Mt` (MedicalTourism)
- **TypeScript Item interface**: `MdclTursmItem` (단일, in `types.ts`)
- **Tool name format**: `kto_medical_<exactOpName>` (camelCase 보존)
- **노출 오퍼레이션 수**: 7 (NOT 8) — List 3 + Sync 1 + Detail 3
- **R1 정책 적용**: `ldongCode` 미노출 (KorService2 의 `ldongCode2` 와 동일
  응답 추정, `kto_korean_ldongCode2` 단일 도구로 충분)
- **`langDivCd` 처리**: 모든 7 DTO 에서 required + string 검증만 (enum 미강제),
  inputSchema description 에 권장값 (`KOR`/`ENG`/`CHS`/`CHT`/`JPN`) + default
  `'KOR'` 가이드 명시

---

## Phase 1: BASE_URL_MAP refactor (1줄 추가)

### Phase 1.1: `src/kto/common/constants.ts` 1줄 추가 + `@MX:NOTE` 갱신

작업 항목:

- `BASE_URL_MAP` 객체에 `MdclTursmService:
  'http://apis.data.go.kr/B551011/MdclTursmService'` 1줄 추가. 기존 16 항목
  (V2 다국어 9 + KorWithService2 + PhotoGalleryService1 + GoCamping + Odii +
  Durunubi + KorPetTourService2) 뒤에 삽입 (전체 16 → 17 항목).
- `@MX:NOTE` prose 갱신 — **5 패턴 → 6 패턴**:
  - 기존 4 패턴 (V2 다국어, V2 단독, suffix 없음, langCode 파라미터) 유지.
  - **6번째 패턴 추가**: `langDivCd` 파라미터 (의료관광 전용, Odii 의 langCode
    패턴과 third-letter difference). 명시 prose 예시: "(5) 단일 path +
    `langDivCd` 파라미터 다국어 (MdclTursmService) — KTO 가 임의 값 수용,
    응답 lang 은 server-normalized."
  - 기존 prose 의 4 패턴 가이드 표는 유지하되, 6번째 패턴 가이드 1줄 추가:
    "langDivCd 파라미터 다국어 → MdclTursmService 패턴".
- `@MX:SPEC` 라인에 `SPEC-KTO-008 REQ-OPT-001` 추가 (전체 8 SPEC 모두 나열).
- `KtoServiceName` 타입은 `keyof typeof BASE_URL_MAP` 자동 추론으로
  `'MdclTursmService'` 가 포함됨 — 별도 코드 변경 불필요.

### Phase 1.2: 회귀 검증

작업 항목:

- `pnpm test src/kto/common/` 실행 → 기존 검증 PASS 확인 + `MdclTursmService`
  항목 1줄에 대한 신규 spec 추가 (URL ==
  `http://apis.data.go.kr/B551011/MdclTursmService`).
- `pnpm test src/kto/kto-http.client.spec.ts` 실행 → 기존 단위 PASS 유지.
- `pnpm test src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,
  go-camping,audio-guide,durunubi,pet-tour}` 실행 → 회귀 0 확인.

---

## Phase 2: types.ts + 7 DTOs

### Phase 2.1: `src/kto/medical-tourism/types.ts` interface 정의

작업 항목:

- `MdclTursmItem` interface 정의 (단일 entity, 7 노출 오퍼레이션 응답 흡수):
  - 모든 필드 optional 로 선언 (KTO 미보유 케이스 대비)
  - named property (camelCase 명명, KTO 원형 보존):
    - 공통 17 필드: `contentId`, `title`, `baseAddr`, `detailAddr`, `zipCd`,
      `tel`, `mapX`, `mapY`, `mlevel`, `lDongRegnCd`, `lDongSignguCd`,
      `orgImage`, `thumbImage`, `cpyrhtDivCd`, `regDt`, `mdfcnDt`, `langDivCd`
    - sync 전용 2 필드: `showflag`, `oldContentId`
  - 인덱스 시그니처: `[key: string]: string | undefined` (sync 응답의 추가
    필드, detail 응답의 의료관광 전용 메타 필드 — `treatmentName`,
    `medicalDept`, `infoCenter`, `homepage` 등 — 자동 흡수)
- interface 를 export 키워드로 노출.
- `@MX:NOTE`: "의료관광 KTO 응답 (camelCase 명명, KorService2 family 의
  KoreanTourItem lowercase 와 분리). sync 응답의 showflag/oldContentId,
  detail 응답의 treatmentName/medicalDept 등 인덱스 시그니처가 흡수." prose
  추가.
- `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-003` 라인 추가.

### Phase 2.2: 7 DTO 작성 (`src/kto/medical-tourism/dto/`)

공통 베이스 필드 (7 DTO 모두 보유):

- **`langDivCd!: string`** — `@IsNotEmpty()`, `@IsString()` (NEW required —
  KTO 게이트웨이 강제. inputSchema description 에 권장값 명시, default
  suggestion `'KOR'`)
- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

작업 항목 (7 DTO):

- **`MtAreaBasedListDto`** (`area-based-list.dto.ts`) — required 1 (langDivCd) +
  optional 추가 필드:
  - `sigunguCode?: string` — `@IsOptional()`, `@IsString()`
  - `cat1?: string` — `@IsOptional()`, `@IsString()`
  - `cat2?: string` — `@IsOptional()`, `@IsString()`
  - `cat3?: string` — `@IsOptional()`, `@IsString()`
  - `arrange?: string` — `@IsOptional()`, `@IsString()` (KTO 정렬 코드)

- **`MtLocationBasedListDto`** (`location-based-list.dto.ts`) — required 4:
  - `langDivCd!: string`
  - `mapX!: number` — `@IsNotEmpty()`, `@IsNumber()` (좌표 누락 → -32602)
  - `mapY!: number` — `@IsNotEmpty()`, `@IsNumber()`
  - `radius!: number` — `@IsNotEmpty()`, `@IsInt()`, `@Min(1)`, `@Max(20000)`
  - `arrange?: string` — `@IsOptional()`, `@IsString()`

- **`MtSearchKeywordDto`** (`search-keyword.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `keyword!: string` — `@IsNotEmpty()`, `@IsString()` (keyword 누락 → -32602)
  - `sigunguCode?: string` — `@IsOptional()`, `@IsString()`
  - `arrange?: string` — `@IsOptional()`, `@IsString()`

- **`MtMdclTursmSyncListDto`** (`mdcl-tursm-sync-list.dto.ts`) — required 1
  (langDivCd):
  - `showflag?: string` — `@IsOptional()`, `@IsString()` ('1' active / '0' deleted)
  - `syncModTime?: string` — `@IsOptional()`, `@IsString()` (동기화 기준 시각,
    형식 미명시이므로 string 검증만)

- **`MtDetailMdclTursmDto`** (`detail-mdcl-tursm.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()` (contentId 누락 →
    -32602)

- **`MtDetailCommonDto`** (`detail-common.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()`

- **`MtDetailIntroDto`** (`detail-intro.dto.ts`) — required 2:
  - `langDivCd!: string`
  - `contentId!: string` — `@IsNotEmpty()`, `@IsString()`

`dto/index.ts` — barrel export.

`dto/dto.spec.ts` — class-validator 검증 단위 테스트 (REQ-UNW-001):

- 모든 7 DTO: `langDivCd` 누락 → 실패, `langDivCd: ''` → 실패,
  `langDivCd: 'KOR'` → 통과, `langDivCd: 'random_string'` → 통과 (enum
  미강제), `langDivCd: 123` → 실패 (string 아님).
- `MtAreaBasedListDto`: `{ langDivCd: 'KOR' }` → 통과, `numOfRows=0` → 실패,
  `numOfRows=101` → 실패, `numOfRows="abc"` → 실패, `pageNo=0` → 실패.
- `MtLocationBasedListDto`: `{ langDivCd: 'KOR' }` → 실패 (mapX/mapY/radius
  required), `{ langDivCd: 'KOR', mapX: 126.9779 }` → 실패 (mapY/radius
  missing), `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664, radius:
  20000 }` → 통과, `{ langDivCd: 'KOR', mapX: "abc", mapY: 37.5664, radius:
  20000 }` → 실패 (mapX not number), `{ langDivCd: 'KOR', mapX: 126.9779,
  mapY: 37.5664, radius: 25000 }` → 실패 (radius > 20000).
- `MtSearchKeywordDto`: `{ langDivCd: 'KOR' }` → 실패 (keyword required),
  `{ langDivCd: 'KOR', keyword: '' }` → 실패 (keyword empty),
  `{ langDivCd: 'KOR', keyword: 'Rhinoplasty' }` → 통과.
- `MtMdclTursmSyncListDto`: `{ langDivCd: 'KOR' }` → 통과, 잘못된
  numOfRows/pageNo → 실패.
- `MtDetailMdclTursmDto`, `MtDetailCommonDto`, `MtDetailIntroDto`:
  `{ langDivCd: 'KOR' }` → 실패 (contentId required), `{ langDivCd: 'KOR',
  contentId: '' }` → 실패 (contentId empty), `{ langDivCd: 'KOR', contentId:
  '1234' }` → 통과.

### Phase 2.3: 회귀 검증

작업 항목:

- `pnpm test src/kto/medical-tourism/dto` 실행 → 모든 DTO 검증 PASS.
- `pnpm test src/kto/medical-tourism/types.spec.ts` (선택) → typed item shape
  검증.

---

## Phase 3: MedicalTourismService + tools.ts

### Phase 3.1: `src/kto/medical-tourism/medical-tourism.service.ts`

작업 항목:

- `MedicalTourismService` class 정의 (`@Injectable()`).
- 생성자에서 `KtoHttpClient` 를 DI 로 주입받는다 (선행 7 모듈 동일 패턴).
- 7 메서드 정의 (선행 SPEC 패턴 그대로 복제):
  - `areaBasedList(dto: MtAreaBasedListDto): Promise<{ items: MdclTursmItem[];
    totalCount: number; numOfRows: number; pageNo: number }>`
  - `locationBasedList(dto: MtLocationBasedListDto): Promise<{ ... }>`
  - `searchKeyword(dto: MtSearchKeywordDto): Promise<{ ... }>`
  - `mdclTursmSyncList(dto: MtMdclTursmSyncListDto): Promise<{ ... }>`
  - `detailMdclTursm(dto: MtDetailMdclTursmDto): Promise<{ ... }>`
  - `detailCommon(dto: MtDetailCommonDto): Promise<{ ... }>`
  - `detailIntro(dto: MtDetailIntroDto): Promise<{ ... }>`
- 각 메서드 내부:
  - `KtoHttpClient.fetch(serviceName='MdclTursmService', operation, params)`
    호출 (params 에 `langDivCd` 포함).
  - `response-normalizer` 의 `normalizeListResponse` 적용.
  - `items` 배열을 typed cast (`MdclTursmItem[]`) 으로 반환.
- `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-EVT-001` 라인 추가.

### Phase 3.2: `src/kto/medical-tourism/medical-tourism.tools.ts`

작업 항목:

- `MEDICAL_TOURISM_TOOLS: ToolRegistry` 배열 정의 (7 도구).
- 각 도구 항목 구조 (선행 SPEC 패턴 그대로):
  - `name`: `kto_medical_areaBasedList`, `kto_medical_locationBasedList`,
    `kto_medical_searchKeyword`, `kto_medical_mdclTursmSyncList`,
    `kto_medical_detailMdclTursm`, `kto_medical_detailCommon`,
    `kto_medical_detailIntro`.
  - `description`: 한글 1-2 줄 (오퍼레이션 의미 + 검증 totalCount + 사용 안내).
    `langDivCd` 파라미터 가이드 명시.
  - `inputSchema`: zod 또는 JSON Schema (DTO 와 1:1 정합). `langDivCd` 의
    description: `"의료관광 응답 언어 코드. 권장값: KOR, ENG, CHS, CHT, JPN. KTO 가 임의 문자열 수용 (server-normalized ENG 응답). default 'KOR' 권장."`
  - `handler`: `async (input) => service.<method>(dto)`.
- `description` 예시:
  - `kto_medical_areaBasedList`: "외국인 의료관광객 대상 KTO 큐레이팅 의료
    기관 (성형/치과/피부 등) 을 지역 기반으로 조회한다. 영어 제목 + 한국어
    병기 응답. 사전 검증: langDivCd='KOR' → totalCount=336~337."
  - `kto_medical_locationBasedList`: "의료관광 의료기관을 좌표 + 반경으로
    조회한다. mapX/mapY/radius 필수. langDivCd 필수."
  - `kto_medical_searchKeyword`: "의료관광 의료기관을 키워드로 검색한다.
    keyword 필수 (영어 검색어 권장 — 의료관광 데이터가 영어 기본). langDivCd
    필수."
  - `kto_medical_mdclTursmSyncList`: "의료관광 전체 카탈로그를 동기화 목적으로
    조회한다. MdclTursmService 고유 오퍼레이션. 응답 record 의 `showflag`
    필드로 active/deleted, `oldContentId` 필드로 컨텐츠 병합 추적."
  - `kto_medical_detailMdclTursm`: "의료기관 contentId 기반 의료관광 전용
    상세 조회. 진료과목 (`medicalDept`), 진료항목 (`treatmentName`), 안내센터
    (`infoCenter`), 홈페이지 (`homepage`) 등 의료관광 메타 응답."
  - `kto_medical_detailCommon`: "의료기관 contentId 기반 공통 정보 조회. KorService2 의 detailCommon2 와 응답 스키마 다름 — 의료관광 전용 필드 반환."
  - `kto_medical_detailIntro`: "의료기관 contentId 기반 소개 정보 조회. KorService2 의 detailIntro2 와 응답 스키마 다름."
- `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-UNW-001` 라인 추가.

### Phase 3.3: `medical-tourism.service.spec.ts` + `medical-tourism.tools.spec.ts`

작업 항목 (선행 SPEC 패턴 그대로 복제):

- `medical-tourism.service.spec.ts`:
  - mock `KtoHttpClient` 로 정상 응답 / flat error / 5xx + 재시도 / 잘못된
    envelope 시나리오 검증.
  - 7 메서드 (`areaBasedList`, `locationBasedList`, `searchKeyword`,
    `mdclTursmSyncList`, `detailMdclTursm`, `detailCommon`, `detailIntro`)
    별도 검증.
  - 각 호출에서 `langDivCd` 파라미터가 KTO 에 그대로 전달됨을 검증
    (mock spy).
- `medical-tourism.tools.spec.ts`:
  - 도구 등록 카운트 (`MEDICAL_TOURISM_TOOLS.length === 7`) 검증.
  - 도구 이름 prefix 정합성 (`kto_medical_` 시작) 검증.
  - 각 도구 `inputSchema` 와 DTO 1:1 정합 검증.
  - 모든 7 도구의 inputSchema 가 `langDivCd` 를 required field 로 명시함을
    검증.
  - `handler` 가 service 의 올바른 메서드 호출 검증.

---

## Phase 4: Module wiring

### Phase 4.1: `src/kto/medical-tourism/medical-tourism.module.ts`

작업 항목:

- `@Module({ providers: [MedicalTourismService, KtoHttpClient], exports:
  [MedicalTourismService] })` 패턴 (선행 7 모듈 동일).
- `KtoHttpClient` 는 `KtoModule` 에서 export 되므로 import 시 재사용.

### Phase 4.2: `src/app.module.ts`

작업 항목:

- `import { MedicalTourismModule } from './kto/medical-tourism/medical-tourism.module';`
  1줄 추가.
- `imports` 배열에 `MedicalTourismModule` 추가 (전체 8 KTO 모듈).

### Phase 4.3: `src/main.ts`

작업 항목:

- `const medicalTourismService = app.get(MedicalTourismService);` 라인 추가
  (선행 7 service 획득 패턴 동일).
- `registerAll()` 의 `registries` 배열에 `{ tools: MEDICAL_TOURISM_TOOLS,
  service: medicalTourismService }` 1 항목 추가 (전체 8 등록 — registries
  8번째 항목).

### Phase 4.4: 회귀 검증

작업 항목:

- `pnpm build` 실행 → TypeScript 컴파일 PASS.
- `pnpm test` 실행 → 단위 회귀 0 + 신규 단위 PASS.
- `pnpm start:dev` 실행 → NestJS 부트스트랩 정상 (로그에 8 KTO 모듈 모두 등록
  표시).

---

## Phase 5: e2e 검증

### Phase 5.1: `test/kto.e2e-spec.ts` 갱신

작업 항목:

- 도구 카운트 assertion 갱신: `expect(tools.length).toBe(48)` → `toBe(55)`.
- `kto_medical_` prefix 도구 카운트 assertion 추가
  (`expect(medicalTools.length).toBe(7)`).
- `kto_medical_areaBasedList` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'KOR', numOfRows: 5 }`
  - 응답 검증: `totalCount > 300` (사전 검증값 336~337), `items.length === 5`,
    `items[0].contentId` string (camelCase), `items[0].title` string.
- `kto_medical_locationBasedList` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'KOR', mapX: 126.9779, mapY: 37.5664, radius: 20000,
    numOfRows: 10 }`
  - 응답 검증: `items.length <= 10`, `items[i].mapX`/`items[i].mapY`
    (camelCase) 정의됨.
- `kto_medical_searchKeyword` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'ENG', keyword: 'Rhinoplasty', numOfRows: 5 }`
  - 응답 검증: `items.length <= 5`, `items[i].title` string (영어 제목 +
    한국어 병기 형식).
- `kto_medical_mdclTursmSyncList` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'KOR', numOfRows: 1 }`
  - 응답 검증: `totalCount > 0`, `items[0].showflag` 또는
    `items[0].oldContentId` 가 정의된 경우 string.
- `kto_medical_detailMdclTursm` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'KOR', contentId: '<유효 contentId>' }` (areaBasedList
    응답에서 추출)
  - 응답 검증: `items.length === 1`, `items[0].contentId` 일치, 의료관광 전용
    필드 (`treatmentName` 또는 `medicalDept` 또는 `homepage`) 가 정의됨.
- `kto_medical_detailCommon` / `kto_medical_detailIntro` 호출 시나리오 추가:
  - 입력: `{ langDivCd: 'KOR', contentId: '<유효 contentId>' }`
  - 응답 검증: `items.length === 1`.
- 잘못된 입력 시나리오 추가:
  - **모든 7 도구**: `langDivCd` 누락 → MCP `-32602`.
  - `kto_medical_locationBasedList({ langDivCd: 'KOR', mapX: 126.9779 })`
    → MCP `-32602` (mapY/radius missing).
  - `kto_medical_searchKeyword({ langDivCd: 'KOR' })` → MCP `-32602`
    (keyword missing).
  - `kto_medical_detailMdclTursm({ langDivCd: 'KOR' })` → MCP `-32602`
    (contentId missing).
  - `kto_medical_detailCommon({ langDivCd: 'KOR' })` → MCP `-32602`
    (contentId missing).
  - `kto_medical_detailIntro({ langDivCd: 'KOR' })` → MCP `-32602`
    (contentId missing).
  - `kto_medical_areaBasedList({ langDivCd: 'KOR', numOfRows: 0 })` → MCP
    `-32602`.

### Phase 5.2: 전체 회귀 검증

작업 항목:

- `pnpm test:e2e` 실행 → 신규 시나리오 + 선행 시나리오 (SPEC-KTO-001 ~ 007)
  모두 PASS.
- 도구 카운트 48 → 55 갱신 확인.
- `kto_korean_*` / `kto_barrier_free_*` / `kto_photo_*` / `kto_camping_*` /
  `kto_audio_*` / `kto_durunubi_*` / `kto_pet_*` 의 등록·JSON Schema·검증·재
  시도·정규화·flat-error 검출 동작 모두 변경 없음 확인.

---

## 기술 결정

- 100% 재사용 — 신규 라이브러리, 신규 추상화 도입 없음.
- 8 오퍼레이션 중 7 노출 (List 3 + Sync 1 + Detail 3). 1 미노출 (`ldongCode`)
  — R1 정책 적용.
- KTO API 의 **6번째 service path 패턴** 흡수 — `langDivCd` 파라미터 + lang
  fluid (Odii 의 langCode 패턴과 third-letter difference). BASE_URL_MAP
  `@MX:NOTE` prose 갱신.
- DTO required 필드 — 모든 7 DTO 가 `langDivCd` 필수 + (op-specific):
  - `MtLocationBasedListDto`: + mapX, mapY, radius (4 required)
  - `MtSearchKeywordDto`: + keyword (2 required)
  - `MtDetailMdclTursmDto`, `MtDetailCommonDto`, `MtDetailIntroDto`:
    + contentId (2 required)
  - `MtAreaBasedListDto`, `MtMdclTursmSyncListDto`: langDivCd 만 required (1)
- 응답 entity 단일화 — `MdclTursmItem` 1 interface 가 7 오퍼레이션 응답을 모두
  흡수 (인덱스 시그니처가 sync 전용 `showflag`/`oldContentId` 필드, detail
  전용 의료관광 메타 필드 자동 흡수).
- 응답 명명 도메인 분리 — `MdclTursmItem` (camelCase `contentId`/`mapX`/`mapY`/
  `regDt`/`mdfcnDt`) 은 KorService2 family 의 `KoreanTourItem` (lowercase
  `contentid`/`mapx`/`mapy`/`createdtime`/`modifiedtime`) 과 별도 entity. KTO
  원형 명명 보존.
- 도구 이름 prefix `kto_medical_*` — "medical" 은 의료관광 도메인의 가장 짧고
  명확한 영문 표기 (LLM 가독성 우수).
- `langDivCd` enum 미강제 — KTO 가 any string 수용 (server-normalized ENG
  응답). DTO 에서 `@IsNotEmpty()` + `@IsString()` 만, inputSchema description
  에 권장값 가이드.

---

## 위험·완화

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | `langDivCd` 의 정확한 가능값 KTO 가이드 미공개 — KTO 가 any string 수용 (server-normalized ENG 응답) | DTO 에서 enum 미강제, `@IsNotEmpty()` + `@IsString()` 만 적용. inputSchema description 에 권장값 (`KOR`/`ENG`/`CHS`/`CHT`/`JPN`) + default `'KOR'` 가이드 명시. KTO 가 향후 새 lang 코드 도입 시 사용자가 즉시 사용 가능. |
| R2 | LOW | `detailCommon`/`detailIntro` 가 KorService2 측과 동일 contentId 사용 가능성 미확인 | 의료관광 contentId 는 별도 도메인으로 가정. 사용자가 contentId 누락 시 `-32602` 즉시 반환 (KTO 호출 발생 안 함). 잘못된 contentId 전달 시 KTO 가 NoData 반환 → 표준 KtoApiError 변환. |
| R3 | LOW | `detailMdclTursm` 의료관광 전용 응답 필드 정확한 셋 KTO 가이드 PDF 확인 필요 | typed interface `MdclTursmItem` 의 인덱스 시그니처 (`[key: string]: string | undefined`) 가 응답 추가 필드 자동 흡수. 사전 검증으로 핵심 필드 (`treatmentName`, `medicalDept`, `homepage`, `infoCenter`) 확인. |
| R4 | LOW | `ldongCode` 미노출에 대한 사용자 혼란 — `kto_medical_ldongCode` 같은 도구가 없는 것에 대한 의문 가능성 | research.md / spec.md / README 에 "법정동 코드는 `kto_korean_ldongCode2` 사용. KTO 의 법정동 코드 체계는 일반관광·반려동물·의료관광 모두 동일." 명시. R1 정책 적용 근거 명시. |

---

## MX Tag Plan

본 SPEC 의 변경에 따른 MX 태그 갱신:

- `src/kto/common/constants.ts`:
  - `@MX:NOTE` prose **갱신** — 5 패턴 → 6 패턴 (langDivCd 파라미터 명시).
  - `@MX:SPEC` 라인에 `SPEC-KTO-008 REQ-OPT-001` 추가.
- `src/kto/medical-tourism/types.ts`:
  - `@MX:NOTE`: "의료관광 KTO 응답 (camelCase 명명, KorService2 family 와
    분리). sync 전용 showflag/oldContentId, detail 전용 treatmentName/
    medicalDept 등 인덱스 시그니처 흡수." prose 추가.
  - `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-003` 라인 추가.
- `src/kto/medical-tourism/medical-tourism.service.ts`:
  - `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-EVT-001` 라인 추가.
  - 7 service 메서드 → `@MX:TODO test` 마커는 단위 테스트 작성 후 제거.
- `src/kto/medical-tourism/medical-tourism.tools.ts`:
  - `@MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-UNW-001` 라인 추가.

---

## 적용 순서 요약

1. Phase 1 — `constants.ts` 1줄 + `@MX:NOTE` prose 갱신 (5 패턴 → 6 패턴) +
   `@MX:SPEC` 갱신, 회귀 0 확인.
2. Phase 2 — `types.ts` 1 interface + 7 DTO + `dto/index.ts` + `dto.spec.ts`.
3. Phase 3 — `MedicalTourismService` + `MEDICAL_TOURISM_TOOLS` + 2 spec 파일.
4. Phase 4 — `medical-tourism.module.ts` + `app.module.ts` + `main.ts` 등록.
5. Phase 5 — `kto.e2e-spec.ts` 도구 카운트 48 → 55 + 7 시나리오 + 잘못된 입력
   시나리오 추가 (`langDivCd` 누락 + op-specific required 누락).

각 Phase 완료 후 `pnpm test` 와 `pnpm test:e2e` 실행하여 회귀 0 유지 확인.
