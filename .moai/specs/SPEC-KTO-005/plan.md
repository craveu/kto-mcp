# Plan — SPEC-KTO-005 (KTO 관광지 오디오 가이드정보 Odii)

본 문서는 SPEC-KTO-005 의 구현 계획을 분해한다. 본 SPEC 은 패턴 복제(replication)
SPEC 이며, SPEC-KTO-001 ~ SPEC-KTO-004 의 공용 인프라를 100% 재사용한다. 신규
라이브러리·신규 추상화 도입 없음.

방법론: `quality.development_mode` 따라가며 본 작업은 brownfield 확장이므로 TDD
기본 적용 (RED → GREEN → REFACTOR). 선행 SPEC 의 단위 테스트 패턴을 그대로
복제한다.

---

## Phase 1: BASE_URL_MAP refactor (1줄 추가 + prose 4 패턴 명시)

### Phase 1.1: `src/kto/common/constants.ts` 1줄 추가

작업 항목:

- `BASE_URL_MAP` 객체에 `Odii: 'http://apis.data.go.kr/B551011/Odii'` 1줄 추가.
  기존 9 다국어 V2 + `KorWithService2` + `PhotoGalleryService1` + `GoCamping`
  항목 뒤에 삽입.
- 위 `@MX:NOTE` prose 1줄 보강:
  - 기존 prose: 3 패턴 명시 (V2 다국어 + V1 단독 + V없음)
  - 갱신 prose: **4 패턴** 명시 — V2 다국어 다중 path + V2 단독 (`KorWithService2`)
    + V1 / suffix 없음 단일 path (`PhotoGalleryService1`, `GoCamping`) + 단일
    path + `langCode` 파라미터 (`Odii`, NEW)
- `@MX:SPEC` 라인에 `SPEC-KTO-005 REQ-OPT-001` 추가.
- `KtoServiceName` 타입은 `keyof typeof BASE_URL_MAP` 자동 추론으로 `'Odii'` 가
  포함됨 — 별도 코드 변경 불필요.

### Phase 1.2: 회귀 검증

작업 항목:

- `pnpm test src/kto/common/constants.spec.ts` 실행 → 기존 검증 PASS 확인 +
  `Odii` 항목 1줄에 대한 신규 spec 추가 (URL == `http://apis.data.go.kr/B551011/Odii`).
- `pnpm test src/kto/kto-http.client.spec.ts` 실행 → 기존 234 단위 PASS 유지.
- `pnpm test src/kto/korean-tour-info` `barrier-free-tour-info` `photo-gallery`
  `go-camping` 실행 → 회귀 0 확인.

---

## Phase 2: types.ts + 8 DTOs

### Phase 2.1: `src/kto/audio-guide/types.ts` 두 interface 정의

작업 항목:

- `OdiiStoryItem` interface 정의:
  - 모든 필드 optional 로 선언 (KTO 미보유 케이스 대비)
  - named property: `tid`, `tlid`, `stid`, `stlid`, `title`, `mapX`, `mapY`,
    `audioTitle`, `script`, `playTime`, `audioUrl`, `langCode`, `imageUrl`,
    `createdtime`, `modifiedtime`
  - 인덱스 시그니처: `[key: string]: string | undefined`
- `OdiiThemeItem` interface 정의:
  - 모든 필드 optional 로 선언
  - named property: `tid`, `tlid`, `themeCategory`, `addr1`, `addr2`, `title`,
    `mapX`, `mapY`, `langCheck`, `langCode`, `imageUrl`, `createdtime`,
    `modifiedtime`
  - 인덱스 시그니처: `[key: string]: string | undefined`
- 두 interface 모두 export 키워드로 노출.

### Phase 2.2: 8 DTO 작성 (`src/kto/audio-guide/dto/`)

공통 베이스 필드 (8 DTO 모두 보유):

- `langCode: string` — `@IsNotEmpty()` 강제, `@IsString()` 적용. 도구
  description 에서 `ko` / `en` 권장 안내.
- `numOfRows?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo?: number` — `@IsOptional()`, `@IsInt()`, `@Min(1)`

작업 항목 (8 DTO, 베이스 필드 외 추가 요건):

- `AgStoryBasedListDto` — 추가 필드 없음
- `AgStoryBasedSyncListDto` — `syncStatus?: string` (`@IsOptional()`,
  `@IsString()`)
