# Plan: SPEC-KTO-003 (KTO MCP 서버 3차 이터레이션 — 관광사진 정보)

## 개요

`spec.md` 의 요구사항을 만족하는 PhotoGalleryService1 관광사진 정보 모듈을 SPEC-KTO-001
(KorService2) / SPEC-KTO-002 (KorWithService2) 의 공용 인프라 위에 추가한다. 본
문서는 작업 분해(WBS), 핵심 기술 결정 사항(특히 신규 typed item `PhotoGalleryItem`
정의 및 `BASE_URL_MAP` 1줄 확장), 위험 요소, 그리고 MX 태그 계획을 정의한다.

본 SPEC 은 패턴 복제 SPEC 이다. 신규 추상화·신규 라이브러리·신규 transport·신규 에러
모델 도입을 모두 금지하고, KorService2 / KorWithService2 모듈의 패턴을 사진 도메인에
그대로 적용한다.

---

## 1. 기술 결정 사항

### 1.1 라이브러리 선정

신규 의존성 **없음**. SPEC-KTO-001 §1.1 + SPEC-KTO-002 §1.1 에서 핀한 의존성을
그대로 재사용한다.

- `@modelcontextprotocol/sdk` (1.x)
- `axios`
- `class-validator`, `class-transformer`
- `fast-xml-parser`
- dev: `nock`, `jest`, `supertest`

### 1.2 도구 이름 prefix 결정

| 후보 | 평가 |
|------|------|
| `kto_kor_photo_*` | KTO 서비스 path 와 일치하나 LLM 가독성 떨어짐. `kto_kor_*` 가 KorService2 의 `kto_korean_*` 와 시각적으로 구분되지 않을 위험 |
| `kto_gallery_*` | "갤러리" 만 강조되어 사진 메타가 사진 객체임을 직관적으로 드러내지 못함 |
| `kto_image_*` | "이미지" 일반 용어 — KorService2 의 `detailImage2` 와 의미상 충돌 우려 |
| **`kto_photo_*`** (선정) | LLM 가독성·한국어 의미 매핑 명확. 기존 `kto_korean_*` (KorService2) / `kto_barrier_free_*` (KorWithService2) 와 prefix 충돌 없음. 사진(photo) 이라는 도메인이 즉시 식별됨 |

선정 기준: MCP `tools/list` 응답에서 LLM 이 도구 의도를 1-shot 으로 식별 가능해야
하며, 선행 SPEC 의 `kto_korean_*` / `kto_barrier_free_*` 와 단어 경계가 분명히
분리되어야 한다.

### 1.3 [핵심] `BASE_URL_MAP` 1줄 확장

#### 배경

`src/kto/common/constants.ts` 의 `BASE_URL_MAP` 은 SPEC-KTO-002 시점에 이미 "단일
flat namespace 에 (1) 언어 변체 + (2) 기능적 형제 서비스" 가 공존하는 의미로 갱신
되어 있다. PhotoGalleryService1 는 두 번째 카테고리(기능적 형제 서비스) 의 추가 항목이며,
**SPEC-KTO-002 와 완전히 동일한 패턴으로 1줄 추가**한다.

#### 변경 내용

```ts
// 추가 1줄 (위치: KorWithService2 다음)
PhotoGalleryService1: 'http://apis.data.go.kr/B551011/PhotoGalleryService1',
```

`BASE_URL_MAP` 위 `@MX:NOTE` 주석은 이미 SPEC-KTO-002 시점에서 일반화 의도(언어 변체
+ 기능적 형제) 를 담고 있어, **본 SPEC 에서는 prose 변경 불필요**. `@MX:SPEC` 라인에
`SPEC-KTO-003 REQ-OPT-001` 만 추가한다.

#### `KtoHttpClient` 인터페이스에 미치는 영향

- `KtoHttpClient.request({ service: KtoServiceName, ... })` 의 시그니처 변경 **없음**.
- `service: 'PhotoGalleryService1'` 를 자연스럽게 받아들임 (`KtoServiceName` union 에
  새 키가 추가되었을 뿐).
