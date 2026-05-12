# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

`kto-mcp` is an MCP (Model Context Protocol) server that wraps Korea Tourism Organization (KTO / 한국관광공사) public APIs from `data.go.kr`. **10 of 10 KTO APIs integrated** (SPEC-KTO-001 ~ SPEC-KTO-010), exposing **63 MCP tools** across 10 prefixes. README and runtime docs are in Korean.

## Commands

```bash
pnpm install
pnpm run build         # nest build → dist/
pnpm run start:dev     # nest start --watch
pnpm run start:prod    # node dist/main (MCP server, transport per env)
pnpm run lint          # ESLint with type-aware rules
pnpm run format        # Prettier on src/ and test/
pnpm run test          # Jest unit tests (693 tests)
pnpm run test:e2e      # jest --config ./test/jest-e2e.json (30 e2e tests)
pnpm run test:cov      # unit tests with coverage (89% statements / 92% lines)
```

Run a single test file:
```bash
pnpm jest src/kto/korean-tour-info/korean-tour-info.service.spec.ts
```

Local PATH note: this repository is developed on WSL with Node.js via fnm; if `pnpm` is not on PATH, prepend `~/.local/share/fnm/node-versions/<ver>/installation/bin`.

## Required environment

`.env` (gitignored, copied from `.env.example`) must define:
- `KTO_SERVICE_KEY` — required, issued at data.go.kr per API. One key generally works across all 10 KTO APIs after activation.
- `KTO_SERVICE_KEY_PREENCODED` — `false` (default) if the raw decoded key was issued; `true` if pre-encoded (`%2B`, `%2F` etc).
- `MCP_TRANSPORT_MODE` — `stdio` | `http-streamable` | `http-json`
- `MCP_HTTP_PORT` — only used by HTTP transports

Server fails fast at boot if `KTO_SERVICE_KEY` is missing (REQ-UNW-001).

## Architecture

NestJS 11 on TypeScript 5 with `module: nodenext` and `moduleResolution: nodenext`. Entry point is `src/main.ts` (rewritten from the scaffold to bootstrap an MCP server, not an HTTP REST app).

### MCP server core (`src/mcp/`)
- `tool-registry.ts` — `registerAll(server, ToolRegistry[])` accepts an array of `{ tools, service }` pairs and registers each tool via `McpServer.registerTool`. The JSON Schema in each tool definition is converted to a Zod raw shape (`jsonSchemaToZodShape`) so the SDK forwards user args to handlers as the first positional argument. **Critical**: passing no `inputSchema` collapses the handler signature to `(extra)`, causing class-transformer to crash on `AbortSignal` (resolved in commit `9a5c2e8`).
- `transports/stdio.adapter.ts` — `StdioServerTransport`
- `transports/http-streamable.adapter.ts` — `StreamableHTTPServerTransport` with `enableJsonResponse: false` (SSE)
- `transports/http.adapter.ts` — same SDK class with `enableJsonResponse: true` (plain JSON)
- `mcp.module.ts` / `mcp.service.ts` — NestJS lifecycle hooks

### Shared KTO infrastructure (`src/kto/common/`)
- `constants.ts` — `BASE_URL_MAP` (single flat namespace for all 17 KTO B551011 service paths across 7 multilingual patterns), `COMMON_PARAMS`, `RETRY_CONFIG`, `GATEWAY_ERROR_CODES`, `PERMANENT_ERROR_CODES`
- `kto-http.client.ts` — `KtoHttpClient.request()` performs auth + retry + error parsing. Handles two error envelopes:
  1. Standard `response.header.resultCode` (most KTO services)
  2. Flat top-level `{responseTime, resultCode, resultMsg}` (PhotoGalleryService1, MdclTursm parameter errors) — detected before normalizer
- `response-normalizer.ts` — `normalizeItems` coerces `items.item` (single object | array | empty string `""`) to a typed array
- `kto-error.ts` — `KtoApiError`, `KtoValidationError`
- `types.ts` — generic `KtoListResponse<T>`

### KTO API modules (10 total, one per SPEC)
Each module is self-contained with `<module>.service.ts`, `<module>.tools.ts`, `<module>.module.ts`, `types.ts` (typed item interface), `dto/` (per-operation DTOs), and tests. They are wired into `src/main.ts` as a single `ToolRegistry[]` array passed to `registerAll`.

| Module dir | Service path | Tool prefix | Tools | SPEC |
|---|---|---|---|---|
| `korean-tour-info/` | KorService2 | `kto_korean_*` | 13 | KTO-001 |
| `barrier-free-tour-info/` | KorWithService2 | `kto_barrier_free_*` | 10 | KTO-002 |
| `photo-gallery/` | PhotoGalleryService1 | `kto_photo_*` | 4 | KTO-003 |
| `go-camping/` | GoCamping | `kto_camping_*` | 5 | KTO-004 |
| `audio-guide/` | Odii | `kto_audio_*` | 8 | KTO-005 |
| `durunubi/` | Durunubi | `kto_durunubi_*` | 2 | KTO-006 |
| `pet-tour/` | KorPetTourService2 | `kto_pet_*` | 4 | KTO-007 |
| `medical-tourism/` | MdclTursmService | `kto_medical_*` | 7 | KTO-008 |
| `wellness-tourism/` | WellnessTursmService | `kto_wellness_*` | 8 | KTO-009 |
| `photo-award/` | PhokoAwrdService | `kto_contest_*` | 2 | KTO-010 |