- `AgStoryLocationBasedListDto` — `mapX`, `mapY`, `radius` 모두 필수
  (`@IsNotEmpty()`), `radius ≤ 20000` (`@Max(20000)`)
- `AgStorySearchListDto` — `keyword` 필수 (`@IsNotEmpty()`, `@IsString()`)
- `AgThemeBasedListDto` — 추가 필드 없음
- `AgThemeBasedSyncListDto` — `syncStatus?: string` (옵션)
- `AgThemeLocationBasedListDto` — Story 의 동일 패턴 (`mapX`/`mapY`/`radius`)
- `AgThemeSearchListDto` — Story 의 동일 패턴 (`keyword`)

디자인 결정:

- 공통 필드 (`langCode`, `numOfRows`, `pageNo`) 의 중복 선언이 미세하게 발생한다.
  본 SPEC 은 추상 베이스 클래스 도입을 **미실시** 한다. 이유:
  - SPEC-KTO-001 ~ SPEC-KTO-004 의 기존 DTO 패턴이 공통 베이스 클래스 미사용
    (각 DTO 가 독립 선언). 일관성 보존.
  - 베이스 클래스 도입은 신규 추상화이며, 본 SPEC 의 디자인 공약 (신규 추상화
    0건) 에 위배.
  - 8 DTO × 3 공통 필드 = 24 줄의 명시적 중복은 가독성·검색성 측면에서 베이스
    클래스 1개보다 우월하다는 판단.

### Phase 2.3: `src/kto/audio-guide/dto/index.ts` 작성

작업 항목:

- 8 DTO export 1줄씩.
- 도구 메타데이터 작성 시 import 1줄로 처리되도록 단순화.

---

## Phase 3: AudioGuideService + tools.ts

### Phase 3.1: `src/kto/audio-guide/audio-guide.service.ts` 작성

작업 항목:

- `@Injectable()` 클래스 `AudioGuideService` 선언.
- 생성자에서 `KtoHttpClient` 주입 (선행 SPEC 동일 패턴).
- 8 메서드 구현:
  - Story 계열 4 메서드: 반환 타입 `Promise<KtoListResponse<OdiiStoryItem>>`,
    `KtoHttpClient.request<OdiiStoryItem>({ service: 'Odii', operation, params })`
    호출 후 `normalizeItems` 결과 그대로 반환.
  - Theme 계열 4 메서드: 동일 패턴, 반환 타입
    `Promise<KtoListResponse<OdiiThemeItem>>`.
- 메서드명은 KTO 원 operation 명 그대로 (`storyBasedList`, `storyBasedSyncList`,
  `storyLocationBasedList`, `storySearchList`, `themeBasedList`,
  `themeBasedSyncList`, `themeLocationBasedList`, `themeSearchList`).
- 각 메서드는 DTO 인스턴스를 받아 `Object.fromEntries` 또는 명시적 spread 로
  쿼리 파라미터를 구성. `langCode`, `numOfRows`, `pageNo`, 좌표/keyword 등을
  포함.

### Phase 3.2: `src/kto/audio-guide/audio-guide.tools.ts` 작성

작업 항목:

- 8 도구 메타데이터 객체 8개 export — 명명: `kto_audio_storyBasedList` 등.
- 각 도구 객체는 다음 필드를 가짐 (선행 SPEC 의 `*.tools.ts` 동일 스키마):
  - `name`: `kto_audio_<exactOpName>`
  - `description`: 한국어 + 영어. `langCode` 권장값 (`ko` / `en`) 명시. 좌표·
    keyword 필수 사항 명시.
  - `inputSchema`: JSON Schema. `langCode` `required`, 베이스 필드 + 추가 필수
    필드 (`mapX`/`mapY`/`radius` 또는 `keyword` 또는 `contentId`).
  - `validate`: 해당 DTO 클래스 (`class-validator` 호환).
  - `handler`: `service` 메서드 호출.
- export const `ODII_TOOLS: ToolRegistry[]` — 8 도구 합산.

### Phase 3.3: `audio-guide.service.spec.ts` + `audio-guide.tools.spec.ts` 작성

작업 항목 (선행 SPEC `go-camping.service.spec.ts` 패턴 복제):

- `nock` 으로 KTO endpoint mocking.
- 8 메서드 각각 happy path 1건 + langCode 누락은 DTO 단계에서 검증되므로
  service 레벨에서는 happy path 위주로 검증.
