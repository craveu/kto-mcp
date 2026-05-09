# SPEC-KTO-008 Compact (KTO 의료관광 정보 MdclTursmService)

8차 이터레이션. 한국관광공사 `MdclTursmService` (data.go.kr 15143913)
**8 오퍼레이션 중 7 노출** (List 3 + Sync 1 + Detail 3) — 1 미노출 (`ldongCode`)
은 KorService2 의 `kto_korean_ldongCode2` 와 동일 응답 추정이므로 R1 중복 회피
정책 적용. KTO API 의 **6번째 service path 패턴** 흡수 — `langDivCd` 파라미터
+ lang fluid (Odii 의 `langCode` 패턴과 third-letter difference). 신규 typed
item `MdclTursmItem` (camelCase 17 + sync 2 + 인덱스 시그니처) — KorService2
family 의 `KoreanTourItem` (lowercase) 과 명명 도메인 분리. 도구 카운트 48 →
55. 사전 KTO 실호출 검증 완료, `[ASSUMED]` 마커 0건.

---

## Requirements (5 EARS modules)

| Module | Pattern | ID | 핵심 |
|--------|---------|-----|------|
| 1 도구 노출 | Ubiquitous | REQ-KTO8-001/002/003 | `kto_medical_*` 7 도구 (List 3 + Sync 1 + Detail 3); transport 3종 + KtoHttpClient + response-normalizer + tool-registry 재사용; `MdclTursmItem` (camelCase 17 + sync 2 + 인덱스 시그니처) typed interface 노출; 1 미노출 (`ldongCode` — R1 정책 적용); KTO 원형 camelCase 필드명 보존 |
| 2 호출 처리 | Event | REQ-EVT-001 | `tools/call` → DTO 검증 → `KtoHttpClient.fetch('MdclTursmService', op, params)` (params 에 langDivCd 포함) → response-normalizer → `items` + `totalCount` + `numOfRows` + `pageNo` 응답. KTO 원형 응답 (영어 + 한국어 병기 title) 그대로 전달. |
| 3 재시도 | State | REQ-STATE-001 | 5xx + 네트워크 에러 → `RETRY_CONFIG` 그대로 적용 (max 3, base 200ms, factor 2.0, jitter ±20%). flat error envelope 검출 (PhotoGalleryService1 패턴 동일). |
| 4 BASE_URL_MAP | Optional | REQ-OPT-001 | `MdclTursmService` 1줄 추가 + `@MX:SPEC` 라인에 `SPEC-KTO-008 REQ-OPT-001` 추가. `@MX:NOTE` prose **갱신** (5 패턴 → 6 패턴, `langDivCd` 파라미터 패턴 명시) |
| 5 입력 검증 | Unwanted | REQ-UNW-001 | 모든 7 도구 `langDivCd` 누락/빈값 → MCP `-32602`; `locationBasedList` mapX/mapY/radius 누락 → `-32602`; `searchKeyword` keyword 누락/빈값 → `-32602`; `detail*` 3 도구 contentId 누락/빈값 → `-32602`; 7 도구 모두 `numOfRows` ≤ 0 / > 100 / non-int, `pageNo` ≤ 0 / non-int → `-32602` 즉시. KTO 호출 발생 안 함. |

---

## Files to Modify

