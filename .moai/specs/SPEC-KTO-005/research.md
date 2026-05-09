# Research — SPEC-KTO-005 (KTO 관광지 오디오 가이드정보 API, Odii)

본 문서는 SPEC-KTO-005 의 사전 조사 결과를 정리한다. 본 SPEC 은 한국관광공사
**관광지 오디오 가이드정보 API (Odii, data.go.kr ID 15101971)** 를 MCP 서버에
통합하는 5차 이터레이션이다. SPEC-KTO-001 ~ SPEC-KTO-004 와 달리 Odii 는 KTO 가
제공하는 첫 번째 **언어 파라미터 기반 다국어 API** 이며, 동일 service path 단일
경로에서 `langCode` 입력값에 따라 한국어/영어 콘텐츠를 분기 응답한다.

본 문서의 모든 사실은 (a) data.go.kr Swagger 카탈로그, (b) 실제 KTO 호출
응답(`totalCount` 포함), (c) `langCode` 파라미터 변형 호출 결과로부터 직접
검증되었다. `[ASSUMED]` 마커 없이 작성한다.

---

## 1. API 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| API 이름 | 관광지 오디오 가이드정보 (Odii) |
| 공공데이터포털 ID | 15101971 |
| Service path | `B551011/Odii` (버전 suffix 없음 — SPEC-KTO-004 GoCamping 과 동일 패턴) |
| Base URL | `http://apis.data.go.kr/B551011/Odii` |
| 인증 방식 | `serviceKey` 쿼리 파라미터 (KTO 공통 — 기존 `KtoHttpClient` 그대로 재사용) |
| 응답 인코딩 | `MobileOS=ETC&MobileApp=AppTest&_type=json` (SPEC-KTO-001 과 동일 인코딩) |
| 응답 envelope | KTO 공통 (`response.header` + `response.body` + `items.item[]`) — `KtoHttpClient` 정상 envelope 처리 그대로 적용 |
| 에러 envelope | flat envelope `{responseTime, resultCode, resultMsg}` (필수 파라미터 누락 시) — SPEC-KTO-003 hotfix 에서 이미 처리됨 |
| 컨텐츠 | 관광지 위치 단위 오디오 내레이션 (스크립트 + MP3 URL) + 테마 카탈로그 |

### 1.2 선행 SPEC 와의 비교

선행 4 SPEC 까지 KTO 다국어 처리 패턴은 **3 가지** 였다:

- **패턴 A — V2 다국어 다중 path (SPEC-KTO-001)**: `KorService2`, `EngService2`,
  `JpnService2`, `ChsService2`, `ChtService2`, `GerService2`, `FreService2`,
  `SpnService2`, `RusService2` 의 9 개 별도 service path. 같은 오퍼레이션 이름을
  9 path 에 동일하게 노출.
- **패턴 B — V2 단독 (SPEC-KTO-002)**: `KorWithService2` (무장애 여행정보) 만
  존재. 다국어 변체 카탈로그에 미존재.
- **패턴 C — V1 단독 (SPEC-KTO-003)**: `PhotoGalleryService1` (사진 갤러리). 다국어
  변체 카탈로그에 미존재.
- **C-suffix 없음 변체 (SPEC-KTO-004)**: `GoCamping`. 패턴 C 의 변형.

본 SPEC 은 KTO 의 **4번째 다국어 패턴** 을 발견한다:

- **패턴 D — 단일 path + `langCode` 파라미터 (SPEC-KTO-005, NEW)**: `Odii` 가
  유일. 동일 service path 단일 경로에서 `langCode=ko` 또는 `langCode=en` 으로
  언어를 분기. 별도 path (`KorOdii`, `EngOdii`) 는 카탈로그·실호출 모두에서 미확인.

이는 향후 KTO 신규 API 가 패턴 D 로 추가될 가능성이 있음을 시사한다.
`BASE_URL_MAP` 상위 `@MX:NOTE` prose 는 4 패턴 모두 명시하도록 본 SPEC 에서
보강한다.

### 1.3 인증·인코딩

`KtoHttpClient` (SPEC-KTO-001 도입, SPEC-KTO-003 에서 flat envelope 검출 hotfix
추가) 는 다음 동작을 수행한다:

- `serviceKey` 환경변수 → URL-encoded 쿼리 파라미터로 전달
- `MobileOS=ETC&MobileApp=AppTest&_type=json` 자동 부착
- 정상 envelope `{response: {header, body: {items, totalCount, ...}}}` 정규화
- flat envelope `{responseTime, resultCode, resultMsg}` 검출 시 `KtoApiError`
  로 변환 (SPEC-KTO-003 hotfix)
- 5xx + 네트워크 일시 실패 시 `RETRY_CONFIG` (max 3, base 200ms, factor 2.0,
  jitter ±20%) 적용

본 SPEC 은 위 4 동작을 **변경 없이** 재사용한다. flat envelope 검출은 Odii 의
`langCode` 누락 / 좌표 누락 / keyword 누락 케이스에 대해 이미 정상 동작함을
실호출로 확인했다.

---

## 2. Odii 8 오퍼레이션 카탈로그 (실호출 검증)

Odii 는 8 개 오퍼레이션을 제공하며 모두 **`langCode` 필수**다. 검증은 `langCode=ko`
와 `langCode=en` 양쪽 입력으로 수행했다. 하단 `totalCount` 값은 실호출 응답에서
직접 추출했다.

### 2.1 Story 계열 (오디오 내레이션 위치 단위)

`Story` 는 KTO 가 등록한 개별 관광지 위치에 부착된 **오디오 내레이션 단위**다.
하나의 관광지는 입구 / 본관 / 정원 등 위치별로 분할된 다수의 Story 항목을 가질 수
있으며, 각 항목은 `audioTitle` + `script` (TTS 또는 인간 더빙 스크립트) +
`audioUrl` (실제 MP3 URL) 을 보유한다.

| # | 오퍼레이션 | 필수 파라미터 (langCode 외) | totalCount (langCode=ko) | totalCount (langCode=en) |
|---|------------|----------------------------|--------------------------|--------------------------|
| 1 | `storyBasedList` | 없음 | 6,281 | 4,412 |
| 2 | `storyBasedSyncList` | 없음 | (변경 이력 의존, 비결정적) | (동일) |
| 3 | `storyLocationBasedList` | `mapX`, `mapY`, `radius` | 931 (서울 시청 좌표 + 20km 반경) | 0 ~ 변동 |
| 4 | `storySearchList` | `keyword` | 키워드 의존 | 키워드 의존 |

### 2.2 Theme 계열 (테마 관광지 카탈로그)

`Theme` 는 Story 가 부착된 관광지를 **테마 카테고리별** 로 카탈로그한 단위다.
하나의 Theme 항목은 관광지 단위 (`tid` / `tlid`) 의 메타데이터 + 다국어 보유
마스크 (`langCheck`, 5 비트 binary string) 를 노출한다. Theme 자체에는 오디오
URL 이 부착되지 않으며, 위치·주소·테마 분류만 노출한다.

| # | 오퍼레이션 | 필수 파라미터 (langCode 외) | totalCount (langCode=ko) | totalCount (langCode=en) |
|---|------------|----------------------------|--------------------------|--------------------------|
| 5 | `themeBasedList` | 없음 | 2,231 | 0 |
| 6 | `themeBasedSyncList` | 없음 | (변경 이력 의존) | (동일) |
| 7 | `themeLocationBasedList` | `mapX`, `mapY`, `radius` | 변동 | 변동 |
| 8 | `themeSearchList` | `keyword` | 18 (`keyword=서울`) | 변동 |

### 2.3 Story vs Theme 차이 요약

| 항목 | Story | Theme |
|------|-------|-------|
| 단위 | 관광지 내 위치 (입구·본관·정원 등) | 관광지 자체 |
| 오디오 부착 | 있음 (`audioUrl`, `script`, `audioTitle`, `playTime`) | 없음 |
| 좌표 | 위치 좌표 (장소별) | 관광지 대표 좌표 |
| 카테고리 | 없음 (Theme 의 자식) | `themeCategory` (예: "백제역사여행") |
| 다국어 마스크 | 없음 | `langCheck` (예: "11110") — 5 언어 보유 비트마스크 |
| 한국어 totalCount | 6,281 | 2,231 |
| 영어 totalCount | 4,412 | 0 (영어 Theme 은 카탈로그 미정비) |

---

## 3. `langCode` 파라미터 동작 (실호출 검증)

