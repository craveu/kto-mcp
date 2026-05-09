# SPEC-KTO-007 Compact (KTO 반려동물 동반여행 정보 KorPetTourService2)

7차 이터레이션. 한국관광공사 `KorPetTourService2` (data.go.kr 15135102)
**13 오퍼레이션 중 4 노출** (List 3 + Sync 1) — 9 미노출 (Code 4 + Detail 5)
은 KorService2 와 동일 응답이므로 R1 중복 회피 정책 확장 적용. 신규 V2 sibling
pattern (KorWithService2 와 동일 형태) 흡수 — 신규 다국어 패턴 도입 없음.
**SPEC-KTO-001 R7 위험 (`detailPetTour2` 의 KorService2 포함 여부) 명시적
해소** — 양 서비스 모두 보유 + 동일 응답 검증 완료, `kto_korean_detailPetTour2`
단일 도구로 충분. 도구 카운트 44 → 48. 사전 KTO 실호출 검증 완료, `[ASSUMED]`
마커 0건.

---

## Requirements (5 EARS modules)

| Module | Pattern | ID | 핵심 |
|--------|---------|-----|------|
| 1 도구 노출 | Ubiquitous | REQ-KTO7-001/002/003 | `kto_pet_*` 4 도구 (List 3 + Sync 1); transport 3종 + KtoHttpClient + response-normalizer + tool-registry 재사용; `KorPetTourItem` (20 필드 + index sig) typed interface 노출; 9 미노출 (Code 4 + Detail 5 — R1 정책 확장); KTO 원형 필드명 보존 |
| 2 호출 처리 | Event | REQ-EVT-001 | `tools/call` → DTO 검증 → `KtoHttpClient.fetch('KorPetTourService2', op, params)` → response-normalizer → `items` + `totalCount` + `numOfRows` + `pageNo` 응답. KTO 원형 응답 그대로 전달. |
| 3 재시도 | State | REQ-STATE-001 | 5xx + 네트워크 에러 → `RETRY_CONFIG` 그대로 적용 (max 3, base 200ms, factor 2.0, jitter ±20%) |
| 4 BASE_URL_MAP | Optional | REQ-OPT-001 | `KorPetTourService2` 1줄 추가 + `@MX:SPEC` 라인에 `SPEC-KTO-007 REQ-OPT-001` 추가. `@MX:NOTE` prose 변경 없음 (V2 sibling pattern 확장, 패턴 B 자연 흡수) |
| 5 입력 검증 | Unwanted | REQ-UNW-001 | `locationBasedList2` mapX/mapY/radius 누락 → MCP `-32602`; `searchKeyword2` keyword 누락/빈값 → `-32602`; 4 도구 모두 `numOfRows` ≤ 0 / > 100 / non-int, `pageNo` ≤ 0 / non-int → `-32602` 즉시. KTO 호출 발생 안 함. |

---

## Files to Modify

### Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `KorPetTourService2:
  'http://apis.data.go.kr/B551011/KorPetTourService2'` 1줄 + `@MX:SPEC` 라인
  갱신 (`SPEC-KTO-007 REQ-OPT-001` 추가). `@MX:NOTE` prose 변경 없음.
- `src/app.module.ts` — `PetTourModule` import 1줄
- `src/main.ts` — `petTourService = app.get(PetTourService)` + `registerAll()`
  registries 배열에 `{ tools: PET_TOUR_TOOLS, service: petTourService }` 1
  항목 (registries 7번째 항목)
- `test/kto.e2e-spec.ts` — 도구 카운트 44 → 48 갱신, KorPetTourService2 시나리오
  추가

### Created (`src/kto/pet-tour/` 모듈, 11 파일)

```
src/kto/pet-tour/
├── pet-tour.module.ts
├── pet-tour.service.ts
├── pet-tour.tools.ts
├── types.ts                       # KorPetTourItem
├── pet-tour.service.spec.ts
├── pet-tour.tools.spec.ts
└── dto/
    ├── area-based-list.dto.ts     # PtAreaBasedListDto
    ├── location-based-list.dto.ts # PtLocationBasedListDto
    ├── search-keyword.dto.ts      # PtSearchKeywordDto
    ├── pet-tour-sync-list.dto.ts  # PtPetTourSyncListDto
    ├── index.ts
    └── dto.spec.ts                # REQ-UNW-001 검증
