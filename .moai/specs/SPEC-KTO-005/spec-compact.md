# SPEC-KTO-005 Compact (KTO 관광지 오디오 가이드정보 Odii)

5차 이터레이션. 한국관광공사 `Odii` (data.go.kr 15101971) 8 오퍼레이션을 MCP 도구로
매핑. KTO 의 4번째 다국어 패턴 — 단일 path + `langCode` 파라미터 — 첫 흡수.
사전 KTO 실호출 검증 완료, `[ASSUMED]` 마커 0건.

---

## Requirements (5 EARS modules)

| Module | Pattern | ID | 핵심 |
|--------|---------|-----|------|
| 1 도구 노출 | Ubiquitous + Event | REQ-KTO5-001/002/003, REQ-EVT-001 | `kto_audio_*` 8 도구; transport 3종 + KtoHttpClient + response-normalizer + tool-registry 재사용; `OdiiStoryItem` + `OdiiThemeItem` typed interface 노출 (인덱스 시그니처 보유); KTO 원형 필드명 보존 |
| 2 재시도 | State | REQ-STATE-001 | 5xx + 네트워크 에러 → `RETRY_CONFIG` 그대로 적용 (max 3, base 200ms, factor 2.0, jitter ±20%) |
| 3 BASE_URL_MAP | Optional | REQ-OPT-001 | `Odii` 1줄 추가 + `@MX:NOTE` prose 4 패턴 명시 + `@MX:SPEC` 라인에 `SPEC-KTO-005 REQ-OPT-001` 추가 |
| 4 입력 검증 | Unwanted | REQ-UNW-001 | `langCode` 8 도구 모두 필수; `*LocationBasedList` 좌표 (`mapX`/`mapY`/`radius` ≤ 20000) 필수; `*SearchList` `keyword` 필수; DTO `class-validator` 차단 |
| 5 회귀 보호 | Unwanted | REQ-UNW-002 | `kto_korean_*`/`kto_barrier_free_*`/`kto_photo_*`/`kto_camping_*` 의 등록·JSON Schema·검증·재시도·정규화·flat-error 검출 동작 모두 변경 없음. e2e 도구 카운트 34 → 42 갱신만 허용 |

---

## Files to Modify

### Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `Odii: 'http://apis.data.go.kr/B551011/Odii'` 1줄 + `@MX:NOTE` prose 4 패턴 + `@MX:SPEC` 라인 갱신
- `src/app.module.ts` — `AudioGuideModule` import 1줄
- `src/main.ts` — `audioGuideService = app.get(AudioGuideService)` + `registerAll()` registries 배열에 `{ tools: ODII_TOOLS, service: audioGuideService }` 1 항목
- `test/kto.e2e-spec.ts` — 도구 카운트 34 → 42 갱신, Odii 시나리오 추가

### Created (audio-guide module, 13 파일)

```
src/kto/audio-guide/
├── audio-guide.module.ts
├── audio-guide.service.ts
├── audio-guide.tools.ts
├── types.ts                  # OdiiStoryItem + OdiiThemeItem
├── audio-guide.service.spec.ts
├── audio-guide.tools.spec.ts
└── dto/
    ├── story-based-list.dto.ts            # AgStoryBasedListDto
    ├── story-based-sync-list.dto.ts       # AgStoryBasedSyncListDto
    ├── story-location-based-list.dto.ts   # AgStoryLocationBasedListDto (mapX/mapY/radius 필수)
    ├── story-search-list.dto.ts           # AgStorySearchListDto (keyword 필수)
    ├── theme-based-list.dto.ts            # AgThemeBasedListDto
    ├── theme-based-sync-list.dto.ts       # AgThemeBasedSyncListDto
    ├── theme-location-based-list.dto.ts   # AgThemeLocationBasedListDto
    ├── theme-search-list.dto.ts           # AgThemeSearchListDto
    ├── index.ts
    └── dto.spec.ts                        # REQ-UNW-001 검증
```

### NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping}/**/*`.

---

## 8 Tools (1:1 mapping with Odii operations)

### Story 계열 (오디오 내레이션 위치 단위 — `audioUrl` / `script` / `playTime` 보유)

