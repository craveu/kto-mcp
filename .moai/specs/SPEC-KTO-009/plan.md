# SPEC-KTO-009 — Implementation Plan

## 0. 전제 (재확인)

- 베이스 브랜치: `main` @ fa0a4d0 (SPEC-KTO-001~008 머지 완료, 도구 카운트 55)
- 본 SPEC 은 **신규 추상화를 도입하지 않으며**, 기존 인프라를 그대로 재사용한다.
- 9 operation 중 8개를 노출 (`ldongCode` SKIP — R1 dedup).
- 새 도구 prefix: `kto_wellness_*`.

## 1. 핵심 설계 결정 (Lock-in)

| 항목 | 결정 | 근거 |
|------|------|------|
| BASE_URL_MAP key | `WellnessTursmService` | KTO 공식 약어 `Tursm` 보존, MdclTursm 와 일관 |
| Tool prefix | `kto_wellness_*` | LLM-friendly, 도메인 식별 명확 |
| Module path | `src/kto/wellness-tourism/` | 의료관광 (`medical-tourism`) 형제 위치 |
| DTO class prefix | `Wt` (WellnessTourism) | 짧고 충돌 없음 (Mdcl `Mt` 와 같은 정책) |
| TypeScript Item interface | `WellnessTursmItem` | KTO 공식 약어 보존 |
| Tool name format | `kto_wellness_<exactOpName>` | KTO operation camelCase 보존 (e.g. `kto_wellness_areaBasedList`) |
| 노출 operation 수 | 8 (skip `ldongCode`) | R1 dedup (KorService2 ldongCode2 와 시맨틱 동일) |
| 도메인 타입 분리 | `WellnessTursmItem` ≠ `MdclTursmItem` | 도메인 의미 차이 우선 |

## 2. 구현 Phase 분해

### Phase 1: 인프라 등록 — `BASE_URL_MAP` 확장 (Priority High)

