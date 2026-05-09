# kto-mcp

한국관광공사(KTO)의 공공 데이터 10개 API를 LLM 에이전트가 자연어로 조회할 수 있도록 통합한 MCP(Model Context Protocol) 서버입니다.

**현황 (10/10 완성)**: 65개 MCP 도구 노출, 7가지 KTO 다국어 처리 패턴 완벽 흡수, 693 unit + 30 e2e 테스트 통과, 89% 커버리지.

## 요구사항

- **Node.js**: 22.x 이상
- **pnpm**: 10.x 이상

## 빠른 시작

```bash
# 의존성 설치
pnpm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일을 열어 KTO_SERVICE_KEY 값 입력
# (발급: https://www.data.go.kr/data/15101578/openapi.do에서 신청)

# 빌드
pnpm run build

# 실행 (stdio 모드)
MCP_TRANSPORT_MODE=stdio node dist/main.js
```

## 환경변수

| 이름 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `KTO_SERVICE_KEY` | ✅ | — | 한국관광공사 data.go.kr 서비스 키 |
| `KTO_SERVICE_KEY_PREENCODED` | ❌ | `false` | 서비스 키가 URL 인코딩된 상태일 경우 `true` |
| `MCP_TRANSPORT_MODE` | ❌ | `stdio` | 전송 모드: `stdio` ⎮ `http-streamable` ⎮ `http-json` |
| `MCP_HTTP_PORT` | ❌ | `3000` | HTTP 모드 실행 시 포트 번호 |

## MCP 전송 모드 비교

| 모드 | 설명 | 사용 사례 |
|------|------|---------|
| **stdio** | 표준 입출력 기반 (JSON-RPC) | Claude Desktop, 로컬 개발, 직렬 통신 |
| **http-streamable** | HTTP SSE (Server-Sent Events) 스트리밍 | 원격 서버, 점진적 응답, 다중 클라이언트 |
| **http-json** | HTTP POST 요청-응답 (일반 JSON) | 게이트웨이, 프록시, REST 클라이언트 호환성 필요 시 |

### Claude Desktop 설정 예시

`.env` 파일에서 `KTO_SERVICE_KEY`를 설정한 후, Claude Desktop 설정 파일(`claude_desktop_config.json`)을 다음과 같이 수정합니다:

**macOS/Linux**:
```json
{
  "mcpServers": {
    "kto-mcp": {
      "command": "node",
      "args": ["/절대경로/kto-mcp/dist/main.js"],
      "env": {
        "KTO_SERVICE_KEY": "your-service-key-here",
        "MCP_TRANSPORT_MODE": "stdio"
      }
    }
  }
}
```

**Windows**:
```json
{
  "mcpServers": {
    "kto-mcp": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\path\\to\\kto-mcp\\dist\\main.js"],
      "env": {
        "KTO_SERVICE_KEY": "your-service-key-here",
        "MCP_TRANSPORT_MODE": "stdio"
      }
    }
  }
}
```

## 노출되는 65개 MCP 도구 카탈로그

10개 API 통합, prefix별 도구 분류:

### kto_korean_* (15개) — 국문 관광정보 조회 (SPEC-KTO-001, KorService2)
- kto_korean_areaBasedList2 — 지역기반 관광정보 목록 조회
- kto_korean_areaBasedSyncList2 — 지역기반 관광정보 동기화 목록
- kto_korean_areaCode2 — 지역 코드 조회
- kto_korean_categoryCode2 — 분류 코드 조회
- kto_korean_detailCommon2 — 공통 상세정보 조회
- kto_korean_detailImage2 — 이미지 정보 조회
- kto_korean_detailInfo2 — 반복 상세정보 조회
- kto_korean_detailIntro2 — 소개정보 조회
- kto_korean_detailPetTour2 — 반려동물 동반 정보
- kto_korean_ldongCode2 — 법정동 코드 조회
- kto_korean_lclsSystmCode2 — 분류체계 코드 조회
- kto_korean_locationBasedList2 — 위치기반 목록 조회
- kto_korean_searchFestival2 — 행사정보 검색
- kto_korean_searchKeyword2 — 키워드 검색
- kto_korean_searchStay2 — 숙박정보 검색

