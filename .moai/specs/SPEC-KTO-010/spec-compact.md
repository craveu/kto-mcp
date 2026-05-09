# SPEC-KTO-010 (Compact) — PhokoAwrdService MCP 통합

**Status**: draft | **Priority**: high | **Created**: 2026-05-09 | **Author**: Seonho Kim | **Milestone**: KTO 시리즈 10/10 (FINAL)

## REQ 요약 (5 EARS 모듈)

- **REQ-KTO10-001 (Ubiquitous)**: `KtoHttpClient` / `BASE_URL_MAP` / `response-normalizer` / `tool-registry` 재사용. `PhotoAwardItem` 타입으로 `ko*` / `en*` 양 prefix 그대로 노출. `cpyrhtDivCd`, `regDt`, `mdfcnDt`, `showflag`는 옵셔널.
- **REQ-EVT-001 (Event-driven)**: `kto_contest_phokoAwrdList` / `kto_contest_phokoAwrdSyncList` MCP 호출 → `PhokoAwrdService/<op>` 라우팅 → 정규화 envelope 반환. 게이트웨이 에러는 throw 없이 응답에 노출.
- **REQ-STATE-001 (State-driven)**: 5xx → `RETRY_CONFIG` (max 3, exp backoff 200ms base) 적용. 영구 에러 코드(22/30/31/32) → 즉시 propagate.
- **REQ-OPT-001 (Optional)**: `BASE_URL_MAP`에 `PhokoAwrdService` 1줄 추가 (10번째이자 마지막). `@MX:NOTE` 갱신으로 7-패턴 분류 완성 명시.
- **REQ-UNW-001 (Unwanted)**: DTO에 `langCode` / `langDivCd` / `lang` 일체 금지. `numOfRows ≤ 0` 사전 차단. `ko*`/`en*` 자동 머지 금지. 이미지 다운로드/캐시 금지. 작가명 익명화 금지.

## Acceptance Criteria (Given/When/Then 10건 요약)

1. BASE_URL_MAP refactor 후 기존 63 도구 회귀 0건
2. `tools/list` 카운트 63 → 65
3. `phokoAwrdList`: totalCount=95, `koTitle`+`enTitle` 동시 노출, `contentId` 6자리 base62-like
4. `phokoAwrdSyncList`: totalCount=96, 모든 항목에 `showflag` 포함
5. `langCode`/`langDivCd` 전달 시 TS 컴파일 에러 + 우회 시 KTO `resultCode=10` 응답 노출
6. SPEC-KTO-001~009 e2e 회귀 0건
7. 5xx 재시도 동작, 영구 에러 비재시도
8. `numOfRows ≤ 0` 사전 거부
9. `kto_contest_ldongCode` 도구 부재 (KorService2/`ldongCode2`로 대체 안내)
10. **마일스톤**: KTO 통합 10/10 완성, 7-패턴 분류 완성, 누적 도구 65개

## Files to Modify

신규:

- `src/kto/photo-award/photo-award.module.ts`
- `src/kto/photo-award/photo-award.service.ts`
- `src/kto/photo-award/photo-award.tools.ts`
- `src/kto/photo-award/types.ts` (`PhotoAwardItem`)
- `src/kto/photo-award/dto/phoko-awrd-list.dto.ts` (`PaPhokoAwrdListDto`)
- `src/kto/photo-award/dto/phoko-awrd-sync-list.dto.ts` (`PaPhokoAwrdSyncListDto`)
- `src/kto/photo-award/dto/index.ts`
- `src/kto/photo-award/photo-award.service.spec.ts`
- `src/kto/photo-award/photo-award.tools.spec.ts`

수정:

- `src/kto/common/constants.ts` (`BASE_URL_MAP` 1줄 추가, `@MX:NOTE` 7-패턴 갱신, `@MX:SPEC` 누적)
- `src/main.ts` (10번째 registry: `PHOTO_AWARD_TOOLS`)
- `src/app.module.ts` (`PhotoAwardModule` import)
- `test/kto.e2e-spec.ts` (도구 카운트 63 → 65)

## Exclusions (스코프 밖)

1. `ldongCode` operation 미노출 — KorService2/`ldongCode2`와 중복 (R1 dedup)
2. 사진 이미지 다운로드/캐시 — URL passthrough만 수행
3. `ko*`/`en*` 응답 필드 자동 머지 금지 — 클라이언트가 호출 시점에 선택
4. 작가명(`koCmanNm`/`enCmanNm`) 익명화 금지 — 이미 KTO 공공 데이터로 공개됨
5. DTO에 언어 파라미터 (`langCode`/`langDivCd`/`lang`) 일체 미포함 — KTO 거부 (`resultCode=10`)

## Design Decisions Lock

| Key | Value |
|-----|------|
| BASE_URL_MAP 키 | `PhokoAwrdService` |
| Tool prefix | `kto_contest_` |
| Module path | `src/kto/photo-award/` |
| DTO prefix | `Pa` |
| Item interface | `PhotoAwardItem` |
| Operations | 2개 (List, SyncList) — `ldongCode` SKIP |
| Language param | NONE (DTO 금지) |

## 7번째 다국어 패턴 (NEW)

응답 필드 prefix 방식 — 단일 호출에 `koTitle`/`enTitle`/`koFilmst`/`enFilmst`/`koCmanNm`/`enCmanNm`/`koWnprzDiz`/`enWnprzDiz`/`koKeyWord`/`enKeyWord` 등 양 언어 동시 포함. 클라이언트 책임 모델로, 호출 시점에 어느 prefix를 읽을지 결정. 라운드트립 1회로 다언어 데이터 확보 — LLM 도구 호출 효율 측면에서 KTO 7개 패턴 중 가장 정제된 디자인.
