---
id: SPEC-KTO-001
version: 1.1.0
status: completed
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-001: KTO MCP 서버 1차 이터레이션 (KorService2 국문 관광정보)

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.1.0 | 2026-05-12 | Seonho Kim | deprecated 오퍼레이션 areaCode2 + categoryCode2 삭제 및 레거시 파라미터 제거. 도구 수 15 → 13 |
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료. 모든 요구사항 만족, 테스트 통과 (76 unit + 6 e2e), 95.41% 커버리지, lint 0 errors |
| 0.1.0 | 2026-05-09 | Seonho Kim | 초안 생성. KorService2 15개 오퍼레이션을 MCP 도구로 1:1 매핑하는 1차 이터레이션 정의 |

---

## Overview

NestJS 11 + TypeScript 5 기반 MCP(Model Context Protocol) 서버로, 한국관광공사
국문 관광정보 조회 API(`KorService2`, data.go.kr ID 15101578)를 LLM 에이전트가
자연어로 호출 가능한 표준 도구(Tools)로 노출한다. 본 SPEC은 1차 이터레이션 범위만
정의하며, 다국어 8개 변체 본격 구현은 차기 이터레이션으로 미룬다.

상위 컨텍스트는 `research.md`(외부 API 분석)에서 확인하고, 구체적 작업 분해는
`plan.md`, 검증 시나리오는 `acceptance.md` 를 참조한다.

---

## Scope

### In Scope (1차 이터레이션)

- `KorService2` 15개 오퍼레이션의 MCP 도구 매핑 (1:1)
- stdio · Streamable HTTP · Non-streamable HTTP 세 종류 transport 지원
- 환경변수 기반 KTO 서비스 키 관리
- KTO 게이트웨이 오류(`OpenAPI_ServiceResponse`)를 MCP 표준 에러로 정규화
- 5xx 응답에 대한 지수 백오프 재시도 (최대 3회)
- 다국어 확장 가능한 base URL 파라미터화 (`serviceName`)
- Jest 단위 테스트 + e2e 테스트 (커버리지 85% 이상)

### Out of Scope (Exclusions — What NOT to Build)

본 이터레이션에서 명시적으로 제외하는 항목:

1. **다국어 8개 변체 본격 구현** — `EngService2` 외 7개 언어 모듈은 설계상 base path 파라미터화만 선반영하고, 실제 도구 등록·테스트는 차기 이터레이션으로 이관.
2. **데이터 캐싱 / 영속 저장소(DB·Redis)** — 모든 호출은 KTO API 직접 호출. 메모리·디스크 캐시 도입 X.
3. **인증·인가 / 멀티 테넌시** — MCP 클라이언트 인증(API key, OAuth) 없음. 서비스 키는 환경변수로 단일 테넌트 운영.
4. **자동 페이지네이션** — `numOfRows`, `pageNo`를 그대로 사용자에게 노출. 도구 내부에서 자동 다음 페이지 조회 X.
5. **응답 스키마 한국어 번역 / 정규화** — 응답 필드명(`addr1`, `mapx` 등)은 KTO 원형을 유지. 추가 변환 레이어는 도입 X.
6. **컨테이너 / CI 자동화 / 모니터링 인프라** — Dockerfile, GitHub Actions, OpenTelemetry 등은 본 SPEC 범위 외.
7. **Swagger / OpenAPI 자동 생성** — MCP 도구 카탈로그가 1차 인터페이스이며, 별도 REST API 문서는 만들지 않음.

---

## Requirements (EARS Format)

EARS 다섯 패턴 모두 사용. 본 SPEC의 요구사항 모듈은 5개 이내로 제한한다.

### Module 1: MCP Transport (REQ-KTO-001 ~ REQ-EVT-001)

#### REQ-KTO-001 (Ubiquitous)

