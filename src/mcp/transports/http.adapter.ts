import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server as HttpServer,
} from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Non-streaming HTTP (plain JSON) transport 어댑터.
 * enableJsonResponse: true — SSE 없이 단순 JSON 요청/응답 모드로 동작한다.
 *
 * stateless 패턴 제약:
 * - SDK 명세상 단일 StreamableHTTPServerTransport 인스턴스는 재사용 불가
 * - main.ts에서는 McpServer + registerAll을 per-request로 구성해야 함
 * - 본 어댑터는 connect()된 McpServer를 받아 단일 세션 처리를 담당한다
 *
 * MCP_TRANSPORT_MODE=http-json 일 때 선택된다.
 */
export class HttpTransportAdapter {
  private httpServer: HttpServer | null = null;
  private transport: StreamableHTTPServerTransport | null = null;
  private port = 0;

  /**
   * McpServer에 transport를 연결하고 HTTP 서버를 시작한다.
   * server는 이미 connect()되지 않은 상태여야 한다.
   */
  async start(server: McpServer, port: number): Promise<void> {
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });

    await server.connect(this.transport);

    this.httpServer = createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        void this.handleRequest(req, res);
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
  ): Promise<void> {
    if (!this.transport) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Transport not initialized' }));
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      await this.transport.handleRequest(req, res, body);
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }

  getPort(): number {
    return this.port;
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close().catch(() => {
        /* 무시 */
      });
      this.transport = null;
    }

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
