---
id: SPEC-KTO-006
version: 1.0.0
status: completed
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-006: KTO MCP 서버 6차 이터레이션 (두루누비 정보 Durunubi, 코리아둘레길)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료, 실 키 스모크 검증 통과, main 머지 완료 |
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. 한국관광공사 두루누비 정보 API(`Durunubi`, data.go.kr ID 15101974) 2 오퍼레이션을 MCP 도구로 매핑하는 6차 이터레이션 정의. |

---

## Overview

SPEC-KTO-001 ~ SPEC-KTO-005 에서 구축한 NestJS 11 + TypeScript 5 기반 MCP 서버에
한국관광공사 **두루누비 정보 API (`Durunubi`, data.go.kr ID 15101974)** 를
추가 통합한다. 두루누비는 한국관광공사가 운영하는 전국 순환형 트래킹 코스
"코리아둘레길" 의 공식 안내 채널이며, 본 API 는 코스 단위 GPX 정보와 상위
테마 카테고리 정보를 노출한다.

본 SPEC 은 선행 5 SPEC 의 공용 인프라(`KtoHttpClient`, `response-normalizer`,
`tool-registry`, transport 3종, 에러 모델, 재시도 정책, `BASE_URL_MAP`) 를
변경 없이 재사용하며, **신규 모듈 디렉토리 `src/kto/durunubi/` 를 추가** 하고
`BASE_URL_MAP` 에 `Durunubi` 항목 1줄을 추가한다.

본 SPEC 은 SPEC-KTO-004 (GoCamping) 와 동일한 **패턴 C** 에 속한다 — 단일 service
path, 버전 suffix 없음, 다국어 변체 미존재, `langCode` 파라미터 부재. 신규
다국어 패턴 도입 없음. `BASE_URL_MAP` 위 `@MX:NOTE` prose 는 SPEC-KTO-005 에서
이미 4 패턴을 명시하도록 보강되었으므로 본 SPEC 은 prose 변경하지 않으며,
`@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 만 1 항목 추가한다.

본 SPEC 은 **현재까지 가장 작은 KTO SPEC** 이다:

- 오퍼레이션 수: 2 (선행 SPEC 비교: 15 / 10 / 4 / 5 / 8)
- 도구 수: 2 (전체 도구 카운트: 42 → 44)
- 신규 추상화: 0
- 신규 패턴: 0 (기존 패턴 C 흡수)

---

## 1. 사용자 시나리오

| Persona | Scenario |
|---------|----------|
| 트래킹 사용자 / LLM 어시스턴트 | "남파랑길 1코스의 GPX 파일을 받고 싶어" → MCP 클라이언트가 `kto_durunubi_courseList` 호출 → 응답에서 `crsKorNm == '남파랑길 1코스'` 인 항목의 `gpxpath` URL 을 추출 → 사용자가 트래킹 워치/외부 앱에서 GPX 다운로드. |
| 여행 기획자 / LLM 어시스턴트 | "코리아둘레길의 상위 카테고리에는 뭐가 있어?" → MCP 클라이언트가 `kto_durunubi_routeList` 호출 → 응답에서 3 개 테마 (`themeNm` + `linemsg`) 카탈로그를 받아 사용자에게 안내. |
| 시스템 운영자 | KTO 두루누비 API 가 5xx 에러를 반환하면 MCP 서버가 자동 재시도 (max 3, base 200ms, factor 2.0, jitter ±20%) 후 그래도 실패하면 MCP 클라이언트로 표준 에러 envelope 전달. |

---

## 2. 요구사항 (5 EARS modules)

본 SPEC 은 EARS 5 모듈 max 정책에 따라 다음 5 모듈로 구성된다.

### 2.1 REQ-KTO6-* (Ubiquitous — 도구 노출 / 인프라 재사용 / typed entity)

- **REQ-KTO6-001**: The system shall expose 두루누비 (`Durunubi`) API 의
  `courseList` 와 `routeList` 양 오퍼레이션을 각각 MCP 도구
  `kto_durunubi_courseList`, `kto_durunubi_routeList` 로 노출한다.
- **REQ-KTO6-002**: The system shall reuse SPEC-KTO-001 ~ SPEC-KTO-005 의 공용
  인프라 (`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport
  3종, 에러 모델, 재시도 정책 `RETRY_CONFIG`, `BASE_URL_MAP`, `COMMON_PARAMS`)
  를 변경 없이 100% 재사용한다.
