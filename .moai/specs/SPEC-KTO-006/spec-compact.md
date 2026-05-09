# SPEC-KTO-006 Compact (KTO 두루누비 정보 Durunubi)

6차 이터레이션. 한국관광공사 `Durunubi` (data.go.kr 15101974) **2 오퍼레이션** 을
MCP 도구로 매핑. 코리아둘레길 트래킹 코스 GPX 정보 + 상위 테마 카탈로그.
SPEC-KTO-004 GoCamping 과 동일한 패턴 C (suffix 없음 + 단일 path + 다국어 변체
미존재) 흡수. 신규 다국어 패턴 도입 없음.
**현재까지 가장 작은 KTO SPEC** (오퍼레이션 2, 도구 2, 신규 추상화 0).
사전 KTO 실호출 검증 완료, `[ASSUMED]` 마커 0건.

---

## Requirements (5 EARS modules)

| Module | Pattern | ID | 핵심 |
|--------|---------|-----|------|
| 1 도구 노출 | Ubiquitous | REQ-KTO6-001/002/003 | `kto_durunubi_*` 2 도구; transport 3종 + KtoHttpClient + response-normalizer + tool-registry 재사용; `DurunubiCourseItem` (16 필드 + index sig) + `DurunubiRouteItem` (5 필드 + index sig) typed interface 노출; KTO 원형 필드명 보존 |
| 2 호출 처리 | Event | REQ-EVT-001 | `tools/call` → DTO 검증 → `KtoHttpClient.fetch('Durunubi', op, params)` → response-normalizer → `items` + `totalCount` + `numOfRows` + `pageNo` 응답. `gpxpath` URL / `themedescs` HTML 그대로 전달. |
| 3 재시도 | State | REQ-STATE-001 | 5xx + 네트워크 에러 → `RETRY_CONFIG` 그대로 적용 (max 3, base 200ms, factor 2.0, jitter ±20%) |
| 4 BASE_URL_MAP | Optional | REQ-OPT-001 | `Durunubi` 1줄 추가 + `@MX:SPEC` 라인에 `SPEC-KTO-006 REQ-OPT-001` 추가. `@MX:NOTE` prose 변경 없음 (패턴 C 흡수, SPEC-KTO-005 에서 이미 4 패턴 명시) |
| 5 입력 검증 | Unwanted | REQ-UNW-001 | `numOfRows` ≤ 0 / > 100 / non-int, `pageNo` ≤ 0 / non-int → DTO `class-validator` 차단 → MCP `-32602` 즉시 반환. KTO 호출 발생 안 함. |

---

## Files to Modify

### Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `Durunubi:
  'http://apis.data.go.kr/B551011/Durunubi'` 1줄 + `@MX:SPEC` 라인 갱신
  (`SPEC-KTO-006 REQ-OPT-001` 추가). `@MX:NOTE` prose 변경 없음.
- `src/app.module.ts` — `DurunubiModule` import 1줄
- `src/main.ts` — `durunubiService = app.get(DurunubiService)` + `registerAll()`
  registries 배열에 `{ tools: DURUNUBI_TOOLS, service: durunubiService }` 1
  항목 (registries 6번째 항목)
- `test/kto.e2e-spec.ts` — 도구 카운트 42 → 44 갱신, Durunubi 시나리오 추가

### Created (durunubi module, 9 파일)

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

### NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,audio-guide}/**/*`.

---

## 2 Tools (1:1 mapping with Durunubi operations)

| Tool name | Operation | 응답 entity | totalCount (사전 검증) | 비고 |
|-----------|-----------|-------------|----------------------|------|
| `kto_durunubi_courseList` | `courseList` | `DurunubiCourseItem` | **228** | Swagger description 표기치 284, 실 응답 228. 코드에 숫자 미박음. `gpxpath` URL 노출. |
| `kto_durunubi_routeList` | `routeList` | `DurunubiRouteItem` | **3** | 페이지네이션 사실상 무효. 남파랑길/해파랑길 등 3 테마 카탈로그. `themedescs` HTML 포함. |

DTO (모두 optional 파라미터):

- `DuCourseListDto`: `numOfRows? @Min(1) @Max(100)`, `pageNo? @Min(1)`
- `DuRouteListDto`: `numOfRows? @Min(1) @Max(100)`, `pageNo? @Min(1)`