- 기존 KorService2 / KorWithService2 호출 사이트는 변경 없음.

이 결정은 plan.md 의 Phase 1 작업 1번으로 1줄 수정 + `@MX:SPEC` 추가로 처리되며,
**breaking change 가 아니다**.

### 1.4 모듈 디렉토리 명명

KorService2 측이 `src/kto/korean-tour-info/`, KorWithService2 측이
`src/kto/barrier-free-tour-info/` 인 점을 따라, 본 SPEC 은
`src/kto/photo-gallery/` 를 사용한다 (kebab-case + 도메인 의미). NestJS 모듈명은
`PhotoGalleryModule` (PascalCase).

"tourism photo" 보다 "photo gallery" 를 선택한 이유:

- 실제 API 가 사진 메타 갤러리 형태이며 (목록 + 상세 두 축), 추상적인 "관광사진"
  표현보다 데이터 구조 의미가 더 명확
- 응답 필드 prefix `gal*` (gallery) 와 디렉토리명이 자연스럽게 일치
- "tourism" 은 KTO 서비스 전반 컨텍스트 (이미 `src/kto/` 디렉토리에서 명시됨) 에서
  중복 표현

### 1.5 [핵심] 신규 typed item `PhotoGalleryItem` 도입 결정

#### 배경

KorService2 / KorWithService2 의 응답 item 은 `addr1`, `cat1`, `contentid`,
`firstimage`, `mapx`, `mapy`, `title` 등 평면 필드명 컨벤션을 사용한다. 두 SPEC 모두
응답 item 을 `unknown` 또는 generic `T` 로 받아 그대로 노출했고, typed item
인터페이스를 정의하지 않았다.

PhotoGalleryService1 의 응답 item 은 `gal*` prefix 필드를 사용하며, 명백히 다른 명명
컨벤션이다. 기존 KorService2 응답 타입과 같은 구조로 처리하면 LLM 클라이언트가 응답
스키마를 추론하기 어렵고, 도구 사용성이 저하된다.

#### 옵션 비교

| 항목 | Option A (선정) — 신규 typed item | Option B — 일반 `T = unknown` 유지 |
|------|------------------------------------|-------------------------------------|
| 응답 타입 | `KtoListResponse<PhotoGalleryItem>` | `KtoListResponse<unknown>` |
| LLM 클라이언트 추론 | 강함 (필드 셋 명시) | 약함 (응답 구조 추론 필요) |
| 신규 코드량 | `types.ts` 1 파일 (≈ 20줄) | 없음 |
| 기존 KTO 서비스에 미치는 영향 | 없음 (사진 모듈 내 캡슐화) | 없음 |
| 도구 description 보강 가능성 | typed item 에서 자동 도출 가능 | 수동 작성 필요 |
| 향후 확장성 | `gal*` 필드 추가 시 interface 갱신 1곳 | 도구별 description 모두 갱신 |
| KTO 원형 보존 정책 (Exclusion 5) | 영향 없음 (interface 는 typing 전용) | 영향 없음 |

#### 선정: **Option A**

근거:

1. **LLM 클라이언트 도구 사용성** — MCP 클라이언트는 응답 필드 셋을 알 수 없으면
   결과를 효과적으로 활용하지 못한다. typed item 은 도구 description 과 inputSchema
   이외에 응답 구조를 제공하는 유일한 방법.
2. **`gal*` prefix 의 명백한 도메인 분리** — 다른 KTO 서비스의 평면 필드와 구분되며,
   사진 도메인에서만 발생하는 필드 셋이므로 별도 타입 정의가 자연스러움.
3. **신규 추상화 금지 정책 위반 아님** — `PhotoGalleryItem` 은 기존 `KtoListResponse<T>`
   의 `T` parameter instantiate 형태이며, 신규 generic·신규 abstract class·신규
   helper 함수를 도입하지 않는다.
