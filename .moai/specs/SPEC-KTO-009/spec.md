---
id: SPEC-KTO-009
version: 1.0.0
status: completed
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-009 — KTO 웰니스관광 정보 API (WellnessTursmService) MCP 통합

## HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-05-09 | Seonho Kim | 구현 완료, 실 키 스모크 검증 통과, main 머지 완료 |
| 0.1.0 | 2026-05-09 | Seonho Kim | 최초 SPEC 작성. SPEC-KTO-001~008 머지 완료된 main 브랜치 위에 KTO 6번째 패턴 (langDivCd) 의 두 번째 적용 사례로서 웰니스관광 정보 API 통합. 9 operation 중 8개 노출. |

## 1. 목적

한국관광공사 (KTO) 웰니스관광 정보 API (`B551011/WellnessTursmService`, data.go.kr 서비스 ID 15144030) 를 MCP 도구로 노출하여, LLM 에이전트가 한국 내 웰니스/스파/온천 관광 자원을 단일 인터페이스로 조회할 수 있게 한다. 본 SPEC 은 SPEC-KTO-008 에서 확립한 KTO 6번째 패턴 (langDivCd 단일 path 다국어) 의 두 번째 적용 사례로서, 동일 패턴의 재현성과 인프라 재사용성을 검증한다.

## 2. EARS 요구사항

### REQ-KTO9-* (Ubiquitous — 항상 적용)

- **REQ-KTO9-001**: The 웰니스관광 모듈 shall HTTP transport, response normalizer, tool registry 의 3종 공통 인프라를 신규 추상화 도입 없이 그대로 재사용한다.
- **REQ-KTO9-002**: The 웰니스관광 서비스 shall `KtoHttpClient` (의료관광/SPEC-KTO-008 에서 사용된 동일 인스턴스) 를 의존성 주입으로 사용하며 신규 HTTP client 클래스를 생성하지 않는다.
- **REQ-KTO9-003**: The 웰니스관광 응답 entity shall `WellnessTursmItem` 인터페이스로 노출되며 `MdclTursmItem` 을 재사용/확장하지 않고 별개 타입으로 정의한다 (도메인 분리 원칙).
- **REQ-KTO9-004**: The 웰니스관광 도구 shall MCP 도구 이름을 `kto_wellness_<exactOpName>` 형식으로 노출하며 KTO 공식 operation 명의 camelCase 표기를 보존한다 (e.g. `kto_wellness_areaBasedList`).
- **REQ-KTO9-005**: The `BASE_URL_MAP` shall `WellnessTursmService` 키를 추가하며 KTO 공식 약어 `Tursm` 표기를 그대로 보존한다.

### REQ-EVT-* (Event-driven — MCP 호출 이벤트 기반)

- **REQ-EVT-001**: When MCP 클라이언트가 8개 `kto_wellness_*` 도구 중 하나를 호출하면, the 시스템 shall 해당 호출을 `WellnessTourismService` 의 대응 메서드로 라우팅하고, KTO `WellnessTursmService` 의 단일 path 에 `langDivCd` 를 포함한 query 로 위임한다.
- **REQ-EVT-002**: When `WellnessTursmService` 가 표준 envelope (`response.body.items.item[]`) 을 반환하면, the 시스템 shall response normalizer 를 통해 단일/배열 정규화 후 `WellnessTursmItem[]` 형태로 MCP 응답에 포함한다.
- **REQ-EVT-003**: When `kto_wellness_locationBasedList` 호출이 성공하면, the 시스템 shall 응답 항목에 `dist` 필드를 보존하여 클라이언트가 거리 기반 정렬/필터링을 수행할 수 있게 한다.
- **REQ-EVT-004**: When `kto_wellness_wellnessTursmSyncList` 호출이 성공하면, the 시스템 shall 응답 항목의 `showflag`, `oldContentId` 필드를 누락 없이 보존한다.

### REQ-STATE-* (State-driven — 외부 API 상태 기반)

- **REQ-STATE-001**: While KTO 외부 API 가 5xx 응답을 반환하는 동안, the 시스템 shall `KtoHttpClient` 의 기존 재시도 정책을 그대로 따르며 본 SPEC 에서 별도의 재시도 로직을 도입하지 않는다.
- **REQ-STATE-002**: While KTO 응답이 PhotoGalleryService1 형태의 flat error envelope 로 도착하는 동안, the 시스템 shall `KtoHttpClient` 가 이미 처리하는 정규화 경로를 통과시키며 신규 분기를 추가하지 않는다.

### REQ-OPT-* (Optional — 인프라 일반화)