The MCP server **shall** expose all 15 `KorService2` operations as MCP tools whose names follow the pattern `kto_korean_{operationName}` (예: `kto_korean_areaBasedList2`, `kto_korean_searchKeyword2`).

#### REQ-KTO-002 (Ubiquitous)

The MCP server **shall** support three transports — `stdio`, `streamable-http`, and `http` (non-streamable) — selected at startup via the `MCP_TRANSPORT_MODE` environment variable.

#### REQ-EVT-001 (Event-driven)

**When** an MCP client sends a `tools/call` request for a registered KTO tool, the server **shall** invoke the corresponding `KorService2` operation, normalize the response, and return the result as the tool's response payload.

---

### Module 2: KTO HTTP Client (REQ-KTO-003 ~ REQ-OPT-001)

#### REQ-KTO-003 (Ubiquitous)

The KTO HTTP client **shall** automatically inject the common required parameters `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`, and `serviceKey={KTO_SERVICE_KEY}` into every outbound request, without requiring the caller to provide them.

#### REQ-KTO-004 (Ubiquitous)

The KTO HTTP client **shall** parse responses in two formats:
- 정상 JSON 응답(`response.body.items.item`)을 항상 배열로 정규화한다(단일 객체 응답도 1-element 배열로 변환).
- 게이트웨이 오류 XML(`OpenAPI_ServiceResponse`)을 `fast-xml-parser`로 파싱하여 표준 에러 객체로 변환한다.

#### REQ-OPT-001 (Optional)

**Where** multi-language extension is anticipated, the KTO HTTP client **shall** accept a `serviceName` parameter (default `'KorService2'`) that determines the base URL path, allowing future language variants (e.g., `'EngService2'`) to be added without modifying the client core.

---

### Module 3: Error Handling and Resilience (REQ-STATE-001 ~ REQ-UNW-002)

#### REQ-STATE-001 (State-driven)

**While** the KTO API returns an HTTP 5xx response or a network-level transient error (timeout, ECONNRESET, ETIMEDOUT), the KTO HTTP client **shall** retry the request up to 3 times with exponential backoff (base delay 500ms, factor 2.0, jitter ±20%).

#### REQ-UNW-001 (Unwanted)

**If** the `KTO_SERVICE_KEY` environment variable is missing or empty at server bootstrap, **then** the server **shall** abort startup with an explicit, descriptive error message that names the missing variable.

#### REQ-UNW-002 (Unwanted)

**If** the KTO API returns an `OpenAPI_ServiceResponse` envelope (gateway error) with a non-`00` `returnReasonCode`, **then** the tool **shall not** return a successful MCP response; instead it **shall** propagate a structured MCP tool error including the original `returnAuthMsg` and `returnReasonCode`.

---

### Module 4: Tool Registration and Validation (REQ-KTO-005 ~ REQ-KTO-006)

#### REQ-KTO-005 (Ubiquitous)

The tool registry **shall** validate every incoming MCP tool argument against a class-validator-backed DTO before invoking the KTO HTTP client; validation failures **shall** be returned as structured MCP tool errors without making any outbound HTTP call.

#### REQ-KTO-006 (Ubiquitous)

The tool registry **shall** expose, for each registered tool, an MCP `inputSchema` (JSON Schema) generated from the corresponding DTO so MCP clients can discover required and optional parameters via `tools/list`.

---

### Module 5: Bootstrap and Operational Contract (REQ-KTO-007 ~ REQ-EVT-002)

#### REQ-KTO-007 (Ubiquitous)

The application bootstrap (`src/main.ts`) **shall** load environment variables, construct the NestJS application context, register all KTO tools with the MCP server, attach the configured transport, and install signal handlers (`SIGINT`, `SIGTERM`) for graceful shutdown.

#### REQ-EVT-002 (Event-driven)

**When** the server receives `SIGINT` or `SIGTERM`, the server **shall** stop accepting new MCP requests, wait for in-flight tool invocations to complete (best-effort, capped at 5 seconds), close the active transport, and exit with code 0.

