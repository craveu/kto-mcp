# Plan — SPEC-KTO-007 (KTO 반려동물 동반여행 정보 KorPetTourService2)

본 문서는 SPEC-KTO-007 의 구현 계획을 분해한다. 본 SPEC 은 패턴 복제(replication)
SPEC 이며, SPEC-KTO-001 ~ SPEC-KTO-006 의 공용 인프라를 100% 재사용한다. 신규
라이브러리·신규 추상화·신규 다국어 패턴 도입 없음.

방법론: `quality.development_mode` 따라가며 본 작업은 brownfield 확장이므로 TDD
기본 적용 (RED → GREEN → REFACTOR). 선행 SPEC 의 단위 테스트 패턴을 그대로
복제한다.

설계 결정 (lock-in):

- **BASE_URL_MAP key**: `KorPetTourService2` (실제 KTO path 와 일치, V2 sibling
  pattern, KorWithService2 와 동일 형태)
- **Tool prefix**: `kto_pet_*`
- **Module path**: `src/kto/pet-tour/`
- **DTO class prefix**: `Pt` (PetTour)
- **TypeScript Item interface**: `KorPetTourItem` (단일, in `types.ts`)
- **Tool name format**: `kto_pet_<exactOpName>` (camelCase 보존)
- **노출 오퍼레이션 수**: 4 (NOT 9, NOT 13)
- **R7 해소 (SPEC-KTO-001)**: `detailPetTour2` 양 서비스 모두 보유 + 동일 응답
  검증 완료. `kto_korean_detailPetTour2` 단일 도구로 충분, `kto_pet_detailPetTour2`
  추가 노출 없음.

---

## Phase 1: BASE_URL_MAP refactor (1줄 추가)

### Phase 1.1: `src/kto/common/constants.ts` 1줄 추가

작업 항목:

- `BASE_URL_MAP` 객체에 `KorPetTourService2:
  'http://apis.data.go.kr/B551011/KorPetTourService2'` 1줄 추가. 기존 9 다국어
  V2 + `KorWithService2` + `PhotoGalleryService1` + `GoCamping` + `Odii` +
  `Durunubi` 항목 뒤에 삽입 (전체 15 → 16 항목).
- `@MX:NOTE` prose 변경하지 않음. SPEC-KTO-005 에서 이미 4 패턴 (V2 다국어,
  V2 단독, suffix 없음, langCode 파라미터) 모두 명시되어 있으며,
  KorPetTourService2 는 패턴 B (V2 sibling pattern, KorWithService2 와 동일
  형태) 의 자연스러운 확장이다. 신규 패턴 없음.
- `@MX:SPEC` 라인에 `SPEC-KTO-007 REQ-OPT-001` 추가 (전체 7 SPEC 모두 나열).
- `KtoServiceName` 타입은 `keyof typeof BASE_URL_MAP` 자동 추론으로
  `'KorPetTourService2'` 가 포함됨 — 별도 코드 변경 불필요.

### Phase 1.2: 회귀 검증

작업 항목:

- `pnpm test src/kto/common/` 실행 → 기존 검증 PASS 확인 + `KorPetTourService2`
  항목 1줄에 대한 신규 spec 추가 (URL ==
  `http://apis.data.go.kr/B551011/KorPetTourService2`).
- `pnpm test src/kto/kto-http.client.spec.ts` 실행 → 기존 단위 PASS 유지.
- `pnpm test src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,
  go-camping,audio-guide,durunubi}` 실행 → 회귀 0 확인.

---

## Phase 2: types.ts + 4 DTOs

### Phase 2.1: `src/kto/pet-tour/types.ts` interface 정의

작업 항목:

- `KorPetTourItem` interface 정의 (단일 entity, 4 노출 오퍼레이션 응답 흡수):
  - 모든 필드 optional 로 선언 (KTO 미보유 케이스 대비)
  - named property: `contentid`, `contenttypeid`, `title`, `addr1`, `addr2`,
    `zipcode`, `tel`, `areacode`, `sigungucode`, `cat1`, `cat2`, `cat3`,
    `mapx`, `mapy`, `mlevel`, `firstimage`, `firstimage2`, `cpyrhtDivCd`,
    `createdtime`, `modifiedtime`, `showflag` (21 필드 — `showflag` 는
    petTourSyncList2 전용)
  - 인덱스 시그니처: `[key: string]: string | undefined` (sync 응답의 추가
    필드 또는 KTO 향후 신규 필드 자동 흡수)
