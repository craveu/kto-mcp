import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server as HttpServer,
} from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Streamable HTTP (SSE) transport 어댑터.
 * enableJsonResponse: false — SSE 스트리밍 모드로 동작한다.
 * server에 connect()된 transport로 단일 세션을 처리한다.
 * MCP_TRANSPORT_MODE=http-streamable 일 때 선택된다.
 */
export class HttpStreamableTransportAdapter {
  private httpServer: HttpServer | null = null;
  private transport: StreamableHTTPServerTransport | null = null;
  private port = 0;

  async start(server: McpServer, port: number): Promise<void> {
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: false, // SSE 스트리밍 모드
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

    if (
      req.method === 'POST' ||
      req.method === 'GET' ||
      req.method === 'DELETE'
    ) {
      let body: unknown;
      if (req.method === 'POST') {
        body = await readBody(req);
      }
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
