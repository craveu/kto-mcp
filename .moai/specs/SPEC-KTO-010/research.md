# SPEC-KTO-010 Research: PhokoAwrdService MCP 통합

## 1. API 개요 (data.go.kr 일련번호 15145706)

`B551011/PhokoAwrdService`는 한국관광공사(KTO)가 운영하는 **관광공모전 사진 수상작 정보** 공공 API다. KTO가 매년 1회 개최하는 사진 공모전(스마트폰 부문 / DSLR 부문 등)에서 입선 이상 등급을 받은 작품의 메타데이터(제목, 촬영장소, 촬영일자, 작가명, 수상 부문, 키워드, 원본/썸네일 이미지 URL, 저작권 구분)를 제공한다.

본 SPEC은 **KTO 공공 API 통합 시리즈의 10번째이자 마지막 통합**으로, SPEC-KTO-001~009로 누적된 63개 MCP 도구 위에 2개를 추가하여 **총 65개 도구로 KTO B551011 게이트웨이 산하 전 서비스 통합을 완료**한다.

서비스 path:
- 정식 경로: `B551011/PhokoAwrdService` (V suffix 없음, KTO 공식 약어 "Phoko Award" 그대로 보존)

## 2. Operations 카탈로그 (3개 — VERIFIED via 실호출 + Swagger 2.0)

| Operation | 설명 | 노출 여부 | totalCount |
|-----------|-----|---------|----------|
| `phokoAwrdList` | 수상작 사진 목록 (현행) | 노출 | 95 |
| `phokoAwrdSyncList` | 수상작 sync 목록 (삭제/이력 1건 포함) | 노출 | 96 |
| `ldongCode` | 법정동 코드 조회 | **R1 SKIP** | — |

`ldongCode`는 SPEC-KTO-001에 통합된 `KorService2/ldongCode2`와 응답 스키마/의미가 동일하므로 중복 노출하지 않는다 (스코프 제외).

## 3. PhotoAwardItem 응답 스키마 — 7번째 다국어 패턴 (NEW)

PhokoAwrdService는 **응답 필드 prefix 방식**으로 한국어/영어 이중 언어 데이터를 단일 호출에 동시 포함시킨다. 이는 KTO API 군에서 처음 발견된 7번째 다국어 처리 패턴이다.

검증된 per-item 필드:

```json
{
  "contentId": "DVvwaI",
  "koTitle": "가야산 설경",
  "enTitle": "Snowscape of Gayasan Mountain",
  "lDongRegnCd": "48",
  "koFilmst": "경상남도 합천군, 가야산국립공원",
  "enFilmst": "Gayasan National Park, Hapcheon-gun, Gyeongsangnam-do",
  "filmDay": "202401",
  "koCmanNm": "서정철",
  "enCmanNm": "서정철",
  "koWnprzDiz": "스마트폰 부문 [입선]",
  "enWnprzDiz": "Mobile [Honorary Mention]",
  "koKeyWord": "...(콤마 구분 한국어 키워드)...",
  "enKeyWord": "...(comma-separated English keywords)...",
  "orgImage": "https://tong.visitkorea.or.kr/cms/resource_photo/56/3414456_image2_1.jpg",
  "thumbImage": "https://tong.visitkorea.or.kr/cms/resource_photo/56/3414456_image3_1.jpg",
  "cpyrhtDivCd": "Type1",
  "regDt": "20241113160022",
  "mdfcnDt": "20241205181146",
  "showflag": "1"
}
```

핵심 관찰:

- `koXxx` / `enXxx` prefix 쌍은 동일 값을 양 언어로 반환 (작가명처럼 한글 그대로인 경우 중복 가능)
- prefix 없는 필드: `contentId`, `lDongRegnCd`, `filmDay`(YYYYMM), `orgImage`, `thumbImage`, `cpyrhtDivCd`, `regDt`, `mdfcnDt`
- `showflag`는 sync 응답 전용 — 일반 List 응답에는 부재 (옵셔널 처리 필요)
- `contentId`는 6자리 base62-like 문자열로, KorService2 도메인의 numeric ID와 다른 별도 ID 체계
- 이미지 URL은 `https://tong.visitkorea.or.kr/cms/resource_photo/...` CDN으로 일관

`langCode` / `langDivCd` / 기타 언어 파라미터를 전달하면 게이트웨이가 `INVALID_REQUEST_PARAMETER_ERROR` (resultCode 10)를 반환한다 (실호출 검증).

## 4. KTO 다국어 처리 7가지 패턴 통합 정리 — 시리즈 마무리

본 SPEC-KTO-010이 PhokoAwrdService를 통합함으로써 KTO B551011 산하 전 서비스의 다국어 패턴 분류가 완료된다.

