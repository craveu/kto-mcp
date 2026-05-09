# 기술 스택 (Tech)

## 런타임 및 빌드

### Node.js
- **버전**: LTS (20.x 이상 권장, 22.x 최신)
- **용도**: 서버 런타임
- **이유**: 안정적인 LTS 채널, 기본 모듈 시스템 성숙도

### 패키지 매니저
- **선택**: pnpm
- **버전**: 10.x 이상
- **이유**: 빠른 설치, 엄격한 의존성 관리, 디스크 효율

### TypeScript
- **버전**: 5.7.3 (현재 고정)
- **컴파일 옵션**:
  - `module: nodenext` (ES 모듈 및 CommonJS 상호운용성)
  - `moduleResolution: nodenext` (최신 Node.js 모듈 해석)
  - `target: ES2020` (Promise, async/await 등 지원)
  - `strict: true` (모든 엄격한 타입 체크 활성화)
- **이유**: 타입 안전성, 최신 ECMAScript 기능, 명확한 에러 처리

---

## 프레임워크 및 핵심 라이브러리

### NestJS
- **버전**: 11.0.1
- **사용 계층**:
  - `@nestjs/core`: IoC 컨테이너, 모듈 시스템
  - `@nestjs/common`: 데코레이터, 라이프사이클 훅
  - `@nestjs/platform-express`: HTTP 서버 어댑터
- **핵심 기능**:
  - 모듈식 아키텍처 (`MCPModule`, `KtoModule` 분리)
  - 의존성 주입 (서비스 간 느슨한 결합)
  - 데코레이터 기반 라우팅/구성

### MCP SDK (추가 예정)
- **라이브러리**: `@modelcontextprotocol/sdk`
- **버전**: 추후 명시 (현재 선택 단계)
- **사용 범위**:
  - MCP 프로토콜 구현 (initialize, ListTools, CallTool 등)
  - 도구 및 리소스 등록
  - stdio/HTTP 전송 추상화
- **상태**: 아직 `package.json`에 미추가 (아키텍처 설계 중)

### RxJS
- **버전**: 7.8.1
- **용도**: NestJS 비동기 연산 지원 (생략 가능하나 권장)

---

## HTTP 클라이언트 및 통신

### 방식 선택
**TBD**: Axios vs Native Fetch  
- **후보 1 - Axios**: NestJS 표준, 재시도·인터셉터 기본 지원
  - 패키지: `@nestjs/axios` 또는 직접 `axios`
  - 장점: 내장 미들웨어, 타임아웃 관리, 요청/응답 변환
- **후보 2 - Node.js Fetch**: 표준 API, 의존성 최소화
  - Node.js 18+ 내장
  - 장점: 경량, 외부 의존 감소
  - 단점: 재시도/인터셉터 직접 구현 필요

### KTO API 특성
- **프로토콜**: HTTP GET (XML/JSON 응답)
- **기본 URL**: https://apis.data.go.kr/
- **인증**: 서비스 키 (쿼리 파라미터 `serviceKey`)
- **응답 포맷**:
  - XML: 기본값 (파싱 필요)
  - JSON: 요청 파라미터로 지정 가능
- **응답 크기**: 항목 수 제한 (pageSize, pageNo 파라미터)

---

## 데이터 검증 및 변환

### class-validator & class-transformer
- **버전**: 최신 LTS (현재 명시 필요)
- **용도**:
  - DTO 검증 (요청/응답 필드 타입)
  - 데코레이터 기반 검증 규칙 (`@IsString()`, `@IsNumber()` 등)
  - 응답 DTO 직렬화 (`plainToInstance()`)
- **예시**:
  ```typescript
  // korean-tour-info.dto.ts
  import { IsString, IsNumber, ValidateNested } from 'class-validator';
  
  export class TourAttractionDto {
    @IsString()
    name: string;
    
    @IsNumber()
    latitude: number;
  }
  ```

---

## XML/JSON 응답 파싱

### 라이브러리 선택
**TBD**: `fast-xml-parser` vs `xml2js`
- **후보 1 - fast-xml-parser**: 빠른 성능, 간단한 API
  - 단순 XML → JSON 변환 용도 적합
  - 권장: KTO API 응답이 구조화된 형식이므로 충분
- **후보 2 - xml2js**: 풍부한 옵션, 복잡한 변환
  - 고급 매핑 필요 시 사용

