# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # install dependencies
pnpm run build        # compile TypeScript via NestJS CLI (outputs to dist/)
pnpm run start:dev    # run with file-watching (development)
pnpm run start:prod   # run compiled output from dist/
pnpm run lint         # ESLint with auto-fix
pnpm run format       # Prettier format src/ and test/
pnpm run test         # unit tests (Jest, rootDir: src/, *.spec.ts files)
pnpm run test:e2e     # e2e tests (jest --config ./test/jest-e2e.json)
pnpm run test:cov     # unit tests with coverage report
```

Run a single test file:
```bash
pnpm jest src/app.controller.spec.ts
```

## Architecture

This is a **NestJS 11** application using TypeScript 5 with `module: nodenext` and `moduleResolution: nodenext`. The entry point is `src/main.ts`, which boots the NestJS app on `process.env.PORT ?? 3000`.

The project is named `kto-mcp` and is currently a bare NestJS scaffold. The intended purpose (MCP server for KTO) has not been implemented yet.

**Module structure** follows standard NestJS conventions:
- `AppModule` (`src/app.module.ts`) — root module; import all feature modules here
- Controllers handle HTTP routing; Services hold business logic; both are registered on their respective module

## `.moai/` Directory

The `.moai/` directory is used by the **Moai design workflow** tool (`/moai design`). It is not part of the NestJS application. The files under `.moai/design/` (`spec.md`, `system.md`, `research.md`) are human-authored design context files loaded by the `/moai design` skill — fill them in before running that workflow.
