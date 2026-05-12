# SPEC-KTO-001 (Compact)

> Auto-extracted summary of `spec.md` + key acceptance criteria.

ID: SPEC-KTO-001
Version: 0.1.0
Status: draft
Priority: high
Author: Seonho Kim
Created/Updated: 2026-05-09

---

## Requirements (EARS)

### Module 1 — MCP Transport
- **REQ-KTO-001 (Ubiquitous)**: 서버는 `KorService2` 13개 오퍼레이션을 `kto_korean_{operationName}` 패턴 도구로 모두 노출해야 한다 (v1.1.0: `areaCode2`/`categoryCode2`는 data.go.kr Swagger에서 "미사용 기능(삭제예정)"으로 표기되어 제거).
- **REQ-KTO-002 (Ubiquitous)**: 서버는 stdio · streamable-http · http 세 transport를 `MCP_TRANSPORT_MODE` 로 선택 가능하게 지원해야 한다.
- **REQ-EVT-001 (Event-driven)**: WHEN MCP 클라이언트가 `tools/call`을 보내면, 서버는 KTO API를 호출하고 정규화된 응답을 반환해야 한다.

### Module 2 — KTO HTTP Client
- **REQ-KTO-003 (Ubiquitous)**: 클라이언트는 `MobileOS=ETC`, `MobileApp=kto-mcp`, `_type=json`, `serviceKey`를 모든 요청에 자동 주입해야 한다.
- **REQ-KTO-004 (Ubiquitous)**: 클라이언트는 정상 JSON 응답의 `items.item`을 항상 배열로 정규화하고, 게이트웨이 오류 XML(`OpenAPI_ServiceResponse`)을 표준 에러로 변환해야 한다.
- **REQ-OPT-001 (Optional)**: WHERE 다국어 확장이 예상되면, 클라이언트는 `serviceName` 파라미터(기본 `'KorService2'`)로 base URL을 결정해야 한다.

### Module 3 — Error Handling and Resilience
- **REQ-STATE-001 (State-driven)**: WHILE KTO API가 5xx 또는 transient 네트워크 오류를 반환하는 동안, 클라이언트는 지수 백오프(base 500ms × 2^n, jitter ±20%)로 최대 3회 재시도해야 한다.
- **REQ-UNW-001 (Unwanted)**: IF `KTO_SERVICE_KEY`가 누락이면, 서버는 부트스트랩에서 명시적 에러로 즉시 종료해야 한다.
- **REQ-UNW-002 (Unwanted)**: IF KTO 응답이 게이트웨이 오류면, 도구는 성공 응답이 아닌 구조화된 MCP 오류를 반환해야 한다.

### Module 4 — Tool Registration and Validation
- **REQ-KTO-005 (Ubiquitous)**: 도구 레지스트리는 모든 MCP 입력을 class-validator DTO로 검증하고, 실패 시 outbound HTTP 호출을 발생시키지 않아야 한다.
- **REQ-KTO-006 (Ubiquitous)**: 도구 레지스트리는 각 도구의 `inputSchema`(JSON Schema)를 DTO로부터 생성하여 `tools/list`에 노출해야 한다.

### Module 5 — Bootstrap and Operational Contract
- **REQ-KTO-007 (Ubiquitous)**: `src/main.ts`는 환경변수 로드 → 컨테이너 생성 → 도구 등록 → transport 부착 → 시그널 핸들러 설치를 순서대로 수행해야 한다.
- **REQ-EVT-002 (Event-driven)**: WHEN SIGINT/SIGTERM 수신 시, 서버는 신규 요청 차단 → in-flight 완료(최대 5초) → transport 종료 → 종료 코드 0으로 종료해야 한다.

---

## Acceptance Criteria (요약)

1. stdio transport에서 `tools/list` 응답에 13개 KTO 도구 모두 포함 (v1.1.0).
2. streamable-http transport에서 동일 도구 노출 (POST `/mcp`).
3. `kto_korean_areaBasedList2` 정상 호출 시 공통 파라미터 자동 주입 + 응답 정규화.
4. `KTO_SERVICE_KEY` 누락 시 부트스트랩 즉시 비-0 종료 + 명시적 메시지.
5. 5xx 응답 시 최대 3회 지수 백오프 재시도.
6. 게이트웨이 오류 XML → 구조화된 MCP 에러 변환, 재시도 X.
7. `serviceName` 파라미터로 base URL 결정 가능 (다국어 확장성).
8. DTO 검증 실패 시 outbound HTTP 호출 발생 X.
9. SIGTERM 시 graceful shutdown.
10. 테스트 커버리지 ≥ 85%.

Edge cases: 빈 결과, `numOfRows=0` 거절, 잘못된 areaCode, 단일 객체 응답 정규화, axios timeout = 5xx 동등 처리, 한글 keyword 단일 인코딩, 예기치 않은 XML 응답 명시적 오류 분류.

Performance: KTO API 호출 평균 ≤ 1초, 메모리 ≤ 256MB, stdio cold start ≤ 500ms.

---

## Files to Modify

### Modified
- `src/main.ts`
- `src/app.module.ts`
- `package.json`

### Created — Configuration
- `.env.example`
- `src/env.ts`

### Created — MCP Layer
- `src/mcp/mcp.module.ts`
- `src/mcp/mcp.service.ts`
- `src/mcp/tool-registry.ts`
- `src/mcp/transports/stdio.adapter.ts`
- `src/mcp/transports/http-streamable.adapter.ts`
- `src/mcp/transports/http.adapter.ts`
- `src/mcp/types/mcp.types.ts`

### Created — KTO Common Layer
- `src/kto/kto.module.ts`
- `src/kto/kto-http.client.ts`
- `src/kto/common/types.ts`
- `src/kto/common/kto-error.ts`
- `src/kto/common/constants.ts`
- `src/kto/common/response-normalizer.ts`

### Created — Korean Tour Info Module
- `src/kto/korean-tour-info/korean-tour-info.module.ts`
- `src/kto/korean-tour-info/korean-tour-info.service.ts`
- `src/kto/korean-tour-info/korean-tour-info.tools.ts`
- `src/kto/korean-tour-info/dto/{15 operation DTOs}.ts`
- `src/kto/korean-tour-info/dto/index.ts`

### Created — Tests
- `src/kto/kto-http.client.spec.ts`
- `src/kto/korean-tour-info/korean-tour-info.service.spec.ts`
- `src/mcp/tool-registry.spec.ts`
- `test/kto.e2e-spec.ts`

### Dependencies (package.json)
- `@modelcontextprotocol/sdk` (1.x)
- `axios`
- `class-validator` (^0.14)
- `class-transformer` (^0.5)
- `fast-xml-parser` (^4.x)

---

## Exclusions (What NOT to Build)

1. 다국어 8개 변체 본격 구현 (설계상 base path 파라미터화만 선반영, 실제 도구 등록 X).
2. 데이터 캐싱 / 영속 저장소 (DB · Redis).
3. 인증·인가 / 멀티 테넌시 / OAuth.
4. 자동 페이지네이션 (numOfRows · pageNo는 사용자 노출).
5. 응답 스키마 한국어 번역 / 정규화 (KTO 원형 필드명 유지).
6. 컨테이너(Dockerfile) / CI 자동화 / 모니터링 인프라.
7. Swagger / OpenAPI 자동 생성 (MCP 도구 카탈로그가 1차 인터페이스).
