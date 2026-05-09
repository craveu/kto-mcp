# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

`kto-mcp` is the scaffold for a planned MCP (Model Context Protocol) server that will wrap Korea Tourism Organization (KTO / 한국관광공사) public APIs from `data.go.kr`. The README is in Korean. The current `main` branch is a fresh `nest new` scaffold — `AppController.getHello()` is the only route — so substantive MCP work is expected to land in this repo rather than already exist.

## Commands

```bash
pnpm install
pnpm run build        # nest build → dist/
pnpm run start:dev    # nest start --watch
pnpm run start:prod   # node dist/main (listens on PORT, default 3000)
pnpm run lint         # ESLint with type-aware rules; runs tsc behind the scenes (slow)
pnpm run format       # Prettier on src/ and test/
pnpm run test         # Jest unit tests
pnpm run test:e2e     # jest --config ./test/jest-e2e.json
pnpm run test:cov     # unit tests with coverage
```

Run a single test file:
```bash
pnpm jest src/app.controller.spec.ts
```

## Architecture

NestJS 11 on TypeScript 5 with `module: nodenext` and `moduleResolution: nodenext`. Entry point is `src/main.ts`. ESLint extends `tseslint.configs.recommendedTypeChecked`, so lint failures can be type errors surfaced via lint rather than `tsc`.

**Module structure** follows standard NestJS conventions:
- `AppModule` (`src/app.module.ts`) — root module; register new feature modules here as they are added
- Controllers handle HTTP routing; services hold business logic; both are registered on the owning module
- Unit tests live alongside their subject (`rootDir: src/`, `*.spec.ts`); only e2e specs live under `test/`

## Structure
Controller, Service 구조로 제작
class-validator 와 dto 방식

## `.moai/` directory

The `.moai/` directory is used by the **Moai design workflow** (`/moai design` skill) and is not part of the runtime.
- `.moai/design/` — human-authored `spec.md`, `system.md`, `research.md` (plus `screenshots/`, `wireframes/`) consumed by `/moai design`. Fill these in before invoking the workflow.
- `.moai/evolution/` — outputs produced by the workflow's iterations.