| 패턴 # | 이름 | 메커니즘 | 대표 서비스 | 도입 SPEC |
|------|-----|--------|----------|---------|
| 1 | V2 별도 path × 9 | 언어별 독립 path (KorService2 / EngService2 / JpnService2 / ChsService2 / ChtService2 / GerService2 / FreService2 / SpnService2 / RusService2) | KorService2 외 8 | KTO-001 |
| 2 | V2 sibling 단독 | 한국어 단독, 별도 path 미존재 (KorWithService2, KorPetTourService2) | KorWithService2 | KTO-002, 007 |
| 3 | V1 단독 | V2 미생산, V1 path 단독 (PhotoGalleryService1) | PhotoGalleryService1 | KTO-003 |
| 4 | no-suffix | 버전 suffix 없는 평면 path (GoCamping, Durunubi) | GoCamping | KTO-004, 006 |
| 5 | langCode 파라미터 | 단일 path, `langCode` 쿼리 파라미터로 언어 선택 (Odii) | Odii | KTO-005 |
| 6 | langDivCd + lang fluid | 단일 path, `langDivCd` 파라미터, KTO 서버가 임의 값 수용 후 server-normalized (MdclTursmService, WellnessTursmService) | MdclTursmService | KTO-008, 009 |
| 7 | **응답 필드 prefix ko*/en*** | **단일 호출에 양 언어 응답 필드 동시 포함, 언어 파라미터 자체 부재 (PhokoAwrdService)** | **PhokoAwrdService** | **KTO-010 (NEW)** |

패턴 7은 **클라이언트 책임 모델**이다. 서버는 두 언어 데이터를 한 번에 모두 보내고, 소비자(LLM/MCP 클라이언트)가 호출 시점에 어느 prefix를 읽을지 결정한다. 호출 비용 측면에서는 응답 페이로드가 약 2배가 되지만, 라운드트립 1회로 다언어 데이터를 확보하므로 LLM 도구 호출 효율 측면에서는 가장 정제된 디자인이다.

## 5. ID 체계 비교

| 도메인 | ID 형식 | 예시 |
|------|--------|-----|
| KorService2 등 (KTO-001 패턴) | 정수형 contentId (1~10자리 숫자) | `2917164` |
| GoCamping (KTO-004) | 정수형 contentId (캠핑장 ID) | `1011` |
| Odii (KTO-005) | 코스/스토리 ID (영문+숫자) | — |
| **PhokoAwrdService (KTO-010)** | **6자리 base62-like 문자열** | **`DVvwaI`** |

PhokoAwrdService의 `contentId`는 KorService2 도메인과 **호환되지 않는다**. 같은 키워드로 조회되더라도 두 도메인은 독립된 ID 공간을 사용한다. 이를 클라이언트가 혼동하지 않도록 도구 description과 `PhotoAwardItem.contentId` JSDoc에 별도 ID 체계임을 명시한다.

## 6. 페이지네이션

표준 envelope (`response.body.totalCount` / `pageNo` / `numOfRows`)이 정상 동작한다. `phokoAwrdList`는 totalCount=95, `phokoAwrdSyncList`는 totalCount=96으로 sync 쪽이 1건 많다 (삭제/이력 항목 포함; `showflag=0` 으로 표기).

## 7. 기존 인프라 재사용 매트릭스

| 컴포넌트 | 위치 | 본 SPEC 처리 |
|--------|-----|----------|
| `KtoHttpClient` | `src/kto/kto-http.client.ts` | REUSE (재사용) |
| `BASE_URL_MAP` | `src/kto/common/constants.ts` | EXTEND (1줄 추가, 마지막) |
| `response-normalizer` | `src/kto/common/response-normalizer.ts` | REUSE |
| `tool-registry` | `src/kto/common/tool-registry.ts` | REUSE (`ToolRegistry[]` 수용) |
| `main.ts` registries | `src/main.ts` | EXTEND (10번째 registry 추가) |
| `app.module.ts` | `src/app.module.ts` | EXTEND (PhotoAwardModule import) |

신규 추상화는 추가하지 않는다. 도메인 모듈만 SPEC-KTO-001~009와 동일한 구조로 신설한다.

## 8. 마일스톤: 10/10 KTO API 완성

| SPEC | 서비스 | 도구 추가 | 누적 도구 |
|------|------|--------|---------|
| KTO-001 | KorService2 외 8 (V2 다국어) | 다수 | (시작) |
| KTO-002 | KorWithService2 | — | — |
| KTO-003 | PhotoGalleryService1 | — | — |
| KTO-004 | GoCamping | — | — |
| KTO-005 | Odii | — | — |
| KTO-006 | Durunubi | — | — |
| KTO-007 | KorPetTourService2 | — | — |
| KTO-008 | MdclTursmService | — | — |
| KTO-009 | WellnessTursmService | — | 63 |
| **KTO-010** | **PhokoAwrdService** | **+2** | **65 (FINAL)** |

본 SPEC 통합 후 추가 KTO 서비스 통합 계획은 없다. 향후 KTO가 신규 서비스를 발표할 경우 별도 SPEC 시리즈로 분리한다.