- **REQ-KTO6-003**: The system shall expose 응답 entity 두 종 — `DurunubiCourseItem`
  (코스 단위, 16 필드 + 인덱스 시그니처) 과 `DurunubiRouteItem` (테마 카테고리,
  5 필드 + 인덱스 시그니처) — 을 각각 typed interface 로 정의하고 export 한다.
  KTO 원형 필드명 (`crsKorNm`, `gpxpath`, `themeNm`, `themedescs` 등) 은 그대로
  보존한다.

### 2.2 REQ-EVT-* (Event-driven — MCP 도구 호출 → KTO 응답)

- **REQ-EVT-001**: When MCP 클라이언트가 `tools/call` 로 `kto_durunubi_courseList`
  또는 `kto_durunubi_routeList` 를 호출하면, the system shall (a) 입력 DTO
  검증 통과 후 (b) `KtoHttpClient.fetch(serviceName='Durunubi', operation,
  params)` 를 통해 KTO API 호출, (c) `response-normalizer` 적용,
  (d) 정규화된 `items` 배열과 `totalCount`, `numOfRows`, `pageNo` 를 포함한
  MCP 응답을 반환한다. `gpxpath` URL 과 `themedescs` HTML 텍스트는 KTO 원형
  그대로 전달한다 (다운로드/파싱/sanitization 미적용).

### 2.3 REQ-STATE-* (State-driven — 5xx 재시도)

- **REQ-STATE-001**: While 두루누비 API 가 5xx HTTP 상태 또는 네트워크 에러 (ECONNRESET,
  ETIMEDOUT 등) 를 반환하면, the system shall `RETRY_CONFIG` (max 3 retries,
  base 200ms, factor 2.0, jitter ±20%) 를 그대로 적용하여 자동 재시도한다.
  재시도 후에도 실패하면 표준 KTO 에러 envelope 으로 변환하여 MCP 클라이언트에
  전달한다.

### 2.4 REQ-OPT-* (Optional — BASE_URL_MAP 일반화 확장)

- **REQ-OPT-001**: Where `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 객체가
  존재하는 경우, the system shall `Durunubi:
  'http://apis.data.go.kr/B551011/Durunubi'` 1줄을 추가하고, `@MX:SPEC` 라인에
  `SPEC-KTO-006 REQ-OPT-001` 항목을 추가한다. `@MX:NOTE` prose (4 패턴
  명시) 는 SPEC-KTO-005 에서 이미 보강되었고 두루누비는 패턴 C 에 속하므로
  prose 변경하지 않는다. `KtoServiceName` union 타입은 자동 추론으로 `'Durunubi'`
  를 포함한다.

### 2.5 REQ-UNW-* (Unwanted — 잘못된 입력 차단)

- **REQ-UNW-001**: If MCP 클라이언트가 `kto_durunubi_courseList` 또는
  `kto_durunubi_routeList` 호출 시 잘못된 파라미터 (예: `numOfRows=0`,
  `numOfRows=101`, `pageNo=0`, `numOfRows="abc"`) 를 전달하면, then the system
  shall class-validator 기반 DTO 검증 단계에서 즉시 차단하고, MCP `-32602`
  (Invalid params) 에러를 반환한다. KTO API 호출은 발생하지 않는다.

---

## 3. 영향받는 파일 (Affected Files)

### 3.1 Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `Durunubi:
  'http://apis.data.go.kr/B551011/Durunubi'` 1줄 추가, `@MX:SPEC` 라인에
  `SPEC-KTO-006 REQ-OPT-001` 추가. `@MX:NOTE` prose 미변경.
- `src/app.module.ts` — `DurunubiModule` import 1줄 추가.
- `src/main.ts` — `durunubiService = app.get(DurunubiService)` 라인 추가 +
  `registerAll()` registries 배열에 `{ tools: DURUNUBI_TOOLS, service:
  durunubiService }` 1 항목 (registries 6번째 항목) 추가.
- `test/kto.e2e-spec.ts` — 도구 카운트 assertion 42 → 44 갱신, Durunubi 시나리오
  추가.

### 3.2 Created (`src/kto/durunubi/` 모듈 디렉토리)

```
src/kto/durunubi/
├── durunubi.module.ts
├── durunubi.service.ts
├── durunubi.tools.ts
├── types.ts                  # DurunubiCourseItem + DurunubiRouteItem
├── durunubi.service.spec.ts
├── durunubi.tools.spec.ts
└── dto/
    ├── course-list.dto.ts    # DuCourseListDto
    ├── route-list.dto.ts     # DuRouteListDto
    ├── index.ts
    └── dto.spec.ts           # REQ-UNW-001 검증