| Tool name | Operation | 추가 필수 (langCode 외) | totalCount (langCode=ko, 사전 검증) |
|-----------|-----------|------------------------|------------------------------------|
| `kto_audio_storyBasedList` | `storyBasedList` | 없음 | 6,281 |
| `kto_audio_storyBasedSyncList` | `storyBasedSyncList` | 없음 | 변동 |
| `kto_audio_storyLocationBasedList` | `storyLocationBasedList` | `mapX`, `mapY`, `radius` (≤20000) | 931 (서울 시청 + 20km) |
| `kto_audio_storySearchList` | `storySearchList` | `keyword` | 키워드 의존 |

### Theme 계열 (테마 관광지 카탈로그 — 오디오 부착 없음)

| Tool name | Operation | 추가 필수 (langCode 외) | totalCount (langCode=ko, 사전 검증) |
|-----------|-----------|------------------------|------------------------------------|
| `kto_audio_themeBasedList` | `themeBasedList` | 없음 | 2,231 |
| `kto_audio_themeBasedSyncList` | `themeBasedSyncList` | 없음 | 변동 |
| `kto_audio_themeLocationBasedList` | `themeLocationBasedList` | `mapX`, `mapY`, `radius` (≤20000) | 변동 |
| `kto_audio_themeSearchList` | `themeSearchList` | `keyword` | 18 (`keyword=서울`) |

---

## Acceptance Summary (10 scenarios + DoD)

| # | 시나리오 | 검증 |
|---|---------|------|
| 1 | BASE_URL_MAP refactor 회귀 0 | 기존 234 단위 + 7 e2e PASS |
| 2 | tools/list 카운트 34 → 42 | `kto_audio_*` 정확히 8 도구 |
| 3 | `storyBasedList(langCode='ko')` happy | totalCount ≥ 6000 + `audioUrl` 포함 |
| 4 | `storyLocationBasedList` 좌표 누락 | MCP `-32602`, outbound 0회 |
| 5 | `themeSearchList` keyword 누락 | MCP `-32602`, outbound 0회 |
| 6 | `langCode` 누락 (8 도구 전체) | MCP `-32602`, outbound 0회 |
| 7 | `langCode='ja'` 정상 통과 | totalCount=0, items=[], 에러 아님 |
| 8 | SPEC-KTO-001~004 회귀 보호 | 기존 도구 등록·검증·재시도 변경 없음 |
| 9 | Coverage ≥ 85% | `pnpm test:cov` statements |
| 10 | `themeBasedList(langCode='en')` 0 records | 정상 응답, 에러 아님 |

DoD: 10 시나리오 PASS + lint + build + cov ≥ 85% + 도구 카운트 42 + 신규 의존성
0건 + 신규 추상화 0건 + Exclusions 10 항목 모두 미구현.

---

## Exclusions (10)

1. 오디오 바이너리 다운로드·캐싱·변환 (URL 만 노출)
2. 미보유 언어 더미 데이터 채움 (KTO 0 records 그대로 유통)
3. Story / Theme 머지 통합 검색 도구 (별도 SPEC 후보)
4. 다국어 Theme 자동 보강 (영어 Theme totalCount=0 그대로 통과)
5. 데이터 캐싱 / 영속 저장소 (DB·Redis)
6. 응답 필드 한글 번역·정규화·평면화·`langCheck` 비트 디코딩
7. 자동 페이지네이션
8. 인증·인가 / 멀티 테넌시
9. `audioUrl` / `imageUrl` 외부 검증
10. `langCode` 입력값 enum 강제 (KTO 신규 언어 추가 대비)

---

## Tech Lock-in (디자인 결정)

| 결정 | 값 |
|------|-----|
| BASE_URL_MAP key | `Odii` (suffix 없음) |
| 도구 prefix | `kto_audio_*` |
| 모듈 디렉토리 | `src/kto/audio-guide/` |
| DTO 클래스 prefix | `Ag` (AudioGuide) |
| typed interface | `OdiiStoryItem` + `OdiiThemeItem` (양쪽 인덱스 시그니처 보유) |
| `langCode` 처리 | DTO `@IsNotEmpty()` 필수, enum 미강제. 도구 description 에서 `ko` / `en` 권장 안내 |
| Base DTO 클래스 | 미사용 (선행 SPEC 일관성) |
| 신규 라이브러리·추상화 | 0건 |

---

Version: 0.1.0
Last Updated: 2026-05-09