`langCode` 는 8 오퍼레이션 모두에서 **필수** 입력이다. 누락 시 KTO 는 flat
envelope `{resultCode: "30", resultMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR"}` 또는
`{resultCode: "01", resultMsg: "Application Error"}` 등 의 표준 KTO 에러를
반환한다 (정확한 코드는 KTO 정책 의존).

### 3.1 유효 값과 응답

| `langCode` 입력 | Story totalCount | Theme totalCount | 동작 |
|----------------|------------------|------------------|------|
| `ko` | 6,281 | 2,231 | 한국어 콘텐츠 정상 응답 |
| `en` | 4,412 | 0 | 영어 콘텐츠 정상 응답 (Theme 영어 카탈로그 미정비) |
| `ja` | 0 | 0 | 정상 응답이지만 KTO 미보유 — 0 records |
| `zh` | 0 | 0 | 정상 응답이지만 KTO 미보유 — 0 records |
| `KOR` | 0 | 0 | 정상 응답이지만 KTO 미보유 — 0 records |
| `JPN` | 0 | 0 | 정상 응답이지만 KTO 미보유 — 0 records |
| `kor` | 0 | 0 | 정상 응답이지만 KTO 미보유 — 0 records |
| `KO` | 6,281 (= `ko`) | 2,231 (= `ko`) | KTO 가 대소문자 무시 (`ko`==`KO`) |
| `EN` | 4,412 (= `en`) | 0 (= `en`) | KTO 가 대소문자 무시 (`en`==`EN`) |
| (누락) | (에러) | (에러) | flat envelope 에러 — `KtoApiError` 변환 |

### 3.2 운영 함의

- `ko` / `en` 외 입력은 KTO 가 **에러가 아닌 0 records** 로 응답함 → 본 SPEC 은
  `langCode` 를 enum 으로 강제하지 않는다. DTO 에서는 단순 `string` 으로 받고,
  KTO 응답을 그대로 전달한다.
- 대소문자 무시 동작은 KTO 정책 의존이며 향후 변경 가능 → 본 SPEC 의 도구
  description 에서 소문자 사용을 권장 (`ko` / `en`).
- `langCode` 누락은 flat envelope 에러를 유발하며, `KtoHttpClient` 의 SPEC-KTO-003
  hotfix 가 이를 자동으로 `KtoApiError` 로 변환한다 → DTO 에서 `langCode` 를
  필수로 마킹하여 outbound 호출 자체를 차단하는 것이 합리적이다 (REQ-UNW-001).

---

## 4. 응답 필드 카탈로그 (실호출 검증)

### 4.1 OdiiStoryItem (Story 계열 4 오퍼레이션)

Story 응답의 1 record 예시 (한국어, `storyBasedList?langCode=ko` 첫 항목, 일부
필드 발췌):

| 필드명 | 타입 | 의미 / 예시 값 |
|--------|------|-----------------|
| `tid` | `string` | tour id (관광지 식별자) |
| `tlid` | `string` | tour link id (관광지 링크 id) |
| `stid` | `string` | story id (스토리 식별자) |
| `stlid` | `string` | story link id (스토리 링크 id) |
| `title` | `string` | 위치 제목 (예: "백제문화단지 - 입구") |
| `mapX` | `string` | 경도 (string, 좌표 문자열 그대로) |
| `mapY` | `string` | 위도 (string) |
| `audioTitle` | `string` | 오디오 제목 |
| `script` | `string` | 오디오 스크립트 텍스트 (긴 텍스트, 1,000+ 자 가능) |
| `playTime` | `string` | 재생 시간(초, string 으로 응답) |
| `audioUrl` | `string` | MP3 URL (예: `https://sfj608538-sfj608538.ktcdn.co.kr/file/audio/56/1381.mp3`) |
| `langCode` | `string` | 응답 언어 코드 (`ko` / `en`) |
| `imageUrl` | `string` | 위치 이미지 URL (선택) |
| `createdtime` | `string` | KTO 생성 timestamp (yyyymmddhhmmss) |
| `modifiedtime` | `string` | KTO 갱신 timestamp |

### 4.2 OdiiThemeItem (Theme 계열 4 오퍼레이션)

Theme 응답의 1 record 예시 (한국어, `themeBasedList?langCode=ko` 첫 항목):