### Modified (4 파일)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `MdclTursmService:
  'http://apis.data.go.kr/B551011/MdclTursmService'` 1줄 + `@MX:NOTE` prose
  **갱신** (5 패턴 → 6 패턴, `langDivCd` 파라미터 다국어 → MdclTursmService
  패턴 추가) + `@MX:SPEC` 라인에 `SPEC-KTO-008 REQ-OPT-001` 추가.
- `src/app.module.ts` — `MedicalTourismModule` import 1줄
- `src/main.ts` — `medicalTourismService = app.get(MedicalTourismService)` +
  `registerAll()` registries 배열에 `{ tools: MEDICAL_TOURISM_TOOLS, service:
  medicalTourismService }` 1 항목 (registries 8번째 항목)
- `test/kto.e2e-spec.ts` — 도구 카운트 48 → 55 갱신, MdclTursmService 시나리오
  추가

### Created (`src/kto/medical-tourism/` 모듈, 14 파일)

```
src/kto/medical-tourism/
├── medical-tourism.module.ts
├── medical-tourism.service.ts
├── medical-tourism.tools.ts
├── types.ts                              # MdclTursmItem
├── medical-tourism.service.spec.ts
├── medical-tourism.tools.spec.ts
└── dto/
    ├── area-based-list.dto.ts            # MtAreaBasedListDto
    ├── location-based-list.dto.ts        # MtLocationBasedListDto
    ├── search-keyword.dto.ts             # MtSearchKeywordDto
    ├── mdcl-tursm-sync-list.dto.ts       # MtMdclTursmSyncListDto
    ├── detail-mdcl-tursm.dto.ts          # MtDetailMdclTursmDto
    ├── detail-common.dto.ts              # MtDetailCommonDto
    ├── detail-intro.dto.ts               # MtDetailIntroDto
    ├── index.ts
    └── dto.spec.ts                       # REQ-UNW-001 검증