4. **변경량 최소** — `types.ts` 1 파일 추가만으로 모든 사진 도구의 반환 타입이
   결정됨.

#### 사용 패턴

```ts
// src/kto/photo-gallery/types.ts
export interface PhotoGalleryItem {
  galContentId: string;
  galTitle?: string;
  galWebImageUrl?: string;
  galCreatedtime?: string;
  galModifiedtime?: string;
  galPhotographyLocation?: string;
  galPhotographyMonth?: string;
  galPhotographer?: string;
  galSearchKeyword?: string;
  // 추가 [LOWER CONFIDENCE] 필드는 RUN Phase 응답 검증 후 확장
}

// src/kto/photo-gallery/photo-gallery.service.ts (sketch)
async galleryList1(
  params: PgGalleryListDto,
): Promise<KtoListResponse<PhotoGalleryItem>> { ... }
```

> [ASSUMED — verify against KTO guide PDF] interface 의 정확한 필드 셋·필수 여부·
> 케이싱 (`galContentId` vs `galContentid`) 은 RUN Phase 첫 통합 테스트 응답으로
> 확정한다. 기본값은 `galContentId` 만 required, 나머지는 모두 optional.

### 1.6 DTO 클래스명 prefix 결정

선행 SPEC 의 패턴:

- KorService2 (SPEC-KTO-001): prefix 없음 (`AreaBasedListDto`, `DetailCommonDto`, ...)
- KorWithService2 (SPEC-KTO-002): `Bf` prefix (`BfAreaBasedListDto`,
  `BfDetailWithTourDto`, ...) — 회피적 명명으로 KorService2 측과 충돌 방지

본 SPEC 은 SPEC-KTO-002 의 precedent 를 따라 **`Pg` prefix** (Photo Gallery 약어)
를 사용한다. 예: `PgGalleryListDto`, `PgGalleryDetailListDto`. 이유:

1. 향후 동일한 클래스명(`GalleryListDto`) 이 다른 도메인에 출현해도 충돌 없음.
2. 모듈 디렉토리(`photo-gallery/`) 와 prefix(`Pg`) 가 일관됨.
3. 선행 SPEC 의 명명 정책과 일관성 유지.

### 1.7 도구 등록 방식 결정 — registries 배열 확장

`src/main.ts` 의 `registerAll()` 호출은 SPEC-KTO-002 시점에 이미 `ToolRegistry[]`
배열을 받는 형태로 확장되어 있다:

```ts
registerAll(mcpServer, [
  { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
  { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeTourInfoService },
]);
```

본 SPEC 은 동일 배열에 **3번째 항목**을 추가:

```ts
registerAll(mcpServer, [
  { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
  { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeTourInfoService },
  { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
]);
```

`tool-registry.ts` 자체는 변경 없음 (이미 `ToolRegistry[]` 다중 항목 지원).

---

## 2. Phase 별 작업 분해 (Priority-based)

### Phase 1: BASE_URL_MAP refactor [Priority High]

목적: 공용 상수 1줄 수정 + `@MX:SPEC` 추가. SPEC-KTO-001 + SPEC-KTO-002 회귀 무사고
검증.

1. `src/kto/common/constants.ts`
   - `BASE_URL_MAP` 의 `KorWithService2` 항목 다음에 `PhotoGalleryService1:
     'http://apis.data.go.kr/B551011/PhotoGalleryService1'` 추가.
   - 위 `@MX:NOTE` prose 변경 **없음** (이미 일반화된 의미를 담고 있음).
   - `@MX:SPEC` 라인에 `SPEC-KTO-003 REQ-OPT-001` 추가 (기존 `SPEC-KTO-001 REQ-OPT-001,
     SPEC-KTO-002 REQ-OPT-001` 와 병기).
2. `src/kto/kto-http.client.spec.ts` 에 `service: 'PhotoGalleryService1'` 호출 케이스
   1건 추가 (정상 응답 모킹) — 기존 테스트 변경 없음.
