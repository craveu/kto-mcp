# Plan: SPEC-KTO-004 (KTO MCP 서버 4차 이터레이션 — 고캠핑 정보조회)

## 개요

`spec.md` 의 요구사항을 만족하는 GoCamping 고캠핑 정보조회 모듈을 SPEC-KTO-001
(KorService2) / SPEC-KTO-002 (KorWithService2) / SPEC-KTO-003 (PhotoGalleryService1)
의 공용 인프라 위에 추가한다. 본 문서는 작업 분해(WBS), 핵심 기술 결정 사항(특히
신규 typed item `GoCampingItem` 정의 및 `BASE_URL_MAP` 1줄 + prose 1줄 확장), 위험
요소, 그리고 MX 태그 계획을 정의한다.

본 SPEC 은 패턴 복제 SPEC 이다. 신규 추상화·신규 라이브러리·신규 transport·신규 에러
모델 도입을 모두 금지하고, 선행 3 SPEC 의 모듈 패턴을 캠핑 도메인에 그대로 적용한다.

---

## 1. 기술 결정 사항

### 1.1 라이브러리 선정

신규 의존성 **없음**. SPEC-KTO-001 §1.1 + SPEC-KTO-002 §1.1 + SPEC-KTO-003 §1.1
에서 핀한 의존성을 그대로 재사용한다.

- `@modelcontextprotocol/sdk` (1.x)
- `axios`
- `class-validator`, `class-transformer`
- `fast-xml-parser`
- dev: `nock`, `jest`, `supertest`

### 1.2 도구 이름 prefix 결정

| 후보 | 평가 |
|------|------|
| `kto_go_camping_*` | KTO 서비스 path(`GoCamping`) 와 일치하나 스네이크 케이스 변환 시 토큰 길이가 길어 LLM `tools/list` 응답에서 가독성 저하. `kto_go_*` 부분이 의미 모호 |
| `kto_camping_*` (선정) | LLM 가독성·한국어 의미 매핑 명확. 기존 `kto_korean_*` (KorService2) / `kto_barrier_free_*` (KorWithService2) / `kto_photo_*` (PhotoGalleryService1) 와 prefix 충돌 없음. "캠핑" 도메인이 즉시 식별됨 |
| `kto_camp_*` | 너무 짧아 도메인 식별성 약함. `kto_camping_*` 가 자연스러움 |

선정 기준: MCP `tools/list` 응답에서 LLM 이 도구 의도를 1-shot 으로 식별 가능해야
하며, 선행 3 SPEC 의 prefix 와 단어 경계가 분명히 분리되어야 한다.

### 1.3 [핵심] `BASE_URL_MAP` 1줄 + prose 1줄 확장

#### 배경

`src/kto/common/constants.ts` 의 `BASE_URL_MAP` 은 SPEC-KTO-002 시점에 이미 "단일
flat namespace 에 (1) 언어 변체 + (2) 기능적 형제 서비스" 가 공존하는 의미로 갱신
되어 있다. 그러나 `GoCamping` 은 V/숫자 suffix 가 없는 **세 번째 명명 패턴 (C)** 이며,
기존 prose 의 두 카테고리 분류만으로는 의도가 흐려진다.

3 패턴 일람:

- (A) V2 다국어 코어: `KorService2`, `EngService2`, `JpnService2`, ..., `KorWithService2`
- (B) V1 단독 사이드: `PhotoGalleryService1`
- (C) 버전 suffix 없음: **`GoCamping`** (본 SPEC 신규)

#### 변경 내용

1줄 추가 (위치: `PhotoGalleryService1` 다음):

```ts
GoCamping: 'http://apis.data.go.kr/B551011/GoCamping',
```

`@MX:NOTE` prose 1줄 보강 — 기존 (`@MX:NOTE: ...언어 변체와 기능적 형제 서비스가
공존한다`) 텍스트에 다음 라인 1개 추가:

```
// 추가로 일부 도메인(GoCamping 등)은 버전 suffix 없는 평면 path 패턴을 사용한다.
```