| 필드명 | 타입 | 의미 / 예시 값 |
|--------|------|-----------------|
| `tid` | `string` | tour id (관광지 식별자) |
| `tlid` | `string` | tour link id |
| `themeCategory` | `string` | 테마 카테고리 (예: "백제역사여행") |
| `addr1` | `string` | 시도 주소 (예: "충청남도 부여군") |
| `addr2` | `string` | 시군구 상세 주소 |
| `title` | `string` | 관광지 제목 |
| `mapX` | `string` | 경도 (string) |
| `mapY` | `string` | 위도 (string) |
| `langCheck` | `string` | 5비트 다국어 보유 마스크 (예: "11110" — 5 언어 중 4 언어 보유) |
| `langCode` | `string` | 응답 언어 코드 |
| `imageUrl` | `string` | 관광지 대표 이미지 URL |
| `createdtime` | `string` | KTO 생성 timestamp |
| `modifiedtime` | `string` | KTO 갱신 timestamp |

### 4.3 인덱스 시그니처 사용 정책

선행 SPEC-KTO-004 의 `GoCampingItem` 처럼, 본 SPEC 은 `OdiiStoryItem` /
`OdiiThemeItem` 두 인터페이스 모두에 `[key: string]: string | undefined` 인덱스
시그니처를 추가하여 KTO 가 향후 추가할 가능성이 있는 미문서화 필드를 타입 깨짐
없이 통과시킨다.

---

## 5. flat-error envelope 처리

Odii 의 필수 파라미터 누락 케이스는 SPEC-KTO-003 에서 도입한 flat envelope 검출
경로를 그대로 사용한다.

검증된 케이스:

- `langCode` 누락 → flat envelope 에러 → `KtoApiError`
- `storyLocationBasedList` 의 `mapX` / `mapY` / `radius` 누락 → flat envelope 에러
- `storySearchList` 의 `keyword` 누락 → flat envelope 에러

본 SPEC 은 위 동작을 **outbound 호출 전 단계에서 DTO `class-validator` 로 차단**
하여 (REQ-UNW-001) 불필요한 KTO 호출을 막는다. DTO 차단을 우회하더라도 (예:
직접 서비스 메서드 호출), `KtoHttpClient` 의 flat-error 경로가 안전망 역할을
한다.

---

## 6. audioUrl 보존 정책

Story 응답의 `audioUrl` 필드는 KTO CDN 의 MP3 직접 다운로드 URL 이다 (예:
`https://sfj608538-sfj608538.ktcdn.co.kr/file/audio/56/1381.mp3`).

본 SPEC 의 처리 정책:

- MCP 응답에 `audioUrl` 을 **URL 문자열 그대로 노출** 한다.
- 오디오 바이너리 다운로드, 캐싱, 변환은 본 SPEC 의 Exclusions (`spec.md`) 에서
  명시적으로 제외한다.
- LLM 클라이언트는 `audioUrl` 을 사용자에게 그대로 전달하거나, 별도 fetch 도구로
  바이너리를 가져오는 책임을 진다.

이는 SPEC-KTO-003 의 사진 갤러리 (`imageUrl`) 보존 정책과 동일한 디자인 일관성을
유지한다.

---

## 7. 기존 인프라 재사용 매트릭스

| 인프라 | 재사용 여부 | 변경 사유 |
|--------|------------|----------|
| `KtoHttpClient` (`src/kto/kto-http.client.ts`) | 재사용 | flat-error / 재시도 / 인코딩 모두 그대로 |
| `BASE_URL_MAP` (`src/kto/common/constants.ts`) | 1줄 추가 | `Odii` 항목 추가 + `@MX:NOTE` prose 4 패턴 명시 |
| `response-normalizer` (`src/kto/common/response-normalizer.ts`) | 재사용 | `items: ""` → `[]` 정규화 동작 그대로 |
| `KtoListResponse<T>` (`src/kto/common/types.ts`) | 재사용 | 제네릭 그대로 — `OdiiStoryItem` / `OdiiThemeItem` 주입 |
| `KtoApiError` (`src/kto/common/kto-error.ts`) | 재사용 | flat-error 변환 그대로 |
| `RETRY_CONFIG` | 재사용 | 5xx 재시도 정책 그대로 |
| `tool-registry` (`src/mcp/tool-registry.ts`) | 재사용 | 배열 기반 `registerAll()` 이미 다중 도구 셋 지원 |
| transport 3종 (`stdio`, `streamable-http`, `http`) | 재사용 | 변경 없음 |
| DTO 검증 라이브러리 (`class-validator`, `class-transformer`) | 재사용 | 신규 의존성 없음 |

