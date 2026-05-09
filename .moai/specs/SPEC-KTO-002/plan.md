# Plan: SPEC-KTO-002 (KTO MCP 서버 2차 이터레이션 — 무장애 여행 정보)

## 개요

`spec.md` 의 요구사항을 만족하는 KorWithService2 무장애 여행 정보 모듈을 SPEC-KTO-001
의 공용 인프라 위에 추가한다. 본 문서는 작업 분해(WBS), 핵심 기술 결정 사항(특히
`BASE_URL_MAP` 일반화), 위험 요소, 그리고 MX 태그 계획을 정의한다.

본 SPEC 은 패턴 복제 SPEC 이다. 신규 추상화·신규 라이브러리·신규 transport·신규 에러
모델 도입을 모두 금지하고, KorService2 모듈의 패턴을 무장애 도메인에 그대로 적용한다.

---

## 1. 기술 결정 사항

### 1.1 라이브러리 선정

신규 의존성 **없음**. SPEC-KTO-001 §1.1 에서 핀한 의존성을 그대로 재사용한다.

- `@modelcontextprotocol/sdk` (1.x)
- `axios`
- `class-validator`, `class-transformer`
- `fast-xml-parser`
- dev: `nock`, `jest`, `supertest`

### 1.2 도구 이름 prefix 결정

| 후보 | 평가 |
|------|------|
| `kto_kor_with_*` | KTO 서비스 path 와 일치하나 LLM 가독성 떨어짐 |
| `kto_barrierfree_*` | 단어 결합 모호 |
| **`kto_barrier_free_*`** (선정) | LLM 가독성·한국어 의미 매핑 명확. 기존 `kto_korean_*` 와 prefix 충돌 없음 |

선정 기준: MCP `tools/list` 응답에서 LLM 이 도구 의도를 1-shot 으로 식별 가능해야 하며,
KorService2 의 `kto_korean_*` 와 단어 경계가 분명히 분리되어야 한다.

### 1.3 [핵심] `BASE_URL_MAP` 일반화 결정

#### 배경