- interface 를 export 키워드로 노출.
- `@MX:NOTE`: "pet-filtered KTO content 응답 (KorService2 의 KoreanTourItem 과
  동일 골격, sync 전용 showflag 추가)" prose 추가.
- `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-003` 라인 추가.

### Phase 2.2: 4 DTO 작성 (`src/kto/pet-tour/dto/`)

공통 베이스 필드 (4 DTO 모두 보유, 모두 optional):

- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

작업 항목 (4 DTO):

- **`PtAreaBasedListDto`** (`area-based-list.dto.ts`) — 모든 추가 필드 optional:
  - `areaCode?: string` — `@IsOptional()`, `@IsString()`
  - `sigunguCode?: string` — `@IsOptional()`, `@IsString()`
  - `contentTypeId?: string` — `@IsOptional()`, `@IsString()`
  - `cat1?: string` — `@IsOptional()`, `@IsString()`
  - `cat2?: string` — `@IsOptional()`, `@IsString()`
  - `cat3?: string` — `@IsOptional()`, `@IsString()`
  - `arrange?: string` — `@IsOptional()`, `@IsString()` (KTO 정렬 코드)

- **`PtLocationBasedListDto`** (`location-based-list.dto.ts`) — required 필드 3:
  - `mapX!: number` — `@IsNotEmpty()`, `@IsNumber()` (좌표 누락 → -32602)
  - `mapY!: number` — `@IsNotEmpty()`, `@IsNumber()`
  - `radius!: number` — `@IsNotEmpty()`, `@IsInt()`, `@Min(1)`, `@Max(20000)`
    (KTO 단위 m, 최대 20km)
  - `contentTypeId?: string` — `@IsOptional()`, `@IsString()`
  - `arrange?: string` — `@IsOptional()`, `@IsString()`

- **`PtSearchKeywordDto`** (`search-keyword.dto.ts`) — required 필드 1:
  - `keyword!: string` — `@IsNotEmpty()`, `@IsString()` (keyword 누락 →
    -32602)
  - `contentTypeId?: string` — `@IsOptional()`, `@IsString()`
  - `areaCode?: string` — `@IsOptional()`, `@IsString()`
  - `sigunguCode?: string` — `@IsOptional()`, `@IsString()`
  - `arrange?: string` — `@IsOptional()`, `@IsString()`

- **`PtPetTourSyncListDto`** (`pet-tour-sync-list.dto.ts`) — 모든 필드 optional:
  - `showflag?: string` — `@IsOptional()`, `@IsString()` ('1' active / '0' deleted)
  - `syncModTime?: string` — `@IsOptional()`, `@IsString()` (동기화 기준 시각,
    형식 미명시이므로 string 검증만)

`langCode` 파라미터는 4 DTO 모두 미사용 — KorPetTourService2 가 다국어 변체를
미보유하므로 DTO 에 노출하지 않는다.

`dto/index.ts` — barrel export.

`dto/dto.spec.ts` — class-validator 검증 단위 테스트 (REQ-UNW-001):

- `PtAreaBasedListDto`: 빈 입력 (`{}`) → 통과, `numOfRows=0` → 실패,
  `numOfRows=101` → 실패, `numOfRows="abc"` → 실패, `pageNo=0` → 실패.
- `PtLocationBasedListDto`: `{}` → 실패 (mapX/mapY/radius required),
  `{ mapX: 126.9779 }` → 실패 (mapY/radius missing),
  `{ mapX: 126.9779, mapY: 37.5664, radius: 20000 }` → 통과,
  `{ mapX: "abc", mapY: 37.5664, radius: 20000 }` → 실패 (mapX not number),
  `{ mapX: 126.9779, mapY: 37.5664, radius: 25000 }` → 실패 (radius > 20000).
- `PtSearchKeywordDto`: `{}` → 실패 (keyword required),
  `{ keyword: '' }` → 실패 (keyword empty),
  `{ keyword: '카페' }` → 통과.
- `PtPetTourSyncListDto`: `{}` → 통과, 잘못된 numOfRows/pageNo → 실패.

### Phase 2.3: 회귀 검증

작업 항목:

- `pnpm test src/kto/pet-tour/dto` 실행 → 모든 DTO 검증 PASS.
- `pnpm test src/kto/pet-tour/types.spec.ts` (선택) → typed item shape 검증.

---

## Phase 3: PetTourService + tools.ts

### Phase 3.1: `src/kto/pet-tour/pet-tour.service.ts`

작업 항목:

- `PetTourService` class 정의 (`@Injectable()`).
- 생성자에서 `KtoHttpClient` 를 DI 로 주입받는다 (선행 6 모듈 동일 패턴).
- 4 메서드 정의 (선행 SPEC 패턴 그대로 복제):
  - `areaBasedList2(dto: PtAreaBasedListDto): Promise<{ items:
    KorPetTourItem[]; totalCount: number; numOfRows: number; pageNo: number }>`
  - `locationBasedList2(dto: PtLocationBasedListDto): Promise<{ ... }>`
  - `searchKeyword2(dto: PtSearchKeywordDto): Promise<{ ... }>`
  - `petTourSyncList2(dto: PtPetTourSyncListDto): Promise<{ ... }>`
- 각 메서드 내부:
  - `KtoHttpClient.fetch(serviceName='KorPetTourService2', operation, params)`
    호출.
  - `response-normalizer` 의 `normalizeListResponse` 적용.
  - `items` 배열을 typed cast (`KorPetTourItem[]`) 으로 반환.
- `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-EVT-001` 라인 추가.

### Phase 3.2: `src/kto/pet-tour/pet-tour.tools.ts`

작업 항목:

- `PET_TOUR_TOOLS: ToolRegistry` 배열 정의 (4 도구).
- 각 도구 항목 구조 (선행 SPEC 패턴 그대로):
  - `name`: `kto_pet_areaBasedList2`, `kto_pet_locationBasedList2`,
    `kto_pet_searchKeyword2`, `kto_pet_petTourSyncList2`
  - `description`: 한글 1-2 줄 (오퍼레이션 의미 + 검증 totalCount + 사용 안내).
  - `inputSchema`: zod 또는 JSON Schema (DTO 와 1:1 정합).
  - `handler`: `async (input) => service.<method>(dto)`.
- `description` 예시:
  - `kto_pet_areaBasedList2`: "반려동물 동반 가능한 KTO 컨텐츠를 지역 기반
    으로 조회한다. KorService2 의 superset 에서 pet-friendly 만 필터링된
    결과를 반환한다. 사전 검증: areaCode='1' (서울) → 62 hits."
  - `kto_pet_locationBasedList2`: "반려동물 동반 가능한 KTO 컨텐츠를 좌표 +
    반경으로 조회한다. mapX/mapY/radius 필수. 사전 검증: 서울시청 (126.9779,
    37.5664) 20km → 75 hits."
  - `kto_pet_searchKeyword2`: "반려동물 동반 가능한 KTO 컨텐츠를 키워드로 검색
    한다. keyword 필수. 사전 검증: keyword='카페' → 19 pet-friendly 카페 hits."
  - `kto_pet_petTourSyncList2`: "반려동물 동반 가능한 KTO 컨텐츠 전체 카탈로그
    를 동기화 목적으로 조회한다. KorPetTourService2 고유 오퍼레이션. 응답
    record 의 `showflag` 필드로 active/deleted 분기. 사전 검증 totalCount=
    10167 — 전체 pet 데이터셋 페이지네이션 동기화 가능."
- `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-UNW-001` 라인 추가.

### Phase 3.3: `pet-tour.service.spec.ts` + `pet-tour.tools.spec.ts`

작업 항목 (선행 SPEC 패턴 그대로 복제):

- `pet-tour.service.spec.ts`:
  - mock `KtoHttpClient` 로 정상 응답 / flat error / 5xx + 재시도 / 잘못된
    envelope 시나리오 검증.
  - 4 메서드 (`areaBasedList2`, `locationBasedList2`, `searchKeyword2`,
    `petTourSyncList2`) 별도 검증.
- `pet-tour.tools.spec.ts`:
  - 도구 등록 카운트 (`PET_TOUR_TOOLS.length === 4`) 검증.
  - 도구 이름 prefix 정합성 (`kto_pet_` 시작) 검증.
  - 각 도구 `inputSchema` 와 DTO 1:1 정합 검증.
  - `handler` 가 service 의 올바른 메서드 호출 검증.

