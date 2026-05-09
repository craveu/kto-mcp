# SPEC-KTO-010 Plan: PhokoAwrdService 통합 실행 계획

## 0. 설계 결정 잠금

| 항목 | 결정값 | 근거 |
|------|------|----|
| `BASE_URL_MAP` 키 | `PhokoAwrdService` | KTO 공식 약어 ("Phoko Award") 보존, V/숫자 suffix 없음 |
| Module path | `src/kto/photo-award/` | 다른 KTO 모듈(go-camping, photo-gallery, pet-tour)과 동일 컨벤션 |
| Tool prefix | `kto_contest_` | "관광공모전" 의미 명확화, LLM 친화적 |
| Tool name format | `kto_contest_<exactOpName>` | `kto_contest_phokoAwrdList`, `kto_contest_phokoAwrdSyncList` |
| DTO 클래스 prefix | `Pa` | PhotoAward 약어, 다른 모듈(`Gc`, `Pg`, `Md`)과 일관 |
| TS Item interface | `PhotoAwardItem` | 도메인 명확성 우선, 약어 미사용 |
| Operations 노출 | 2개 (`phokoAwrdList`, `phokoAwrdSyncList`) | `ldongCode`는 KorService2/`ldongCode2`와 중복 → SKIP |
| 언어 파라미터 | DTO에 일체 미포함 | KTO가 거부 (`resultCode=10`) |
| 응답 노출 방식 | `ko*` / `en*` prefix 그대로 노출 | 자동 머지 금지, 클라이언트가 선택 |

## 1. Phase 분해

### Phase 1: BASE_URL_MAP 1줄 추가 (10번째이자 마지막)

수정 파일: `src/kto/common/constants.ts`

작업:

- `BASE_URL_MAP` 객체에 `PhokoAwrdService: 'http://apis.data.go.kr/B551011/PhokoAwrdService'` 추가
- `@MX:NOTE` 주석을 갱신하여 KTO 다국어 처리 7가지 패턴을 모두 명시 (1: V2 다중 path × 9, 2: V2 sibling 단독, 3: V1 단독, 4: no-suffix, 5: langCode 파라미터, 6: langDivCd + lang fluid, **7: 응답 필드 prefix `ko*` / `en*`** — NEW)
- `@MX:NOTE` 마지막 라인에 "KTO 통합 시리즈 SPEC-KTO-001~010 완료, 패턴 분류 체계 완성" 주석 추가
- `@MX:SPEC` 라인에 `SPEC-KTO-010 REQ-OPT-001` 누적 추가 (총 10개 SPEC 누적)

### Phase 2: types.ts + 2 DTO 작성

신규 파일: `src/kto/photo-award/types.ts`

작업:

- `PhotoAwardItem` 인터페이스 정의 — 검증된 필드 schema
- 모든 `ko*` / `en*` 페어를 옵셔널 `string`으로 선언 (response variability 흡수)
- `showflag`는 sync 응답 전용이므로 옵셔널
- `cpyrhtDivCd`, `regDt`, `mdfcnDt`도 옵셔널
- index signature `[key: string]: string | undefined` 추가하여 KTO가 추후 prefix 페어를 추가할 경우 안전 — R1 완화

신규 파일: `src/kto/photo-award/dto/phoko-awrd-list.dto.ts`

작업:

- `PaPhokoAwrdListDto` 클래스 — 옵셔널 `numOfRows`, `pageNo`만 정의
- `class-validator` 데코레이터: `@IsOptional() @IsInt() @Min(1)` 적용
- **`langCode` / `langDivCd` / `lang` 필드 일체 미포함** — REQ-UNW-001 enforce

신규 파일: `src/kto/photo-award/dto/phoko-awrd-sync-list.dto.ts`

작업:

- `PaPhokoAwrdSyncListDto` 클래스 — 옵셔널 `numOfRows`, `pageNo`, `showflag`, `syncModTime`
- `showflag`은 `'0' | '1'` 문자열 enum, `syncModTime`은 `YYYYMMDDHHmmss` 형식 문자열
- 동일하게 언어 파라미터 미포함

신규 파일: `src/kto/photo-award/dto/index.ts`

작업: barrel export.

### Phase 3: PhotoAwardService + tools.ts 작성

신규 파일: `src/kto/photo-award/photo-award.service.ts`

작업:

- `PhotoAwardService` 클래스에 2개 메서드 (`phokoAwrdList`, `phokoAwrdSyncList`)
- 각 메서드는 `KtoHttpClient.request('PhokoAwrdService', '<opName>', dto)` 호출 후 `response-normalizer`로 envelope 정규화
- `PhotoAwardItem[]` 형태로 결과 반환

신규 파일: `src/kto/photo-award/photo-award.tools.ts`

작업:

- `PHOTO_AWARD_TOOLS: ToolRegistry[]` 선언 (2개 도구)
- 각 도구 inputSchema: `numOfRows`, `pageNo` 등 옵셔널, **language 파라미터 없음**
- 각 도구 `description` 한국어 + 영어로 명시: "응답에 `koTitle` / `enTitle` 등 한국어/영어 필드가 동시에 포함됨. 클라이언트가 호출 시점에 어느 언어를 사용할지 선택"

### Phase 4: Module 배선 + 10번째 registry 등록

신규 파일: `src/kto/photo-award/photo-award.module.ts`