Total: **63 tools**. Per-DTO class-validator does deeper validation after the SDK's Zod first pass.

### KTO multilingual patterns observed
The 10 KTO APIs use **7 different multilingual handling patterns**. New KTO integrations should identify which pattern via `data.go.kr/<id>/openapi.do` listing scrape + real-key probe before SPEC writing:
1. V2 separate paths × 9 (`KorService2`, `EngService2`, `JpnService2`, ...) — KTO-001
2. V2 standalone (no language variant) — KTO-002, 007
3. V1 standalone — KTO-003
4. no-suffix flat (no V/op suffix) — KTO-004, 006
5. `langCode` parameter (`ko`/`en` only) — KTO-005
6. `langDivCd` parameter + lang fluid (server normalizes to ENG regardless) — KTO-008, 009
7. dual-language response fields (`ko*` + `en*` prefixes, no language parameter) — KTO-010

## Adding a new KTO API (or other public API)

Established SOP that produced 0 `[ASSUMED]` markers across SPEC-KTO-002~010:
1. **Pre-scrape**: `curl https://www.data.go.kr/data/<id>/openapi.do -o page.html`, then `grep -ohE 'B551011/[A-Za-z0-9]+'` and `grep -ohE '"operationId":"[a-zA-Z0-9]+"'` to extract the actual service path and operations.
2. **Real-key probe**: hit each operation once with `KTO_SERVICE_KEY` to verify response shape, required parameters, and error envelope.
3. **`/moai plan "<API name>"`** — manager-spec writes 5 SPEC files using the verified facts.
4. **R1 dedup policy**: skip operations whose response is identical to KorService2 (typically `areaCode`, `categoryCode`, `ldongCode`, `lclsSystmCode`, and sometimes `detailCommon`/`detailIntro`/`detailInfo`/`detailImage` when the contentId domain overlaps).
5. **Module template**: copy any of `src/kto/<existing>/` as the template; the only required moves are:
   - Add 1 line to `BASE_URL_MAP` in `src/kto/common/constants.ts`
   - Add 1 entry to the `registries` array in `src/main.ts`
   - Define one new typed item in `types.ts`
   - One DTO per exposed operation, prefixed `<TwoLetters>` (e.g., `Pa`, `Mt`, `Wt`)
   - Tool name format: `kto_<prefix>_<exactKtoOperationName>` — preserve KTO casing including any suffix (`1`, `2`, or none).

## SPEC documents (`.moai/specs/SPEC-KTO-XXX/`)

Each SPEC has `spec.md` (EARS frontmatter + 5 modules), `plan.md` (phases + risks + MX tag plan), `acceptance.md` (Given/When/Then), `research.md` (verified API facts), `spec-compact.md` (token-efficient summary), and `progress.md` (Phase results). All 10 SPECs are at status `completed` (v1.0.0). Implementation Notes section in each spec.md records the squash-merge SHA on main.

## `.moai/` directory

The `.moai/` directory is used by the MoAI-ADK workflow (Plan-Run-Sync) and is not part of the runtime:
- `.moai/specs/SPEC-KTO-001/` ~ `SPEC-KTO-010/` — the 10 SPECs that produced this server
- `.moai/project/product.md`, `structure.md`, `tech.md` — long-lived project context
- `.moai/cache/` — gitignored. Smoke test scripts (`smoke-*.mjs`), debug scripts, and pre-scraped `data.go.kr/*.html` listings live here. Useful for re-running real-key smoke checks against a specific service.
- `.moai/state/` — gitignored. MoAI session memos.
- `.moai/config/`, `.moai/learning/`, `.moai/manifest.json` — MoAI workflow configuration

## Testing strategy

- **Unit tests** (`src/**/*.spec.ts`, 693 tests): mock `KtoHttpClient` for service tests, `nock` for client tests, mock `McpServer` for tool-registry tests
- **e2e tests** (`test/kto.e2e-spec.ts`, 30 tests): in-process `Client` from `@modelcontextprotocol/sdk` connecting to a spawned `dist/main.js`; verifies tool registration count and DTO validation
- **Real-key smoke** (`.moai/cache/smoke-*.mjs`, manual): full SDK roundtrip → real KTO API. Run on demand with a valid `KTO_SERVICE_KEY` in `.env`

`.moai/cache/` is gitignored, so smoke test scripts persist locally without polluting the repo.

## Quality gates (current main)

- 693 unit tests pass
- 30 e2e tests pass
- Coverage: 89% statements, 92% lines
- Lint: 0 errors
- Build: success
- All 10 SPEC files: status `completed` (v1.0.0)
- Zero new top-level abstractions added across SPEC-KTO-002~010 (all infrastructure inherited from SPEC-KTO-001)

## Conventions

- Korean prose in user-facing docs (README, SPEC, code comments where contextual)
- English identifiers, file paths, types, env var names
- DTO class names: `<TwoLetters><OperationName>Dto` (e.g., `MtAreaBasedListDto`, `PaPhokoAwrdListDto`)
- Tool names: `kto_<prefix>_<exactKtoOperationName>` — preserve KTO operation casing (camelCase, no transformation)
- Service path keys in `BASE_URL_MAP` match KTO official path names verbatim (`KorService2`, `Odii`, `MdclTursmService`, etc.) — do not rename for prettiness
