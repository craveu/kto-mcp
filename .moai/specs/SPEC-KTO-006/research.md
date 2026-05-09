# Research — SPEC-KTO-006 (KTO 두루누비 정보 API, Durunubi)

본 문서는 SPEC-KTO-006 의 사전 조사 결과를 정리한다. 본 SPEC 은 한국관광공사
**두루누비 정보 API (Durunubi, data.go.kr ID 15101974)** 를 MCP 서버에
통합하는 6차 이터레이션이다. SPEC-KTO-001 ~ SPEC-KTO-005 의 공용 인프라
(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 3종, 에러
모델, 재시도 정책, `BASE_URL_MAP`) 를 100% 재사용한다. 본 SPEC 은 지금까지의
SPEC 중 **가장 작다** — 오퍼레이션 단 2개, 신규 추상화 0건.

본 문서의 모든 사실은 (a) data.go.kr Swagger 2.0 카탈로그, (b) 실제 KTO 호출
응답(`totalCount` 포함), (c) `courseList` / `routeList` 양 오퍼레이션 응답 샘플
직접 점검으로부터 검증되었다. `[ASSUMED]` 마커 없이 작성한다.

---

## 1. API 개요

### 1.1 기본 정보

| 항목 | 값 |
|------|------|
| API 이름 | 두루누비 정보 (Durunubi) |
| 공공데이터포털 ID | 15101974 |
| 한글 명칭 | 두루누비 (코리아둘레길) |
| Service path | `B551011/Durunubi` (버전 suffix 없음 — SPEC-KTO-004 GoCamping / SPEC-KTO-005 Odii 와 동일한 평면 형태) |
| Base URL | `http://apis.data.go.kr/B551011/Durunubi` |
| 인증 방식 | `serviceKey` 쿼리 파라미터 (KTO 공통 — 기존 `KtoHttpClient` 그대로 재사용) |
| 응답 인코딩 | `MobileOS=ETC&MobileApp=kto-mcp&_type=json` (SPEC-KTO-001 과 동일 인코딩, `COMMON_PARAMS` 그대로 재사용) |
| 응답 envelope | KTO 공통 (`response.header` + `response.body` + `items.item[]`) |
| 에러 envelope | flat envelope `{responseTime, resultCode, resultMsg}` (SPEC-KTO-003 hotfix 로 이미 처리됨) |
| `langCode` 파라미터 | **미사용** — 한국어 단일 응답 (SPEC-KTO-005 Odii 와의 차별점) |
| 컨텐츠 | 코리아둘레길 트래킹 코스 GPX 정보 + 상위 카테고리 (테마) 정보 |

### 1.2 코리아둘레길 컨텍스트

Swagger 2.0 카탈로그의 description 필드 (info.description) 는 다음과 같이
서술한다 (원문 인용):

> "한국관광공사에서 제공하는 전국 순환형 트래킹 코스 '코리아둘레길'의 284개
> 코스 상세 GPX 정보와 주변 관광정보. 두루누비 외 타 어플에도 적용하여 걷기
> 기록을 측정 할 수 있으며, 트래킹용 스마트 워치에 다운받아 개인별로 기록 측정
> 및 완주가 가능합니다."

Swagger 카탈로그가 명시한 "284 코스" 와 실제 `courseList` 응답 `totalCount`
(228) 는 일치하지 않는다. 실 응답값 **228** 을 검증된 사실로 채택하며, 284 는
Swagger description 상의 표기치로 양쪽 모두 본 문서에 기록한다. 차이의 원인은
KTO 카탈로그·실 데이터 동기화 시점 차이로 추정되며, 본 SPEC 의 구현은 양쪽 어떤
숫자도 코드에 박지 않는다 — `totalCount` 는 응답에서 그대로 전달한다.

### 1.3 두루누비 운영 카테고리

`routeList` 오퍼레이션은 코리아둘레길 산하 상위 카테고리(테마) 를 노출하며,
실호출 결과 `totalCount=3` 으로 매우 작은 카탈로그다. 응답 샘플로 확인된
대표 테마는:

- 남파랑길 (남쪽의 쪽빛 바다와 함께 걷는 길)
- 해파랑길
- 평화누리길 / 제주올레 등 (3개 카테고리 중 하나)

`themeNm` 필드가 한글 테마명을, `linemsg` 필드가 한 줄 설명을, `themedescs`
필드가 HTML 포함 상세 설명을 보유한다.