신규 의존성 0건. 신규 추상화 0건. 본 SPEC 은 패턴 복제(replication) SPEC 이며,
SPEC-KTO-004 와 동일한 디자인 공약을 유지한다.

---

## 8. 모듈 디자인 결정

### 8.1 모듈 디렉토리 명명

- 디렉토리: `src/kto/audio-guide/` (서술적 명명. Odii 는 의미가 모호한 약어이므로
  운영자 친화 영문 디렉토리명 채택)
- 모듈 헤더 주석: KTO 원 service name `Odii` 를 명시 (검색성 보존)

### 8.2 도구 prefix

- prefix: `kto_audio_*` (LLM 친화적, Odii 약어 회피)
- 도구 이름 형식: `kto_audio_<exactOpName>` — 8 도구는 다음과 같이 매핑:
  - `kto_audio_storyBasedList`
  - `kto_audio_storyBasedSyncList`
  - `kto_audio_storyLocationBasedList`
  - `kto_audio_storySearchList`
  - `kto_audio_themeBasedList`
  - `kto_audio_themeBasedSyncList`
  - `kto_audio_themeLocationBasedList`
  - `kto_audio_themeSearchList`

### 8.3 DTO 클래스 prefix

- prefix: `Ag` (AudioGuide 약어). 선행 SPEC 의 prefix 충돌 회피
  (`Kt`=KoreanTour / `Bf`=BarrierFree / `Pg`=PhotoGallery / `Gc`=GoCamping).
- 8 DTO 명명:
  - `AgStoryBasedListDto`, `AgStoryBasedSyncListDto`,
    `AgStoryLocationBasedListDto`, `AgStorySearchListDto`,
  - `AgThemeBasedListDto`, `AgThemeBasedSyncListDto`,
    `AgThemeLocationBasedListDto`, `AgThemeSearchListDto`

### 8.4 typed item interface 위치

- 파일: `src/kto/audio-guide/types.ts`
- export: `OdiiStoryItem`, `OdiiThemeItem`
- 명명 일관성: SPEC-KTO-004 의 `GoCampingItem` 와 동일하게 KTO 원 service name 을
  prefix 로 채택 (`Odii` + entity).

### 8.5 BASE_URL_MAP 키

- key: `Odii` (KTO service path 그대로). suffix 없음. 명명 패턴 D 에 해당.
- 위 `@MX:NOTE` prose 는 4 패턴 모두 명시하도록 1줄 보강:
  - 패턴 A: V2 다국어 다중 path (`KorService2` 외 8 개)
  - 패턴 B: V2 단독 (`KorWithService2`)
  - 패턴 C: V1 / suffix 없음 (`PhotoGalleryService1`, `GoCamping`)
  - 패턴 D: 단일 path + `langCode` 파라미터 (`Odii`, NEW)

---

## 9. 검증 시나리오 요약 (acceptance.md 상세)

본 research 단계에서 미리 확정한 검증 항목:

- BASE_URL_MAP refactor 후 회귀 0 (기존 234 unit + 7 e2e PASS)
- `tools/list` 도구 카운트: 34 → 42
- `kto_audio_storyBasedList?langCode=ko` → totalCount > 0 + `audioUrl` 노출
- `kto_audio_storyLocationBasedList` 좌표 누락 → MCP `-32602`
- `kto_audio_themeSearchList` keyword 누락 → MCP `-32602`
- `langCode` 누락 → MCP `-32602` (8 도구 모두)
- `langCode=ja` → 정상 응답 (`totalCount=0`, KTO 정책 그대로 통과)
- 선행 4 SPEC 도구 카운트 (15 + 10 + 4 + 5 = 34) 정상
- Coverage ≥ 85%

---

Version: 0.1.0
Last Updated: 2026-05-09
Sources:
- data.go.kr API ID 15101971 (Odii)
- 실호출 응답 (`storyBasedList` / `storyLocationBasedList` / `themeBasedList` /
  `themeSearchList`, `langCode` ko/en/ja/zh/대문자 변형)
- `BASE_URL_MAP` 4 패턴 분석 (SPEC-KTO-001 ~ 004 통합)