### 파싱 전략
```
API 응답 (XML) 
  → fast-xml-parser.parse() 
  → 중간 객체 
  → mapApiResponseToDto() 
  → DTO 인스턴스
```

---

## 테스트

### 단위 테스트
- **프레임워크**: Jest 30.0.0
- **설정**: `jest.config.js` (기존, `rootDir: src`)
- **커버리지**: 최소 85% 목표
- **패턴**: `*.spec.ts` (rootDir: src에서 자동 발견)
- **예시**:
  ```typescript
  describe('KoreanTourInfoService', () => {
    it('should fetch attractions by region', async () => {
      const result = await service.searchAttractionsInRegion('서울');
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });
  ```

### e2e 테스트
- **프레임워크**: Jest + Supertest (선택) 또는 기타
- **설정**: `test/jest-e2e.json` (기존)
- **테스트 대상**: 
  - MCP 도구 호출 (CallTool 요청)
  - HTTP 응답 검증
  - 오류 처리 시나리오
- **예시**:
  ```typescript
  describe('KTO e2e', () => {
    it('should call korean-tour-info tool and return results', async () => {
      const result = await callMCPTool('searchAttractions', {
        region: 'Seoul',
      });
      expect(result.status).toBe('success');
    });
  });
  ```

### 테스트 실행 명령
```bash
pnpm test                 # 단위 테스트
pnpm test:watch          # 감시 모드
pnpm test:cov            # 커버리지 리포트
pnpm test:e2e            # e2e 테스트
```

---

## 린트 및 포맷팅

### ESLint
- **버전**: 9.18.0 (ESLint 최신 flat config)
- **설정**: `.eslintrc.js` (기존)
- **규칙 셋**: `typescript-eslint` 타입 체크 기반
  - `tseslint.configs.recommendedTypeChecked` 확장
  - NestJS 관례 (데코레이터, 의존성 주입) 지원
  - 린트 실패는 `tsc` 타입 에러까지 포함
- **실행**:
  ```bash
  pnpm lint                # 모든 파일 린트
  ```

### Prettier
- **버전**: 3.4.2
- **설정**: `prettier.config.js` (기존)
- **포맷팅 대상**: `src/**/*.ts`, `test/**/*.ts`
- **실행**:
  ```bash
  pnpm format              # 자동 포맷팅
  ```

### 빌드 절차
```bash
pnpm build               # nest build → dist/
                         # TypeScript 컴파일 + 산출물 dist/에 복사
```

---

## 환경 변수 및 구성

### 필수 환경변수
| 변수 | 설명 | 예시 | 필수 |
|------|------|------|------|
| `KTO_SERVICE_KEY` | KTO API 서비스 키 (data.go.kr 발급) | `abc123xyz...` | O |
| `MCP_TRANSPORT_MODE` | 전송 방식 | `stdio` \| `http-streamable` \| `http` | X (기본: stdio) |
| `MCP_HTTP_PORT` | HTTP 모드 포트 | `3000` | X (기본: 3000) |
| `NODE_ENV` | 환경 | `development` \| `production` | X |

### 환경변수 로더
- **파일**: `src/env.ts`
- **기능**:
  - 런타임에 환경변수 검증
  - 타입 안전성 (타입 가드)
  - 기본값 설정
  - 에러 메시지 명확화
- **예시**:
  ```typescript
  export const getEnv = () => ({
    ktoServiceKey: process.env.KTO_SERVICE_KEY!,
    mcpTransport: process.env.MCP_TRANSPORT_MODE ?? 'stdio',
    mcpHttpPort: parseInt(process.env.MCP_HTTP_PORT ?? '3000'),
  });
  ```

---

## 의존성 관리

