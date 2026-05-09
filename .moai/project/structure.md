# 프로젝트 구조 (Structure)

## 현재 상태

NestJS 11 신규 스캐폴드 상태. `src/app.controller`, `app.service`, `app.module`, `main.ts`만 존재.

---

## 계획된 디렉토리 구조

```
kto-mcp/
├── src/
│   ├── main.ts                           # 부트스트랩 (multi-transport 엔트리포인트)
│   │                                     # stdio, HTTP(Streamable), HTTP(non-Streamable) 초기화
│   │
│   ├── app.module.ts                     # 루트 모듈 (기존, 리팩토링)
│   │                                     # MCP, KTO 모듈 등록
│   │
│   ├── mcp/                              # MCP 서버 어댑터
│   │   ├── mcp.module.ts                 # MCP 모듈 정의
│   │   ├── mcp.service.ts                # MCP 서버 라이프사이클 관리
│   │   ├── transports/                   # 세 가지 전송 어댑터
│   │   │   ├── stdio.adapter.ts          # stdio 전송 (로컬 개발/Claude Desktop)
│   │   │   ├── http-streamable.adapter.ts # HTTP Streamable (점진적 응답)
│   │   │   └── http.adapter.ts           # HTTP non-Streamable (간단한 요청-응답)
│   │   ├── registry/                     # MCP 도구 등록 및 관리
│   │   │   └── tool-registry.service.ts  # 도구 동적 등록/해제
│   │   └── types/                        # MCP 타입 정의 (재정의/확장)
│   │       └── mcp.types.ts              # MCPTool, MCPResource 등
│   │
│   ├── kto/                              # KTO API 통합 계층
│   │   ├── kto.module.ts                 # KTO 모듈 정의
│   │   ├── kto-http.client.ts            # 공용 KTO HTTP 클라이언트
│   │   │                                 # - 서비스 키 관리, baseURL 파라미터화
│   │   │                                 # - language 파라미터 주입 가능, XML/JSON 응답 파싱
│   │   │                                 # - 지수 백오프 재시도 (3회, base 500ms)
│   │   ├── kto-http.client.spec.ts       # HTTP 클라이언트 단위 테스트
│   │   │
│   │   │
│   │   ├── common/                       # 다국어 확장 시 공유될 요소
│   │   │   ├── dto/                      # Data Transfer Objects
│   │   │   │   ├── tour-info.dto.ts      # 관광정보 응답 DTO (언어 무관)
│   │   │   │   ├── accommodation.dto.ts  # 숙박 DTO
│   │   │   │   ├── festival.dto.ts       # 축제 DTO
│   │   │   │   └── common.dto.ts         # 공용 필드/타입
│   │   │   ├── constants/                # 상수
│   │   │   │   ├── api-endpoints.ts      # API 엔드포인트 매핑
│   │   │   │   ├── error-codes.ts        # KTO API 에러 코드
│   │   │   │   └── language.constants.ts # 언어 코드 (국, 영, 일, 중 등)
│   │   │   ├── interfaces/
│   │   │   │   ├── kto-client.interface.ts  # KTOClient 인터페이스
│   │   │   │   └── kto-service.interface.ts # KTOService 인터페이스
│   │   │   ├── errors/
│   │   │   │   ├── kto.error.ts          # KTO API 예외 클래스
│   │   │   │   └── validation.error.ts
│   │   │   └── utils/
│   │   │       ├── xml-parser.util.ts    # XML 응답 파싱 유틸
│   │   │       └── response-mapper.util.ts # API 응답 → DTO 매핑
│   │   │
│   │   └── korean-tour-info/             # 1차 구현 대상 (API ID: 15101578)
│   │       ├── korean-tour-info.module.ts
│   │       ├── korean-tour-info.service.ts  # 비즈니스 로직
│   │       │                             # - 관광지, 숙박, 음식점, 축제 조회
│   │       │                             # - 상세 정보 조회
│   │       │                             # - 검색/필터링
│   │       ├── korean-tour-info.service.spec.ts
│   │       ├── korean-tour-info.tools.ts # MCP 도구 정의
│   │       │                             # - searchTouristAttractions()
│   │       │                             # - getAccommodations()
│   │       │                             # - searchRestaurants()
│   │       │                             # - searchFestivals()
│   │       │                             # - getDetailedInfo()
│   │       │                             # (Swagger 기준 모든 오퍼레이션)
│   │       ├── dto/
│   │       │   └── korean-tour-info.dto.ts # API 응답 타입 (한국어 필드명 포함)
│   │       └── korean-tour-info.controller.ts # (선택) 개발/테스트 REST 엔드포인트
│   │
│   ├── app.controller.ts                 # (기존) 헬스체크 엔드포인트만 유지
│   ├── app.service.ts                    # (기존, 최소화)
│   └── env.ts                            # 환경변수 로더 및 타입 안전성
│
├── test/                                 # e2e 테스트 (기존 Jest 설정)
│   ├── app.e2e-spec.ts                   # (리팩토링) 헬스체크 e2e
│   ├── kto.e2e-spec.ts                   # KTO API e2e 테스트
│   │                                     # - HTTP 클라이언트 모킹
│   │                                     # - 도구 호출 검증
│   │                                     # - 응답 포맷 검증
│   └── jest-e2e.json                     # (기존)
│
├── README.md                             # 프로젝트 설명 (한국어)
├── package.json                          # (기존)
├── tsconfig.json                         # (기존, module: nodenext)
├── nest-cli.json                         # (기존)
├── .eslintrc.js                          # (기존, tseslint 설정)
├── prettier.config.js                    # (기존)
└── jest.config.js                        # (기존)
```