### 1.4 선행 SPEC 와의 비교

선행 5 SPEC 까지 KTO 다국어 처리 패턴은 **4 가지** 가 카탈로그에 공존한다:

- **패턴 A — V2 다국어 다중 path (SPEC-KTO-001)**: `KorService2`, `EngService2`,
  `JpnService2`, `ChsService2`, `ChtService2`, `GerService2`, `FreService2`,
  `SpnService2`, `RusService2` 의 9 개 별도 service path.
- **패턴 B — V2 단독 (SPEC-KTO-002)**: `KorWithService2` (무장애 여행정보).
- **패턴 C — V1 / suffix 없음 단독 (SPEC-KTO-003 / SPEC-KTO-004)**:
  `PhotoGalleryService1` (사진 갤러리), `GoCamping` (고캠핑). 다국어 변체
  카탈로그 미보유.
- **패턴 D — 단일 path + `langCode` 파라미터 (SPEC-KTO-005)**: `Odii` (관광지
  오디오 가이드). 동일 path 에서 `langCode` 입력으로 한국어/영어 분기.

본 SPEC 의 `Durunubi` 는 **패턴 C 에 속한다** — 단일 service path, suffix 없음,
다국어 변체 미존재, `langCode` 파라미터 부재. 즉 KTO 가 보유한 4번째 패턴 (D)
이 아닌, 3번째 패턴 (C) 의 자연스러운 흡수다. 신규 패턴 도입 없음.

