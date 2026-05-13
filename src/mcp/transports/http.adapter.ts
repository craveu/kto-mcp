import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server as HttpServer,
} from 'http';
import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAll, type ToolRegistry } from '../tool-registry';
import { SessionCredentialsStore } from '../session-credentials.store';
import { extractCredentialsFromRequest } from './http-streamable.adapter';

// @MX:WARN: [AUTO] HTTP 헤더에서 외부 입력(Authorization) 처리. 키 노출 위험.
// @MX:REASON: Authorization: Bearer <key> 헤더를 raw IncomingMessage에서 추출한다.
// 절대 서비스 키 전체를 로그/에러/응답에 출력하지 말 것.
// @MX:SPEC: SPEC-KTO-011 REQ-EVT-001, REQ-UNW-001

/**
 * Non-streaming HTTP (plain JSON) transport 어댑터.
 * enableJsonResponse: true — SSE 없이 단순 JSON 요청/응답 모드로 동작한다.
 * SPEC-KTO-011: 다중 세션 지원 — 세션별 독립 McpServer + Transport 쌍 관리.
 *
 * MCP_TRANSPORT_MODE=http-json 일 때 선택된다.
 */
@Injectable()
export class HttpTransportAdapter {
  private httpServer: HttpServer | null = null;
  private port = 0;

  // @MX:ANCHOR: [AUTO] 다중 세션 transport 맵 — 세션별 독립 transport 인스턴스
  // @MX:REASON: 단일 transport 재사용 시 "Server already initialized" 오류 발생.
  // 각 세션은 고유한 McpServer + StreamableHTTPServerTransport 쌍을 가진다.
  private readonly transports = new Map<
    string,
    StreamableHTTPServerTransport
  >();

  constructor(private readonly store: SessionCredentialsStore) {}

  /**
   * HTTP 서버를 시작한다.
   * server 팩토리 패턴: 각 initialize 요청마다 새 McpServer + transport를 생성한다.
   */
  async start(registries: ToolRegistry[], port: number): Promise<void> {
    this.httpServer = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        void this.handleRequest(req, res, registries);
      },
    );

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, () => {
        const addr = this.httpServer!.address();
        this.port =
          typeof addr === 'object' && addr !== null ? addr.port : port;
        resolve();
      });
    });
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    registries: ToolRegistry[],
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId =
      typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

    // 기존 세션 → 해당 transport로 라우팅
    if (sessionId && this.transports.has(sessionId)) {
      const existing = this.transports.get(sessionId)!;
      const body = await readBody(req);
      // 후속 POST 요청에서 새 키를 제공하면 즉시 재등록
      const creds = extractCredentialsFromRequest(req);
      if (creds) {
        this.store.register(sessionId, creds);
      }
      await existing.handleRequest(req, res, body);
      return;
    }

    // mcp-session-id 헤더가 있는데 맵에 없으면 404
    if (sessionId) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    // 신규 initialize 요청 — 새 transport + McpServer 쌍 생성
    const pendingCreds = extractCredentialsFromRequest(req);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sid: string) => {
        this.transports.set(sid, transport);
        if (pendingCreds) {
          this.store.register(sid, pendingCreds);
          const keyTail = pendingCreds.serviceKey.slice(-4);
          console.error(
            `[kto-mcp] session ${sid} auth=present (key …${keyTail})`,
          );
        } else {
          const authHeader = req.headers['authorization'];
          const hasHeader = typeof authHeader === 'string' && authHeader !== '';
          console.error(
            `[kto-mcp] session ${sid} auth=MISSING — authorization header ${hasHeader ? 'malformed (not Bearer scheme)' : 'absent'}. Subsequent tools/call will fail with KtoServiceKeyMissingError.`,
          );
        }
      },
      onsessionclosed: (sid: string) => {
        this.transports.delete(sid);
        this.store.unregister(sid);
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        this.transports.delete(sid);
        this.store.unregister(sid);
      }
    };

    // 세션 전용 McpServer 생성 및 도구 등록
    const mcpServer = new McpServer({ name: 'kto-mcp', version: '0.1.0' });
    registerAll(mcpServer, registries, this.store);
    await mcpServer.connect(transport);

    const body = await readBody(req);
    await transport.handleRequest(req, res, body);
  }

  getPort(): number {
    return this.port;
  }

  async stop(): Promise<void> {
    const closePromises = Array.from(this.transports.values()).map((t) =>
      t.close().catch(() => {
        /* 무시 */
      }),
    );
    await Promise.all(closePromises);
    this.transports.clear();

    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
      this.httpServer = null;
    }
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as unknown) : undefined);
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', reject);
  });
}