`langCode` 파라미터 미사용 — 두루누비 API 가 요구하지 않음 (SPEC-KTO-005 Odii
와의 차별점).

---

## Acceptance (요약)

| # | Scenario | Type |
|---|----------|------|
| 1 | BASE_URL_MAP refactor 후 회귀 0 (332 단위 + 10 e2e PASS) | 단위/e2e |
| 2 | tools/list 카운트 42 → 44, `kto_durunubi_*` 정확히 2개 | e2e |
| 3 | `courseList({numOfRows:1})` happy path → totalCount ≥ 200 + `gpxpath` URL | e2e |
| 4 | `routeList({})` happy path → totalCount === 3 + 3 테마 + `themeNm`/`linemsg` 모두 존재 | e2e |
| 5 | `courseList({numOfRows:0})` → MCP -32602 (KTO 호출 차단) | 단위/e2e |
| 6 | SPEC-KTO-001 ~ 005 회귀 — 기존 42 도구 정상 | e2e |
| 7 | 단위 커버리지 ≥ 85% | 단위 |
| 8 | 5xx 재시도 → RETRY_CONFIG (max 3, base 200ms, factor 2.0, ±20%) 그대로 | 단위 |
| 9 | `gpxpath` URL / `themedescs` HTML 원형 전달, sanitization 미적용 | 단위 |

---

## Exclusions (HARD out-of-scope)

1. **GPX 파일 다운로드/파싱**: `gpxpath` URL 만 노출. 다운로드/XML 파싱/
   trackpoint 추출/시각화는 트래킹 워치/외부 앱 책임.
2. **코스/루트 머지 통합 도구**: `routeIdx` 기반 join 통합 도구는 별도 SPEC
   후보. KTO 원형 응답 그대로 전달 (단일 책임 원칙).
3. **`themedescs` HTML 렌더링·sanitization**: HTML 태그 포함 KTO 원형 텍스트
   그대로 전달. 파싱/sanitization/렌더링은 LLM 클라이언트 책임. MCP 응답은
   HTML 렌더링되지 않으므로 XSS 표면 없음.
4. **다국어 변체**: 두루누비는 한국어 단일 응답만 제공. KTO 카탈로그·실호출
   모두 다국어 변체 미확인. 향후 KTO 가 변체 출시 시 별도 SPEC 으로 흡수.

---

## Risks

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | Swagger description "284 코스" vs 실 `totalCount=228` 불일치 | research.md/spec.md 양쪽 수치 명시. 코드에 숫자 미박음 — 응답값 그대로 전달. |
| R2 | LOW | `themedescs` HTML 태그 포함 | XSS 평가 — MCP 클라이언트 LLM 응답은 HTML 렌더링 안 함. 표면 없음. 노트만 추가. |
| R3 | LOW | `routeList` totalCount=3 페이지네이션 무효 | SPEC 노트로 기록. DTO 호환성 보존 — 빈 입력 호출 시 KTO 기본값. |
| R4 | LOW | KTO 향후 다국어 변체 추가 가능성 | 현재 카탈로그·실호출 미확인. 발생 시 별도 SPEC. typed interface 인덱스 시그니처로 자동 흡수 가능. |

---

## Tool prefix rationale

`kto_durunubi_*` — "두루누비" 는 KTO 공식 제품명 (한글). KTO 공식 브랜드
가이드의 영문 transliteration `Durunubi` 를 prefix 로 채택.
선행 prefix 패턴 (`kto_korean_*`, `kto_barrier_free_*`, `kto_photo_*`,
`kto_camping_*`, `kto_audio_*`) 의 자연스러운 6번째 항목.

---

## 핵심 결정 (lock-in)

- BASE_URL_MAP key: `Durunubi` (실 KTO path 와 일치)
- Module path: `src/kto/durunubi/`
- DTO class prefix: `Du`
- Item interfaces: `DurunubiCourseItem`, `DurunubiRouteItem`
- Tool name format: `kto_durunubi_<exactOpName>` (camelCase 보존)
- 신규 추상화 없음. SPEC-KTO-001 ~ SPEC-KTO-005 인프라 100% 재사용.
