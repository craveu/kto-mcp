# 프로젝트 구조 (Structure)

## 현재 상태

NestJS 11 + TypeScript 5 기반 MCP 서버 10/10 완성. 63개 MCP 도구 노출, 10개 KTO API 모듈 통합 완료.

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
│   ├── kto/                              # KTO API 통합 계층 (10개 모듈)
│   │   ├── kto.module.ts                 # KTO 루트 모듈
│   │   ├── common/                       # 공용 인프라 (전체 모듈 공유)
│   │   │   ├── dto/                      # 공용 Data Transfer Objects
│   │   │   ├── constants/                # BASE_URL_MAP, 에러 코드
│   │   │   ├── interfaces/               # KTOClient, KTOService 인터페이스
│   │   │   ├── errors/                   # KTO API 예외 클래스
│   │   │   └── utils/                    # XML 파싱, 응답 정규화, 재시도 정책
│   │   ├── korean-tour-info/             # KTO-001: 국문 관광정보 (13 도구, v1.1.0)
│   │   │   ├── korean-tour-info.module.ts
│   │   │   ├── korean-tour-info.service.ts
│   │   │   ├── korean-tour-info.tools.ts
│   │   │   └── dto/
│   │   ├── barrier-free-tour-info/       # KTO-002: 무장애 여행정보 (10 도구)
│   │   │   ├── barrier-free-tour-info.module.ts
│   │   │   ├── barrier-free-tour-info.service.ts
│   │   │   ├── barrier-free-tour-info.tools.ts
│   │   │   └── dto/
│   │   ├── photo-gallery/                # KTO-003: 관광사진 (4 도구)
│   │   │   ├── photo-gallery.module.ts
│   │   │   ├── photo-gallery.service.ts
│   │   │   ├── photo-gallery.tools.ts
│   │   │   └── dto/
│   │   ├── go-camping/                   # KTO-004: 고캠핑 (5 도구)
│   │   │   ├── go-camping.module.ts
│   │   │   ├── go-camping.service.ts
│   │   │   ├── go-camping.tools.ts
│   │   │   └── dto/
│   │   ├── audio-guide/                  # KTO-005: 오디오 가이드 Odii (8 도구)
│   │   │   ├── audio-guide.module.ts
│   │   │   ├── audio-guide.service.ts
│   │   │   ├── audio-guide.tools.ts
│   │   │   └── dto/
│   │   ├── durunubi/                     # KTO-006: 두루누비 (2 도구)
│   │   │   ├── durunubi.module.ts
│   │   │   ├── durunubi.service.ts
│   │   │   ├── durunubi.tools.ts
│   │   │   └── dto/
│   │   ├── pet-tour/                     # KTO-007: 반려동물 동반 (4 도구)
│   │   │   ├── pet-tour.module.ts
│   │   │   ├── pet-tour.service.ts
│   │   │   ├── pet-tour.tools.ts
│   │   │   └── dto/
│   │   ├── medical-tourism/              # KTO-008: 의료관광 (7 도구)
│   │   │   ├── medical-tourism.module.ts
│   │   │   ├── medical-tourism.service.ts
│   │   │   ├── medical-tourism.tools.ts
│   │   │   └── dto/
│   │   ├── wellness-tourism/             # KTO-009: 웰니스관광 (8 도구)
│   │   │   ├── wellness-tourism.module.ts
│   │   │   ├── wellness-tourism.service.ts
│   │   │   ├── wellness-tourism.tools.ts
│   │   │   └── dto/
│   │   └── photo-award/                  # KTO-010: 관광공모전 (2 도구)
│   │       ├── photo-award.module.ts
│   │       ├── photo-award.service.ts
│   │       ├── photo-award.tools.ts
│   │       └── dto/
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

## 다국어 패턴 정리

### 7가지 KTO 다국어 처리 패턴 (완벽 흡수)

| # | 패턴 명칭 | 예시 | 모듈 | 설명 |
|---|---------|------|------|------|
| 1 | V2 별도 path 다국어 변체 | KorService2/EngService2/JpnService2 등 | KTO-001 | 서비스명 + 국가코드 suffix + V2 |
| 2 | V2 sibling 단독 | KorWithService2, KorPetTourService2 | KTO-002, 007 | V2 version이지만 다국어 변체 없음 |
| 3 | V1 단독 | PhotoGalleryService1 | KTO-003 | V1 version, 다국어 변체 미보유 |
| 4 | suffix 없음 평면형 | GoCamping, Durunubi | KTO-004, 006 | 버전/언어 suffix 모두 없음 |
| 5 | langCode 파라미터 | Odii (ko/en만 권장) | KTO-005 | 단일 path + langCode 파라미터 |
| 6 | langDivCd 파라미터 + lang fluid | MdclTursmService, WellnessTursmService | KTO-008, 009 | 단일 path + langDivCd + 응답 유연 |
| 7 | 응답 필드 prefix (ko*/en*) | PhokoAwrdService | KTO-010 | 한/영 필드를 동시 응답 |

### 아키텍처 재사용성
- **공용 KtoHttpClient**: 모든 10개 모듈이 단일 인스턴스 재사용
- **BASE_URL_MAP**: 10개 API를 키-밸류로 중앙 집중 관리
- **response-normalizer**: 모든 응답을 일관된 JSON 포맷으로 정규화
- **tool-registry**: 63개 도구를 동적 등록/해제
- **transport 계층**: stdio/http-streamable/http-json 3종 공통 사용

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

Version: 2.0.0  
Last Updated: 2026-05-09  
Owner: seonho@wantedlab.com
Status: 10/10 완성, 63개 도구 노출, 7가지 패턴 흡수