작업: `PhotoAwardService` provider, `KtoHttpClientModule` import.

수정 파일: `src/app.module.ts`

작업: `PhotoAwardModule` imports 배열에 추가.

수정 파일: `src/main.ts`

작업: `PHOTO_AWARD_TOOLS`를 import하여 기존 9개 registry 배열에 10번째이자 마지막 항목으로 추가. 등록 순서는 도메인 순(이전 9개 다음).

### Phase 5: 테스트 작성

신규 파일: `src/kto/photo-award/photo-award.service.spec.ts`

작업:

- `phokoAwrdList`: 정상 응답에서 `PhotoAwardItem[]` 반환 검증, `koTitle`+`enTitle` 동시 존재 검증
- `phokoAwrdSyncList`: `showflag` 필드 포함 검증
- `numOfRows ≤ 0` 거부 검증 (REQ-UNW-001)
- 5xx 재시도 검증
- 영구 에러 코드 (22/30/31/32) 비재시도 검증

신규 파일: `src/kto/photo-award/photo-award.tools.spec.ts`

작업: 도구 등록 카운트 = 2, 도구명 정확성, inputSchema에 language 파라미터 부재 검증.

수정 파일: `test/kto.e2e-spec.ts`

작업: `tools/list` 응답 카운트 63 → 65 갱신, 도구명 화이트리스트에 신규 2개 추가.

## 2. 기술 결정

- **100% 인프라 재사용**: 신규 추상화 0건. `KtoHttpClient`, `BASE_URL_MAP`, `response-normalizer`, `tool-registry` 모두 그대로 사용.
- **DTO 레벨 언어 파라미터 금지**: KTO 게이트웨이가 거부하므로 타입 시스템에서 사전 차단.
- **응답 자동 머지 금지**: `ko*` / `en*` 양 prefix를 그대로 노출. LLM 친화적 도구 description으로 의도 명시.
- **이미지 URL passthrough**: 다운로드/캐시/리사이즈 미수행. 단일 책임 원칙.
- **registry 등록 순서**: 도메인 도입 순(KorService2 → ... → MdclTursm → WellnessTursm → PhotoAward), 가독성 우선.

## 3. 위험 평가

| ID | 설명 | 발생 가능성 | 영향도 | 완화 |
|----|---|--------|------|----|
| R1 | KTO가 응답 필드명에서 `ko*` / `en*` prefix를 일관되게 사용하지 않을 수 있음 (예: `filmDay`는 prefix 없음, 새 필드 추가 시 prefix 형식 변경 가능) | 중 | 저 | `PhotoAwardItem`에 `[key: string]: string \| undefined` index signature를 추가하여 미선언 필드도 안전하게 통과. 코어 필드(koTitle, enTitle 등)는 명시적 옵셔널. |
| R2 | `showflag`가 `phokoAwrdList`에 부재, `phokoAwrdSyncList`에만 존재 | 확정 | 저 | `PhotoAwardItem.showflag`을 옵셔널 선언. `phokoAwrdSyncList` 응답 검증 시 존재 가정 가능 (테스트 분리). |
| R3 | KTO 응답에서 `koCmanNm` 와 `enCmanNm` 가 동일 한글 값으로 반환되는 경우 (작가가 영문명 미제공) | 확정 | 저 | 계약상 정상 — 양 prefix 그대로 통과. 자동 머지 금지 원칙에 부합. |
| R4 | `ldongCode` operation을 SKIP한다는 결정이 추후 사용자 요청으로 번복될 수 있음 | 저 | 저 | research.md / spec.md / plan.md에 SKIP 사유 명시. 별도 SPEC으로 추후 처리 가능. |

## 4. MX Tag Plan

| 대상 | 태그 | 메시지 |
|----|----|------|
| `BASE_URL_MAP` (`src/kto/common/constants.ts`) | `@MX:NOTE` 갱신 | KTO 다국어 7가지 패턴 모두 명시, "KTO-001~010 완료, 패턴 분류 체계 완성" 명시 |
| `BASE_URL_MAP` | `@MX:SPEC` append | `SPEC-KTO-010 REQ-OPT-001` 추가 (총 10개 SPEC 누적) |
| `src/kto/photo-award/types.ts` | `@MX:NOTE` 신규 | dual-language 응답 패턴(7번째) 설명, contentId 6자리 base62-like 별도 ID 체계 명시 |
| `PhotoAwardService.phokoAwrdList` | `@MX:TODO test` (구현 전) → 제거 (테스트 작성 후) | 테스트 작성 완료 시 제거 |
| `PhotoAwardService.phokoAwrdSyncList` | `@MX:TODO test` (구현 전) → 제거 | 테스트 작성 완료 시 제거 |

신규 `@MX:WARN` 또는 `@MX:ANCHOR`는 추가하지 않는다 (fan_in 3 미만, 위험 구조 없음).

## 5. 우선순위

| Phase | 우선순위 | 의존성 |
|-------|------|------|
| Phase 1 (BASE_URL_MAP) | High | 없음 |
| Phase 2 (types + DTO) | High | Phase 1 |
| Phase 3 (Service + tools) | High | Phase 2 |
| Phase 4 (Module 배선) | High | Phase 3 |
| Phase 5 (테스트) | High | Phase 3, Phase 4 |

모든 Phase는 동일 SPEC 내에서 순차적으로 완료한다.