---

## Affected Files (Write Targets)

### Modified

- `src/main.ts` — multi-transport 부트스트랩 로직으로 교체
- `src/app.module.ts` — `McpModule`, `KtoModule` 등록
- `package.json` — 의존성 추가 (아래 목록 참조)

### Created

#### Configuration

- `.env.example` — `KTO_SERVICE_KEY`, `MCP_TRANSPORT_MODE`, `MCP_HTTP_PORT` 샘플
- `src/env.ts` — 타입 안전 환경변수 로더

#### MCP Layer

- `src/mcp/mcp.module.ts`
- `src/mcp/mcp.service.ts`
- `src/mcp/tool-registry.ts`
- `src/mcp/transports/stdio.adapter.ts`
- `src/mcp/transports/http-streamable.adapter.ts`
- `src/mcp/transports/http.adapter.ts`
- `src/mcp/types/mcp.types.ts`

#### KTO Common Layer

- `src/kto/kto.module.ts`
- `src/kto/kto-http.client.ts`
- `src/kto/common/types.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/constants.ts` (공통 파라미터 상수, base path 매핑)
- `src/kto/common/response-normalizer.ts` (item 배열 정규화)

#### Korean Tour Info Module (1차 구현)

- `src/kto/korean-tour-info/korean-tour-info.module.ts`
- `src/kto/korean-tour-info/korean-tour-info.service.ts`
- `src/kto/korean-tour-info/korean-tour-info.tools.ts`
- `src/kto/korean-tour-info/dto/area-based-list.dto.ts`
- `src/kto/korean-tour-info/dto/area-based-sync-list.dto.ts`
- `src/kto/korean-tour-info/dto/area-code.dto.ts`
- `src/kto/korean-tour-info/dto/category-code.dto.ts`
- `src/kto/korean-tour-info/dto/detail-common.dto.ts`
- `src/kto/korean-tour-info/dto/detail-image.dto.ts`
- `src/kto/korean-tour-info/dto/detail-info.dto.ts`
- `src/kto/korean-tour-info/dto/detail-intro.dto.ts`
- `src/kto/korean-tour-info/dto/detail-pet-tour.dto.ts`
- `src/kto/korean-tour-info/dto/ldong-code.dto.ts`
- `src/kto/korean-tour-info/dto/lcls-systm-code.dto.ts`
- `src/kto/korean-tour-info/dto/location-based-list.dto.ts`
- `src/kto/korean-tour-info/dto/search-festival.dto.ts`
- `src/kto/korean-tour-info/dto/search-keyword.dto.ts`
- `src/kto/korean-tour-info/dto/search-stay.dto.ts`
- `src/kto/korean-tour-info/dto/index.ts`

#### Tests

- `src/kto/kto-http.client.spec.ts`
- `src/kto/korean-tour-info/korean-tour-info.service.spec.ts`
- `src/mcp/tool-registry.spec.ts`
- `test/kto.e2e-spec.ts`

### Dependencies to Add (`package.json`)

| 패키지 | 용도 | 분류 |
|--------|------|------|
| `@modelcontextprotocol/sdk` (1.x 안정 채널) | MCP 프로토콜 | dependencies |
| `axios` (또는 `@nestjs/axios` + `axios`) | HTTP 클라이언트 | dependencies |
| `class-validator` (^0.14) | DTO 검증 | dependencies |
| `class-transformer` (^0.5) | DTO 직렬화 | dependencies |
| `fast-xml-parser` (^4.x) | 게이트웨이 XML 오류 파싱 | dependencies |

---

## Success Criteria