---

## Phase 4: Module wiring

### Phase 4.1: `src/kto/pet-tour/pet-tour.module.ts`

작업 항목:

- `@Module({ providers: [PetTourService, KtoHttpClient], exports:
  [PetTourService] })` 패턴 (선행 6 모듈 동일).
- `KtoHttpClient` 는 `KtoModule` 에서 export 되므로 import 시 재사용.

### Phase 4.2: `src/app.module.ts`

작업 항목:

- `import { PetTourModule } from './kto/pet-tour/pet-tour.module';` 1줄 추가.
- `imports` 배열에 `PetTourModule` 추가 (전체 7 KTO 모듈).

### Phase 4.3: `src/main.ts`

작업 항목:

- `const petTourService = app.get(PetTourService);` 라인 추가 (선행 6 service
  획득 패턴 동일).
- `registerAll()` 의 `registries` 배열에 `{ tools: PET_TOUR_TOOLS, service:
  petTourService }` 1 항목 추가 (전체 7 등록 — registries 7번째 항목).

### Phase 4.4: 회귀 검증

작업 항목:

- `pnpm build` 실행 → TypeScript 컴파일 PASS.
- `pnpm test` 실행 → 단위 회귀 0 + 신규 단위 PASS.
- `pnpm start:dev` 실행 → NestJS 부트스트랩 정상 (로그에 7 KTO 모듈 모두 등록
  표시).

---

## Phase 5: e2e 검증

### Phase 5.1: `test/kto.e2e-spec.ts` 갱신

작업 항목:

- 도구 카운트 assertion 갱신: `expect(tools.length).toBe(44)` → `toBe(48)`.
- `kto_pet_` prefix 도구 카운트 assertion 추가
  (`expect(petTools.length).toBe(4)`).
- `kto_pet_areaBasedList2` 호출 시나리오 추가:
  - 입력: `{ areaCode: '1', numOfRows: 5 }`
  - 응답 검증: `totalCount > 50` (사전 검증값 62), `items.length === 5`,
    `items[0].contentid` string, `items[0].title` string.
- `kto_pet_locationBasedList2` 호출 시나리오 추가:
  - 입력: `{ mapX: 126.9779, mapY: 37.5664, radius: 20000, numOfRows: 10 }`
  - 응답 검증: `totalCount > 60` (사전 검증값 75), `items.length === 10`.
- `kto_pet_searchKeyword2` 호출 시나리오 추가:
  - 입력: `{ keyword: '카페', numOfRows: 5 }`
  - 응답 검증: `totalCount >= 15` (사전 검증값 19), `items.length === 5`.
- `kto_pet_petTourSyncList2` 호출 시나리오 추가:
  - 입력: `{ numOfRows: 1 }` (전체 totalCount 검증만 목적)
  - 응답 검증: `totalCount > 10000` (사전 검증값 10167), `items.length === 1`.
- 잘못된 입력 시나리오 추가:
  - `kto_pet_locationBasedList2({ mapX: 126.9779 })` → MCP `-32602` (mapY/
    radius missing).
  - `kto_pet_searchKeyword2({})` → MCP `-32602` (keyword missing).
  - `kto_pet_areaBasedList2({ numOfRows: 0 })` → MCP `-32602`.

### Phase 5.2: 전체 회귀 검증

작업 항목:

- `pnpm test:e2e` 실행 → 신규 시나리오 + 선행 시나리오 (SPEC-KTO-001 ~ 006)
  모두 PASS.
- 도구 카운트 44 → 48 갱신 확인.
- `kto_korean_*` / `kto_barrier_free_*` / `kto_photo_*` / `kto_camping_*` /
  `kto_audio_*` / `kto_durunubi_*` 의 등록·JSON Schema·검증·재시도·정규화·
  flat-error 검출 동작 모두 변경 없음 확인.

---

## 기술 결정

- 100% 재사용 — 신규 라이브러리, 신규 패턴, 신규 추상화 도입 없음.
- 13 오퍼레이션 중 4 노출 (List 3 + Sync 1). 9 미노출 (Code 4 + Detail 5)
  — R1 정책 확장.