현재 `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 은 SPEC-KTO-001 시점에 **언어 변체용**
으로 설계되었다 (`KorService2`, `EngService2`, `JpnService2`, ...). 무장애 서비스
(`KorWithService2`) 는 **언어 변체가 아니라 기능적 형제 서비스(functional sibling)** 다.
이를 어떻게 흡수할지 두 옵션이 있다.

#### 옵션 비교

| 항목 | Option A (선정) — flat 확장 | Option B — 분리 + union |
|------|------------------------------|--------------------------|
| 변경 형태 | `BASE_URL_MAP` 에 `KorWithService2` 항목 추가 | `LANGUAGE_MAP` + `BARRIER_FREE_MAP` 분리, `KtoServiceName = keyof typeof LANGUAGE_MAP \| keyof typeof BARRIER_FREE_MAP` |
| `KtoHttpClient` 인터페이스 | 변경 없음 | 변경 없음 (union 유지) |
| `KtoServiceName` 타입 | `keyof typeof BASE_URL_MAP` 그대로 | union type 으로 변경 |
| 코드 변경량 | 1줄 추가 + 주석 갱신 | 다수 파일 영향 (constants.ts split + 모든 import 사이트 점검) |
| 의미 명확성 | "단일 flat namespace" 명확 (주석으로 보강) | 변체·기능 서비스 구분 명확 |
| KorService2 회귀 위험 | **없음** | 중간 (타입 union 변경이 기존 import 사이트 영향) |
| 향후 확장성 (예: `EngWithService2`) | flat 확장 1줄 | `BARRIER_FREE_MAP` 에 항목 추가 필요 |

#### 선정: **Option A**

근거:
1. **회귀 위험 최소화** — SPEC-KTO-001 의 95.41% 커버리지 테스트 스위트를 변경 없이 통과시키는 것이 본 SPEC 의 핵심 제약 (REQ-UNW-002).
2. **공유 코드 조회 오퍼레이션의 자연스러운 흡수** — `areaCode2`, `categoryCode2` 등은 KTO 가이드상 KorService2 와 KorWithService2 양쪽에서 동일한 응답을 반환한다고 명시되어 있다. flat namespace 가 이러한 "코드는 공통 자원" 의 의미와 맞다.
3. **신규 추상화 금지** — 본 SPEC 은 패턴 복제 SPEC 이며, 새로운 분류 체계 도입은 SPEC 의도에 반한다.

#### 의미 명확화 (코멘트 보강)

`constants.ts` 의 `BASE_URL_MAP` 위 기존 `@MX:NOTE` 주석을 다음 의도가 드러나도록 갱신한다
(MX 태그 형식 보존):

> `BASE_URL_MAP` 은 KTO B551011 게이트웨이 산하 모든 서비스 path 의 단일 flat namespace 다.
> 같은 맵에 (1) 언어 변체 (`KorService2`, `EngService2`, ...) 와 (2) 기능적 형제 서비스
> (`KorWithService2`, ...) 가 공존한다. 다국어 확장 시 `EngService2` 패턴, 사이드 서비스 추가
> 시 `KorWithService2` 패턴을 따른다.

#### `KtoHttpClient` 인터페이스에 미치는 영향

- `KtoHttpClient.request({ service: KtoServiceName, ... })` 의 시그니처 변경 **없음**.
- `service: 'KorWithService2'` 를 자연스럽게 받아들임 (`KtoServiceName` 의 union 에 새 키가 추가되었을 뿐).
- 기존 KorService2 호출 사이트 (`korean-tour-info.service.ts`) 는 변경 없음.

이 결정은 plan.md 의 Phase 1 작업 1번으로 1줄 수정 + 주석 갱신으로 처리되며, **breaking change 가 아니다**.

### 1.4 모듈 디렉토리 명명

KorService2 측이 `src/kto/korean-tour-info/` 인 점을 따라, 본 SPEC 은
`src/kto/barrier-free-tour-info/` 를 사용한다 (kebab-case + 도메인 의미). NestJS 모듈명은
`BarrierFreeTourInfoModule` (PascalCase).

---

## 2. Phase 별 작업 분해 (Priority-based)

### Phase 1: BASE_URL_MAP refactor [Priority High]

목적: 공용 상수 1줄 수정 + 주석 갱신. SPEC-KTO-001 회귀 무사고 검증.

1. `src/kto/common/constants.ts`
   - `BASE_URL_MAP` 에 `KorWithService2: 'http://apis.data.go.kr/B551011/KorWithService2'` 추가.
   - 위 `@MX:NOTE` 주석을 §1.3 의 의미 명확화 문구로 갱신.
   - `BASE_URL_MAP` 자체에 `@MX:SPEC: SPEC-KTO-002 REQ-OPT-001` 추가 (기존 `SPEC-KTO-001 REQ-OPT-001` 와 병기).
2. `src/kto/kto-http.client.spec.ts` 에 `service: 'KorWithService2'` 호출 케이스 1건 추가 (정상 응답 모킹) — 기존 테스트 변경 없음.
3. `pnpm test` 전수 실행. SPEC-KTO-001 의 76 unit + 6 e2e 모두 PASS 확인 (REQ-UNW-002).

### Phase 2: barrier-free-tour-info DTOs [Priority High]

목적: 오퍼레이션별 입력 DTO 작성. KorService2 패턴 복사 + 무장애 고유 DTO 추가.

4. `src/kto/barrier-free-tour-info/dto/` 디렉토리 생성.
5. KorService2 의 14개 DTO 중 무장애 도메인 적용 가능 12개 복사 후 클래스명만 변경
   (`AreaBasedListDto` → `BfAreaBasedListDto` 또는 동일 이름이지만 별도 디렉토리/모듈로 분리). 클래스명 충돌 방지를 위해 **prefix `Bf` 또는 동일 이름 + 모듈 격리** 중 하나를 RUN Phase 에서 결정.
6. `dto/detail-with-tour.dto.ts` 신규 작성 — `contentId: string` (필수, `@IsNotEmpty`) 단일 필드 (REQ-UNW-001).
7. `dto/index.ts` 배럴 작성.
8. (선택) `dto/dto.spec.ts` — `BfDetailWithTourDto` 의 `contentId` 누락 검증 테스트.

> [ASSUMED] DTO 셋의 정확한 개수는 RUN Phase 첫 통합 테스트 결과에 따른다 (R3 참조). 본 Plan 은 보수적으로 **최대 13개 DTO** (코드 4 + 목록 5 + 상세 4 = 13, `detailWithTour2` 포함) 를 상한으로 잡는다.

### Phase 3: BarrierFreeTourInfoService + tools.ts [Priority High]

목적: KorWithService2 호출 메서드와 도구 메타데이터 정의.

9. `barrier-free-tour-info.service.ts`
   - 각 오퍼레이션별 메서드 구현. 예: `async areaBasedList2(params): Promise<KtoListResponse<...>>` → `this.client.request({ service: 'KorWithService2', operation: 'areaBasedList2', params })`.
   - `KtoHttpClient` 를 생성자 주입 (KorService2 측과 동일한 DI 패턴).
   - `detailWithTour2` 메서드 필수 포함.
10. `barrier-free-tour-info.tools.ts`
    - 도구 메타데이터 배열 export (`BARRIER_FREE_TOUR_INFO_TOOLS`).
    - 각 항목: `name: 'kto_barrier_free_{operation}'`, `description` (한글), `inputSchema` (JSON Schema), `dtoClass`, `methodName`.
    - KorService2 의 `korean-tour-info.tools.ts` 구조 그대로 복제.
11. 단위 테스트: `barrier-free-tour-info.service.spec.ts` — 각 메서드의 정상 케이스 + `detailWithTour2` 의 무장애 응답 필드 정규화 검증.

### Phase 4: Module wiring [Priority High]

목적: NestJS DI 와 ToolRegistry 연결.

12. `barrier-free-tour-info.module.ts`
    - `@Module({ imports: [KtoModule], providers: [BarrierFreeTourInfoService], exports: [BarrierFreeTourInfoService] })`.
13. `src/app.module.ts`
    - `BarrierFreeTourInfoModule` import 추가 (1줄).
14. `src/main.ts`
    - 기존 도구 등록 위치에서 `BARRIER_FREE_TOUR_INFO_TOOLS` 도 함께 `ToolRegistry.registerAll()` 에 전달. (KorService2 의 `KOREAN_TOUR_INFO_TOOLS` 와 배열 concat 또는 두 번 호출.)

### Phase 5: e2e 검증 [Priority High]

목적: in-process MCP roundtrip + nock 모킹으로 무장애 도구 통합 검증. 실 키 스모크 테스트는 사용자 수행.

15. `test/kto.e2e-spec.ts` 에 KorWithService2 시나리오 추가:
    - `tools/list` 응답에 `kto_barrier_free_*` 도구가 모두 포함되는지 검증.
    - `tools/call kto_barrier_free_detailWithTour2` 의 nock 모킹 응답을 받아 무장애 필드(`wheelchair`, `exit`, `elevator`, `parking`, `restroom` 등) 가 응답에 포함되는지 검증.
    - `contentId` 누락 호출 시 outbound HTTP 미발생 + 검증 에러 응답 (REQ-UNW-001).
    - KorService2 도구의 기존 시나리오 회귀 무사고 (REQ-UNW-002).
16. `pnpm test:cov` 로 커버리지 ≥ 85% 확인.
17. `pnpm lint`, `pnpm build` 무에러 확인.
18. (사용자 수행) 실 `KTO_SERVICE_KEY` 로 `kto_barrier_free_areaBasedList2` 와 `kto_barrier_free_detailWithTour2` 1회씩 호출하여 30/404 응답 발생 오퍼레이션 식별 → 도구 카탈로그에서 제거.

### Phase 5.5: MX Tag Application [Priority Medium]

§5 의 MX Tag Plan 적용.

---

## 3. Reference Implementation Hints

| 항목 | 참고처 |
|------|--------|
| KorService2 모듈 패턴 | `src/kto/korean-tour-info/` 전체 (특히 `korean-tour-info.service.ts`, `korean-tour-info.tools.ts`, `dto/index.ts`) |
| KtoHttpClient 사용 패턴 | `src/kto/korean-tour-info/korean-tour-info.service.ts` (생성자 주입 + `this.client.request(...)`) |
| 도구 등록 패턴 | `src/main.ts` 의 `ToolRegistry.registerAll(server, KOREAN_TOUR_INFO_TOOLS)` 호출부 |
| DTO + class-validator 패턴 | `src/kto/korean-tour-info/dto/area-based-list.dto.ts`, `dto/detail-common.dto.ts` (필수 contentId 검증) |
| 무장애 응답 필드 카탈로그 | `research.md` §4 |

---

## 4. Risks and Mitigations

| 위험 | 영향 | 완화 전략 |
|------|------|-----------|
| **R1 (MEDIUM). 공유 코드 조회 오퍼레이션 도구 중복** — `areaCode2`, `categoryCode2`, `ldongCode2`, `lclsSystmCode2` 가 KorService2 측에 이미 `kto_korean_*` 로 노출되어 있고, KorWithService2 측에서도 동일 응답을 반환할 가능성이 높다. 같은 의도의 도구를 prefix 만 다르게 두 번 노출하면 LLM 도구 선택 혼선 발생. | 中 | **무장애 모듈에서는 무장애 고유 또는 무장애 응답 차이가 발생하는 오퍼레이션만 노출**. 즉 `detailWithTour2` (필수) + `areaBasedList2`/`locationBasedList2`/`searchKeyword2`/`searchFestival2`/`searchStay2`/`detailCommon2`/`detailIntro2`/`detailInfo2`/`detailImage2` 9개를 우선 노출하고, 코드 조회 4개(`areaCode2`/`categoryCode2`/`ldongCode2`/`lclsSystmCode2`) 는 KorService2 도구로 대체 가능하므로 **본 SPEC 에서는 중복 등록 금지**. KorService2 도구의 응답이 KorWithService2 측 호출에서도 그대로 사용 가능하다는 가정. RUN Phase 에서 응답이 동일함을 통합 테스트로 1회 확인. |
| **R2 (LOW). KorWithService2 의 정확한 base path 미확인** | 高 (도구 호출이 30 에러로 전수 실패) | RUN Phase Phase 1 의 첫 단위 테스트(`KtoHttpClient` 의 `service: 'KorWithService2'` 케이스) 로 검증. 30/404 응답 시 `BASE_URL_MAP` path 를 `/B551011/KorWith` 또는 `/B551011/KorWithService` 등 변체로 시도 후 KTO 가이드 PDF 재확인. |
| **R3 (MEDIUM). Swagger 직접 접근 불가 → 일부 파라미터 [ASSUMED] 마커** | 中 | research.md 의 모든 추정 항목에 `[ASSUMED — verify against KTO guide PDF]` 마커 부여. RUN Phase Phase 5 첫 통합 테스트에서 응답 확인 후 DTO·도구 카탈로그 최종 확정. KTO 가이드 PDF 가 RUN 단계에서 확보되면 그 시점에 일괄 갱신. |
| **R4 (LOW). 도구 카탈로그 비대화** — KorService2 15개 + KorWithService2 9개 = 24개 도구가 `tools/list` 에 노출되며, LLM 선택 정확도가 하락할 가능성. | 中 | 각 도구 `description` 에 "**무장애** 정보 조회" / "일반 관광정보 조회" 명시. R1 완화책(중복 도구 미등록) 도 본 위험 함께 완화. 24개는 일반적 MCP 클라이언트 한도 내. |
| **R5 (LOW). 무장애 응답 필드명 정확성** — `braileblock` 등은 KTO 가이드 표기 그대로일 가능성이 있으나 오타로 추정됨. | 低 | KTO 원형 보존 정책(SPEC-KTO-001 Exclusion 5) 동일 적용. 오타조차 보존. RUN Phase 첫 응답에서 정확한 표기 확인 후 acceptance.md 의 검증 필드명 갱신. |
| **R6 (LOW). 무장애 도메인 다국어 변체 발견 시 SPEC 분리 필요성** | 低 | 본 SPEC Exclusion 1 에 명시. 발견 시 별도 SPEC 으로 즉시 분리. 본 SPEC 의 `BASE_URL_MAP` flat 구조가 분리에 친화적. |

---

## 5. MX Tag Plan (Phase 5.5)

본 SPEC 의 신규 산출물에 적용할 MX 태그 계획.

### Anchor 태그 (high fan_in 함수)

| 대상 | 태그 | 사유 |
|------|------|------|
| `KtoHttpClient.request()` (변경 없음) | 기존 `@MX:ANCHOR` 유지 | fan_in 증가 (기존 KorService2 15개 + 신규 KorWithService2 9개 ≈ 24개). 태그 자체는 변경 없으나 본 SPEC 산출물의 progress 보고서에 fan_in 증가 사실을 기록한다. |
| `BarrierFreeTourInfoService.areaBasedList2`, `BarrierFreeTourInfoService.detailWithTour2` 등 모든 메서드 | `@MX:TODO test` (작성 직후) → 테스트 통과 시 제거 | KorService2 모듈과 동일 정책. 메서드별 단위 테스트가 통과하면 일괄 제거. |
| `BARRIER_FREE_TOUR_INFO_TOOLS` (`barrier-free-tour-info.tools.ts`) | `@MX:NOTE` | 도구 카탈로그 진입점. KorService2 도구 카탈로그(`KOREAN_TOUR_INFO_TOOLS`) 와 병렬 구조임을 명시. |

### Warn 태그 (위험 패턴)

| 대상 | 태그 | 사유 |
|------|------|------|
| (해당 없음) | — | 신규 위험 패턴 없음. 재시도·XML 파싱 등 위험 코드는 모두 `KtoHttpClient` 내부에서 기존 `@MX:WARN` 으로 관리되며 본 SPEC 에서 재선언 불필요. |

### Note 태그 (의도/계약 명시)

| 대상 | 태그 | 사유 |
|------|------|------|
| `BASE_URL_MAP` (`src/kto/common/constants.ts`, 갱신) | 기존 `@MX:NOTE` 갱신 + `@MX:SPEC: SPEC-KTO-002 REQ-OPT-001` 추가 | "language variants + functional sibling services share this map" 의도 명시. 다국어 확장은 `EngService2` 패턴, 사이드 서비스 추가는 `KorWithService2` 패턴 안내. |
| `BarrierFreeTourInfoService.detailWithTour2` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-002 REQ-EVT-001` | KorWithService2 고유 오퍼레이션. KTO 가이드의 무장애 메타 필드(`wheelchair`, `exit`, `elevator`, `parking`, `restroom`, `guidesystem`, `signguide`, `videoguide`, `audioguide`, `braileblock`, `helpdog`, `stroller`) 를 그대로 반환한다는 계약을 명시. |
| `BfDetailWithTourDto.contentId` | `@MX:NOTE` + `@MX:SPEC: SPEC-KTO-002 REQ-UNW-001` | `@IsNotEmpty` 검증의 SPEC 계약 추적. |

