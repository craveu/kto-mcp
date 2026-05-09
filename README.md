# kto-mcp

한국관광공사(KTO)의 공공 데이터 API를 쉽게 사용하기 위한 MCP(Model Context Protocol) 서버입니다.

**현황 (1차 이터레이션 완료)**: KorService2 국문 관광정보 조회 API 15개 오퍼레이션을 표준 MCP 도구로 노출합니다. 다음 이터레이션에서 9개 추가 KTO API + 8개 다국어 변체(영, 일, 중 등)가 추가될 예정입니다.

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

# 실행
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

## 노출되는 MCP 도구 (15개)

**Legend**: 이름(Name) → 한국어 설명(Description) → 기본 KorService2 오퍼레이션 매핑

| MCP 도구명 | 설명 | KorService2 오퍼레이션 |
|-----------|------|----------------------|
| `kto_korean_areaBasedList2` | 지역 기반 관광지 목록 조회 | areaBasedList2 |
| `kto_korean_areaBasedSyncList2` | 지역 기반 관광지 동기화 목록 | areaBasedSyncList2 |
| `kto_korean_areaCode2` | 지역 코드 조회 | areaCode2 |
| `kto_korean_categoryCode2` | 관광지 카테고리 코드 조회 | categoryCode2 |
| `kto_korean_detailCommon2` | 관광지 상세 정보 (공통) | detailCommon2 |
| `kto_korean_detailImage2` | 관광지 이미지 정보 조회 | detailImage2 |
| `kto_korean_detailInfo2` | 관광지 상세 정보 조회 | detailInfo2 |
| `kto_korean_detailIntro2` | 관광지 소개 정보 조회 | detailIntro2 |
| `kto_korean_detailPetTour2` | 반려동물 동반 관광정보 | detailPetTour2 |
| `kto_korean_ldongCode2` | 법정동 코드 조회 | ldongCode2 |
| `kto_korean_lclsSystmCode2` | 시스템 분류 코드 조회 | lclsSystmCode2 |
| `kto_korean_locationBasedList2` | 좌표 기반 관광지 목록 | locationBasedList2 |
| `kto_korean_searchFestival2` | 축제 검색 | searchFestival2 |
| `kto_korean_searchKeyword2` | 키워드 기반 관광지 검색 | searchKeyword2 |
| `kto_korean_searchStay2` | 숙박시설 검색 | searchStay2 |

### 도구 파라미터 확인

각 도구의 입력 파라미터는 Claude 내 `tools/list` 요청으로 확인할 수 있습니다. 예를 들어 `kto_korean_searchKeyword2`의 스키마:

```json
{
  "keyword": { "type": "string", "description": "검색 키워드 (필수)" },
  "pageNo": { "type": "number", "description": "페이지 번호 (기본값: 1)" },
  "numOfRows": { "type": "number", "description": "한 페이지 항목 수 (기본값: 10, 최대: 100)" }
}
```

## 개발 및 테스트

### 명령어

```bash
# 개발 (파일 변경 감지)
pnpm run start:dev

# 프로덕션 빌드
pnpm run build

# 프로덕션 실행
node dist/main.js

# 단위 테스트
pnpm run test

# 특정 테스트 파일 실행
pnpm jest src/app.controller.spec.ts

# e2e 테스트
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
- **테스트**: 76 unit + 6 e2e (총 82개) — 모두 통과
- **커버리지**: 95.41% statements / 95.08% lines (목표: 85%)
- **린팅**: 0 errors / 0 warnings
- **빌드**: `nest build` 성공 → `dist/` 생성

## 프로젝트 구조

```
kto-mcp/
├── src/
│   ├── main.ts                      # Multi-transport 부트스트랩
│   ├── app.module.ts                # 루트 모듈
│   ├── mcp/                         # MCP 서버 및 전송 계층
│   │   ├── mcp.module.ts
│   │   ├── mcp.service.ts
│   │   ├── registry/                # MCP 도구 등록
│   │   └── transports/              # stdio, HTTP Streamable, HTTP JSON
│   ├── kto/                         # KTO API 통합 계층
│   │   ├── kto.module.ts
│   │   ├── common/                  # DTO, 에러, 유틸
│   │   │   ├── dto/
│   │   │   ├── errors/
│   │   │   └── utils/
│   │   ├── clients/                 # KTO HTTP 클라이언트
│   │   │   └── kto-http.client.ts   # 재시도, 파싱, 다국어 지원
│   │   └── korean-tour-info/        # 1차 구현 (KorService2)
│   │       ├── korean-tour-info.module.ts
│   │       ├── korean-tour-info.service.ts
│   │       └── korean-tour-info.tools.ts
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

- **SPEC 문서**: [`.moai/specs/SPEC-KTO-001/spec.md`](.moai/specs/SPEC-KTO-001/spec.md) — 1차 이터레이션 요구사항
- **계획 문서**: [`.moai/specs/SPEC-KTO-001/plan.md`](.moai/specs/SPEC-KTO-001/plan.md) — 구현 분해 및 도구 목록
- **수락 기준**: [`.moai/specs/SPEC-KTO-001/acceptance.md`](.moai/specs/SPEC-KTO-001/acceptance.md) — 검증 시나리오
- **연구 문서**: [`.moai/specs/SPEC-KTO-001/research.md`](.moai/specs/SPEC-KTO-001/research.md) — KTO API 분석
- **프로젝트 정보**: [`.moai/project/`](.moai/project/) — 제품 설명(product.md), 기술 스택(tech.md), 구조(structure.md)

## 라이선스

UNLICENSED
