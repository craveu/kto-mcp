import { NestFactory } from '@nestjs/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AppModule } from './app.module';
import { getEnv } from './env';
import { registerAll } from './mcp/tool-registry';
import { KoreanTourInfoService } from './kto/korean-tour-info/korean-tour-info.service';
import { StdioTransportAdapter } from './mcp/transports/stdio.adapter';
import { HttpStreamableTransportAdapter } from './mcp/transports/http-streamable.adapter';
import { HttpTransportAdapter } from './mcp/transports/http.adapter';

async function bootstrap() {
  // REQ-KTO-007: 환경변수 로드 — KTO_SERVICE_KEY 누락 시 즉시 throw (REQ-UNW-001)
  const env = getEnv();

  // NestJS 애플리케이션 컨텍스트 생성 (HTTP 서버 미기동)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // MCP 서버 생성
  const mcpServer = new McpServer({
    name: 'kto-mcp',
    version: '0.1.0',
  });

  // 도구 등록 (REQ-KTO-005, REQ-KTO-006)
  const service = app.get(KoreanTourInfoService);
  registerAll(mcpServer, service);

  // transport 선택 및 시작 (REQ-KTO-002)
  let adapter:
    | StdioTransportAdapter
    | HttpStreamableTransportAdapter
    | HttpTransportAdapter;

  const mode = env.mcpTransportMode;

  if (mode === 'stdio') {
    const stdioAdapter = app.get(StdioTransportAdapter);
    await stdioAdapter.start(mcpServer);
    adapter = stdioAdapter;
  } else if (mode === 'http-streamable') {
    const httpAdapter = app.get(HttpStreamableTransportAdapter);
    await httpAdapter.start(mcpServer, env.mcpHttpPort);
    adapter = httpAdapter;
    console.error(
      `[kto-mcp] HTTP streamable transport 시작 (port=${httpAdapter.getPort()})`,
    );
  } else if (mode === 'http-json') {
    const httpAdapter = app.get(HttpTransportAdapter);
    await httpAdapter.start(mcpServer, env.mcpHttpPort);
    adapter = httpAdapter;
    console.error(
      `[kto-mcp] HTTP JSON transport 시작 (port=${httpAdapter.getPort()})`,
    );
  } else {
    console.error(`[kto-mcp] 알 수 없는 MCP_TRANSPORT_MODE: ${mode}`);
    await app.close();
    process.exit(1);
  }

  // SIGINT/SIGTERM graceful shutdown (REQ-EVT-002)
  const shutdown = async (sig: string) => {
    console.error(`[kto-mcp] ${sig} 수신, 종료 중...`);
    try {
      await adapter.stop();
    } catch {
      /* transport 종료 오류 무시 */
    }
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err: unknown) => {
  console.error('[kto-mcp] 부트스트랩 실패:', err);
  process.exit(1);
});