`@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 추가 (기존 `SPEC-KTO-001 REQ-OPT-001,
SPEC-KTO-002 REQ-OPT-001, SPEC-KTO-003 REQ-OPT-001` 와 병기).

#### `KtoHttpClient` 인터페이스에 미치는 영향

- `KtoHttpClient.request({ service: KtoServiceName, ... })` 의 시그니처 변경 **없음**.
- `service: 'GoCamping'` 를 자연스럽게 받아들임 (`KtoServiceName` union 에 새 키
  추가일 뿐).
- 기존 KorService2 / KorWithService2 / PhotoGalleryService1 호출 사이트 변경 없음.

이 결정은 plan.md 의 Phase 1 작업으로 1줄 + prose 1줄 + `@MX:SPEC` 추가로 처리되며,
**breaking change 가 아니다**.

### 1.4 모듈 디렉토리 명명

선행 SPEC 측이 `src/kto/korean-tour-info/`, `src/kto/barrier-free-tour-info/`,
`src/kto/photo-gallery/` 인 점을 따라, 본 SPEC 은 **`src/kto/go-camping/`** 를 사용
한다 (kebab-case + 공식 도메인 명). NestJS 모듈명은 `GoCampingModule` (PascalCase).

`go-camping` 을 선택한 이유:

- KTO 공식 service path (`GoCamping`) 와 1:1 매핑되어 의미 추적이 명확
- "camping" 보다 KTO 데이터셋 공식 명명 (`고캠핑`) 의 정확한 영문 표기
- 향후 일반 캠핑 도메인 SPEC 등장 시(`SPEC-KTO-CAMP-XXX`) 명명 충돌 방지

### 1.5 [핵심] 신규 typed item `GoCampingItem` + `GoCampingImageItem` 도입 결정

#### 배경

GoCamping 응답 item 은 캠핑 도메인 특화 필드 50+ 종을 포함한다. SPEC-KTO-003 의
`PhotoGalleryItem` (`gal*` prefix 9~11 필드) 보다 훨씬 풍부하며, 모든 필드를 named
property 로 두면 interface 가 비대해지고 향후 KTO 가 필드를 추가할 때마다 갱신
부담이 크다.

또한 `imageList` 응답 item 은 5 필드의 명확히 다른 스키마이므로, 단일 `GoCampingItem`
으로 처리하면 type 안전성이 떨어진다.

#### 옵션 비교

| 항목 | Option A (선정) — 핵심 named + 인덱스 시그니처 + 별도 ImageItem | Option B — 모든 필드 named property | Option C — `T = unknown` 유지 |
|------|--------------------|--------------------|--------------------|
| 응답 타입 (4 list ops) | `KtoListResponse<GoCampingItem>` | 동일 | `KtoListResponse<unknown>` |
| 응답 타입 (imageList) | `KtoListResponse<GoCampingImageItem>` | `KtoListResponse<GoCampingItem>` (다른 필드 셋이지만 흡수) | `KtoListResponse<unknown>` |
| LLM 클라이언트 추론 | 강함 (핵심 30 필드 명시 + 인덱스로 확장) | 매우 강함 (60 필드 모두 명시) | 약함 |
| 신규 코드량 | `types.ts` 1 파일 (≈ 50줄, 두 interface) | `types.ts` 1 파일 (≈ 80줄) | 없음 |
| 향후 확장성 | KTO 신규 필드 자동 흡수 (인덱스 시그니처) | KTO 신규 필드마다 interface 갱신 | 도구별 description 모두 갱신 |
| 모든 필드 type-check | 핵심 필드만 (인덱스 부분은 `string \| undefined`) | 모든 필드 | 미적용 |
| imageList 별도 typing | 명확한 분리 | imageList 가 일반 필드 셋과 섞여 type 모호 | 미적용 |

#### 선정: **Option A**

근거:

1. **확장성 우선** — KTO 가 향후 추가할 필드를 자동으로 흡수. SPEC-KTO-003 의 `gal*`
   prefix 처럼 명확한 명명 컨벤션이 없으므로 (캠핑 필드는 `facltNm`, `mapX`,
   `glampInnerFclty` 등 혼합), interface 단일화를 위해 인덱스 시그니처가 자연스러움.
2. **핵심 식별성 보장** — 자주 사용되는 30개 핵심 필드는 named 로 두어 LLM 클라이언트
   가 응답 구조를 1-shot 으로 추론 가능.
3. **imageList 별도 typing** — 5 필드의 단순 스키마는 명확히 분리하여 type 안전성
   향상.
4. **신규 추상화 금지 정책 위반 아님** — 두 interface 모두 기존 `KtoListResponse<T>`
   의 `T` parameter instantiate 형태이며, 신규 generic·신규 abstract class·신규
   helper 함수를 도입하지 않는다.
5. **변경량 최소** — `types.ts` 1 파일 추가만으로 5 도구의 반환 타입이 결정됨.

#### 사용 패턴

```ts
// src/kto/go-camping/types.ts
export interface GoCampingItem {
  /** 콘텐츠 ID (캠핑장 식별자) */
  contentId: string;

