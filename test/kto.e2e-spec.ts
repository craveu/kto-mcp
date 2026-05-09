/**
 * KTO MCP 서버 E2E 테스트
 *
 * Phase 6: 다음을 검증한다:
 * 1. McpServer에 15개 도구가 모두 등록됨 (in-process 검증)
 * 2. HTTP transport가 initialize POST에 200으로 응답 (HTTP smoke test)
 * 3. DTO 검증 실패 시 outbound HTTP 호출이 발생하지 않음 (REQ-KTO-005)
 */

import 'reflect-metadata';

// 환경변수 설정 (실제 KTO API 호출 없이 테스트)
process.env['KTO_SERVICE_KEY'] = 'test-e2e-service-key';
process.env['MCP_TRANSPORT_MODE'] = 'http-json';

import { NestFactory } from '@nestjs/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import {
  type IncomingMessage,
  type ServerResponse,
  type Server as HttpServer,
  type ClientRequest,
} from 'http';
import { INestApplicationContext } from '@nestjs/common';

import { AppModule } from '../src/app.module';
import { registerAll } from '../src/mcp/tool-registry';
import { KoreanTourInfoService } from '../src/kto/korean-tour-info/korean-tour-info.service';
import { KOREAN_TOUR_INFO_TOOLS } from '../src/kto/korean-tour-info/korean-tour-info.tools';
import { BarrierFreeTourInfoService } from '../src/kto/barrier-free-tour-info/barrier-free-tour-info.service';
import { BARRIER_FREE_TOUR_INFO_TOOLS } from '../src/kto/barrier-free-tour-info/barrier-free-tour-info.tools';
import { PhotoGalleryService } from '../src/kto/photo-gallery/photo-gallery.service';
import { PHOTO_GALLERY_TOOLS } from '../src/kto/photo-gallery/photo-gallery.tools';
import { GoCampingService } from '../src/kto/go-camping/go-camping.service';
import { GO_CAMPING_TOOLS } from '../src/kto/go-camping/go-camping.tools';

/** HTTP POST 요청 헬퍼 */
function httpPost(
  port: number,
  body: string,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { request } = require('http') as typeof import('http');
    const req: ClientRequest = request(
      {
        hostname: 'localhost',
        port,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'Content-Length': String(Buffer.byteLength(body)),
        },
      },
      (res: IncomingMessage) => {
        const parts: Buffer[] = [];
        res.on('data', (c: Buffer) => parts.push(c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(
              Buffer.concat(parts).toString(),
            ) as unknown;
            resolve({ status: res.statusCode ?? 0, body: parsed });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: null });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** 테스트용 HTTP MCP 서버 생성 헬퍼 */
async function createTestHttpServer(
  korService: KoreanTourInfoService,
  bfService: BarrierFreeTourInfoService,
  photoService?: PhotoGalleryService,
): Promise<{
  port: number;
  httpServer: HttpServer;
  cleanup: () => Promise<void>;
}> {
  // 새 McpServer + transport 생성 (stateless 1회 사용)
  const mcpServer = new McpServer({ name: 'kto-mcp-e2e', version: '0.1.0' });
  const registries: Parameters<typeof registerAll>[1] = [
    { tools: KOREAN_TOUR_INFO_TOOLS, service: korService },
    { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: bfService },
  ];
  if (photoService) {
    registries.push({ tools: PHOTO_GALLERY_TOOLS, service: photoService });
  }
  registerAll(mcpServer, registries);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await mcpServer.connect(transport);

  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString()) as unknown;
          void transport.handleRequest(req, res, body);
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
    },
  );

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };

  const cleanup = async () => {
    await new Promise<void>((resolve, reject) =>
      httpServer.close((e) => (e ? reject(e) : resolve())),
    );
    await transport.close().catch(() => {
      /* 무시 */
    });
  };

  return { port: addr.port, httpServer, cleanup };
}