```

### NOT Modified (must remain unchanged)

`src/kto/kto-http.client.ts`, `src/kto/common/response-normalizer.ts`,
`src/kto/common/kto-error.ts`, `src/kto/common/types.ts`,
`src/mcp/tool-registry.ts`, `src/mcp/transports/*.ts`, `src/env.ts`,
`src/kto/{korean-tour-info,barrier-free-tour-info,photo-gallery,go-camping,
audio-guide,durunubi,pet-tour}/**/*`.

---

## 7 Tools (1:1 mapping with 7 exposed operations of 8 total)

| Tool name | Operation | totalCount (사전 검증) | 비고 |
|-----------|-----------|----------------------|------|
| `kto_medical_areaBasedList` | `areaBasedList` | **336~337** (langDivCd='KOR' 전체) | 지역 기반 의료관광 목록 |
| `kto_medical_locationBasedList` | `locationBasedList` | (좌표·반경 의존) | 위치 기반 의료관광 목록. mapX/mapY/radius required. |
| `kto_medical_searchKeyword` | `searchKeyword` | (keyword 의존) | 의료관광 키워드 검색. keyword required (영어 검색어 권장). |
| `kto_medical_mdclTursmSyncList` | `mdclTursmSyncList` | (전체 sync) | NEW — MdclTursmService 고유 sync. `showflag`/`oldContentId` 필드. |
| `kto_medical_detailMdclTursm` | `detailMdclTursm` | (contentId 의존) | NEW — 의료관광 전용 상세. `treatmentName`/`medicalDept`/`infoCenter`/`homepage` 메타. |
| `kto_medical_detailCommon` | `detailCommon` | (contentId 의존) | KorService2 의 `detailCommon2` 와 응답 스키마 다름 — 별도 노출. |
| `kto_medical_detailIntro` | `detailIntro` | (contentId 의존) | KorService2 의 `detailIntro2` 와 응답 스키마 다름 — 별도 노출. |

DTO 7종 (Mt prefix), 모두 `langDivCd!: string` required 필드 보유:

- `MtAreaBasedListDto`: langDivCd! + 모두 optional (sigunguCode, cat1/2/3,
  arrange, numOfRows, pageNo)
- `MtLocationBasedListDto`: langDivCd!, mapX!, mapY!, radius! (1-20000),
  arrange?, numOfRows?, pageNo?
- `MtSearchKeywordDto`: langDivCd!, keyword!, sigunguCode?, arrange?,
  numOfRows?, pageNo?
- `MtMdclTursmSyncListDto`: langDivCd! + showflag?, syncModTime?, numOfRows?,
  pageNo?
- `MtDetailMdclTursmDto`: langDivCd!, contentId!
- `MtDetailCommonDto`: langDivCd!, contentId!
- `MtDetailIntroDto`: langDivCd!, contentId!

`langDivCd` enum 미강제 — KTO 가 any string 수용 (server-normalized ENG 응답).
inputSchema description 권장값: `KOR`/`ENG`/`CHS`/`CHT`/`JPN`, default `'KOR'`.

---

## 1 Skipped Operation (R1 policy)

| Operation | 분류 | 미노출 사유 |
|-----------|------|------------|
| `ldongCode` | Code | KorService2 의 `ldongCode2` 와 동일 응답 추정 (KTO 법정동 코드 체계는 일반관광·반려동물·의료관광 모두 공통 행정 코드) → `kto_korean_ldongCode2` (SPEC-KTO-001 노출) 단일 도구로 충분. R1 정책 적용 |

---

## Acceptance (요약)

| # | Scenario | Type |
|---|----------|------|
| 1 | BASE_URL_MAP refactor 후 회귀 0 (선행 7 SPEC 단위 + e2e PASS) | 단위/e2e |
| 2 | tools/list 카운트 48 → 55, `kto_medical_*` 정확히 7개 | e2e |
| 3 | `areaBasedList(langDivCd='KOR')` happy path → totalCount ≥ 300 | e2e |
| 4 | 모든 7 도구 `langDivCd` 누락 → MCP -32602 (KTO 호출 발생 안 함) | 단위/e2e |
| 5 | `locationBasedList` mapX/mapY/radius 누락/잘못된 값 → MCP -32602 | 단위/e2e |
| 6 | `searchKeyword` keyword 누락/빈값 → MCP -32602 | 단위/e2e |
| 7 | `detail*` 3 도구 contentId 누락/빈값 → MCP -32602 | 단위/e2e |
| 8 | `mdclTursmSyncList` 응답 → `showflag`/`oldContentId` 인덱스 시그니처 흡수 | 단위/e2e |
| 9 | SPEC-KTO-001 ~ 007 회귀 — 기존 48 도구 정상 | e2e |
| 10 | 단위 커버리지 ≥ 85% | 단위 |
| 11 | 5xx 재시도 → RETRY_CONFIG (max 3, base 200ms, factor 2.0, ±20%) 그대로 | 단위 |
| 12 | MdclTursmItem 응답 원형 전달 — camelCase 필드 보존 (contentId/mapX/mapY/regDt/mdfcnDt) | 단위 |

---

## Exclusions (HARD out-of-scope)

1. **`ldongCode` 미노출**: KorService2 의 `ldongCode2` 와 동일 응답 추정,
   `kto_korean_ldongCode2` 로 이미 노출. R1 정책 적용. 의료관광 컨텐츠 의
   법정동 코드 조회는 `kto_korean_ldongCode2` 사용.
2. **의료관광 영문 → 한국어 자동 번역**: KTO 응답 (영어 + 한국어 병기 형식)
   그대로 전달. 도구는 KTO 응답 변형/번역/sanitization 하지 않음. 추가 번역
   필요 시 LLM 클라이언트 책임.
3. **의료기관 평점·리뷰**: KTO API 미제공. 본 데이터셋의 본질은 KTO 큐레이팅
   메타정보. 평점·리뷰는 외부 시스템 (HiraMed, Naver/Google Maps) 에서 조회.
4. **다국어 변체 별도 path**: MdclTursmService 는 `langDivCd` 파라미터로 다국어
   처리 (6번째 패턴). 별도 path 패턴 (KorService2 의 9 다국어) 적용 안 함.
5. **`detailMdclTursm` 의료관광 전용 메타 필드 강제 typing**: 인덱스 시그니처
   가 `treatmentName`/`medicalDept`/`infoCenter`/`homepage` 등 흡수. 향후
   KTO 가 추가 의료관광 필드 도입해도 별도 SPEC 변경 불필요.

---

## Risks

| ID | 영향도 | 위험 | 완화 |
|----|-------|------|------|
| R1 | LOW | `langDivCd` 의 정확한 가능값 KTO 가이드 미공개 — KTO 가 any string 수용 (server-normalized ENG 응답) | DTO 에서 enum 미강제, `@IsNotEmpty()` + `@IsString()` 만 적용. inputSchema description 에 권장값 (`KOR`/`ENG`/`CHS`/`CHT`/`JPN`) + default `'KOR'` 가이드 명시 |
| R2 | LOW | `detailCommon`/`detailIntro` 가 KorService2 측과 동일 contentId 사용 가능성 미확인 | 의료관광 contentId 별도 도메인 가정. 누락 → -32602, 잘못된 contentId → KTO NoData → KtoApiError 변환 |
| R3 | LOW | `detailMdclTursm` 의료관광 전용 응답 필드 정확한 셋 KTO 가이드 PDF 확인 필요 | typed interface 인덱스 시그니처가 응답 추가 필드 자동 흡수. 사전 검증으로 핵심 필드 (`treatmentName`/`medicalDept`/`homepage`/`infoCenter`) 확인 |
| R4 | LOW | `ldongCode` 미노출에 대한 사용자 혼란 | research.md / spec.md / README 에 "법정동 코드는 `kto_korean_ldongCode2` 사용" 명시. R1 정책 적용 근거 명시 |

---

## Tool prefix rationale

`kto_medical_*` — "medical" 은 의료관광 (medical tourism) 의 핵심 도메인 (외국인
대상 의료기관 정보) 의 짧고 명확한 영문 표기. 선행 prefix 패턴 (`kto_korean_*`,
`kto_barrier_free_*`, `kto_photo_*`, `kto_camping_*`, `kto_audio_*`,
`kto_durunubi_*`, `kto_pet_*`) 의 자연스러운 8번째 항목. KTO 공식 약어 `Mdcl`
대신 "medical" 채택 — LLM 가독성 우수.

---

## KTO API 6번째 service path 패턴 (NEW)

| # | 패턴 | 예시 | 특징 |
|---|------|-----|------|
| 1 | V2 다국어 다중 path | KorService2 + 8 다국어 (Eng/Jpn/Chs/Cht/Ger/Fre/Spn/Rus) | 9 별도 path, V2 suffix |
| 2 | V2 sibling 단독 | KorWithService2, KorPetTourService2 | V2 suffix 단독 |
| 3 | V/숫자 suffix 평면 | PhotoGalleryService1 | V1 suffix |
| 4 | suffix 없는 평면 | GoCamping, Durunubi | suffix 없음 |
| 5 | langCode 파라미터 | Odii (ko/en만 데이터 보유) | 단일 path + langCode 파라미터 |
| 6 | **langDivCd 파라미터 + lang fluid** | **MdclTursmService** **NEW** | 단일 path + langDivCd 파라미터 (any string tolerated) + 응답 lang server-normalized (ENG 기본). 오퍼레이션도 NO suffix (`areaBasedList` NOT `areaBasedList2`). |

5 vs 6 패턴 차이:

- 5 (Odii): `langCode` (네 글자), 데이터가 ko/en 만 보유, 클라이언트가 lang
  선택 가능
- 6 (MdclTursmService): `langDivCd` (여덟 글자, third-letter difference), KTO
  가 임의 값 수용, 응답 lang 은 server-normalized ENG (의료관광은 외국인 대상)

---

## 핵심 결정 (lock-in)

- BASE_URL_MAP key: `MdclTursmService` (실 KTO path 와 일치, KTO 공식 약어
  `Mdcl` 보존)
- Module path: `src/kto/medical-tourism/`
- DTO class prefix: `Mt`
- Item interface: `MdclTursmItem` (단일, 17 필드 + sync 2 필드 + 인덱스 시그
  니처, camelCase 명명)
- Tool name format: `kto_medical_<exactOpName>` (camelCase 보존, NO suffix —
  KTO 가 의료관광 오퍼레이션을 NO suffix 로 명명)
- 노출 오퍼레이션 수: 7 (NOT 8) — List 3 + Sync 1 + Detail 3
- 미노출: 1 (`ldongCode` — R1 정책 적용)
- 신규 추상화 0건. SPEC-KTO-001 ~ SPEC-KTO-007 인프라 100% 재사용.
- KTO 의 6번째 service path 패턴 흡수 — `langDivCd` 파라미터 + lang fluid
  (server-normalized ENG 응답).
- `langDivCd` enum 미강제 — KTO 가 any string 수용. DTO 는 `@IsNotEmpty()` +
  `@IsString()` 만, inputSchema description 에 권장값 가이드.
- 응답 entity 명명 도메인 분리 — `MdclTursmItem` (camelCase) vs
  `KoreanTourItem` (lowercase). KTO 원형 명명 보존.
