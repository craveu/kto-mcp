# SPEC-KTO-002 (Compact)

KTO MCP 서버 2차 이터레이션 — KorWithService2 무장애 여행 정보 (data.go.kr ID 15101897). SPEC-KTO-001 의 공용 인프라(`KtoHttpClient`, `response-normalizer`, `tool-registry`, transport 3종, 에러 모델, 재시도 정책) 100% 재사용. 패턴 복제 SPEC.

---

## Requirements (5 Modules / EARS)

### Module 1: KorWithService2 도메인 도구 노출

- **REQ-KTO2-001 (Ubiquitous)** — 모든 KorWithService2 오퍼레이션을 `kto_barrier_free_{operationName}` 이름의 MCP 도구로 노출. 기존 `kto_korean_*` 와 prefix 충돌 없음.
- **REQ-KTO2-002 (Ubiquitous)** — `stdio` / `streamable-http` / `http` transport, `KtoHttpClient`, `response-normalizer`, `tool-registry` 를 SPEC-KTO-001 에서 변경 없이 재사용. KorService2 도구 회귀 무사고.
- **REQ-EVT-001 (Event-driven)** — `tools/call` 수신 시 `KtoHttpClient.request({ service: 'KorWithService2', operation, params })` 호출 → 정규화 → 응답 반환. 무장애 응답 필드(`wheelchair`, `exit`, `elevator`, `parking`, `restroom`, `guidesystem`, `signguide`, `videoguide`, `audioguide`, `braileblock`, `helpdog`, `stroller`) 를 KTO 원형 표기 그대로 보존.

### Module 2: 5xx 재시도 정책 상속

- **REQ-STATE-001 (State-driven)** — KorWithService2 5xx/네트워크 transient 에러에 기존 `RETRY_CONFIG` (max 3, base 200ms, factor 2.0, jitter ±20%) 동일 적용. 별도 설정 없음.

### Module 3: BASE_URL_MAP 일반화

- **REQ-OPT-001 (Optional)** — `BASE_URL_MAP` 에 `KorWithService2: 'http://apis.data.go.kr/B551011/KorWithService2'` 1줄 추가. `KtoServiceName = keyof typeof BASE_URL_MAP` 유지. 단일 flat namespace 에 언어 변체 + 기능적 형제 서비스 공존. 신규 추상화 도입 금지.

### Module 4: detailWithTour2 의 contentId 검증

- **REQ-UNW-001 (Unwanted)** — `kto_barrier_free_detailWithTour2` 호출 시 `contentId` 누락이면 outbound HTTP 발생 X. class-validator(`@IsNotEmpty`) 로 차단, 구조화된 MCP 도구 에러 반환.

### Module 5: SPEC-KTO-001 회귀 보호

- **REQ-UNW-002 (Unwanted)** — 본 SPEC 구현이 기존 `kto_korean_*` 도구 등록·JSON Schema·검증·재시도·정규화 동작을 변경하면 reject. SPEC-KTO-001 단위/e2e 테스트(76+6)가 assertion 변경 없이 모두 PASS 해야 함.

---

## Files to Modify

### Modified (2)

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 1줄 추가 + `@MX:NOTE` 주석 갱신 (의미 명확화) + `@MX:SPEC: SPEC-KTO-002 REQ-OPT-001` 추가
- `src/app.module.ts` — `BarrierFreeTourInfoModule` import 1줄 추가

### Created — Module (`src/kto/barrier-free-tour-info/`)

- `barrier-free-tour-info.module.ts`
- `barrier-free-tour-info.service.ts`
- `barrier-free-tour-info.tools.ts`
- `dto/area-based-list.dto.ts`
- `dto/detail-common.dto.ts`
- `dto/detail-image.dto.ts`
- `dto/detail-info.dto.ts`
- `dto/detail-intro.dto.ts`
- `dto/detail-with-tour.dto.ts` (KorWithService2 고유, `contentId` 필수)
- `dto/location-based-list.dto.ts`
- `dto/search-festival.dto.ts`
- `dto/search-keyword.dto.ts`
- `dto/search-stay.dto.ts`
- `dto/index.ts`

### Created — Tests