describe('KTO MCP E2E', () => {
  let appContext: INestApplicationContext;
  let service: KoreanTourInfoService;
  let barrierFreeService: BarrierFreeTourInfoService;
  let photoGalleryService: PhotoGalleryService;
  let goCampingService: GoCampingService;

  beforeAll(async () => {
    appContext = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    service = appContext.get(KoreanTourInfoService);
    barrierFreeService = appContext.get(BarrierFreeTourInfoService);
    photoGalleryService = appContext.get(PhotoGalleryService);
    goCampingService = appContext.get(GoCampingService);
  });

  afterAll(async () => {
    await appContext.close();
  });

  describe('도구 등록 검증', () => {
    it('McpServer에 34개 KTO 도구(kto_korean_* 15개 + kto_barrier_free_* 10개 + kto_photo_* 4개 + kto_camping_* 5개)가 모두 등록된다 (acceptance criterion 1)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      expect(Object.keys(server._registeredTools).length).toBe(34);
    });

    it('kto_korean_* 도구 15개와 kto_barrier_free_* 도구 10개와 kto_photo_* 도구와 kto_camping_* 도구가 모두 포함된다', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-test-2',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const registeredNames = Object.keys(server._registeredTools);

      for (const expectedTool of KOREAN_TOUR_INFO_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of BARRIER_FREE_TOUR_INFO_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of PHOTO_GALLERY_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of GO_CAMPING_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      // 필수 도구 개별 확인
      expect(registeredNames).toContain('kto_barrier_free_detailWithTour2');
      expect(registeredNames).toContain('kto_photo_galleryList1');
      expect(registeredNames).toContain('kto_photo_galleryDetailList1');
      expect(registeredNames).toContain('kto_photo_gallerySearchList1');
      expect(registeredNames).toContain('kto_photo_gallerySyncDetailList1');
      // 고캠핑 도구 개별 확인
      expect(registeredNames).toContain('kto_camping_basedList');
      expect(registeredNames).toContain('kto_camping_basedSyncList');
      expect(registeredNames).toContain('kto_camping_locationBasedList');
      expect(registeredNames).toContain('kto_camping_searchList');
      expect(registeredNames).toContain('kto_camping_imageList');
    });

    it('kto_photo_galleryDetailList1 호출 시 galContentId 누락이면 outbound 없이 검증 에러를 반환한다 (REQ-UNW-001)', async () => {
      const mockPhotoService = {
        galleryDetailList1: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as PhotoGalleryService;

      const mcpServer2 = new McpServer({
        name: 'kto-mcp-photo-dto-test',
        version: '0.1.0',
      });
      registerAll(mcpServer2, [
        { tools: PHOTO_GALLERY_TOOLS, service: mockPhotoService },
      ]);

      const internalServer = mcpServer2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_photo_galleryDetailList1'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({})) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('title');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPhotoService.galleryDetailList1).not.toHaveBeenCalled();
    });
  });

  describe('HTTP transport smoke test (acceptance criterion 2)', () => {
    it('POST /mcp initialize 요청이 200을 반환한다', async () => {
      const { port, cleanup } = await createTestHttpServer(
        service,
        barrierFreeService,
      );

      try {
        const payload = JSON.stringify({
          jsonrpc: '2.0',
          id: randomUUID(),
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0.0' },
          },
        });

        const result = await httpPost(port, payload);

        expect(result.status).toBe(200);
        const body = result.body as {
          result?: { protocolVersion?: string; serverInfo?: unknown };
        };
        expect(body.result?.protocolVersion).toBeDefined();
        expect(body.result?.serverInfo).toBeDefined();
      } finally {
        await cleanup();
      }
    });
  });

  describe('DTO 검증 (acceptance criterion 8)', () => {
    it('contentId 미입력 시 서비스 메서드를 호출하지 않고 MCP 오류를 반환한다 (in-process 검증)', async () => {
      // in-process 검증: HTTP 레이어 없이 tool-registry의 DTO 검증 로직을 직접 확인
      const mockService2 = {
        detailCommon2: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as KoreanTourInfoService;

      const mcpServer2 = new McpServer({
        name: 'kto-mcp-dto-inprocess',
        version: '0.1.0',
      });
      registerAll(mcpServer2, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: mockService2 },
      ]);

      // _registeredTools에서 detailCommon2 핸들러를 직접 호출
      const internalServer = mcpServer2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_korean_detailCommon2'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({})) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('contentId');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockService2.detailCommon2).not.toHaveBeenCalled();
    });

    it('(HTTP) contentId 미입력 시 MCP 오류를 반환한다', async () => {
      // 모킹된 service: detailCommon2가 호출되면 에러 발생 → 테스트 실패 감지
      const mockService = {
        ...service,
        detailCommon2: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as KoreanTourInfoService;

      const mcpServer = new McpServer({
        name: 'kto-mcp-dto-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: mockService },
      ]);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await mcpServer.connect(transport);

      const httpServer = createServer(
        (req: IncomingMessage, res: ServerResponse) => {
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', () => {
            const body = JSON.parse(
              Buffer.concat(chunks).toString(),
            ) as unknown;
            void transport.handleRequest(req, res, body);
          });
        },
      );

      await new Promise<void>((resolve) => httpServer.listen(0, resolve));
      const addr = httpServer.address() as { port: number };
      const testPort = addr.port;

      try {
        const payload = JSON.stringify({
          jsonrpc: '2.0',
          id: randomUUID(),
          method: 'tools/call',
          params: {
            name: 'kto_korean_detailCommon2',
            arguments: {}, // contentId 누락
          },
        });

        const result = await httpPost(testPort, payload);

        expect(result.status).toBe(200);
        const body = result.body as {
          result?: { isError?: boolean; content?: Array<{ text: string }> };
        };
        // isError: true 이면 DTO 검증 또는 서비스 오류로 인한 실패
        expect(body.result?.isError).toBe(true);
        // 오류 내용에 검증 관련 메시지나 서비스 미호출 오류가 포함되어야 함
        expect(body.result?.content?.[0]?.text).toBeTruthy();

        // REQ-KTO-005: 검증 실패 시 outbound HTTP 호출 발생 X
        // (isError 응답으로 서비스 메서드 미호출 확인 — 더 세밀한 검증은 in-process 테스트에서)
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockService.detailCommon2).not.toHaveBeenCalled();
      } finally {
        await new Promise<void>((resolve, reject) =>
          httpServer.close((e) => (e ? reject(e) : resolve())),
        );
        await transport.close().catch(() => {
          /* 무시 */
        });
      }
    });
  });
});
