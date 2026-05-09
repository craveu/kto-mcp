---
id: SPEC-KTO-010
version: 0.1.0
status: draft
created: 2026-05-09
updated: 2026-05-09
author: Seonho Kim
priority: high
issue_number: 0
---

# SPEC-KTO-010: PhokoAwrdService MCP 통합 (관광공모전 사진 수상작) — KTO 시리즈 마일스톤

## HISTORY

- 2026-05-09: 초기 draft 작성. **KTO 통합 시리즈 10/10 완성 마일스톤 SPEC**으로, SPEC-KTO-001~009의 누적 63개 MCP 도구에 PhokoAwrdService 2개 도구를 추가하여 총 65개 도구로 KTO B551011 게이트웨이 산하 전 서비스 통합을 마감한다. 본 SPEC을 통해 KTO 다국어 처리 7가지 패턴 분류 체계가 완성된다 (패턴 7 = 응답 필드 prefix `ko*` / `en*`). `ldongCode` operation은 KorService2/`ldongCode2`와 중복이므로 노출하지 않는다.

## 1. 배경 및 동기

KTO 공공 API 통합 프로젝트는 SPEC-KTO-001부터 SPEC-KTO-009에 걸쳐 B551011 게이트웨이 산하 17개 서비스(KorService2, EngService2, JpnService2, ChsService2, ChtService2, GerService2, FreService2, SpnService2, RusService2, KorWithService2, PhotoGalleryService1, GoCamping, Odii, Durunubi, KorPetTourService2, MdclTursmService, WellnessTursmService)를 모두 MCP 도구화하여 main 브랜치에 머지하였다 (current head: 735e846, 63 tools).

본 SPEC-KTO-010은 마지막 미통합 서비스인 **PhokoAwrdService** (관광공모전 사진 수상작 정보)를 동일한 아키텍처 패턴으로 통합하여 KTO 통합 시리즈를 마감한다. PhokoAwrdService는 응답 필드 prefix(`ko*`/`en*`) 방식의 7번째 다국어 처리 패턴을 도입하므로, 시리즈 마무리와 함께 KTO 다국어 패턴 분류 체계 또한 완성된다.

## 2. EARS 요구사항 (5 모듈)

### REQ-KTO10-001 — Ubiquitous (시스템 항상 만족)

The PhokoAwrdService 통합 모듈 shall reuse the existing `KtoHttpClient`, `BASE_URL_MAP`, `response-normalizer`, and `tool-registry` infrastructure without introducing new abstractions.

The PhotoAward module shall expose `PhotoAwardItem` typed records as MCP tool responses, preserving both `ko*` and `en*` prefix fields verbatim from the upstream KTO API.

The PhotoAward module shall declare `cpyrhtDivCd`, `regDt`, `mdfcnDt`, and `showflag` (sync only) fields as optional in the TypeScript `PhotoAwardItem` interface to accommodate response variability between `phokoAwrdList` and `phokoAwrdSyncList`.

### REQ-EVT-001 — Event-driven (이벤트 트리거)

When an MCP client invokes `kto_contest_phokoAwrdList` with valid `numOfRows` / `pageNo` parameters, the system shall route the request through `KtoHttpClient` to `PhokoAwrdService/phokoAwrdList` and return the normalized envelope containing `PhotoAwardItem[]` with both Korean and English fields.

When an MCP client invokes `kto_contest_phokoAwrdSyncList` with valid pagination plus optional `showflag` and `syncModTime` parameters, the system shall route the request through `KtoHttpClient` to `PhokoAwrdService/phokoAwrdSyncList` and return the normalized envelope including the `showflag` field on each item.

When the upstream KTO gateway returns a `resultCode` other than `00` (e.g., `10` for invalid parameter), the system shall surface the gateway error code and message in the MCP tool response without throwing.

### REQ-STATE-001 — State-driven (상태 조건)

While the upstream `PhokoAwrdService` HTTP response status is in the 5xx range, the system shall apply the existing `RETRY_CONFIG` (max 3 retries, exponential backoff with 200ms base) before failing the request.

While the upstream gateway error code is one of the permanent error codes (`22`, `30`, `31`, `32` per `PERMANENT_ERROR_CODES`), the system shall not retry and shall propagate the error to the MCP client immediately.

### REQ-OPT-001 — Optional (확장 가능 — 본 SPEC의 1줄 추가가 마지막)

Where the `BASE_URL_MAP` constant in `src/kto/common/constants.ts` enumerates KTO service-name to base-URL mappings, the system shall add the entry `PhokoAwrdService: 'http://apis.data.go.kr/B551011/PhokoAwrdService'` as the **10th and final** mapping introduced through SPEC-KTO-001 to SPEC-KTO-010 series.