- **REQ-OPT-001**: Where `BASE_URL_MAP` 가 다중 KTO 서비스를 키-값으로 관리하는 일반화 구조를 제공하는 곳에서, the 시스템 shall `WellnessTursmService` 항목을 단일 줄 추가만으로 등록할 수 있어야 한다 (기존 8개 서비스의 등록 방식과 동일 인터페이스 유지).

### REQ-UNW-* (Unwanted — 금지 동작)

- **REQ-UNW-001**: If MCP 호출에서 `langDivCd` 파라미터가 누락되면, then the 시스템 shall MCP `-32602 invalid params` 코드로 차단하고 KTO API 로 위임하지 않는다 (8개 도구 모두 적용).
- **REQ-UNW-002**: If `kto_wellness_locationBasedList` 호출에서 `mapX`, `mapY`, `radius` 중 하나라도 누락되면, then the 시스템 shall `-32602` 로 차단한다.
- **REQ-UNW-003**: If `kto_wellness_searchKeyword` 호출에서 `keyword` 가 누락되거나 빈 문자열이면, then the 시스템 shall `-32602` 로 차단한다.
- **REQ-UNW-004**: If `kto_wellness_detailIntro` 또는 `kto_wellness_detailInfo` 호출에서 `contentId` 또는 `contentTypeId` 가 누락되면, then the 시스템 shall `-32602` 로 차단한다.
- **REQ-UNW-005**: If `kto_wellness_detailCommon` 또는 `kto_wellness_detailImage` 호출에서 `contentId` 가 누락되면, then the 시스템 shall `-32602` 로 차단한다.
- **REQ-UNW-006**: The 시스템 shall `kto_wellness_ldongCode` 를 노출하지 않으며, KorService2 `ldongCode2` 도구와 중복 등록되어서는 안 된다.

## 3. 영향 받는 파일

### 수정

- `src/kto/common/constants.ts` — `BASE_URL_MAP` 에 `WellnessTursmService` 항목 추가 (1줄)
- `src/main.ts` — 9번째 ToolRegistry (`WELLNESS_TOURISM_TOOLS`) 등록
- `src/app.module.ts` — `WellnessTourismModule` import 추가
- `test/kto.e2e-spec.ts` — 도구 카운트 기대값 55 → 63 갱신 + 신규 `kto_wellness_*` 도구 호출 케이스 추가

### 신규 (`src/kto/wellness-tourism/`)

- `wellness-tourism.module.ts`
- `wellness-tourism.service.ts`
- `wellness-tourism.service.spec.ts`
- `wellness-tourism.tools.ts`
- `wellness-tourism.tools.spec.ts`
- `types.ts` — `WellnessTursmItem` 인터페이스 + 인덱스 시그니처
- `dto/index.ts` — 8개 DTO re-export
- `dto/area-based-list.dto.ts` — `WtAreaBasedListDto`
- `dto/location-based-list.dto.ts` — `WtLocationBasedListDto`
- `dto/search-keyword.dto.ts` — `WtSearchKeywordDto`
- `dto/wellness-tursm-sync-list.dto.ts` — `WtWellnessTursmSyncListDto`
- `dto/detail-common.dto.ts` — `WtDetailCommonDto`
- `dto/detail-intro.dto.ts` — `WtDetailIntroDto`
- `dto/detail-info.dto.ts` — `WtDetailInfoDto`
- `dto/detail-image.dto.ts` — `WtDetailImageDto`

## 4. Exclusions (What NOT to Build)

- **`ldongCode` operation 미노출**: KorService2 `ldongCode2` 도구와 응답/시맨틱 동일 → R1 dedup 정책 적용 (SPEC-KTO-007/008 에서 확립한 동일 결정 답습). 클라이언트는 기존 `kto_korean_ldongCode2` 도구를 사용한다.
- **다국어 변체 path 미존재 가정**: 의료관광/웰니스 도메인은 KorService2 와 달리 path 자체에 언어 코드가 박혀 있지 않으며 `langDivCd` 파라미터로만 분기한다. 본 SPEC 은 path-suffix 다국어 변체를 처리하지 않는다.
- **외부 예약 시스템 통합 없음**: 본 SPEC 은 정보 조회 (read-only) 만 다루며 예약/결제/사용자 인증 관련 기능을 도입하지 않는다.
- **자동 한-영 번역 없음**: 응답 `title` 등이 한국어로 도착할 때 (의료관광은 영어 기본) 자동 번역하지 않는다. 클라이언트가 필요 시 별도 처리한다.
- **`WellnessTursmItem` 의 `MdclTursmItem` 재사용 없음**: 두 타입은 구조적으로 70% 이상 중첩되지만 도메인 의미가 다르므로 별개 interface 로 정의한다 (의도적 중복; 도메인 분리 일관성 우선).
- **신규 HTTP client / response-normalizer / tool-registry 추상화 도입 없음**: 기존 main 브랜치의 인프라를 100% 재사용한다.
