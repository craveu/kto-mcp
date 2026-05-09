# SPEC-KTO-004 (Compact)

KTO MCP 서버 4차 이터레이션 — GoCamping 고캠핑 정보조회 (data.go.kr ID 15101933,
한국관광공사_고캠핑 정보 조회서비스_GW). SPEC-KTO-001 (KorService2) + SPEC-KTO-002
(KorWithService2) + SPEC-KTO-003 (PhotoGalleryService1) 의 공용 인프라(`KtoHttpClient`,
`response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책,
`BASE_URL_MAP`) 100% 재사용. 패턴 복제 SPEC.

핵심 차이점:
1. service path 가 V/숫자 suffix 없는 평면 형태 (`B551011/GoCamping`) — `BASE_URL_MAP` 의
   3번째 패턴 변종 (V2 다국어 + V1 단독 + V없음 평면).
2. 응답 item 이 캠핑 도메인 특화 50+ 필드 (`facltNm`, `induty`, `lctCl`, `glampInnerFclty`,
   `siteBottomCl1~5`, `frprvtSandCo`, ...) 포함 → 신규 typed item `GoCampingItem`
   (핵심 30 named + 인덱스 시그니처) 도입.
3. `imageList` 응답은 별도 5-필드 스키마 → `GoCampingImageItem` 별도 정의.

모든 사실 Swagger 2.0 스펙 본문 + 사용자 실 호출로 VERIFIED. [ASSUMED] 마커 0건.

---

## Requirements (5 Modules / EARS)

### Module 1: GoCamping 도메인 도구 노출

- **REQ-KTO4-001 (Ubiquitous)** — GoCamping 5 오퍼레이션을 `kto_camping_{operationName}`
  이름의 MCP 도구로 노출. 기존 `kto_korean_*` (15) / `kto_barrier_free_*` (10) /
  `kto_photo_*` (4) 와 prefix 충돌 없음.
- **REQ-KTO4-002 (Ubiquitous)** — `stdio` / `streamable-http` / `http` transport,
  `KtoHttpClient` (flat-error envelope 감지 포함), `response-normalizer` (빈 문자열
  `""` → 빈 배열 정규화 포함), `tool-registry`(이미 `ToolRegistry[]` 다중 지원),
  `BASE_URL_MAP` 인프라를 SPEC-KTO-001/002/003 에서 변경 없이 재사용. `BASE_URL_MAP`
  1줄 + prose 1줄 외 다른 인프라 파일 수정 없음. 선행 3 SPEC 도구 회귀 무사고.
- **REQ-KTO4-003 (Ubiquitous)** — `src/kto/go-camping/types.ts` 에 두 interface
  정의:
  - `GoCampingItem` (`contentId: string` required, named optional 30개 필드 +
    인덱스 시그니처 `[key: string]: string | undefined`)
  - `GoCampingImageItem` (`contentId: string` required, `serialnum` / `imageUrl` /
    `createdtime` / `modifiedtime` optional)
  4 list ops 반환 타입 = `Promise<KtoListResponse<GoCampingItem>>`. imageList 반환
  타입 = `Promise<KtoListResponse<GoCampingImageItem>>`.
- **REQ-EVT-001 (Event-driven)** — `tools/call` 수신 시 `KtoHttpClient.request({
  service: 'GoCamping', operation, params })` 호출 → 정규화 → 응답 반환. 캠핑 응답
  필드 (`contentId`, `facltNm`, `lineIntro`, `intro`, `addr1`, `mapX`, `mapY`,
  `induty`, `lctCl`, `glampInnerFclty`, `caravInnerFclty`, `siteBottomCl1`–
  `siteBottomCl5`, `frprvtSandCo`, `firstImageUrl`, `imageUrl`, `serialnum`,
  `syncStatus` 등) KTO 원형 표기 그대로 보존 (`Y`/`N` boolean 변환 X, 다른 KTO
  서비스 필드명 매핑 X).

### Module 2: 5xx 재시도 정책 상속

- **REQ-STATE-001 (State-driven)** — GoCamping 5xx/네트워크 transient 에러에
  기존 `RETRY_CONFIG` (max 3, base 200ms, factor 2.0, jitter ±20%) 동일 적용. 별도
  설정 없음.

### Module 3: BASE_URL_MAP 1줄 + prose 1줄 확장

- **REQ-OPT-001 (Optional)** — `BASE_URL_MAP` 에 `GoCamping:
  'http://apis.data.go.kr/B551011/GoCamping'` 1줄 추가. `KtoServiceName = keyof
  typeof BASE_URL_MAP` 유지. `@MX:NOTE` prose 1줄 보강 — 3 패턴 (V2 다국어 코어 +
  V1 단독 사이드 + V없음 평면) 공존 명시. `@MX:SPEC: SPEC-KTO-004 REQ-OPT-001`
  추가. 신규 추상화 도입 금지.

### Module 4: 필수 입력 파라미터 검증

- **REQ-UNW-001 (Unwanted)** — 다음 도구 호출 시 필수 파라미터 누락이면 outbound
  HTTP 발생 X, class-validator 로 차단, 구조화된 MCP 도구 에러 (`-32602` 또는 동등
  구조) 반환:
  - `kto_camping_locationBasedList` — `mapX` (`@IsNotEmpty`), `mapY`
    (`@IsNotEmpty`), `radius` (`@IsNotEmpty` + `@Max(20000)`)
  - `kto_camping_searchList` — `keyword` (`@IsNotEmpty`)
  - `kto_camping_imageList` — `contentId` (`@IsNotEmpty`)
  - `kto_camping_basedList` 와 `kto_camping_basedSyncList` 는 필수 파라미터 없음.

### Module 5: SPEC-KTO-001/002/003 회귀 보호

- **REQ-UNW-002 (Unwanted)** — 본 SPEC 구현이 기존 `kto_korean_*` /
  `kto_barrier_free_*` / `kto_photo_*` 도구 등록·JSON Schema·검증·재시도·정규화
  동작을 변경하면 reject. 선행 3 SPEC 의 unit + e2e 테스트가 도구 카운트 assertion
  (29 → 34) 갱신 외 assertion 변경 없이 모두 PASS 해야 함.

---

## Files to Modify

### Modified (4)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 1줄 추가 + `@MX:NOTE` prose 1줄
  보강 (3 패턴 명시) + `@MX:SPEC` 라인에 `SPEC-KTO-004 REQ-OPT-001` 추가
- `src/app.module.ts` — `GoCampingModule` import 1줄 추가
- `src/main.ts` — `GoCampingService` 주입 1줄 + `registerAll()` registries 배열에
  `{ tools: GO_CAMPING_TOOLS, service: goCampingService }` 항목 1개 추가
- `test/kto.e2e-spec.ts` — 도구 카운트 assertion `29` → `34` 갱신 + GoCamping
  시나리오 추가

### Created — Module (`src/kto/go-camping/`)

- `go-camping.module.ts`
- `go-camping.service.ts` (5 methods: basedList, basedSyncList, locationBasedList,
  searchList, imageList)
- `go-camping.tools.ts` (5 tools: kto_camping_basedList, kto_camping_basedSyncList,
  kto_camping_locationBasedList, kto_camping_searchList, kto_camping_imageList)
- `types.ts` (신규 — `GoCampingItem` + `GoCampingImageItem`)
- `dto/based-list.dto.ts` (`GcBasedListDto`, 모두 선택)
- `dto/based-sync-list.dto.ts` (`GcBasedSyncListDto`, 모두 선택, `syncStatus` enum
  A/U/D)
- `dto/location-based-list.dto.ts` (`GcLocationBasedListDto`, `mapX`/`mapY`/`radius`
  필수, radius ≤ 20000)
- `dto/search-list.dto.ts` (`GcSearchListDto`, `keyword` 필수)
- `dto/image-list.dto.ts` (`GcImageListDto`, `contentId` 필수)
- `dto/index.ts`

### Created — Tests

- `src/kto/go-camping/go-camping.service.spec.ts`
- `src/kto/go-camping/go-camping.tools.spec.ts`
- `src/kto/go-camping/dto/dto.spec.ts`

### NOT Modified (must remain unchanged)

- `src/kto/kto-http.client.ts`
- `src/kto/common/response-normalizer.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/types.ts`
- `src/mcp/tool-registry.ts` (이미 `ToolRegistry[]` 다중 지원)
- `src/mcp/transports/*.ts`
- `src/env.ts`
- `src/kto/korean-tour-info/**/*` (모두 변경 없음)
- `src/kto/barrier-free-tour-info/**/*` (모두 변경 없음)
- `src/kto/photo-gallery/**/*` (모두 변경 없음)

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001/002/003 핀 그대로 재사용.

---

## Acceptance (Test Coverage Map)

| # | 시나리오 | REQ |
|---|----------|-----|
| 1 | BASE_URL_MAP refactor 후 SPEC-KTO-001/002/003 unit + e2e 회귀 무사고 (도구 카운트 assertion 갱신 외) | REQ-UNW-002 |
| 2 | tools/list 응답에 `kto_korean_*` (15) + `kto_barrier_free_*` (10) + `kto_photo_*` (4) + `kto_camping_*` (5) 모두 포함, 도구 카운트 = 34 | REQ-KTO4-001, REQ-KTO4-002 |
| 3 | basedList 정상 호출 → 캠핑장 메타 필드 KTO 원형 보존 + 페이지네이션 노출 | REQ-EVT-001, REQ-KTO4-003 |
| 4 | locationBasedList 의 mapX/mapY/radius 누락 또는 radius > 20000 → outbound 0회 + MCP 검증 에러 | REQ-UNW-001 |
| 5 | searchList 의 keyword 누락 → outbound 0회 + MCP 검증 에러 | REQ-UNW-001 |
| 6 | imageList 의 contentId 누락 → outbound 0회 + MCP 검증 에러 | REQ-UNW-001 |
| 7 | imageList 빈 결과(`items: ""`) → `items: []` 정규화 | REQ-EVT-001, REQ-KTO4-002 |
| 8 | locationBasedList 정상 호출 → outbound URL 의 mapX/mapY/radius 검증 | REQ-EVT-001 |
| 9 | GoCamping 5xx → 4회 호출 (1+3 retry) + 백오프 단조 증가 | REQ-STATE-001 |
| 10 | BASE_URL_MAP refactor 후 KorService2/KorWithService2/PhotoGalleryService1 outbound URL 변경 없음 | REQ-OPT-001, REQ-UNW-002 |
| 11 | 게이트웨이 XML 오류(reasonCode=30) → KtoApiError 재시도 X | (재사용 검증) |
| 12 | streamable-http transport 에서 캠핑 도구 정상 노출 | REQ-KTO4-002 |
| 13 | 커버리지 ≥ 85% 유지 | (Quality Gate) |
| 14 | `GoCampingItem` + `GoCampingImageItem` typed item 노출 — 반환 타입 분기 검증 | REQ-KTO4-003 |
| 15 | basedSyncList → `syncStatus` (A/U/D) 보존 + totalCount 5181 | REQ-EVT-001 |

### Edge Cases (11)

- 빈 결과 / 단일 객체 응답 → 배열 정규화 / 응답 필드 일부 누락 / 인덱스 시그니처
  흡수 검증 / 한글 keyword 인코딩 / radius 경계값 / 선행 3 서비스 재시도 격리 /
  `contentId` vs `contentid` ID 체계 차이 (R6) / 도구 카운트 assertion 정확성 /
  `mapX`/`mapY`/`radius` number/string 양 type 입력 / imageList 정상 응답 사진
  메타 보존

---

## Exclusions

1. 캠핑장 사진 다운로드·바이너리 캐싱·이미지 변환 — 메타데이터(URL) 만 노출.
2. 예약 시스템 통합 — KTO API 자체에 예약 기능 미존재. `resveUrl` URL 만 노출.
3. 다국어 캠핑 변체(`EngGoCamping` 등) 본격 구현 — 존재 미확인, 차기 SPEC.
4. 데이터 캐싱 / DB / Redis — 모든 호출 KTO API 직접 호출.
5. 캠핑 응답 필드 한글 번역·정규화 — KTO 원형 (`facltNm`, `induty`, `Y`/`N`) 보존.
6. 자동 페이지네이션 — `numOfRows`/`pageNo` 그대로 노출.
7. MCP 클라이언트 인증·인가 / 멀티 테넌시 — 단일 `KTO_SERVICE_KEY` 운영.
8. 이미지 URL 유효성 외부 검증 — KTO 응답 그대로 신뢰.
9. `basedList` ↔ KorService2 `areaBasedList2` 머지 통합 도구 — 별도 SPEC 후보.
10. 인허가 데이터 검증·정책 분석 기능 — 필드만 노출, 분석 미구현.

---

## Verified API Facts (v0.1.0)

| 항목 | 확인 결과 | 근거 |
|------|-----------|------|
| service path | `B551011/GoCamping` (V/숫자 suffix 없음, 3번째 패턴 변종) | Swagger 2.0 host 필드 + 사용자 실 호출 200 OK |
| operations | 5개 (basedList, basedSyncList, locationBasedList, searchList, imageList) | Swagger paths + operationId 추출 |
| basedList totalCount | 3,067 (운영 중 캠핑장) | 사용자 실 호출 응답 |
| basedSyncList totalCount | 5,181 (삭제·이력 포함 동기화) | 사용자 실 호출 응답 |
| 응답 envelope | `response.body.items.item` (선행 SPEC 동일) | 사용자 실 호출 |
| imageList 빈 결과 | `body.items === ""` (사진 없는 contentId) | 사용자 실 호출 |
| `mapX`/`mapY`/`radius` Swagger type | string (모두) | Swagger parameters |
| `radius` 한도 | ≤ 20000 (m) | Swagger description |
| `keyword` (searchList) 인코딩 | 클라이언트 책임 | Swagger description "(인코딩 필요)" |
| `syncStatus` 값 | A=신규 / U=수정 / D=삭제 | Swagger parameters description |
| 페이지네이션 필드 | numOfRows, pageNo, totalCount 모두 존재 | 사용자 실 호출 응답 |
| 다국어 변체 | 미존재 | 카탈로그 페이지 본문 검색 |
| basedList_item 필드 수 | 60+ (Swagger definitions 전수) | Swagger 2.0 definitions |
| imageList_item 필드 수 | 5 (contentId, serialnum, imageUrl, createdtime, modifiedtime) | Swagger 2.0 definitions |

---

Version: 0.1.0
Last Updated: 2026-05-09
