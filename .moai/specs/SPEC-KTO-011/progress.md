# SPEC-KTO-011 Progress

## Phase 0 — SDK SessionId Verification

**Date**: 2026-05-10

### Verified SDK behavior

File inspected: `node_modules/@modelcontextprotocol/sdk/dist/cjs/shared/protocol.d.ts` line 173-198

```ts
export type RequestHandlerExtra<...> = {
  signal: AbortSignal;
  authInfo?: AuthInfo;
  sessionId?: string;   // <-- EXISTS, optional
  _meta?: RequestMeta;
  requestId: RequestId;
  // ...
};
```

File inspected: `node_modules/@modelcontextprotocol/sdk/dist/cjs/server/streamableHttp.d.ts`

Confirms stateful vs stateless mode:
- `sessionIdGenerator: undefined` → stateless, `sessionId` is `undefined` in handlers
- `sessionIdGenerator: () => randomUUID()` → stateful, `sessionId` is stable per-session

### Conclusion

**`extra.sessionId` IS available** in `RequestHandlerExtra` but only when transport is in stateful mode.

**Action**: Switch both HTTP adapters from `sessionIdGenerator: undefined` to `sessionIdGenerator: () => randomUUID()` (stateful mode). This is required for per-session key lookup to work.

The [ASSUMED] marker in the SPEC is resolved: stateful mode is required and sufficient.

---

## Phase 1 — SessionCredentialsStore + KtoServiceKeyMissingError

**Status**: COMPLETE

### Files created
- `src/mcp/session-credentials.store.ts`
- `src/mcp/session-credentials.store.spec.ts` (12 tests)
- `src/kto/common/kto-error.ts` (KtoServiceKeyMissingError added)

---

## Phase 2 — KtoHttpClient signature change

**Status**: COMPLETE

### Changes
- `src/kto/kto-http.client.ts`: removed serviceKey/preencoded from constructor, added credentials to KtoRequestOptions
- `src/kto/kto.module.ts`: simplified provider (no useFactory)
- `src/kto/kto-http.client.spec.ts`: updated to pass credentials per call

---

## Phase 3 — 65 service methods bulk update

**Status**: COMPLETE

### Changes
- All 10 service files: added `credentials: KtoCredentials` parameter to all 65 methods
- All 10 service spec files: added testCredentials const and passed to all calls

---

## Phase 4 — Transport adapters + tool-registry + main boot

**Status**: COMPLETE

### Changes
- `src/mcp/tool-registry.ts`: added store param, sessionId lookup in handlers
- `src/mcp/tool-registry.spec.ts`: 14 tests covering credentials flow
- `src/mcp/transports/http-streamable.adapter.ts`: @Injectable, store injection, stateful mode, extractCredentialsFromRequest exported
- `src/mcp/transports/http-streamable.adapter.spec.ts`: 17 tests
- `src/mcp/transports/http.adapter.ts`: same pattern, enableJsonResponse:true
- `src/mcp/transports/http.adapter.spec.ts`: 11 tests
- `src/mcp/transports/stdio.adapter.ts`: store injection, STDIO_SESSION_ID registration
- `src/mcp/transports/stdio.adapter.spec.ts`: 7 tests
- `src/env.ts`: KTO_SERVICE_KEY only required in stdio mode
- `src/env.spec.ts`: stdio/HTTP/common describe blocks
- `src/mcp/mcp.module.ts`: SessionCredentialsStore added to providers/exports
- `src/main.ts`: store from DI, passed to registerAll and stdioAdapter.start

---

## Phase 5 — e2e tests + type errors fixed

**Status**: COMPLETE

### Changes
- `test/kto.e2e-spec.ts`: added SessionCredentialsStore import + e2eStore, passed to all 29 registerAll calls
- `src/kto/photo-award/photo-award.service.spec.ts`: missing credentials arg fixed

---

## Final results

- Unit tests: 730 passed, 0 failed (39 suites)
- e2e type errors: 0 (tsc --noEmit clean)
- Coverage: 89% statements, 78% branches, 76% functions, 92% lines
- Lint errors: 0
- Build: tsc --noEmit clean