- `src/kto/barrier-free-tour-info/barrier-free-tour-info.service.spec.ts`
- (선택) `src/kto/barrier-free-tour-info/dto/dto.spec.ts`

### Modified — Tests

- `test/kto.e2e-spec.ts` — KorWithService2 시나리오 추가 (신규 파일 X, 기존 파일 확장)

### NOT Modified (must remain unchanged)

- `src/kto/kto-http.client.ts`
- `src/kto/common/response-normalizer.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/types.ts`
- `src/mcp/tool-registry.ts`
- `src/mcp/transports/*.ts`
- `src/env.ts`
- `src/kto/korean-tour-info/**/*` (모두 변경 없음)

### Dependencies

신규 의존성 **없음**. SPEC-KTO-001 핀 그대로 재사용.

---

## Acceptance (Test Coverage Map)

| # | 시나리오 | REQ |
|---|----------|-----|
| 1 | BASE_URL_MAP refactor 후 SPEC-KTO-001 76+6 테스트 회귀 무사고 | REQ-UNW-002 |
| 2 | tools/list 응답에 `kto_korean_*` (15) + `kto_barrier_free_*` (≤9) 모두 포함, `detailWithTour2` 필수 | REQ-KTO2-001, REQ-KTO2-002 |
| 3 | detailWithTour2 정상 호출 → 무장애 필드 12종 KTO 원형 보존 | REQ-EVT-001 |
| 4 | detailWithTour2 contentId 누락 → outbound 0회 + MCP 검증 에러 | REQ-UNW-001 |
| 5 | KorWithService2 5xx → 4회 호출 (1+3 retry) + 백오프 단조 증가 | REQ-STATE-001 |
| 6 | BASE_URL_MAP refactor 후 KorService2 outbound URL 변경 없음 | REQ-OPT-001, REQ-UNW-002 |
| 7 | 게이트웨이 XML 오류(reasonCode=30) → KtoApiError 재시도 X | (재사용 검증) |
| 8 | streamable-http transport 에서 무장애 도구 정상 노출 | REQ-KTO2-002 |
| 9 | 커버리지 ≥ 85% 유지 (SPEC-KTO-001 95.41% 대비 회귀 없음) | (Quality Gate) |

### Edge Cases (7)

- 빈 결과 / detailWithTour2 단일 객체 응답 / 무장애 필드 일부 누락 / 코드 조회 도구 중복 미등록(R1) / 30·404 발생 오퍼레이션 도구 제외(R3) / 한글 keyword 인코딩 / KorService2·KorWithService2 재시도 격리

---

## Exclusions

1. 무장애 다국어 변체(`EngWithService2` 등) 본격 구현 — 차기 SPEC.
2. 데이터 캐싱 / DB / Redis — 모든 호출 KTO API 직접 호출.
3. KorService2 + KorWithService2 응답 머지하는 통합 검색 도구 — 별도 SPEC 후보.
4. 무장애 응답 필드 한글 번역·정규화 — KTO 원형 보존.
5. 자동 페이지네이션 — `numOfRows`/`pageNo` 그대로 노출.
6. MCP 클라이언트 인증·인가 / 멀티 테넌시 — 단일 `KTO_SERVICE_KEY` 운영.
7. `detailWithTour2` 응답 신뢰도 검증·외부 데이터 교차검증 — SPEC 범위 외.

---

## Key Risks (요약)

- **R1 (MEDIUM)**: 코드 조회 도구(`areaCode2` 등) 가 KorService2 측에 이미 노출되어 있어 중복 가능. 완화: 무장애 모듈에서는 무장애 응답 차이가 발생하는 9개 오퍼레이션만 노출, 코드 조회 4개 미등록.
- **R2 (LOW)**: KorWithService2 정확한 base path 미확인. 완화: Phase 1 첫 단위 테스트로 검증, 30 응답 시 path 변체 시도.
- **R3 (MEDIUM)**: Swagger 직접 접근 불가 → `[ASSUMED — verify against KTO guide PDF]` 마커. 완화: RUN Phase 첫 통합 테스트에서 응답 확인 후 DTO·도구 카탈로그 최종 확정.

---

Version: 0.1.0
Last Updated: 2026-05-09