### 직접 의존성 (현재 package.json)
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/platform-express": "^11.0.1",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
}
```

### 추가 예정 의존성
| 라이브러리 | 용도 | 버전 | 상태 |
|-----------|------|------|------|
| `@modelcontextprotocol/sdk` | MCP 프로토콜 | TBD | 선택 대기 |
| `axios` 또는 내장 Fetch | HTTP 클라이언트 | TBD | 정의 대기 |
| `class-validator` | DTO 검증 | ^0.14.0 | 검토 중 |
| `class-transformer` | DTO 직렬화 | ^0.5.0 | 검토 중 |
| `fast-xml-parser` 또는 `xml2js` | XML 파싱 | TBD | 정의 대기 |

### 개발 의존성 (현재 package.json)
- `jest`, `ts-jest`: 테스트
- `@nestjs/testing`: NestJS 테스트 유틸
- `supertest`: HTTP 테스트
- `eslint`, `typescript-eslint`, `prettier`: 린트/포맷
- `ts-node`: CLI 스크립트 실행
- `@types/*`: TypeScript 타입 정의

---

## 배포 및 실행

### 로컬 개발
```bash
pnpm install              # 의존성 설치
pnpm start:dev            # watch 모드로 실행 (src 변경 감지)
```

### 프로덕션 빌드
```bash
pnpm build               # TypeScript 컴파일 → dist/
pnpm start:prod          # node dist/main.js 실행
```

### 컨테이너 배포 (향후)
**상태**: TBD (이 이터레이션 범위 외)  
계획:
- Dockerfile (Alpine Node.js 베이스)
- docker-compose (로컬 개발용)
- GitHub Actions CI/CD (자동 테스트/빌드)

---

## 성능 고려사항

### KTO API 호출 최적화
- **타임아웃**: 10~15초 (data.go.kr 응답 지연 고려)
- **재시도**: 지수 백오프 (최대 3회) 추후 구현
- **동시 요청**: 기본 제한 없음 (rate limiting 추후 검토)

### 응답 캐싱 (향후)
**상태**: TBD  
- Redis 또는 메모리 캐시
- TTL: API 데이터 특성에 따라 1시간~1일

### 메모리 사용
- **기본 런타임**: ~100MB
- **HTTP 스트리밍**: 대용량 응답 처리 시 메모리 효율 (점진적 송신)

---

## 모니터링 및 로깅

### 기본 로깅
- **라이브러리**: NestJS 기본 Logger (추후 Winston/Pino 검토)
- **레벨**: `log`, `error`, `warn`, `debug`
- **출력**: 콘솔 (구조화된 JSON 선택 가능)

### 추후 계획
- Structured logging (JSON 형식)
- 외부 로그 수집 (CloudWatch, Datadog 등)
- 분산 추적 (OpenTelemetry)

---

## 문서화

### 생성된 문서
- API 문서: Swagger/OpenAPI (추후 생성)
- README.md: 설치·실행·사용 가이드
- CHANGELOG.md: 버전 히스토리
- API 리퍼런스: MCP 도구 정의 문서

### 코드 내 문서
- JSDoc 주석 (주요 함수/클래스)
- 타입 정의 (자체 문서화)
- 예제 코드 (docs/ 또는 README)

---

## 버전 호환성

| 요소 | 버전 | 이유 |
|------|------|------|
| Node.js | 20.x LTS 또는 22.x | 안정성, 보안 업데이트 |
| TypeScript | 5.7.3 | 최신 ES 기능 + 안정성 |
| NestJS | 11.0.1 | 현재 LTS, 안정적인 API |
| pnpm | 10.x+ | 빠른 설치, 엄격한 의존성 |

---

## 보안 고려사항

### KTO 서비스 키 관리
- `.env` 또는 환경변수로만 관리 (소스 코드 제외)
- 로그에 서비스 키 절대 출력 금지
- 깃허브 Secrets (CI/CD) 사용

### API 입력 검증
- class-validator로 모든 DTO 검증
- XSS 방지 (응답 이스케이프)
- SQL 인젝션 방지 (이번 이터레이션에선 해당 없음)

### HTTPS 강제 (배포 시)
- Reverse proxy (Nginx, CloudFront) 통해 HTTPS 제공

---

Version: 1.0.0  
Last Updated: 2026-05-09  
Owner: seonho@wantedlab.com

---

## 주석 및 미결정 사항 (TBD)

| 항목 | 상태 | 계획 |
|------|------|------|
| MCP SDK 버전 | TBD | 프로토콜 안정성 검증 후 명시 |
| HTTP 클라이언트 (Axios vs Fetch) | TBD | 성능/의존성 테스트 후 결정 |
| XML 파서 (fast-xml-parser vs xml2js) | TBD | KTO API 응답 구조 분석 후 선택 |
| 캐싱 전략 | TBD | 2차 이터레이션 또는 성능 테스트 후 |
| 배포 플랫폼 (AWS, GCP, 온프레미스) | TBD | 요구사항 수집 후 결정 |
| 모니터링 도구 (Datadog, CloudWatch 등) | TBD | 운영 단계 이후 |