3. `pnpm test` 전수 실행. SPEC-KTO-001 + SPEC-KTO-002 의 기존 unit + e2e 테스트가
   변경 없이 모두 PASS 확인 (REQ-UNW-002).

### Phase 2: photo-gallery DTOs + types.ts [Priority High]

목적: 오퍼레이션별 입력 DTO 작성 + 응답 typed item 정의.

4. `src/kto/photo-gallery/dto/` 디렉토리 생성.
5. `dto/gallery-list.dto.ts` 작성 — `PgGalleryListDto`:
   - `keyword?: string` (검색 키워드)
   - `arrange?: string` (정렬 옵션)
   - `numOfRows?: number` (페이지 크기)
   - `pageNo?: number` (페이지 번호)
   - 모두 `@IsOptional()` + 타입 검증
6. `dto/gallery-detail-list.dto.ts` 작성 — `PgGalleryDetailListDto`:
   - `galContentId: string` (필수, `@IsString()` + `@IsNotEmpty()`)
   - REQ-UNW-001 검증 대상
7. `dto/index.ts` 배럴 작성.
8. `types.ts` 작성 — `PhotoGalleryItem` interface:
   - `galContentId: string` (required)
   - 나머지 필드 모두 optional
   - `@MX:NOTE` 추가 — KTO 사진 응답 스키마 계약 명시.
9. (선택) `dto/dto.spec.ts` — `PgGalleryDetailListDto` 의 `galContentId` 누락 검증
   테스트.

> [VERIFIED] 실 API 호출로 확인: PhotoGalleryService1은 4개 오퍼레이션 제공.
> **4 DTO + 1 typed item** — PgGalleryListDto, PgGalleryDetailListDto, PgGallerySearchListDto, PgGallerySyncDetailListDto.
> galContentTypeId 필드 추가 확인. gallerySyncDetailList1 파라미터명 추가 검증 필요.

### Phase 3: PhotoGalleryService + tools.ts [Priority High]

목적: PhotoGalleryService1 호출 메서드와 도구 메타데이터 정의.

10. `photo-gallery.service.ts`
    - `galleryList1(params: PgGalleryListDto):
      Promise<KtoListResponse<PhotoGalleryItem>>` →
      `this.client.request({ service: 'PhotoGalleryService1', operation: 'galleryList1',
      params })`.
    - `galleryDetailList1(params: PgGalleryDetailListDto):
      Promise<KtoListResponse<PhotoGalleryItem>>` → 동일 패턴.
    - `KtoHttpClient` 를 생성자 주입 (KorService2 / KorWithService2 측과 동일한 DI 패턴).
