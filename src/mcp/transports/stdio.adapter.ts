import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * stdio transport 어댑터.
 * stdin/stdout을 통해 MCP 클라이언트와 통신한다.
 */
export class StdioTransportAdapter {
  private transport: StdioServerTransport | null = null;

  /**
   * StdioServerTransport를 생성하고 McpServer에 연결한다.
   */
  async start(server: McpServer): Promise<void> {
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
  }
}