- 도구 메타데이터 spec: `name` prefix 검증, `inputSchema` `required` 필드 검증,
  `description` 에 `langCode` 안내 포함 검증.

### Phase 3.4: `dto/dto.spec.ts` 작성 (REQ-UNW-001 검증)

작업 항목:

- 8 DTO × 검증 시나리오:
  - `langCode` 누락 → `class-validator` `@IsNotEmpty` 위반 검증
  - `langCode` 빈 문자열 → 위반 검증
  - location DTO: `mapX` / `mapY` / `radius` 누락 → 위반 검증
  - location DTO: `radius=20001` → `@Max(20000)` 위반 검증
  - search DTO: `keyword` 누락 → 위반 검증
  - happy path: 모든 필수 필드 채움 → no error

---

## Phase 4: Module wiring

### Phase 4.1: `src/kto/audio-guide/audio-guide.module.ts` 작성

작업 항목:

- NestJS `@Module` decorator.
- `providers: [AudioGuideService]`, `exports: [AudioGuideService]`,
  `imports: [KtoHttpClientModule]` (또는 선행 SPEC 의 패턴).

### Phase 4.2: `src/app.module.ts` 1줄 import 추가

작업 항목:

- `import { AudioGuideModule } from './kto/audio-guide/audio-guide.module'` 1줄
- `imports: [..., AudioGuideModule]` 항목 1개 추가.

### Phase 4.3: `src/main.ts` registries 확장

작업 항목:

- `audioGuideService = app.get(AudioGuideService)` 1줄 주입.
- `registerAll()` 호출의 registries 배열에
  `{ tools: ODII_TOOLS, service: audioGuideService }` 1개 항목 추가.
- 기존 4 registries (KoreanTour / BarrierFree / PhotoGallery / GoCamping) 는
  변경 없이 유지.

---

## Phase 5: e2e 검증

### Phase 5.1: `test/kto.e2e-spec.ts` 갱신

작업 항목:

- 기존 도구 카운트 assertion `34` → `42` 로 갱신 (1 곳).
- `kto_audio_*` prefix 검증 신규 시나리오 1건 추가 (8 도구 모두 노출 확인).
- `kto_audio_storyBasedList` happy path 시나리오 1건 추가 (`langCode=ko`,
  totalCount > 0, `audioUrl` 필드 존재).
- `kto_audio_storyLocationBasedList` 좌표 누락 시나리오 1건 (MCP `-32602`).
- `kto_audio_themeSearchList` keyword 누락 시나리오 1건 (MCP `-32602`).
- `langCode` 누락 케이스 1건 (8 도구 중 임의의 1 도구로 대표 검증).

### Phase 5.2: 회귀 검증

작업 항목:

- `pnpm test` 전체 단위 PASS 확인 (선행 4 SPEC 의 234 단위 + 본 SPEC 신규 단위).
- `pnpm test:e2e` 전체 e2e PASS 확인 (선행 4 SPEC 의 7 e2e + 본 SPEC 신규 e2e).
- `pnpm test:cov` 커버리지 ≥ 85% 확인.
- `pnpm lint` 무경고.
- `pnpm build` 성공.

---

## Tech 결정 (Lock-in)

| 결정 | 값 | 근거 |
|------|-----|------|
| BASE_URL_MAP key | `Odii` (suffix 없음) | KTO 공식 service path 그대로 |
| 도구 prefix | `kto_audio_*` | LLM 친화. Odii 약어 회피 |
| 모듈 디렉토리 | `src/kto/audio-guide/` | 서술적. 모듈 헤더 주석에 `Odii` 명시 |
| DTO 클래스 prefix | `Ag` (AudioGuide) | 선행 prefix (`Kt`/`Bf`/`Pg`/`Gc`) 충돌 회피 |
| typed item 인터페이스 | `OdiiStoryItem` + `OdiiThemeItem` | KTO service name (`Odii`) prefix + entity (`Story` / `Theme`) suffix |
| 인덱스 시그니처 | `[key: string]: string | undefined` 양 인터페이스 모두 | SPEC-KTO-004 일관성 |
| `langCode` 처리 | DTO `@IsNotEmpty()` 필수, enum 미강제 | KTO 0 records 정책 그대로 유통 |
| 도구 description `langCode` 안내 | "ko 또는 en. 보통 ko 권장" | 운영 가이드 |
| Base DTO 클래스 | 미사용 | 신규 추상화 0건 정책 + 선행 DTO 패턴 일관성 |
| 신규 라이브러리 | 0건 | 100% 재사용 |
| 신규 추상화 | 0건 | 패턴 복제 |