```

### NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,
audio-guide,durunubi}/**/*`.

---

## 4 Tools (1:1 mapping with 4 exposed operations of 13 total)

| Tool name | Operation | totalCount (사전 검증) | 비고 |
|-----------|-----------|----------------------|------|
| `kto_pet_areaBasedList2` | `areaBasedList2` | **62** (areaCode='1' 서울) | pet-filtered 지역 기반 |
| `kto_pet_locationBasedList2` | `locationBasedList2` | **75** (서울시청 20km) | pet-filtered 위치 기반. mapX/mapY/radius required. |
| `kto_pet_searchKeyword2` | `searchKeyword2` | **19** (keyword='카페') | pet-filtered 키워드 검색. keyword required. |
| `kto_pet_petTourSyncList2` | `petTourSyncList2` | **10167** (전체 pet 데이터셋) | NEW — KorPetTourService2 고유 sync 오퍼레이션. `showflag` 필드로 active/deleted 분기. |

DTO 4종 (Pt prefix):

- `PtAreaBasedListDto`: 모두 optional (areaCode, sigunguCode, contentTypeId,
  cat1/2/3, arrange, numOfRows, pageNo)
- `PtLocationBasedListDto`: mapX!, mapY!, radius! (1-20000), contentTypeId?,
  arrange?, numOfRows?, pageNo?
- `PtSearchKeywordDto`: keyword!, contentTypeId?, areaCode?, sigunguCode?,
  arrange?, numOfRows?, pageNo?
- `PtPetTourSyncListDto`: 모두 optional (showflag?, syncModTime?, numOfRows?,
  pageNo?)

`langCode` 파라미터 미사용 — KorPetTourService2 가 다국어 변체 미보유.

---

## 9 Skipped Operations (R1 policy extension)

| Operation | 분류 | 미노출 사유 |
|-----------|------|------------|
| `areaCode2` | Code | KorService2 와 동일 응답 → `kto_korean_areaCode2` 이미 노출 |
| `categoryCode2` | Code | 상동 → `kto_korean_categoryCode2` |
| `ldongCode2` | Code | 상동 → `kto_korean_ldongCode2` |
| `lclsSystmCode2` | Code | 상동 → `kto_korean_lclsSystmCode2` |
| `detailCommon2` | Detail | contentId 기반 단일 record, 양 서비스 동일 응답 → `kto_korean_detailCommon2` 이미 노출 |
| `detailIntro2` | Detail | 상동 → `kto_korean_detailIntro2` |
| `detailInfo2` | Detail | 상동 → `kto_korean_detailInfo2` |
| `detailImage2` | Detail | 상동 → `kto_korean_detailImage2` |
| `detailPetTour2` | Detail (pet 전용) | **SPEC-KTO-001 R7 해소** — 양 서비스 모두 보유 + 동일 응답 검증 완료. `kto_korean_detailPetTour2` 단일 도구로 충분 |

---

## Acceptance (요약)