- `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 에 한 줄 추가:
  - 키: `WellnessTursmService`
  - 값: 기존 KTO base host + `B551011/WellnessTursmService`
- @MX:SPEC 태그에 `SPEC-KTO-009 REQ-OPT-001` append
- 회귀 영향: 기존 8개 서비스 라우팅 테이블 무변경 — 단순 추가.

### Phase 2: 타입 + DTO 8종 (Priority High)

#### 2.1 `types.ts`

- `WellnessTursmItem` 인터페이스 정의:
  - 필수 공통: `contentId`, `contentTypeId`, `title`, `langDivCd`
  - 주소: `baseAddr`, `detailAddr`, `zipCd`
  - 연락처: `tel`, `telname`, `homepage`
  - 좌표: `mapX`, `mapY`, `mlevel`
  - 이미지/저작권: `orgImage`, `thumbImage`, `cpyrhtDivCd`
  - 타임스탬프: `regDt`, `mdfcnDt`
  - 응답별 옵션: `dist?` (location), `showflag?` / `oldContentId?` (sync), `imgname?` / `serialnum?` (image)
  - 인덱스 시그니처: `[key: string]: unknown`
- @MX:NOTE 태그: "WellnessTursmItem — camelCase 유지, MdclTursmItem 과 도메인 분리"

#### 2.2 DTO 8종 (`dto/*.dto.ts`)

공통 베이스 (모든 DTO 에 포함):
- `langDivCd: string` — 필수
- `numOfRows?: number`, `pageNo?: number` — 옵션 (Pagination)

operation 별 추가 필수/옵션:

| DTO | 필수 (langDivCd 외) | 옵션 |
|-----|---------------------|------|
| `WtAreaBasedListDto` | — | `arrange?`, `contentTypeId?`, `areaCode?`, `sigunguCode?`, `cat1?`, `cat2?`, `cat3?` |
| `WtLocationBasedListDto` | `mapX`, `mapY`, `radius` | `arrange?`, `contentTypeId?` |
| `WtSearchKeywordDto` | `keyword` | `arrange?`, `contentTypeId?`, `areaCode?`, `sigunguCode?` |
| `WtWellnessTursmSyncListDto` | — | `showflag?`, `syncModTime?`, `arrange?`, `contentTypeId?` |
| `WtDetailCommonDto` | `contentId` | — |
| `WtDetailIntroDto` | `contentId`, `contentTypeId` | — |
| `WtDetailInfoDto` | `contentId`, `contentTypeId` | — |
| `WtDetailImageDto` | `contentId` | `imageYN?`, `subImageYN?` |

`dto/index.ts` 에서 8 DTO re-export.

### Phase 3: 서비스 + 도구 정의 (Priority High)

#### 3.1 `wellness-tourism.service.ts`

- `WellnessTourismService` 클래스
- 의존성: `KtoHttpClient` (constructor 주입)
- 8개 메서드:
  - `areaBasedList(dto: WtAreaBasedListDto)`
  - `locationBasedList(dto: WtLocationBasedListDto)`
  - `searchKeyword(dto: WtSearchKeywordDto)`
  - `wellnessTursmSyncList(dto: WtWellnessTursmSyncListDto)`
  - `detailCommon(dto: WtDetailCommonDto)`
  - `detailIntro(dto: WtDetailIntroDto)`
  - `detailInfo(dto: WtDetailInfoDto)`
  - `detailImage(dto: WtDetailImageDto)`
- 모든 메서드가 `BASE_URL_MAP['WellnessTursmService']` 키로 라우팅
- 응답: `WellnessTursmItem[]` (response normalizer 통과 후)

#### 3.2 `wellness-tourism.tools.ts`

- `WELLNESS_TOURISM_TOOLS: ToolRegistry[]` 8 entries
- 각 entry: `{ name, description, inputSchema, handler }`
- `name` 은 `kto_wellness_<exactOpName>` 형식
- `inputSchema` 는 DTO 와 1:1 일치 (JSON Schema)
- `handler` 는 service 메서드 호출

### Phase 4: 모듈 와이어링 (Priority High)

#### 4.1 `wellness-tourism.module.ts`

- NestJS `@Module` decorator
- `imports`: `KtoHttpClient` 가 노출되는 공통 모듈
- `providers`: `WellnessTourismService`
- `exports`: `WellnessTourismService`, `WELLNESS_TOURISM_TOOLS`

#### 4.2 `app.module.ts`

- `WellnessTourismModule` import 에 추가
- 기존 8개 모듈 (Korean, AreaBasedSync, Pet, Camping, BarrierFree, AudioGuide, Photo, Medical) 와 동일한 패턴

#### 4.3 `main.ts`

- registries 배열에 `WELLNESS_TOURISM_TOOLS` 추가 (9th entry)
- 기존 등록 순서 변경 금지 — append-only

### Phase 5: 단위 테스트 + e2e (Priority High)

#### 5.1 `wellness-tourism.service.spec.ts`

- 각 8 메서드에 대한 happy-path 테스트
- KtoHttpClient mock — `BASE_URL_MAP['WellnessTursmService']` 경로 호출 검증
- response normalizer 통과 검증 (단일/배열 둘 다)

#### 5.2 `wellness-tourism.tools.spec.ts`

- 8개 도구의 inputSchema 검증 (필수 파라미터 누락 시 거부)
- handler 위임 검증

#### 5.3 `test/kto.e2e-spec.ts`

- 도구 카운트 기대값: 55 → **63**
- `kto_wellness_*` prefix 도구 8개 모두 `tools/list` 응답에 포함 확인
- 대표 도구 1~2개 (`kto_wellness_areaBasedList`, `kto_wellness_searchKeyword`) e2e 호출 케이스 추가

## 3. 기술 결정

- **신규 추상화 도입 금지**. 모든 인프라 (HTTP client, response normalizer, tool registry, BASE_URL_MAP, pagination DTO 베이스) 는 기존 main 브랜치 코드를 그대로 사용한다.
- **`WellnessTursmItem` 별도 정의** (MdclTursmItem 재사용 안 함) — 두 타입의 구조 중첩이 높지만 도메인 의미가 다르므로 별개 interface 로 유지한다. SPEC-KTO-007/008 에서 확립한 도메인-단위 타입 분리 정책의 연장.
- **DTO 필수 / 옵션 명시** — Plan 의 표 (Phase 2.2) 가 단일 truth source. 구현 시 표를 그대로 참조한다.
- **공식 KTO operation 명 보존** — 도구 이름과 service 메서드 이름 모두 KTO Swagger 의 camelCase 표기를 그대로 사용한다.

## 4. 위험 분석

| ID | 위험 | 영향 | 가능성 | 완화 |
|----|------|------|--------|------|
| R1 | `WellnessTursmItem` 이 `MdclTursmItem` 과 70%+ 중첩되어 향후 유지보수 부담 | LOW | MEDIUM | 의도적 중복 — 도메인 분리 우선. 향후 공통 베이스 interface 로 추출 가능하지만 본 SPEC 범위 외. SPEC-KTO-008 의 동일 정책 답습. |
| R2 | `detailIntro` / `detailInfo` 의 `contentTypeId` 가능값 (12/14/15/25/28/32/38/39) 이 KTO 표준 코드와 정확히 일치하지 않을 가능성 | LOW | LOW | DTO 에서 enum 강제하지 않고 `string` 으로 받음. 잘못된 값은 KTO 측에서 처리하며 -32602 차단 대상이 아님. KorService2 `detailIntro2`/`detailInfo2` 와 동일한 처리 정책. |
| R3 | `ldongCode` 를 KorService2 `ldongCode2` 와 시맨틱 동일이라고 단정한 근거 부족 가능성 | LOW | LOW | SPEC-KTO-007/008 에서 동일 결정을 내렸으며 회귀 발생 사례 없음. 본 SPEC 도 동일 정책 답습. 회귀 발견 시 후속 SPEC 으로 노출 추가. |

## 5. MX Tag Plan

- `src/kto/common/constants.ts` 의 `BASE_URL_MAP` 정의: 기존 `@MX:SPEC` 에 `SPEC-KTO-009 REQ-OPT-001` 항목 append
- `src/kto/wellness-tourism/wellness-tourism.service.ts` 의 8 메서드: 각각 `@MX:TODO test` 로 시작 → 단위 테스트 작성 시 제거
- `src/kto/wellness-tourism/types.ts` 의 `WellnessTursmItem`: `@MX:NOTE camelCase 유지, MdclTursmItem 과 도메인 분리 (SPEC-KTO-009)`
- `src/kto/wellness-tourism/wellness-tourism.tools.ts` 의 `WELLNESS_TOURISM_TOOLS`: `@MX:ANCHOR kto_wellness_*` (LLM 도구 진입점)

## 6. 마일스톤 (Priority 기반, 시간 추정 없음)

- **M1 (Priority High)**: Phase 1 + Phase 2 완료 — BASE_URL_MAP 확장 + 타입/DTO 정의. 단위 테스트로 DTO 검증 가능.
- **M2 (Priority High)**: Phase 3 + Phase 4 완료 — Service/Tools/Module 와이어링. `tools/list` 에 8개 신규 도구 노출 확인.
- **M3 (Priority High)**: Phase 5 완료 — 단위 + e2e 테스트 통과. 도구 카운트 63 확인. 기존 55개 회귀 0.

선행/후행 관계:
- M1 → M2 → M3 (Phase 의 순차 의존성)
- M2 완료 후에야 e2e 테스트 작성 가능 (도구 등록 필요)

## 7. 회귀 방지 체크리스트

- 기존 8개 서비스의 BASE_URL_MAP 키 무변경
- 기존 도구 이름 / inputSchema 무변경
- `KtoHttpClient` 시그니처 무변경
- response normalizer 로직 무변경
- 등록 순서 (registries 배열) 의 기존 인덱스 0~7 무변경 — 8번 인덱스에 append-only

## 8. 인프라 재사용 강조

본 SPEC 은 **신규 추상화 0개**, **기존 인프라 100% 재사용** 을 원칙으로 한다. 새로 추가되는 것은:
- 1개 BASE_URL_MAP entry
- 1개 NestJS module
- 1개 service (8 메서드)
- 1개 tools array (8 entries)
- 1개 types interface
- 8개 DTO 클래스
- 단위/e2e 테스트

이 외의 어떤 공통 모듈도 수정하지 않으며, 어떤 신규 abstract class / generic helper / decorator 도 도입하지 않는다.