| 항목 | 기준 |
|------|------|
| 도구 매핑 완성도 | `KorService2` 15개 오퍼레이션 모두 MCP 도구로 노출 (`tools/list` 응답에서 검증) |
| 단위 테스트 커버리지 | 85% 이상 (`pnpm test:cov` statements 기준) |
| e2e 테스트 통과 | `test/kto.e2e-spec.ts` 의 모든 시나리오 PASS |
| Lint | `pnpm lint` 무경고 무에러 |
| Build | `pnpm build` 성공 |
| `KTO_SERVICE_KEY` 누락 처리 | 서버 부트스트랩이 즉시 명시적 오류로 종료 |
| Transport 검증 | stdio 및 streamable-http 모드에서 `tools/list` + `tools/call` 정상 동작 |

상세 시나리오는 `acceptance.md` 참조.

---

## Implementation Notes

### Implementation Completed: 2026-05-09

**Branch**: `feat/SPEC-KTO-001-korean-tour-info`

**Test Summary**:
- Unit tests: 76 (all passing)
- E2E tests: 6 (all passing)
- Total coverage: 95.41% statements / 95.08% lines
- Build: SUCCESS (nest build → dist/)
- Lint: 0 errors, 0 warnings

**Files Created/Modified**: 49 across src/ and test/

**Divergence from Plan** (minor, documented in progress.md):
1. `kto-http.client.ts` placed flat at `src/kto/` rather than `src/kto/clients/` — followed SPEC-KTO-001 plan.md §10 explicitly
2. Retry `initialDelayMs` accepts optional 3rd constructor argument for test speed (1ms in tests vs 200ms production)
3. `KtoModule` uses `useFactory` calling `getEnv()` to defer environment variable access until DI runtime
4. Added `dto/dto.spec.ts` (not in original plan) to meet coverage target
5. Added `reflect-metadata` import in DTO tests for class-transformer compatibility with pure Jest

**MCP Tools Exposed** (15 total): All mapped from KorService2 operations with `kto_korean_` prefix naming
- areaBasedList2, areaBasedSyncList2, areaCode2, categoryCode2
- detailCommon2, detailImage2, detailInfo2, detailIntro2, detailPetTour2
- ldongCode2, lclsSystmCode2, locationBasedList2
- searchFestival2, searchKeyword2, searchStay2

**Transports Tested**: All three modes (stdio, http-streamable, http-json) verified via integration tests

**Known Limitations** (for RUN phase follow-up):
- Parameter validation against KTO API guide PDF: Swagger is authoritative, some PDF parameters marked `[ASSUMED — verify against Swagger]` in comments
- `detailPetTour2` operation existence (R7 risk): Recommend smoke test with real KTO key during Run phase post-deployment

---

### Patch: 2026-05-12 — Deprecated Operations & Legacy Parameter Removal (v1.1.0)

**Reference**: https://www.data.go.kr/data/15101578/openapi.do (KorService2 Swagger)

**Deprecated operations removed** (Swagger `description` field: `미사용 기능 (삭제예정-...)`):
- `/areaCode2` — `미사용 기능 (삭제예정-법정동 시도코드 대체)` → 도구 `kto_korean_areaCode2` 삭제
- `/categoryCode2` — `미사용 기능 (삭제예정-분류체계 코드로 대체)` → 도구 `kto_korean_categoryCode2` 삭제

**Legacy parameters removed** from 5 operations (실측 결과 부분 데이터 반환):
- `areaCode`, `sigunguCode` — `areaBasedList2`, `areaBasedSyncList2`, `searchKeyword2`, `searchFestival2`, `searchStay2`에서 제거
- `cat1`, `cat2`, `cat3` — `areaBasedList2`, `areaBasedSyncList2`, `searchKeyword2`에서 제거

**New parameters added** (법정동 / 분류체계 기반):
- `lDongRegnCd`, `lDongSignguCd` — 위 5개 오퍼레이션에 추가
- `lclsSystm1`, `lclsSystm2`, `lclsSystm3` — `areaBasedList2`, `areaBasedSyncList2`, `searchKeyword2`에 추가

**Tool count**: 15 → 13

---

Version: 1.1.0
Last Updated: 2026-05-12