| # | Scenario | Type |
|---|----------|------|
| 1 | BASE_URL_MAP refactor 후 회귀 0 (367 단위 + 12 e2e PASS) | 단위/e2e |
| 2 | tools/list 카운트 44 → 48, `kto_pet_*` 정확히 4개 | e2e |
| 3 | `areaBasedList2(areaCode='1')` happy path → totalCount ≥ 50 | e2e |
| 4 | `locationBasedList2(서울시청 20km)` happy path → totalCount ≥ 60 | e2e |
| 5 | `searchKeyword2(keyword='카페')` happy path → totalCount ≥ 15 | e2e |
| 6 | `petTourSyncList2({})` happy path → totalCount ≥ 10000 (전체 pet 데이터셋) | e2e |
| 7 | `locationBasedList2` 좌표 누락/잘못된 값 → MCP -32602 | 단위/e2e |
| 8 | `searchKeyword2` keyword 누락/빈값 → MCP -32602 | 단위/e2e |
| 9 | SPEC-KTO-001 ~ 006 회귀 — 기존 44 도구 정상, `kto_korean_detailPetTour2` 정상 (R7 해소 검증) | e2e |
| 10 | 단위 커버리지 ≥ 85% | 단위 |
| 11 | 5xx 재시도 → RETRY_CONFIG (max 3, base 200ms, factor 2.0, ±20%) 그대로 | 단위 |
| 12 | KorPetTourItem 응답 원형 전달 — 필드 보존 (sync `showflag` 인덱스 시그니처 흡수) | 단위 |

---

## Exclusions (HARD out-of-scope)

1. **detail 5 오퍼레이션 미노출**: `detailCommon2`/`detailIntro2`/`detailInfo2`/
   `detailImage2`/`detailPetTour2` — KorService2 와 동일 응답이므로 중복 회피.
   pet content 의 상세 조회는 `kto_korean_detail*` 사용. **SPEC-KTO-001 R7
   해소** — 양 서비스 모두 보유 + 동일 응답 검증 완료.
2. **코드 4 오퍼레이션 미노출**: `areaCode2`/`categoryCode2`/`ldongCode2`/
   `lclsSystmCode2` — KorService2 와 동일 응답, `kto_korean_*` 로 이미 노출.
   R1 정책 확장.
3. **다국어 변체**: KorPetTourService2 한국어 단일. KTO 카탈로그·실호출 모두
   다국어 변체 미확인. 향후 출시 시 별도 SPEC.
4. **통합 검색 도구 (KorService2 + KorPetTourService2 머지)**: 별도 SPEC 후보.
   클라이언트 사이드 조합이 정상 흐름. 단일 책임 원칙 준수.

---

## Risks

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | detail/code 9 오퍼레이션 미노출에 대한 사용자 혼란 | research.md/spec.md/README 에 "pet content 상세는 `kto_korean_detail*` 사용. 양 서비스 동일 응답." 명시 |
| R2 | LOW | `petTourSyncList2` `syncModTime` 형식 미확인 | DTO 에서 string 검증만, KTO 에 그대로 전달. 빈 입력 호출 정상 동작 사전 검증 (totalCount=10167) |
| R3 | LOW | KTO 향후 다국어 변체 추가 가능성 | 발생 시 별도 SPEC. typed interface 인덱스 시그니처로 자동 흡수 가능 |

---

## Tool prefix rationale

`kto_pet_*` — "pet" 은 KTO API 의 핵심 도메인 (반려동물 동반) 의 짧고 명확한
영문 표기. 선행 prefix 패턴 (`kto_korean_*`, `kto_barrier_free_*`,
`kto_photo_*`, `kto_camping_*`, `kto_audio_*`, `kto_durunubi_*`) 의 자연스러운
7번째 항목.

---

## 핵심 결정 (lock-in)

- BASE_URL_MAP key: `KorPetTourService2` (실 KTO path 와 일치, V2 sibling
  pattern, KorWithService2 와 동일 형태)
- Module path: `src/kto/pet-tour/`
- DTO class prefix: `Pt`
- Item interface: `KorPetTourItem` (단일, 20 필드 + 인덱스 시그니처)
- Tool name format: `kto_pet_<exactOpName>` (camelCase 보존)
- 노출 오퍼레이션 수: 4 (NOT 9, NOT 13) — List 3 + Sync 1
- 신규 추상화 없음. SPEC-KTO-001 ~ SPEC-KTO-006 인프라 100% 재사용.
- **SPEC-KTO-001 R7 해소**: `detailPetTour2` 양 서비스 모두 보유 + 동일 응답
  검증 완료. `kto_korean_detailPetTour2` 단일 도구 충분, `kto_pet_detailPetTour2`
  추가 노출 없음.