### kto_barrier_free_* (10개) — 무장애 여행정보 (SPEC-KTO-002, KorWithService2)
- kto_barrier_free_areaBasedList2 — 지역기반 무장애 관광정보 목록
- kto_barrier_free_locationBasedList2 — 위치기반 무장애 관광정보 목록
- kto_barrier_free_searchKeyword2 — 키워드로 무장애 관광정보 검색
- kto_barrier_free_searchFestival2 — 무장애 행사정보 검색
- kto_barrier_free_searchStay2 — 무장애 숙박정보 검색
- kto_barrier_free_detailCommon2 — 무장애 공통 상세정보
- kto_barrier_free_detailIntro2 — 무장애 소개정보
- kto_barrier_free_detailInfo2 — 무장애 반복 상세정보
- kto_barrier_free_detailImage2 — 무장애 이미지 정보
- kto_barrier_free_detailWithTour2 — 무장애 특화 상세정보 (KorWithService2 고유)

### kto_photo_* (4개) — 관광사진 정보 (SPEC-KTO-003, PhotoGalleryService1)
- kto_photo_galleryList1 — 관광사진 갤러리 목록
- kto_photo_galleryDetailList1 — 갤러리 제목 검색
- kto_photo_gallerySearchList1 — 키워드로 관광사진 검색
- kto_photo_gallerySyncDetailList1 — 관광사진 동기화 목록

### kto_camping_* (5개) — 고캠핑 정보 (SPEC-KTO-004, GoCamping)
- kto_camping_basedList — 캠핑장 기본 목록
- kto_camping_basedSyncList — 캠핑장 동기화 목록
- kto_camping_locationBasedList — 위치기반 캠핑장 목록
- kto_camping_searchList — 키워드로 캠핑장 검색
- kto_camping_imageList — 캠핑장 이미지 목록

### kto_audio_* (8개) — 오디오 가이드 정보 (SPEC-KTO-005, Odii)
- kto_audio_storyBasedList — Story 기본 목록
- kto_audio_storyBasedSyncList — Story 동기화 목록
- kto_audio_storyLocationBasedList — 위치기반 Story 목록
- kto_audio_storySearchList — Story 키워드 검색
- kto_audio_themeBasedList — Theme 기본 목록
- kto_audio_themeBasedSyncList — Theme 동기화 목록
- kto_audio_themeLocationBasedList — 위치기반 Theme 목록
- kto_audio_themeSearchList — Theme 키워드 검색

### kto_durunubi_* (2개) — 두루누비 (코리아둘레길) 정보 (SPEC-KTO-006, Durunubi)
- kto_durunubi_courseList — 코스 목록 (228 코스, GPX URL 포함)
- kto_durunubi_routeList — 상위 경로/테마 목록 (3개)

### kto_pet_* (4개) — 반려동물 동반 여행정보 (SPEC-KTO-007, KorPetTourService2)
- kto_pet_areaBasedList2 — 지역기반 반려동물 동반 관광지
- kto_pet_locationBasedList2 — 위치기반 반려동물 동반 관광지
- kto_pet_searchKeyword2 — 키워드로 반려동물 동반 관광지 검색
- kto_pet_petTourSyncList2 — 반려동물 동반 관광지 동기화 목록

### kto_medical_* (7개) — 의료관광 정보 (SPEC-KTO-008, MdclTursmService)
- kto_medical_areaBasedList — 지역기반 의료관광 목록
- kto_medical_locationBasedList — 위치기반 의료관광 목록
- kto_medical_searchKeyword — 키워드로 의료관광 검색
- kto_medical_mdclTursmSyncList — 의료관광 동기화 목록
- kto_medical_detailMdclTursm — 의료관광 전용 상세정보
- kto_medical_detailCommon — 의료관광 공통정보
- kto_medical_detailIntro — 의료관광 소개정보