  // 핵심 식별·위치
  facltNm?: string;
  lineIntro?: string;
  intro?: string;
  addr1?: string;
  addr2?: string;
  mapX?: string;
  mapY?: string;
  zipcode?: string;
  doNm?: string;
  sigunguNm?: string;

  // 운영·사업자
  induty?: string;
  lctCl?: string;
  facltDivNm?: string;
  mangeDivNm?: string;
  mgcDiv?: string;
  manageSttus?: string;
  hvofBgnde?: string;
  hvofEnddle?: string;
  prmisnDe?: string;
  bizrno?: string;
  trsagntNo?: string;
  insrncAt?: string;
  allar?: string;

  // 미디어·시간
  firstImageUrl?: string;
  createdtime?: string;
  modifiedtime?: string;

  // 연락·예약
  tel?: string;
  homepage?: string;
  resveUrl?: string;

  // basedSyncList 전용
  syncStatus?: string;

  // 나머지 30+ 필드 (시설 수량, 사이트 크기/바닥, 안전 설비, 글램핑/카라반, 테마)
  [key: string]: string | undefined;
}

export interface GoCampingImageItem {
  contentId: string;
  serialnum?: string;
  imageUrl?: string;
  createdtime?: string;
  modifiedtime?: string;
}
```

```ts
// src/kto/go-camping/go-camping.service.ts (sketch)
async basedList(params: GcBasedListDto):
  Promise<KtoListResponse<GoCampingItem>> { ... }

async imageList(params: GcImageListDto):
  Promise<KtoListResponse<GoCampingImageItem>> { ... }