### TODO 태그 (테스트 미작성)

- 모든 신규 public 메서드(`BarrierFreeTourInfoService.*`) 작성 직후 `@MX:TODO test` 부여.
- Phase 3 단위 테스트 통과 시 일괄 제거.

### Legacy 태그

해당 없음 (본 SPEC 은 신규 코드만 추가).

---

## 6. Definition of Done (Plan-level)

본 plan 이 "완료" 되었다고 선언할 수 있는 조건은 `acceptance.md` 의 모든 시나리오 PASS +
Success Criteria(`spec.md`) 충족이다. 작업 도중 각 Phase 종료 시점에 다음을 점검:

- Phase 1 종료: `BASE_URL_MAP` refactor 후 SPEC-KTO-001 의 76 unit + 6 e2e 테스트가 변경 없이 모두 PASS (REQ-UNW-002).
- Phase 2 종료: `BfDetailWithTourDto.contentId` 누락 검증 테스트 PASS (REQ-UNW-001).
- Phase 3 종료: `BarrierFreeTourInfoService` 의 모든 메서드가 `KtoHttpClient.request({ service: 'KorWithService2', ... })` 를 호출하도록 단위 테스트로 검증.
- Phase 4 종료: `tools/list` 응답에 `kto_barrier_free_*` 와 `kto_korean_*` 모두 포함 (transport 양쪽 확인).
- Phase 5 종료: 커버리지 ≥ 85%, e2e 모두 PASS, lint·build 무에러.
- Phase 5.5 종료: MX 태그 보고서 생성 + `BASE_URL_MAP` 의 `@MX:NOTE` 갱신 확인.

---

Version: 0.1.0
Last Updated: 2026-05-09