`BASE_URL_MAP` 위 `@MX:NOTE` prose 는 SPEC-KTO-005 에서 이미 4 패턴을 명시하도록
보강되어 있으며, 본 SPEC 은 그 prose 를 변경하지 않는다 — 패턴 C 에 속하므로
새 패턴 안내 추가 불필요. `@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 만
추가한다.

### 1.5 인증·인코딩

`KtoHttpClient` (SPEC-KTO-001 도입, SPEC-KTO-003 에서 flat envelope 검출 hotfix
추가) 는 다음 동작을 수행하며, 본 SPEC 도 동일하게 동작한다:

- `serviceKey` 환경변수 → URL-encoded 쿼리 파라미터로 전달
- `COMMON_PARAMS` (`MobileOS`, `MobileApp`, `_type`) 자동 주입
- 응답 envelope 정규화 (`response.body.items.item[]` → 배열로 평탄화)
- flat error envelope 검출 → `KtoApiError` 발생
- 5xx + 네트워크 에러 → `RETRY_CONFIG` (max 3, base 200ms, factor 2.0,
  jitter ±20%) 적용

본 SPEC 은 위 동작에 대해 어떠한 변경도 가하지 않는다.

---

## 2. 오퍼레이션 카탈로그

### 2.1 오퍼레이션 목록 (2개 — 사전 검증 완료)

| # | Operation | 설명 | totalCount (실호출 검증) | 응답 entity |
|---|-----------|------|------------------------|------------|
| 1 | `courseList` | 트래킹 코스 목록 (코리아둘레길 코스 단위) | **228** (Swagger description: 284) | `DurunubiCourseItem` |
| 2 | `routeList` | 경로(테마) 목록 (코리아둘레길 상위 카테고리) | **3** | `DurunubiRouteItem` |

본 SPEC 의 오퍼레이션 수는 SPEC-KTO-001 ~ SPEC-KTO-005 의 어떤 SPEC 보다도
적다 (각각 15, 10, 4, 5, 8). 따라서 본 SPEC 은 도구 1:1 매핑이 매우 단순하다.

### 2.2 응답 entity 비교 (DurunubiCourseItem vs DurunubiRouteItem)

두 entity 는 응답 스키마가 명확히 다른 도메인 단위다.

| 속성 | DurunubiCourseItem (courseList) | DurunubiRouteItem (routeList) |
|------|--------------------------------|-------------------------------|
| 단위 의미 | 트래킹 가능한 단일 코스 (예: "남파랑길 1코스") | 코리아둘레길 상위 테마 카테고리 (예: "남파랑길") |
| `routeIdx` | O — 소속 테마 ID (e.g., `T_ROUTE_MNG0000000001`) | O — 테마 자체 ID |
| `crsIdx` | O — 코스 ID (e.g., `T_CRS_MNG0000005116`) | X |
| `crsKorNm` | O — 코스 한글명 (e.g., "남파랑길 1코스") | X |
| `crsDstnc` | O — 코스 거리(km, string) | X |
| `crsTotlRqrmHour` | O — 총 소요시간(분, string) | X |
| `crsLevel` | O — 난이도 (숫자코드 string) | X |
| `crsCycle` | O — 순환형 여부 ("순환형" / "비순환형") | X |
| `crsContents` | O — 코스 상세 설명 (긴 텍스트) | X |
| `crsSummary` | O — 코스 요약 | X |
| `crsTourInfo` | O — 주변 관광 정보 | X |
| `travelerinfo` | O — 여행자 정보 | X |
| `sigun` | O — 시군 (행정구역) | X |
| `brdDiv` | O — 경계 구분 | X |
| `gpxpath` | O — **GPX 파일 URL** (트래킹 워치/외부 앱 연동용) | X |
| `themeNm` | X | O — 테마명 (e.g., "남파랑길") |
| `linemsg` | X | O — 한 줄 설명 (e.g., "남쪽의 쪽빛 바다와 함께 걷는 길") |
| `themedescs` | X | O — 테마 상세 설명 (HTML 포함, e.g., `<p>...남파랑길은...</p>`) |
| `createdtime` | O | O |
| `modifiedtime` | O | O |
| index signature | O — `[key: string]: string \| undefined` | O — `[key: string]: string \| undefined` |

두 entity 의 공통 필드는 `routeIdx`, `createdtime`, `modifiedtime` 뿐이며,
나머지는 완전히 분리된 도메인 속성을 가진다. 따라서 두 entity 를 한
typed interface 로 합치지 않고 **분리 노출** 한다.

### 2.3 `gpxpath` 필드 의미 (HARD 경계)

`DurunubiCourseItem.gpxpath` 는 GPX 파일을 가리키는 **URL 문자열** 이다.
GPX 는 GPS Exchange Format 의 약자로 위경도 trackpoint 시퀀스를 XML 로 표현한
표준 포맷이다. 본 SPEC 은 다음 경계를 엄격히 준수한다:

- **IN SCOPE**: `gpxpath` 의 URL 문자열을 `DurunubiCourseItem` 응답 그대로 노출.
- **OUT OF SCOPE**: GPX 파일 다운로드, GPX XML 파싱, trackpoint 추출, 경로 시각화.
  → 트래킹용 스마트 워치, 두루누비 앱, 외부 GIS 앱이 GPX URL 을 받아 처리하는
  것이 정상 흐름이며, MCP 서버는 URL 만 전달한다.
- **이유**: (a) Swagger description 도 "트래킹용 스마트 워치에 다운받아 개인별로
  기록 측정" 으로 외부 클라이언트 처리를 명시. (b) GPX 다운로드/파싱은 전혀
  다른 도메인이며 별도 SPEC 후보. (c) MCP 도구의 단일 책임 원칙 준수.

이 경계는 본 SPEC `Exclusions` 섹션에 명시한다.

### 2.4 `themedescs` 필드의 HTML 콘텐츠

`DurunubiRouteItem.themedescs` 는 HTML 태그 (`<p>`, `<br>` 등) 를 포함한
서술형 텍스트다. 본 SPEC 은:

- **IN SCOPE**: HTML 텍스트 그대로 응답에 포함하여 LLM 클라이언트로 전달.
- **OUT OF SCOPE**: HTML 파싱, sanitization, plain text 변환, 렌더링.
  → MCP 서버는 KTO 원형 콘텐츠를 그대로 전달하며, LLM 클라이언트가 자체적으로
  HTML 을 해석한다.
- **XSS 위험성 평가**: MCP 서버 응답은 LLM 클라이언트 (Claude Code, Anthropic
  데스크톱 앱 등) 가 처리한다. 클라이언트는 LLM 응답을 HTML 로 렌더링하지
  않으며, plain text 또는 markdown 으로 표시하므로 XSS 표면이 형성되지 않는다.
  본 SPEC 은 sanitization 미적용을 의도적 결정으로 채택한다.

### 2.5 페이지네이션

KTO 공통 페이지네이션 (`numOfRows`, `pageNo`) 은 양 오퍼레이션 모두 동작한다.
다만:

- `courseList` 의 totalCount 228 → 페이지네이션 의미 있음.
- `routeList` 의 totalCount **3** → 페이지네이션 사실상 불필요. 한 번의 호출로
  전체 카탈로그를 받을 수 있다. 다만 KTO 기본 동작과의 일관성을 위해 DTO 에
  `numOfRows?` / `pageNo?` 는 노출한다 (값 미지정 시 KTO 기본값 사용).

---

## 3. DTO·도구 설계 결정

### 3.1 DTO

두 DTO 모두 **모든 파라미터 optional**:

- `DuCourseListDto` — `numOfRows?: number`, `pageNo?: number` (둘 다
  `@IsOptional()`)
- `DuRouteListDto` — `numOfRows?: number`, `pageNo?: number` (둘 다
  `@IsOptional()`)

`langCode` 파라미터는 양 오퍼레이션 모두 KTO 가 요구하지 않으므로 DTO 에 노출
하지 않는다. 빈 입력 (`{}`) 으로 호출 시 KTO 가 default 동작 (1 페이지, 기본
행 수) 을 수행한다.

검증 규칙은 SPEC-KTO-001 ~ SPEC-KTO-005 의 패턴 그대로 적용:

- `numOfRows`: `@IsOptional()`, `@IsInt()`, `@Min(1)`, `@Max(100)`
- `pageNo`: `@IsOptional()`, `@IsInt()`, `@Min(1)`

### 3.2 도구 명명

선행 SPEC 의 prefix 패턴 (`kto_korean_*`, `kto_barrier_free_*`, `kto_photo_*`,
`kto_camping_*`, `kto_audio_*`) 을 따라 두루누비는 `kto_durunubi_*` 를 채택한다.
"두루누비" 는 KTO 의 공식 제품명 (한글)이며, 영문 표기 또한 KTO 공식 브랜드
가이드에서 `Durunubi` 로 transliteration 된다. 따라서 prefix `durunubi` 는 한글
브랜드의 적법한 영문화이며 도구 식별자에 사용 가능하다.

도구 이름 형식: `kto_durunubi_<exactOpName>`

- `kto_durunubi_courseList`
- `kto_durunubi_routeList`

이는 SPEC-KTO-005 가 도입한 `kto_audio_<exactOpName>` 형식 (camelCase 보존) 과
동일한 명명 규칙이다.

---

## 4. 위험·미해결 항목

### 4.1 위험 (LOW)

- **R1 — totalCount 카탈로그 vs 실 데이터 불일치**: Swagger 카탈로그
  description "284 코스" 와 실 응답 `totalCount=228` 차이. 영향: 매우 낮음
  (구현은 응답값 그대로 전달, 코드에 숫자 박지 않음). 완화: research.md 와
  spec.md 노트에 양쪽 모두 기록.
- **R2 — themedescs HTML 콘텐츠**: HTML 태그 포함 응답을 그대로 전달. 영향: 매우
  낮음 (MCP 클라이언트는 LLM 응답을 HTML 렌더링하지 않으므로 XSS 표면 없음).
  완화: 노트만 추가.
- **R3 — routeList 페이지네이션 무효성**: totalCount=3 으로 페이지네이션 무의미.
  영향: 매우 낮음 (DTO 호환성 보존, 사용자가 빈 입력으로 호출해도 정상 동작).
  완화: SPEC 노트로 기록.

### 4.2 미해결 항목

본 SPEC 범위 내에 미해결 항목 없음. KTO 두루누비 API 의 모든 오퍼레이션 (2개)
이 본 SPEC 에서 흡수된다.

---

## 5. 결론

SPEC-KTO-006 은 **현재까지 가장 작은 KTO SPEC** 이다 — 오퍼레이션 2개, 신규
패턴 0건, 신규 추상화 0건. SPEC-KTO-004 (GoCamping) 와 동일한 패턴 C (suffix
없는 평면 형태, 다국어 변체 미존재) 에 자연스럽게 흡수된다. SPEC-KTO-001 ~
SPEC-KTO-005 의 공용 인프라를 100% 재사용하며, `BASE_URL_MAP` 1줄 + 모듈
디렉토리 1개 추가로 통합이 완료된다.

`gpxpath` 와 `themedescs` 필드는 본 SPEC 에서 **URL/HTML 문자열을 그대로 전달**
하는 정책을 채택하며, GPX 파싱·HTML sanitization 은 명시적으로 out-of-scope
이다.