---

## Risks

### R1 (LOW) — `langCode` 가능값 미래 확장

위험: KTO 가 `ja`, `zh`, `de` 등 신규 언어를 향후 추가할 가능성. 현재는 0 records
응답.

영향: DTO 에서 enum 강제 시 신규 언어 추가 후 코드 갱신 전까지 차단됨.

완화: DTO 에서 `langCode` 를 `string` 으로 받고 enum 강제 미적용. 도구
description 에서만 권장값 안내. KTO 응답을 그대로 통과시켜 사용자가 결과 0
records 를 보고 판단 가능.

### R2 (LOW) — Odii service path 가 4번째 다국어 패턴

위험: `BASE_URL_MAP` 위 `@MX:NOTE` prose 가 3 패턴만 명시한 상태. 신규 패턴
미문서화 시 향후 신규 SPEC 작성자가 디자인 의도 파악 곤란.

영향: 가독성·유지보수성 저해. 런타임 동작 영향 없음.

완화: Phase 1.1 에서 prose 1줄 보강하여 4 패턴 모두 명시. `@MX:SPEC` 라인에
`SPEC-KTO-005 REQ-OPT-001` 추가.

### R3 (LOW) — Story / Theme 두 entity 의 응답 필드 불일치

위험: 동일 service path 의 8 오퍼레이션이 두 종류의 응답 스키마 (Story / Theme)
를 가짐. 단일 typed interface 로 처리 시 타입 안전성 저하.

영향: TypeScript 타입 추론 정확성 저해.

완화: `OdiiStoryItem` 과 `OdiiThemeItem` 를 별도 interface 로 분리 정의. 4 Story
메서드는 `Promise<KtoListResponse<OdiiStoryItem>>`, 4 Theme 메서드는
`Promise<KtoListResponse<OdiiThemeItem>>` 반환. `tool-registry` 의 일반화된
배열 기반 등록 (선행 SPEC-KTO-003 도입) 으로 두 entity 의 도구를 동일 registry
배열에 혼재 가능.

### R4 (LOW) — `audioUrl` URL 안정성

위험: KTO CDN URL (`sfj608538-sfj608538.ktcdn.co.kr`) 의 가용성 변동 가능성.
SPEC 응답에는 URL 그대로 전달.

영향: 사용자가 클릭한 시점에 fetch 실패 가능.

완화: 본 SPEC 의 Exclusions 에 명시 (URL 만 노출, 외부 검증 미실시). KTO API
계약 그대로 통과시키며 책임 경계를 명확화.

---

## MX Tag Plan

본 SPEC 의 MX 태그 변경:

- `src/kto/common/constants.ts` `@MX:NOTE` prose 갱신 — 3 패턴 → **4 패턴** 명시.
- `src/kto/common/constants.ts` `@MX:SPEC` 라인에 `SPEC-KTO-005 REQ-OPT-001`
  추가.
- 8 service 메서드 (`AudioGuideService`) → 신규 코드. `@MX:TODO test` 마커
  추가 후 GREEN 단계에서 제거.
- `src/kto/audio-guide/types.ts` 두 interface 헤더 주석에 `@MX:NOTE` 부착:
  - `OdiiStoryItem` 헤더: "Story 계열 응답 — 오디오 내레이션 위치 단위. 4
    Story 오퍼레이션 (`storyBasedList`, `storyBasedSyncList`,
    `storyLocationBasedList`, `storySearchList`) 의 공용 응답 타입."
  - `OdiiThemeItem` 헤더: "Theme 계열 응답 — 테마 관광지 카탈로그. 4 Theme
    오퍼레이션 (`themeBasedList`, `themeBasedSyncList`,
    `themeLocationBasedList`, `themeSearchList`) 의 공용 응답 타입."
- `audio-guide.module.ts` 헤더 주석에 KTO Odii service path 링크.
- `audio-guide.service.ts` 의 8 메서드 → 신규 코드. fan_in ≥ 3 미발생 (각 메서드
  1 도구만 호출). `@MX:ANCHOR` 미적용.

---

Version: 0.1.0
Last Updated: 2026-05-09