---

## 모듈별 책임

### `mcp` 모듈
**목적**: MCP 표준 프로토콜 구현 및 전송 관리  
**책임**:
- MCP 서버 라이프사이클 (initialize, ready, shutdown)
- 도구 등록 및 호출 라우팅
- 세 가지 전송 어댑터 관리
- 요청-응답 직렬화/역직렬화

### `kto` 모듈
**목적**: KTO API 통합 레이어  
**책임**:
- data.go.kr KTO API 호출
- HTTP 클라이언트 관리 (재시도, 타임아웃)
- XML/JSON 응답 파싱
- 공용 DTO 및 에러 처리

### `kto/korean-tour-info` 모듈
**목적**: 1차 구현 대상 API (15101578) 전용  
**책임**:
- 한국관광공사 국문 관광정보 조회 로직
- MCP 도구 정의 (모든 오퍼레이션 매핑)
- 비즈니스 로직 (검색, 필터링, 상세 조회)
- 단위/e2e 테스트

---

## 다국어 확장 설계

### 이 이터레이션 (국문만) — 실제 구현

**참고**: SPEC-KTO-001 plan.md §10 에 따라 `kto-http.client.ts` 는 `src/kto/clients/` 서브디렉토리가 아닌 `src/kto/` 플랫 레벨에 배치되었습니다.

```
kto/
├── kto-http.client.ts        # language 파라미터 미리 준비
├── common/                   # 모든 언어에서 공유
├── korean-tour-info/         # 국문 API (15101578)
```

### 2차+ 이터레이션 (다국어 추가)
각 언어별 모듈이 동일 구조로 추가되며, 기존 `common`과 `clients` 재사용:

```
kto/
├── common/
├── clients/kto-http.client.ts      # language = "English" 파라미터
├── korean-tour-info/                # API 15101578 (국문)
├── english-tour-info/               # API 15101578-ENG (영문)
├── japanese-tour-info/              # API 15101578-JPN (일문)
├── chinese-simplified-tour-info/    # API 15101578-CHS (중문 간체)
├── chinese-traditional-tour-info/   # API 15101578-CHT (중문 번체)
├── german-tour-info/                # API 15101578-GER (독일문)
├── french-tour-info/                # API 15101578-FRE (프랑스문)
├── spanish-tour-info/               # API 15101578-SPA (스페인문)
└── russian-tour-info/               # API 15101578-RUS (러시아문)
```

**확장 시 변경량**:
- 새 언어 모듈: 200~300줄 (service + tools 정의)
- 기존 코드 변경: 최소화 (클라이언트 language 파라미터만 주입)

---

## 의존성 및 가져오기

### 주요 NestJS 모듈 임포트
```typescript
// app.module.ts
import { MCP Module } from './mcp/mcp.module';
import { KtoModule } from './kto/kto.module';

@Module({
  imports: [MCPModule, KtoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### DTO 임포트 (한국-관광정보 서비스)
```typescript
// korean-tour-info/korean-tour-info.service.ts
import { TourInfoDto, AccommodationDto } from '../common/dto';
import { KTOHttpClient } from '../kto-http.client';  // 플랫 레벨에서 임포트
```

### 유틸 임포트
```typescript
// korean-tour-info/korean-tour-info.service.ts
import { parseXmlResponse } from '../common/utils/xml-parser.util';
import { mapApiResponseToDto } from '../common/utils/response-mapper.util';
```

---

## 부트스트랩 흐름 (main.ts)

```
1. 환경변수 로드 (KTO_SERVICE_KEY, MCP_TRANSPORT_MODE, MCP_HTTP_PORT 등)
2. NestJS 앱 생성 (AppModule 로드)
   - MCP 모듈 초기화
   - KTO 모듈 초기화
   - 도구 레지스트리에 korean-tour-info 도구 등록
3. 선택된 전송 시작
   - stdio 모드: 프로세스 stdin/stdout 사용
   - HTTP Streamable: NestJS HttpServer + 스트림 핸들러
   - HTTP non-Streamable: NestJS HttpServer + 일반 핸들러
4. 신호 핸들러 (SIGINT, SIGTERM) → graceful shutdown
```

---

## 파일 생성 순서 (개발 로드맵)

### Phase 1: 기초 구조
1. `main.ts` 리팩토링 (multi-transport 초기화)
2. `env.ts` 생성 (환경변수 타입 안전성)
3. `mcp/mcp.module.ts`, `mcp/mcp.service.ts`
4. `mcp/transports/*.adapter.ts` (세 가지 전송)

### Phase 2: KTO 공용 계층
5. `kto/clients/kto-http.client.ts` (language 파라미터화)
6. `kto/common/dto/*.ts` (공용 DTO)
7. `kto/common/constants/*.ts` (API 매핑, 에러 코드)
8. `kto/common/utils/*.ts` (XML 파싱, 응답 매핑)

### Phase 3: 한국-관광정보 구현
9. `kto/korean-tour-info/korean-tour-info.service.ts`
10. `kto/korean-tour-info/korean-tour-info.tools.ts`
11. `kto/korean-tour-info/korean-tour-info.module.ts`
12. 단위 테스트 (`*.spec.ts`)

### Phase 4: 테스트 및 통합
13. `test/kto.e2e-spec.ts` (e2e 테스트)
14. 도구 레지스트리 통합 검증
15. 전송별 통합 테스트

---

Version: 1.0.0  
Last Updated: 2026-05-09  
Owner: seonho@wantedlab.com