- SPEC-KTO-001 R7 위험 (`detailPetTour2` 의 KorService2 포함 여부) 본 SPEC
  시점에 명시적으로 해소 — 양 서비스 모두 보유 + 동일 응답 검증 완료.
  `kto_korean_detailPetTour2` 단일 도구로 충분, 본 SPEC 에서
  `kto_pet_detailPetTour2` 추가 노출 없음.
- DTO required 필드:
  - `PtLocationBasedListDto`: mapX, mapY, radius (3 required)
  - `PtSearchKeywordDto`: keyword (1 required)
  - `PtAreaBasedListDto`, `PtPetTourSyncListDto`: 모두 optional
- 응답 entity 단일화 — `KorPetTourItem` 1 interface 가 4 오퍼레이션 응답을
  모두 흡수 (인덱스 시그니처가 sync 전용 `showflag` 필드 자동 흡수).
- 도구 이름 prefix `kto_pet_*` — "pet" 은 KTO 도메인의 가장 짧고 명확한 영문
  표기.

---

## 위험·완화

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | detail/code 9 오퍼레이션을 노출하지 않은 것에 대한 사용자 혼란 — `kto_pet_detailCommon2` 같은 도구가 없는 것에 대한 의문 가능성. | research.md / spec.md / README 에 "pet content 의 상세는 `kto_korean_detail*` 도구를 사용. KorService2 와 KorPetTourService2 의 detail 응답은 동일." 명시. R1 정책 확장 근거 (양 서비스 동일 응답) 명시. |
| R2 | LOW | `petTourSyncList2` 의 `syncModTime` 형식 (ISO 8601 vs YYYYMMDDHHMMSS) 미확인 — KTO Swagger description 미명시. | DTO 에서 `string` 으로만 검증하고 KTO 에 그대로 전달. 빈 입력 (`{}`) 호출이 default 동작으로 정상 작동함을 사전 검증 (totalCount=10167). 사용자가 잘못된 형식 전달 시 KTO 가 자체 에러 envelope 반환 — 표준 KtoApiError 로 변환되어 클라이언트에 전달. |
| R3 | LOW | KTO 향후 KorPetTourService2 다국어 변체 (예: `EngPetTourService2`) 또는 `langCode` 파라미터 추가 가능성. | 현재 카탈로그·실호출에서 미확인. 발생 시 별도 SPEC (예: `SPEC-KTO-007-i18n`) 으로 흡수. typed interface `KorPetTourItem` 의 인덱스 시그니처가 응답 새 필드 자동 흡수. |

---

## MX Tag Plan

본 SPEC 의 변경에 따른 MX 태그 갱신:

- `src/kto/common/constants.ts`:
  - `@MX:NOTE` prose 변경 없음 (SPEC-KTO-005 에서 이미 4 패턴 명시됨,
    KorPetTourService2 는 V2 sibling pattern 의 자연스러운 확장).
  - `@MX:SPEC` 라인에 `SPEC-KTO-007 REQ-OPT-001` 추가.
- `src/kto/pet-tour/types.ts`:
  - `@MX:NOTE`: "pet-filtered KTO content 응답 (KorService2 의 KoreanTourItem
    과 동일 골격, sync 전용 showflag 추가)" prose 추가.
  - `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-003` 라인 추가.
- `src/kto/pet-tour/pet-tour.service.ts`:
  - `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-EVT-001` 라인 추가.
  - 4 service 메서드 → `@MX:TODO test` 마커는 단위 테스트 작성 후 제거.
- `src/kto/pet-tour/pet-tour.tools.ts`:
  - `@MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-UNW-001` 라인 추가.

---

## 적용 순서 요약

1. Phase 1 — `constants.ts` 1줄 + `@MX:SPEC` 갱신, 회귀 0 확인.
2. Phase 2 — `types.ts` 1 interface + 4 DTO + `dto/index.ts` + `dto.spec.ts`.
3. Phase 3 — `PetTourService` + `PET_TOUR_TOOLS` + 2 spec 파일.
4. Phase 4 — `pet-tour.module.ts` + `app.module.ts` + `main.ts` 등록.
5. Phase 5 — `kto.e2e-spec.ts` 도구 카운트 44 → 48 + 4 시나리오 + 3 잘못된 입력 시나리오 추가.

각 Phase 완료 후 `pnpm test` 와 `pnpm test:e2e` 실행하여 회귀 0 유지 확인.