### kto_wellness_* (8개) — 웰니스/스파/온천 관광정보 (SPEC-KTO-009, WellnessTursmService)
- kto_wellness_areaBasedList — 지역기반 웰니스 관광지 목록
- kto_wellness_locationBasedList — 위치기반 웰니스 관광지 목록
- kto_wellness_searchKeyword — 키워드로 웰니스 관광지 검색
- kto_wellness_wellnessTursmSyncList — 웰니스 관광지 동기화 목록
- kto_wellness_detailCommon — 웰니스 관광지 공통 상세정보
- kto_wellness_detailIntro — 웰니스 관광지 소개 상세정보
- kto_wellness_detailInfo — 웰니스 관광지 반복 상세정보
- kto_wellness_detailImage — 웰니스 관광지 이미지 목록

### kto_contest_* (2개) — 관광공모전 수상작 정보 (SPEC-KTO-010, PhokoAwrdService)
- kto_contest_phokoAwrdList — 관광공모전 수상작 사진 목록 (한/영 동시)
- kto_contest_phokoAwrdSyncList — 관광공모전 수상작 동기화 목록

## KTO API 7가지 다국어 처리 패턴

| # | 패턴 명칭 | 예시 | SPECs | 설명 |
|---|---------|------|-------|------|
| 1 | V2 별도 path 다국어 변체 | KorService2/EngService2/JpnService2 등 9개 | KTO-001 | 서비스명 + 국가코드 suffix + V2 |
| 2 | V2 sibling 단독 | KorWithService2, KorPetTourService2 | KTO-002, 007 | V2 version이지만 다국어 변체 없음 |
| 3 | V1 단독 | PhotoGalleryService1 | KTO-003 | V1 version, 다국어 변체 미보유 |
| 4 | suffix 없음 평면형 | GoCamping, Durunubi | KTO-004, 006 | 버전/언어 suffix 모두 없음 |
| 5 | langCode 파라미터 | Odii (ko/en만 권장) | KTO-005 | 단일 path + langCode 파라미터 |
| 6 | langDivCd 파라미터 + lang fluid | MdclTursmService, WellnessTursmService | KTO-008, 009 | 단일 path + langDivCd + 응답 유연 |
| 7 | 응답 필드 prefix (ko*/en*) | PhokoAwrdService | KTO-010 | 한/영 필드를 동시 응답 |

## 개발 및 테스트

### 명령어

```bash
# 개발 (파일 변경 감지)
pnpm run start:dev

# 프로덕션 빌드
pnpm run build

# 프로덕션 실행
node dist/main.js

# 단위 테스트 (693개)
pnpm run test

# 특정 테스트 파일 실행
pnpm jest src/app.controller.spec.ts

# e2e 테스트 (30개)
pnpm run test:e2e

# 커버리지 보고서
pnpm run test:cov

# ESLint 검사
pnpm run lint

# 코드 포맷팅 (Prettier)
pnpm run format
```

### 품질 기준

현재 구현 상태:
- **테스트**: 693 unit + 30 e2e (총 723개) — 모두 통과
- **커버리지**: 89% statements / 92% lines (목표: 85%)
- **린팅**: 0 errors / 0 warnings
- **빌드**: `nest build` 성공 → `dist/` 생성

## 프로젝트 구조