Where the `BASE_URL_MAP` `@MX:NOTE` comment documents the KTO multilingual patterns, the comment shall be updated to enumerate **all 7 patterns** (V2 다중 path / V2 sibling / V1 단독 / no-suffix / langCode / langDivCd + fluid / 응답 필드 prefix `ko*` / `en*`) and note that the pattern catalogue is now complete.

### REQ-UNW-001 — Unwanted (금지 사항)

The `PaPhokoAwrdListDto` and `PaPhokoAwrdSyncListDto` classes shall not include any of the following fields: `langCode`, `langDivCd`, `lang`, or any other language-selection parameter. The KTO upstream API rejects such parameters with `INVALID_REQUEST_PARAMETER_ERROR` (`resultCode=10`); enforcing absence at the DTO boundary prevents avoidable round-trips.

If a client supplies `numOfRows` ≤ 0, the system shall reject the request before dispatching the upstream HTTP call.

The PhotoAward module shall not auto-merge `ko*` / `en*` paired fields into a unified locale-selected representation; both prefixed values shall be exposed verbatim so the consuming LLM client decides language at consumption time.

The PhotoAward module shall not download, cache, or rewrite the `orgImage` / `thumbImage` URLs; only the original CDN URLs are surfaced to MCP clients.

The PhotoAward module shall not anonymize or transform `koCmanNm` / `enCmanNm` (작가명) values, since the upstream KTO API already publishes them as public award records.

## 3. Affected Files

신규 작성:

- `src/kto/photo-award/photo-award.module.ts` — NestJS 모듈 정의
- `src/kto/photo-award/photo-award.service.ts` — 2개 비즈니스 메서드
- `src/kto/photo-award/photo-award.tools.ts` — `kto_contest_*` 도구 2개 등록
- `src/kto/photo-award/types.ts` — `PhotoAwardItem` 인터페이스
- `src/kto/photo-award/dto/phoko-awrd-list.dto.ts` — `PaPhokoAwrdListDto`
- `src/kto/photo-award/dto/phoko-awrd-sync-list.dto.ts` — `PaPhokoAwrdSyncListDto`
- `src/kto/photo-award/dto/index.ts` — DTO barrel export
- `src/kto/photo-award/photo-award.service.spec.ts`
- `src/kto/photo-award/photo-award.tools.spec.ts`

수정:

- `src/kto/common/constants.ts` — `BASE_URL_MAP`에 `PhokoAwrdService` 1줄 추가, `@MX:NOTE` 갱신, `@MX:SPEC` 누적 갱신
- `src/main.ts` — 10번째이자 마지막 registry로 `PHOTO_AWARD_TOOLS` 등록
- `src/app.module.ts` — `PhotoAwardModule` import
- `test/kto.e2e-spec.ts` — 도구 카운트 63 → 65 검증

## 4. Exclusions (What NOT to Build)

본 SPEC은 다음 항목을 **명시적으로 스코프 밖**으로 둔다:

1. **`ldongCode` operation 미노출** — KorService2/`ldongCode2`(SPEC-KTO-001)와 응답 스키마/의미가 동일하므로 중복 노출하지 않는다 (R1 dedup).
2. **사진 이미지 다운로드/캐시** — `orgImage` / `thumbImage` URL만 노출한다. 외부 클라이언트가 다운로드/CDN 캐시/리사이즈를 처리한다.
3. **`ko*` / `en*` 응답 필드 자동 머지** — 두 prefix를 그대로 노출하며, LLM 클라이언트가 호출 시점에 어느 언어를 사용할지 결정한다.
4. **수상자 개인정보 익명화 (`koCmanNm` / `enCmanNm`)** — KTO 공공 API에 이미 공개 수상자 정보로 게재된 데이터이므로 그대로 전달한다.
5. **DTO 레벨 언어 파라미터 (`langCode` / `langDivCd` / `lang`) 추가** — KTO 업스트림이 거부 (`resultCode=10`)하므로 DTO에 포함시키지 않는다.

## 5. Success Criteria 요약

- 신규 2개 도구 (`kto_contest_phokoAwrdList`, `kto_contest_phokoAwrdSyncList`)가 MCP `tools/list` 응답에 등장
- 누적 도구 카운트 65개 (이전 63 + 2)
- 기존 SPEC-KTO-001~009의 63개 도구 회귀 0건
- `BASE_URL_MAP` `@MX:NOTE`에 7번째 패턴이 명시되고 7-patterns 분류 완성 명시
- 테스트 커버리지 ≥ 85%

## 6. 참조

- research.md — API 개요, 7가지 다국어 패턴 통합 정리, ID 체계 비교
- plan.md — Phase 분해, 기술 결정, 위험 평가
- acceptance.md — Given/When/Then 검수 시나리오