```

### 1.6 DTO 클래스명 prefix 결정

선행 SPEC 의 패턴:

- KorService2 (SPEC-KTO-001): prefix 없음 (`AreaBasedListDto`, `DetailCommonDto`, ...)
- KorWithService2 (SPEC-KTO-002): `Bf` prefix (`BfAreaBasedListDto`, ...)
- PhotoGalleryService1 (SPEC-KTO-003): `Pg` prefix (`PgGalleryListDto`, ...)

본 SPEC 은 동일 정책으로 **`Gc` prefix** (Go Camping 약어) 를 사용한다. 예:
`GcBasedListDto`, `GcLocationBasedListDto`, `GcSearchListDto`, `GcImageListDto`,
`GcBasedSyncListDto`. 이유:

1. 향후 동일한 클래스명(`SearchListDto`, `BasedListDto`) 이 다른 도메인에 출현해도
   충돌 없음.
2. 모듈 디렉토리(`go-camping/`) 와 prefix(`Gc`) 가 일관됨.
3. 선행 SPEC 의 명명 정책과 일관성 유지.

### 1.7 DTO 필수 필드 결정

[VERIFIED — Swagger 2.0 parameters 검증 결과]

| 오퍼레이션 | DTO | 필수 필드 | 선택 필드 |
|------------|-----|-----------|-----------|
| `basedList` | `GcBasedListDto` | (없음) | `numOfRows?`, `pageNo?` |
| `basedSyncList` | `GcBasedSyncListDto` | (없음) | `numOfRows?`, `pageNo?`, `syncStatus?` (A/U/D), `syncModTime?` |
| `locationBasedList` | `GcLocationBasedListDto` | `mapX`, `mapY`, `radius` (≤20000) | `numOfRows?`, `pageNo?` |
| `searchList` | `GcSearchListDto` | `keyword` | `numOfRows?`, `pageNo?` |
| `imageList` | `GcImageListDto` | `contentId` | `numOfRows?`, `pageNo?` |

`mapX` / `mapY` / `radius` type 정책:

Swagger 가 모두 `string` 으로 명시하나, 사용자 친화성을 위해 DTO 에서 **number 도
허용** 한다 (`@IsNumberString` + `@IsNotEmpty` 또는 `@Type(() => Number) @IsNumber()`
중 후자 채택). outbound URL 직렬화 시 axios 가 자동 string 변환. radius 는 `@Max(20000)`
적용. SPEC-KTO-001 의 `LocationBasedListDto` (KorService2) 와 동일 정책.

### 1.8 도구 등록 방식 결정 — registries 배열 확장

`src/main.ts` 의 `registerAll()` 호출은 SPEC-KTO-003 시점에 이미 `ToolRegistry[]`
배열을 받는 형태로 3 항목 (`KOREAN_TOUR_INFO_TOOLS`, `BARRIER_FREE_TOUR_INFO_TOOLS`,
`PHOTO_GALLERY_TOOLS`) 으로 확장되어 있다:

```ts
registerAll(mcpServer, [
  { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
  { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeTourInfoService },
  { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
]);
```

본 SPEC 은 동일 배열에 **4번째 항목**을 추가:

```ts
registerAll(mcpServer, [
  { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
  { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeTourInfoService },
  { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
  { tools: GO_CAMPING_TOOLS, service: goCampingService },
]);
```

`tool-registry.ts` 자체는 변경 없음 (이미 `ToolRegistry[]` 다중 항목 지원).

---

## 2. Phase 별 작업 분해 (Priority-based)

### Phase 1: BASE_URL_MAP refactor [Priority High]

목적: 공용 상수 1줄 수정 + prose 1줄 보강 + `@MX:SPEC` 추가. 선행 3 SPEC 회귀
무사고 검증.

1. `src/kto/common/constants.ts`
   - `BASE_URL_MAP` 의 `PhotoGalleryService1` 항목 다음에 `GoCamping:
     'http://apis.data.go.kr/B551011/GoCamping'` 추가.
   - 위 `@MX:NOTE` prose 1줄 추가 — "추가로 일부 도메인(GoCamping 등)은 버전 suffix
     없는 평면 path 패턴을 사용한다."
   - `@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 추가.
2. `src/kto/kto-http.client.spec.ts` 에 `service: 'GoCamping'` 호출 케이스 1건 추가
   (정상 응답 모킹) — 기존 테스트 변경 없음.
3. `pnpm test` 전수 실행. 선행 3 SPEC 의 기존 unit + e2e 테스트가 변경 없이 모두
   PASS 확인 (REQ-UNW-002).

### Phase 2: go-camping DTOs + types.ts [Priority High]

목적: 오퍼레이션별 입력 DTO 작성 + 응답 typed item 정의.

4. `src/kto/go-camping/dto/` 디렉토리 생성.
5. `dto/based-list.dto.ts` — `GcBasedListDto`:
   - `numOfRows?: number`, `pageNo?: number` (모두 `@IsOptional()` + 타입 검증)
6. `dto/based-sync-list.dto.ts` — `GcBasedSyncListDto`:
   - `numOfRows?`, `pageNo?`, `syncStatus?` (`@IsOptional()` + `@IsIn(['A', 'U',
     'D'])`), `syncModTime?: string`
7. `dto/location-based-list.dto.ts` — `GcLocationBasedListDto`:
   - `mapX: number | string` (`@IsNotEmpty()`), `mapY: number | string`
     (`@IsNotEmpty()`), `radius: number | string` (`@IsNotEmpty()` + `@Max(20000)`)
   - `numOfRows?`, `pageNo?`
   - REQ-UNW-001 검증 대상 (3 필드 누락 차단)
8. `dto/search-list.dto.ts` — `GcSearchListDto`:
   - `keyword: string` (필수, `@IsString()` + `@IsNotEmpty()`)
   - `numOfRows?`, `pageNo?`
   - REQ-UNW-001 검증 대상
9. `dto/image-list.dto.ts` — `GcImageListDto`:
   - `contentId: string` (필수, `@IsString()` + `@IsNotEmpty()`)
   - `numOfRows?`, `pageNo?`
   - REQ-UNW-001 검증 대상
10. `dto/index.ts` 배럴 작성.
11. `types.ts` 작성 — `GoCampingItem` (30 named + 인덱스 시그니처) + `GoCampingImageItem`
    (5 필드) interface 두 개:
    - `@MX:NOTE` 추가 — KTO 캠핑 응답 스키마 계약 명시. 인덱스 시그니처 사용
      이유 (50+ 필드 자동 흡수) 명시.
12. `dto/dto.spec.ts` — REQ-UNW-001 검증 단위 테스트:
    - `GcLocationBasedListDto` 의 `mapX`/`mapY`/`radius` 누락 → 검증 실패
    - `GcLocationBasedListDto` 의 radius > 20000 → 검증 실패
    - `GcSearchListDto` 의 `keyword` 누락 → 검증 실패
    - `GcImageListDto` 의 `contentId` 누락 → 검증 실패
    - `GcBasedListDto` / `GcBasedSyncListDto` 의 모든 필드 부재 → 검증 통과 (선택)

### Phase 3: GoCampingService + tools.ts [Priority High]

목적: GoCamping 호출 메서드와 도구 메타데이터 정의.

13. `go-camping.service.ts`
    - `basedList(params: GcBasedListDto): Promise<KtoListResponse<GoCampingItem>>`
      → `this.client.request({ service: 'GoCamping', operation: 'basedList', params })`.
    - `basedSyncList(params: GcBasedSyncListDto):
      Promise<KtoListResponse<GoCampingItem>>` → 동일 패턴.
    - `locationBasedList(params: GcLocationBasedListDto):
      Promise<KtoListResponse<GoCampingItem>>` → 동일 패턴.
    - `searchList(params: GcSearchListDto):
      Promise<KtoListResponse<GoCampingItem>>` → 동일 패턴.
    - `imageList(params: GcImageListDto):
      Promise<KtoListResponse<GoCampingImageItem>>` → 동일 패턴, **반환 타입만
      `GoCampingImageItem`** 으로 분기.
    - `KtoHttpClient` 를 생성자 주입 (선행 3 SPEC 와 동일한 DI 패턴).
14. `go-camping.tools.ts`
    - 도구 메타데이터 배열 export (`GO_CAMPING_TOOLS`).
    - 각 항목: `name: 'kto_camping_{operation}'`, `description` (한글 — "고캠핑
      기본 정보 목록 조회" 등), `inputSchema` (JSON Schema), `dtoClass`,
      `methodName`.
    - 선행 3 SPEC 의 `*.tools.ts` 구조 그대로 복제.
    - description 에 R6 (별도 ID 체계) 와 R5 (KTO 원형 보존 — `Y`/`N`, 인덱스
      시그니처 등) 의도 명시.
15. 단위 테스트:
    - `go-camping.service.spec.ts` — 5 메서드 정상 케이스 + service 파라미터 검증
      (`'GoCamping'`) + 응답 정규화 검증 + imageList 빈 결과(`""`) 검증.
    - `go-camping.tools.spec.ts` — `GO_CAMPING_TOOLS` 배열 구조 검증, 5 도구
      `name`/`description`/`inputSchema` 존재 확인, prefix `kto_camping_` 검증.

### Phase 4: Module wiring [Priority High]

목적: NestJS DI 와 ToolRegistry 연결.

16. `go-camping.module.ts`
    - `@Module({ imports: [KtoModule], providers: [GoCampingService], exports:
      [GoCampingService] })`.
17. `src/app.module.ts`
    - `GoCampingModule` import 추가 (1줄).
18. `src/main.ts`
    - `GoCampingService` 주입 1줄 (`const goCampingService = app.get(GoCampingService);`).
    - `registerAll()` 호출의 registries 배열에 `{ tools: GO_CAMPING_TOOLS, service:
      goCampingService }` 항목 1개 추가.

### Phase 5: e2e 검증 [Priority High]

목적: in-process MCP roundtrip + nock 모킹으로 캠핑 도구 통합 검증. 실 키 스모크
테스트는 사용자 수행.

19. `test/kto.e2e-spec.ts` 의 도구 카운트 assertion 갱신:
    - `29` (15 korean + 10 barrier-free + 4 photo) → `34` (15 + 10 + 4 + 5
      camping).
20. `test/kto.e2e-spec.ts` 에 GoCamping 시나리오 추가:
    - `tools/list` 응답에 `kto_camping_*` 5 도구가 모두 포함되는지 검증.
    - `tools/call kto_camping_basedList` 의 nock 모킹 응답을 받아 `facltNm`,
      `induty`, `mapX`, `addr1` 등 필드가 응답에 포함되는지 검증.
    - `tools/call kto_camping_locationBasedList` 의 nock 모킹 응답 검증
      (`mapX`/`mapY`/`radius` outbound URL 검증).
    - `tools/call kto_camping_searchList` 의 nock 모킹 응답 검증.
    - `tools/call kto_camping_imageList` 의 nock 모킹 응답 검증 + 빈 결과
      (`items: ""`) → `items: []` 정규화 검증.
    - `tools/call kto_camping_basedSyncList` 의 nock 모킹 응답 검증 + `syncStatus`
      필드 보존 검증.
    - `mapX`/`mapY`/`radius` 누락 → outbound 0회 + 검증 에러 (REQ-UNW-001).
    - `keyword` 누락 → outbound 0회 + 검증 에러 (REQ-UNW-001).
    - `contentId` 누락 → outbound 0회 + 검증 에러 (REQ-UNW-001).
    - 선행 3 SPEC 도구의 기존 시나리오 회귀 무사고 (REQ-UNW-002).
21. `pnpm test:cov` 로 커버리지 ≥ 85% 확인.
22. `pnpm lint`, `pnpm build` 무에러 확인.
23. (사용자 수행) 실 `KTO_SERVICE_KEY` 로 5 도구를 1회씩 호출하여 응답 필드 명·
    케이싱 정확성 확인 → `types.ts` 의 `GoCampingItem` 핵심 named 필드 셋 검증.

### Phase 5.5: MX Tag Application [Priority Medium]

§5 의 MX Tag Plan 적용.

---

## 3. Reference Implementation Hints

| 항목 | 참고처 |
|------|--------|
| KorService2 모듈 패턴 | `src/kto/korean-tour-info/` 전체 |
| KorWithService2 모듈 패턴 | `src/kto/barrier-free-tour-info/` 전체 |
| PhotoGalleryService1 모듈 패턴 | `src/kto/photo-gallery/` 전체 (특히 typed item interface 도입 패턴) |
| KtoHttpClient 사용 패턴 | `src/kto/photo-gallery/photo-gallery.service.ts` (생성자 주입 + `this.client.request(...)`) |
| 도구 등록 패턴 (다중 registry) | `src/main.ts` 의 `registerAll(server, [{ tools: ..., service: ... }, ...])` 호출부 |
| 필수 contentId 검증 패턴 | `src/kto/photo-gallery/dto/gallery-detail-list.dto.ts` (필수 `galContentId` 검증) |
| 필수 mapX/mapY/radius 검증 패턴 | `src/kto/korean-tour-info/dto/location-based-list.dto.ts` (필수 좌표·반경 검증) |
| 필수 keyword 검증 패턴 | `src/kto/korean-tour-info/dto/search-keyword.dto.ts` (필수 `keyword` 검증) |
| typed item 인터페이스 + 인덱스 시그니처 | (신규 — 본 SPEC 에서 정립) |
| 캠핑 응답 필드 카탈로그 | `research.md` §4 |

---

## 4. Risks and Mitigations

| 위험 | 영향 | 완화 전략 |
|------|------|-----------|
| **R1 (LOW). GoCamping 의 V없음 패턴이 BASE_URL_MAP 의도를 흐림** — `KorService2` (V2) + `PhotoGalleryService1` (V1) + `GoCamping` (V없음) 3 패턴 공존으로 `@MX:NOTE` 의 일반화 의도가 불명확해질 수 있음. | 中 | `@MX:NOTE` prose 1줄 보강으로 3 패턴 모두 명시 (Plan §1.3). 각 SPEC ID 를 `@MX:SPEC` 라인에 누적 기록하여 추적성 보장. |
| **R2 (LOW). imageList 빈 결과 (`items: ""`) 응답** | 低 | [VERIFIED] 기존 `normalizeItems()` 가 이미 처리. 단위 테스트로 회귀 방지 (Phase 3 의 service.spec.ts + Phase 5 의 e2e). SPEC-KTO-001 Edge 2.1 동일 처리. |
| **R3 (MEDIUM). GoCampingItem 50+ 필드 중 모든 것을 typed interface 에 넣지 않으면 type loss** | 中 | 핵심 30 필드만 named property + 나머지 인덱스 시그니처(`[key: string]: string \| undefined`) 로 처리 (Plan §1.5). KTO 가 향후 필드 추가 시 자동 흡수. trade-off: named 외 필드는 `string \| undefined` 로만 type-check 가능 (도메인 개념적 type 손실 일부 발생). |
| **R4 (LOW). 도구 카탈로그 비대화** — 15 + 10 + 4 + 5 = 34 도구가 `tools/list` 에 노출되며, LLM 도구 선택 정확도 하락 가능성 | 中 | 각 도구 `description` 에 도메인 명시 ("**고캠핑** 캠핑장 위치기반 조회" 등). 34개는 일반적 MCP 클라이언트 한도 내. |
| **R5 (LOW). `mapX`/`mapY`/`radius` type 정책 — Swagger 는 string, 사용자는 number 입력 가능성** | 低 | DTO 에서 `@Type(() => Number) @IsNumber()` 채택. axios outbound 시 자동 string 직렬화 (선행 SPEC-KTO-001 동일 정책). 단위 테스트로 number / string 모두 정상 outbound 검증. |
| **R6 (MEDIUM). GoCamping `contentId` vs KorService2 `contentid` 의 ID 체계 차이** — 사용자가 KorService2 `contentid` 를 `kto_camping_imageList` 에 입력하면 빈 응답이 반환될 위험. | 中 | `GoCampingItem.contentId` 와 `GcImageListDto.contentId` 의 의도(캠핑장 ID, KorService2 contentid 와 별도 ID 체계) 를 도구 description 과 `@MX:NOTE` 로 명시. acceptance.md Edge case 에 빈 응답 케이스 추가. |
| **R7 (LOW). 다국어 캠핑 변체 발견 시 SPEC 분리 필요성** | 低 | 본 SPEC Exclusion 3 에 명시. 발견 시 별도 SPEC 으로 즉시 분리. 본 SPEC 의 `BASE_URL_MAP` flat 구조가 분리에 친화적. |
| **R8 (LOW). `basedSyncList` 의 totalCount 가 `basedList` 보다 큼 (5181 vs 3067)** — LLM 클라이언트가 두 도구 차이를 혼동할 가능성 | 低 | 도구 description 에 차이 명시: `basedList` = 운영 중 캠핑장만, `basedSyncList` = 삭제·수정·신규 이력 포함 전수 (`syncStatus`: A/U/D). |
| **R9 (LOW). `searchList` 다중 키워드 구분자 미명시** | 低 | RUN Phase 통합 테스트 시 콤마/공백/파이프 모두 시도하여 문서화. 본 SPEC 은 단일 키워드 호출만 검증, 다중 키워드는 해소 시 acceptance.md 보강. |
| **R10 (LOW). `imageList` 가 imageUrl 만 반환 — 실제 다운로드는 본 SPEC 범위 외** (Exclusion 1) | 低 | 도구 description 에 명시. acceptance.md 에 별도 시나리오 없음 (Exclusion 으로 분리). |

---

## 5. MX Tag Plan (Phase 5.5)

본 SPEC 의 신규 산출물에 적용할 MX 태그 계획.

### Anchor 태그 (high fan_in 함수)

| 대상 | 태그 | 사유 |
|------|------|------|
| `KtoHttpClient.request()` (변경 없음) | 기존 `@MX:ANCHOR` 유지 | fan_in 증가 (KorService2 15 + KorWithService2 10 + PhotoGalleryService1 4 + 신규 GoCamping 5 = 34). 태그 자체는 변경 없으나 progress 보고서에 fan_in 증가 사실을 기록한다. |
| `GoCampingService.basedList`, `basedSyncList`, `locationBasedList`, `searchList`, `imageList` | `@MX:TODO test` (작성 직후) → 테스트 통과 시 제거 | 선행 SPEC 모듈과 동일 정책. 메서드별 단위 테스트 통과 시 일괄 제거. |
| `GO_CAMPING_TOOLS` (`go-camping.tools.ts`) | `@MX:NOTE` | 도구 카탈로그 진입점. KorService2 (`KOREAN_TOUR_INFO_TOOLS`) / KorWithService2 (`BARRIER_FREE_TOUR_INFO_TOOLS`) / PhotoGalleryService1 (`PHOTO_GALLERY_TOOLS`) 와 병렬 구조임을 명시. |

### Warn 태그 (위험 패턴)

| 대상 | 태그 | 사유 |
|------|------|------|
| (해당 없음) | — | 신규 위험 패턴 없음. 재시도·XML 파싱 등 위험 코드는 모두 `KtoHttpClient` 내부에서 기존 `@MX:WARN` 으로 관리되며 본 SPEC 에서 재선언 불필요. |

### Note 태그 (의도/계약 명시)

| 대상 | 태그 | 사유 |
|------|------|------|
| `BASE_URL_MAP` (`src/kto/common/constants.ts`, 갱신) | 기존 `@MX:NOTE` prose 1줄 추가 (3 패턴 명시) + `@MX:SPEC: SPEC-KTO-004 REQ-OPT-001` 추가 | V2 다국어 + V1 단독 + V없음 평면 — 3 패턴 공존을 명시. 향후 SPEC 에서 패턴 분기 인지 가능. |
| `GoCampingItem` (`src/kto/go-camping/types.ts`) | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-KTO4-003` | KTO 캠핑 응답 스키마 계약. 핵심 30 필드 named + 나머지 인덱스 시그니처 사용 이유 (50+ 필드 자동 흡수) 명시. R6 (`contentId` 별도 ID 체계) 도 함께 기록. |
| `GoCampingImageItem` (`src/kto/go-camping/types.ts`) | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-KTO4-003` | imageList 응답의 5 필드 단순 스키마. `imageUrl` 은 메타데이터만 노출 (Exclusion 1) 명시. |
| `GoCampingService.imageList` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-EVT-001` | 빈 결과(`""`) 처리는 기존 `normalizeItems()` 재사용임을 명시 (R2). |
| `GcLocationBasedListDto.mapX`/`mapY`/`radius` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-UNW-001` | `@IsNotEmpty` + `@Max(20000)` 검증의 SPEC 계약 추적. |
| `GcSearchListDto.keyword` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-UNW-001` | `@IsNotEmpty` 검증의 SPEC 계약 추적. |
| `GcImageListDto.contentId` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-004 REQ-UNW-001` | `@IsNotEmpty` 검증의 SPEC 계약 추적. R6 (`contentId` 별도 ID 체계) 도 명시. |

### TODO 태그 (테스트 미작성)

- 모든 신규 public 메서드(`GoCampingService.*`) 작성 직후 `@MX:TODO test` 부여.
- Phase 3 단위 테스트 통과 시 일괄 제거.

### Legacy 태그

해당 없음 (본 SPEC 은 신규 코드만 추가).

---

## 6. Definition of Done (Plan-level)

본 plan 이 "완료" 되었다고 선언할 수 있는 조건은 `acceptance.md` 의 모든 시나리오
PASS + Success Criteria(`spec.md`) 충족이다. 작업 도중 각 Phase 종료 시점에 다음을
점검:

- Phase 1 종료: `BASE_URL_MAP` refactor 후 선행 3 SPEC 의 기존 unit + e2e 테스트가
  변경 없이 모두 PASS (REQ-UNW-002).
- Phase 2 종료: `GcLocationBasedListDto` 의 `mapX`/`mapY`/`radius` + `GcSearchListDto`
  의 `keyword` + `GcImageListDto` 의 `contentId` 누락 검증 테스트 PASS (REQ-UNW-001).
  `GoCampingItem` + `GoCampingImageItem` interface 가 export 됨 (REQ-KTO4-003).
- Phase 3 종료: `GoCampingService` 의 5 메서드가 `KtoHttpClient.request({ service:
  'GoCamping', ... })` 를 호출하도록 단위 테스트로 검증. 4 list ops 반환 타입이
  `Promise<KtoListResponse<GoCampingItem>>` 이고 `imageList` 반환 타입이
  `Promise<KtoListResponse<GoCampingImageItem>>` 임을 type-check 로 확인.
- Phase 4 종료: `tools/list` 응답에 `kto_camping_*` 5 도구 + `kto_korean_*` 15 +
  `kto_barrier_free_*` 10 + `kto_photo_*` 4 모두 포함 (transport 양쪽 확인).
- Phase 5 종료: 커버리지 ≥ 85%, e2e 모두 PASS, lint·build 무에러. 도구 카운트
  assertion 29 → 34 갱신.
- Phase 5.5 종료: MX 태그 보고서 생성 + `BASE_URL_MAP` 의 `@MX:SPEC` 라인에
  `SPEC-KTO-004 REQ-OPT-001` 추가 + prose 1줄 보강 확인.

---

Version: 0.1.0
Last Updated: 2026-05-09
