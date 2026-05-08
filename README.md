# kto-mcp

한국관광공사(KTO)의 공공 데이터 API를 쉽게 사용하기 위한 MCP(Model Context Protocol) 서버입니다.

## 요구사항

- Node.js 22+
- pnpm 9+

## 설치

```bash
pnpm install
```

## 실행

```bash
# 개발 (파일 변경 감지)
pnpm run start:dev

# 프로덕션
pnpm run build
pnpm run start:prod
```

기본 포트는 `3000`이며, `PORT` 환경 변수로 변경할 수 있습니다.

## 테스트

```bash
# 단위 테스트
pnpm run test

# 단일 파일
pnpm jest src/app.controller.spec.ts

# e2e 테스트
pnpm run test:e2e

# 커버리지
pnpm run test:cov
```

## 코드 품질

```bash
pnpm run lint     # ESLint (자동 수정 포함)
pnpm run format   # Prettier
```

## 기술 스택

- [NestJS](https://nestjs.com/) 11
- TypeScript 5
- Jest