```

### 3.3 NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,audio-guide}/**/*`.

---

## 4. 도구 명명 규약 (`kto_durunubi_*`)

### 4.1 도구 prefix 결정

선행 SPEC 의 prefix 패턴:

- SPEC-KTO-001 → `kto_korean_*`
- SPEC-KTO-002 → `kto_barrier_free_*`
- SPEC-KTO-003 → `kto_photo_*`
- SPEC-KTO-004 → `kto_camping_*`
- SPEC-KTO-005 → `kto_audio_*`
- **SPEC-KTO-006 → `kto_durunubi_*`** (NEW)

"두루누비" 는 KTO 의 공식 제품명 (한글) 이며, KTO 공식 브랜드 가이드에서
`Durunubi` 로 영문 transliteration 된다. 따라서 `durunubi` 는 한글 브랜드의 적법한
영문 표기이며 도구 식별자로 사용 가능하다.

### 4.2 도구 이름 형식

`kto_durunubi_<exactOpName>` (camelCase 보존, SPEC-KTO-005 와 동일):

- `kto_durunubi_courseList` — `courseList` 오퍼레이션 호출 (228 코스)
- `kto_durunubi_routeList` — `routeList` 오퍼레이션 호출 (3 테마)

---

## 5. Exclusions (What NOT to Build)

본 SPEC 은 다음 항목을 의도적으로 out-of-scope 로 둔다:

1. **GPX 파일 다운로드/파싱**: `DurunubiCourseItem.gpxpath` 는 URL 문자열로만
   노출한다. GPX 파일 다운로드, GPX XML 파싱, trackpoint 추출, 경로 시각화는
   본 SPEC 의 책임이 아니다 — 트래킹용 스마트 워치, 두루누비 앱, 외부 GIS
   앱이 GPX URL 을 받아 처리하는 것이 정상 흐름이다. (이유: Swagger
   description 도 외부 클라이언트 처리 명시.)
2. **코스 / 루트 머지 통합 도구**: `courseList` 응답의 `routeIdx` 와 `routeList`
   응답을 join 하여 단일 통합 도구를 노출하는 것은 별도 SPEC 후보이며 본 SPEC
   범위 외다 — KTO 원형 응답을 그대로 전달하는 단일 책임 원칙 준수.
3. **`themedescs` HTML 렌더링·sanitization**: `DurunubiRouteItem.themedescs` 는
   HTML 태그 (`<p>`, `<br>` 등) 를 포함한 KTO 원형 텍스트를 그대로 전달한다.
   HTML 파싱, sanitization, plain text 변환, 렌더링은 본 SPEC 의 책임이 아니다 —
   MCP 클라이언트 (LLM) 가 자체적으로 처리하며, MCP 응답은 HTML 로 렌더링되지
   않으므로 XSS 표면이 형성되지 않는다.
4. **다국어 변체**: 두루누비는 한국어 단일 응답만 제공한다. KTO 카탈로그·실호출
   모두에서 영어/일본어/중국어 변체 service path (예: `EngDurunubi`) 또는 `langCode`
   파라미터가 미확인이다. 다국어 지원은 본 SPEC 범위 외이며, 향후 KTO 가
   다국어 변체를 출시하는 경우 별도 SPEC 으로 흡수한다.

---

## 6. 검증 기준 (요약)

상세 시나리오는 `acceptance.md` 참조. 핵심:

- BASE_URL_MAP refactor 후 회귀 0 (선행 5 SPEC 의 332 단위 + 10 e2e 모두 PASS)
- `tools/list` 카운트 42 → 44 (Durunubi 2 도구 추가)
- `kto_durunubi_*` prefix 도구 정확히 2 개
- `courseList` 응답에 `gpxpath` URL 포함, `routeList` 응답에 3 개 테마 포함
- DTO 검증 위반 시 MCP `-32602` 즉시 반환 (KTO 호출 차단)
- 단위 테스트 커버리지 ≥ 85%

---

## 7. 참고

- `research.md` — API 개요, 오퍼레이션 카탈로그 (검증된 totalCount 포함), 응답
  entity 비교 표, 4 패턴 분류, 위험 항목.
- `plan.md` — 5 단계 Phase 분해 및 기술 결정.
- `acceptance.md` — Given / When / Then 시나리오.
- `spec-compact.md` — 압축본.
