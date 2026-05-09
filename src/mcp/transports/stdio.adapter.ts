import { Injectable } from '@nestjs/common';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  type KtoCredentials,
  SessionCredentialsStore,
} from '../session-credentials.store';
import { STDIO_SESSION_ID } from '../session-credentials.store';

/**
 * stdio transport 어댑터.
 * stdin/stdout을 통해 MCP 클라이언트와 통신한다.
 * SPEC-KTO-011: start() 시 env 기반 credentials를 __stdio_default__ sessionId로 store에 등록.
 * HTTP 헤더 처리 로직 없음 (backward compat).
 */
@Injectable()
export class StdioTransportAdapter {
  private transport: StdioServerTransport | null = null;

  constructor(private readonly store: SessionCredentialsStore) {}

  /**
   * StdioServerTransport를 생성하고 McpServer에 연결한다.
   * credentials를 __stdio_default__ sessionId로 store에 등록한다.
   */
  async start(server: McpServer, credentials: KtoCredentials): Promise<void> {
    // stdio 전용 고정 sessionId로 env 기반 creds 등록
    // tool-registry가 extra.sessionId=undefined 시 STDIO_SESSION_ID로 fallback
    this.store.register(STDIO_SESSION_ID, credentials);

    this.transport = new StdioServerTransport();
    await server.connect(this.transport);
  }

  /**
   * transport를 닫는다. SIGINT/SIGTERM 수신 시 호출된다.
   */
  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.store.unregister(STDIO_SESSION_ID);
  }
}