```
kto-mcp/
├── src/
│   ├── main.ts                      # Multi-transport 부트스트랩 (10 registries)
│   ├── app.module.ts                # 루트 모듈
│   ├── mcp/                         # MCP 서버 및 3종 전송 계층
│   │   ├── mcp.module.ts
│   │   ├── mcp.service.ts
│   │   ├── registry/                # MCP 도구 등록 (tool-registry)
│   │   └── transports/              # stdio, HTTP Streamable, HTTP JSON
│   ├── kto/                         # KTO API 통합 계층 (10 API modules)
│   │   ├── kto.module.ts
│   │   ├── common/                  # 공용: KtoHttpClient, BASE_URL_MAP, error, normalizer
│   │   ├── korean-tour-info/        # KTO-001 국문 관광정보 (15 도구)
│   │   ├── barrier-free-tour-info/  # KTO-002 무장애 여행정보 (10 도구)
│   │   ├── photo-gallery/           # KTO-003 관광사진 (4 도구)
│   │   ├── go-camping/              # KTO-004 고캠핑 (5 도구)
│   │   ├── audio-guide/             # KTO-005 오디오 가이드 (8 도구)
│   │   ├── durunubi/                # KTO-006 두루누비 (2 도구)
│   │   ├── pet-tour/                # KTO-007 반려동물 동반 (4 도구)
│   │   ├── medical-tourism/         # KTO-008 의료관광 (7 도구)
│   │   ├── wellness-tourism/        # KTO-009 웰니스관광 (8 도구)
│   │   └── photo-award/             # KTO-010 관광공모전 (2 도구)
│   └── env.ts                       # 환경변수 로더
├── test/
│   ├── app.e2e-spec.ts              # 헬스체크 e2e
│   ├── kto.e2e-spec.ts              # KTO API e2e
│   └── jest-e2e.json
├── dist/                            # 컴파일 산출물 (빌드 후)
├── .env.example                     # 환경변수 템플릿
├── package.json
├── tsconfig.json
├── nest-cli.json
├── jest.config.js
├── .eslintrc.js
├── prettier.config.js
└── README.md
```

## 기술 스택

- **프레임워크**: NestJS 11 (모듈식 아키텍처, IoC)
- **언어**: TypeScript 5.7 (strict mode, nodenext)
- **테스트**: Jest (단위 + e2e)
- **HTTP 클라이언트**: Axios (재시도, 타임아웃 관리)
- **검증**: class-validator + class-transformer
- **XML 파싱**: fast-xml-parser
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.0

## SPEC 및 문서

10개 SPEC 문서 모두 완료 (1.0.0 또는 0.2.0):

- **SPEC-KTO-001**: 국문 관광정보 조회 (KorService2) — v1.0.0 completed
- **SPEC-KTO-002**: 무장애 여행정보 (KorWithService2) — v1.0.0 completed
- **SPEC-KTO-003**: 관광사진 정보 (PhotoGalleryService1) — v1.0.0 completed
- **SPEC-KTO-004**: 고캠핑 정보 (GoCamping) — v1.0.0 completed
- **SPEC-KTO-005**: 오디오 가이드 (Odii) — v1.0.0 completed
- **SPEC-KTO-006**: 두루누비 (Durunubi) — v1.0.0 completed
- **SPEC-KTO-007**: 반려동물 동반 여행 (KorPetTourService2) — v1.0.0 completed
- **SPEC-KTO-008**: 의료관광 (MdclTursmService) — v1.0.0 completed
- **SPEC-KTO-009**: 웰니스관광 (WellnessTursmService) — v1.0.0 completed
- **SPEC-KTO-010**: 관광공모전 (PhokoAwrdService) — v1.0.0 completed

상세 문서: `.moai/specs/SPEC-KTO-*/spec.md`

## 데이터 출처 및 라이선스

- **데이터 출처**: 한국관광공사가 data.go.kr을 통해 공개한 10개 공공 API
- **API 신청**: 각 API별로 별도 활용 신청 필요 (대부분 `KTO_SERVICE_KEY` 단일 키로 접근 가능)
- **응답 이미지**: visitkorea.or.kr CDN 호스팅. 다운로드 및 2차 이용은 KTO 정책 준수

## 라이선스

UNLICENSED