11. `photo-gallery.tools.ts`
    - 도구 메타데이터 배열 export (`PHOTO_GALLERY_TOOLS`).
    - 각 항목: `name: 'kto_photo_{operation}'`, `description` (한글 — "관광사진 갤러리
      목록 조회" 등), `inputSchema` (JSON Schema), `dtoClass`, `methodName`.
    - KorService2 / KorWithService2 의 `*.tools.ts` 구조 그대로 복제.
12. 단위 테스트: `photo-gallery.service.spec.ts` — 각 메서드의 정상 케이스 +
    `galContentId` 누락 시 검증 에러 + `gal*` 응답 필드 정규화 검증.

### Phase 4: Module wiring [Priority High]

목적: NestJS DI 와 ToolRegistry 연결.

13. `photo-gallery.module.ts`
    - `@Module({ imports: [KtoModule], providers: [PhotoGalleryService], exports:
      [PhotoGalleryService] })`.
14. `src/app.module.ts`
    - `PhotoGalleryModule` import 추가 (1줄).
15. `src/main.ts`
    - `PhotoGalleryService` 주입 1줄 (`const photoGalleryService =
      app.get(PhotoGalleryService);`).
    - `registerAll()` 호출의 registries 배열에 `{ tools: PHOTO_GALLERY_TOOLS, service:
      photoGalleryService }` 항목 1개 추가.

### Phase 5: e2e 검증 [Priority High]

목적: in-process MCP roundtrip + nock 모킹으로 사진 도구 통합 검증. 실 키 스모크
테스트는 사용자 수행.

16. `test/kto.e2e-spec.ts` 의 도구 카운트 assertion 갱신:
    - `25` (15 korean + 10 barrier-free) → `≥ 29` (15 korean + 10 barrier-free + 4 photo).
    - [VERIFIED] 실 API 호출 결과 4 오퍼레이션 확인.
17. `test/kto.e2e-spec.ts` 에 PhotoGalleryService1 시나리오 추가:
    - `tools/list` 응답에 `kto_photo_*` 도구가 모두 포함되는지 검증.
    - `tools/call kto_photo_galleryList1` 의 nock 모킹 응답을 받아 `gal*` 필드(`galContentId`,
      `galTitle`, `galWebImageUrl` 등) 가 응답에 포함되는지 검증.
    - `tools/call kto_photo_galleryDetailList1` 의 nock 모킹 응답 검증.
    - `galContentId` 누락 호출 시 outbound HTTP 미발생 + 검증 에러 응답 (REQ-UNW-001).
    - KorService2 / KorWithService2 도구의 기존 시나리오 회귀 무사고 (REQ-UNW-002).
18. `pnpm test:cov` 로 커버리지 ≥ 85% 확인.
19. `pnpm lint`, `pnpm build` 무에러 확인.
20. (사용자 수행) 실 `KTO_SERVICE_KEY` 로 `kto_photo_galleryList1` 와
    `kto_photo_galleryDetailList1` 1회씩 호출하여 30/404 응답 발생 오퍼레이션 식별
    → 도구 카탈로그에서 제거. `gal*` 응답 필드 정확한 명명·케이싱 확인 → `types.ts`
    의 `PhotoGalleryItem` interface 갱신.

### Phase 5.5: MX Tag Application [Priority Medium]

§5 의 MX Tag Plan 적용.

---

## 3. Reference Implementation Hints

| 항목 | 참고처 |
|------|--------|
| KorService2 모듈 패턴 | `src/kto/korean-tour-info/` 전체 |
| KorWithService2 모듈 패턴 | `src/kto/barrier-free-tour-info/` 전체 (특히 prefix·DTO 명명 정책) |
| KtoHttpClient 사용 패턴 | `src/kto/korean-tour-info/korean-tour-info.service.ts` (생성자 주입 + `this.client.request(...)`) |
| 도구 등록 패턴 (다중 registry) | `src/main.ts` 의 `registerAll(server, [{ tools: ..., service: ... }, ...])` 호출부 |
| DTO + class-validator 패턴 (필수 contentId) | `src/kto/barrier-free-tour-info/dto/detail-with-tour.dto.ts` (필수 `contentId` 검증) |
| 사진 응답 필드 카탈로그 | `research.md` §4 |

---

## 4. Risks and Mitigations

| 위험 | 영향 | 완화 전략 |
|------|------|-----------|
| **R1 (LOW). 보조 코드 조회 오퍼레이션 발견 시 도구 중복** — `galleryAreaCode2` / `galleryCategoryCode2` 등이 PhotoGalleryService1 측에 존재할 경우, KorService2 측에 이미 `kto_korean_areaCode2` / `kto_korean_categoryCode2` 로 노출되어 있어 중복 가능성. | 低 | **본 SPEC 에서는 사진 모듈에 코드 조회 도구 등록 금지**. RUN Phase 통합 테스트에서 발견되더라도 KorService2 도구로 대체 가능하므로 미등록. SPEC-KTO-002 R1 과 동일한 정책 적용. |
| **R2 (LOW). PhotoGalleryService1 의 정확한 base path 미확인 — [RESOLVED]** | 高 (도구 호출이 30/404 에러로 전수 실패) | [VERIFIED] 실 API 호출로 `B551011/PhotoGalleryService1` 확인. galleryList1 호출 성공 (totalCount 6119). |
| **R3 (MEDIUM). Swagger 직접 접근 불가 → 일부 응답 필드 [ASSUMED] 마커 — [LARGELY RESOLVED]** | 中 | [VERIFIED] galleryList1, galleryDetailList1, gallerySearchList1 응답 필드 확인. galContentTypeId 추가. 잔여 미확인: gallerySyncDetailList1 파라미터명(syncModTime). |
| **R4 (LOW). 도구 카탈로그 비대화** — KorService2 15 + KorWithService2 10 + PhotoGalleryService1 4 = 29 도구가 `tools/list` 에 노출되며, LLM 도구 선택 정확도가 하락할 가능성. | 中 | 각 도구 `description` 에 "**관광사진** 갤러리 조회" 명시. R1 완화책(보조 코드 조회 미등록) 도 본 위험 함께 완화. 29개는 일반적 MCP 클라이언트 한도 내. |
| **R5 (LOW). 사진 응답 필드 케이싱 정확성** — `galContentId` (camelCase) vs `galContentid` (lowercase) 등 케이스가 추정. | 低 | KTO 원형 보존 정책 (SPEC-KTO-001 Exclusion 5) 적용. 케이스조차 보존. RUN Phase 첫 응답에서 정확한 케이싱 확인 후 `types.ts` 의 `PhotoGalleryItem` interface 와 acceptance.md 의 검증 필드명 갱신. |
| **R6 (MEDIUM). `galContentId` 와 KorService2 `contentid` 의 ID 체계 차이** — KTO 서비스간 ID 가 호환되지 않을 가능성이 높음. 사용자가 KorService2 contentid 를 `kto_photo_galleryDetailList1` 에 입력하면 빈 응답이 반환될 위험. | 中 | `PhotoGalleryItem.galContentId` 와 `PgGalleryDetailListDto.galContentId` 의 의도(사진 갤러리 ID, KorService2 contentid 와 별도 ID 체계) 를 도구 description 과 `@MX:NOTE` 로 명시. acceptance.md Edge case 에 빈 응답 케이스 추가. |
| **R7 (LOW). 사진 다국어 변체 발견 시 SPEC 분리 필요성** | 低 | 본 SPEC Exclusion 2 에 명시. 발견 시 별도 SPEC 으로 즉시 분리. 본 SPEC 의 `BASE_URL_MAP` flat 구조가 분리에 친화적. |
| **R8 (LOW). 페이지네이션 필드 부재 가능성** — 응답 envelope 에 `numOfRows` / `pageNo` / `totalCount` 가 없을 경우, `KtoListResponse<T>` 의 일부 필드가 undefined. | 低 | `KtoListResponse<T>` 의 페이지네이션 필드는 이미 optional 또는 정규화 로직에서 fallback 처리. RUN Phase 첫 응답에서 필드 존재 여부 검증, 부재 시 `acceptance.md` Edge case 추가 + interface 조정. |

---

## 5. MX Tag Plan (Phase 5.5)

본 SPEC 의 신규 산출물에 적용할 MX 태그 계획.

### Anchor 태그 (high fan_in 함수)

| 대상 | 태그 | 사유 |
|------|------|------|
| `KtoHttpClient.request()` (변경 없음) | 기존 `@MX:ANCHOR` 유지 | fan_in 증가 (KorService2 15개 + KorWithService2 10개 + 신규 PhotoGalleryService1 2~4개 ≈ 27~29개). 태그 자체는 변경 없으나 본 SPEC 산출물의 progress 보고서에 fan_in 증가 사실을 기록한다. |
| `PhotoGalleryService.galleryList1`, `PhotoGalleryService.galleryDetailList1` | `@MX:TODO test` (작성 직후) → 테스트 통과 시 제거 | KorService2 / KorWithService2 모듈과 동일 정책. 메서드별 단위 테스트가 통과하면 일괄 제거. |
| `PHOTO_GALLERY_TOOLS` (`photo-gallery.tools.ts`) | `@MX:NOTE` | 도구 카탈로그 진입점. KorService2 (`KOREAN_TOUR_INFO_TOOLS`) / KorWithService2 (`BARRIER_FREE_TOUR_INFO_TOOLS`) 와 병렬 구조임을 명시. |

### Warn 태그 (위험 패턴)

| 대상 | 태그 | 사유 |
|------|------|------|
| (해당 없음) | — | 신규 위험 패턴 없음. 재시도·XML 파싱 등 위험 코드는 모두 `KtoHttpClient` 내부에서 기존 `@MX:WARN` 으로 관리되며 본 SPEC 에서 재선언 불필요. |

### Note 태그 (의도/계약 명시)

| 대상 | 태그 | 사유 |
|------|------|------|
| `BASE_URL_MAP` (`src/kto/common/constants.ts`, 갱신) | 기존 `@MX:NOTE` 유지 (prose 변경 없음) + `@MX:SPEC: SPEC-KTO-003 REQ-OPT-001` 추가 | SPEC-KTO-002 시점의 일반화 의도가 이미 담겨 있어 prose 갱신 불필요. SPEC ID 만 추가. |
| `PhotoGalleryItem` (`src/kto/photo-gallery/types.ts`) | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-003 REQ-KTO3-003` | KTO 사진 응답 스키마 계약. `gal*` prefix 필드 셋이 KorService2 / KorWithService2 평면 필드와 다른 명명 컨벤션이며, KTO 원형 보존 정책 하에 변환 없이 노출됨을 명시. |
| `PhotoGalleryService.galleryDetailList1` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-003 REQ-EVT-001` | PhotoGalleryService1 핵심 오퍼레이션. KTO 가이드의 사진 메타 필드를 그대로 반환한다는 계약을 명시. R6 (`galContentId` 별도 ID 체계) 도 함께 기록. |
| `PgGalleryDetailListDto.galContentId` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-003 REQ-UNW-001` | `@IsNotEmpty` 검증의 SPEC 계약 추적. |

### TODO 태그 (테스트 미작성)

- 모든 신규 public 메서드(`PhotoGalleryService.*`) 작성 직후 `@MX:TODO test` 부여.
- Phase 3 단위 테스트 통과 시 일괄 제거.

### Legacy 태그

해당 없음 (본 SPEC 은 신규 코드만 추가).

---

## 6. Definition of Done (Plan-level)

본 plan 이 "완료" 되었다고 선언할 수 있는 조건은 `acceptance.md` 의 모든 시나리오
PASS + Success Criteria(`spec.md`) 충족이다. 작업 도중 각 Phase 종료 시점에 다음을
점검:

- Phase 1 종료: `BASE_URL_MAP` refactor 후 SPEC-KTO-001 + SPEC-KTO-002 의 기존
  unit + e2e 테스트가 변경 없이 모두 PASS (REQ-UNW-002).
- Phase 2 종료: `PgGalleryDetailListDto.galContentId` 누락 검증 테스트 PASS
  (REQ-UNW-001). `PhotoGalleryItem` interface 가 export 됨 (REQ-KTO3-003).
- Phase 3 종료: `PhotoGalleryService` 의 모든 메서드가 `KtoHttpClient.request({
  service: 'PhotoGalleryService1', ... })` 를 호출하도록 단위 테스트로 검증. 반환 타입
  이 `Promise<KtoListResponse<PhotoGalleryItem>>` 임을 type-check 로 확인.
- Phase 4 종료: `tools/list` 응답에 `kto_photo_*` 와 `kto_korean_*` /
  `kto_barrier_free_*` 모두 포함 (transport 양쪽 확인).
- Phase 5 종료: 커버리지 ≥ 85%, e2e 모두 PASS, lint·build 무에러. 도구 카운트
  assertion 25 → ≥27 갱신.
- Phase 5.5 종료: MX 태그 보고서 생성 + `BASE_URL_MAP` 의 `@MX:SPEC` 라인에
  `SPEC-KTO-003 REQ-OPT-001` 추가 확인.

---

Version: 0.1.0
Last Updated: 2026-05-09
