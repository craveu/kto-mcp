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
import { AudioGuideService } from '../src/kto/audio-guide/audio-guide.service';
import { ODII_TOOLS } from '../src/kto/audio-guide/audio-guide.tools';
import { DurunubiService } from '../src/kto/durunubi/durunubi.service';
import { DURUNUBI_TOOLS } from '../src/kto/durunubi/durunubi.tools';
import { PetTourService } from '../src/kto/pet-tour/pet-tour.service';
import { PET_TOUR_TOOLS } from '../src/kto/pet-tour/pet-tour.tools';
import { MedicalTourismService } from '../src/kto/medical-tourism/medical-tourism.service';
import { MEDICAL_TOURISM_TOOLS } from '../src/kto/medical-tourism/medical-tourism.tools';
import { WellnessTourismService } from '../src/kto/wellness-tourism/wellness-tourism.service';
import { WELLNESS_TOURISM_TOOLS } from '../src/kto/wellness-tourism/wellness-tourism.tools';
import { PhotoAwardService } from '../src/kto/photo-award/photo-award.service';
import { PHOTO_AWARD_TOOLS } from '../src/kto/photo-award/photo-award.tools';

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
  let audioGuideService: AudioGuideService;
  let durunubiService: DurunubiService;
  let petTourService: PetTourService;
  let medicalTourismService: MedicalTourismService;
  let wellnessTourismService: WellnessTourismService;
  let photoAwardService: PhotoAwardService;

  beforeAll(async () => {
    appContext = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    service = appContext.get(KoreanTourInfoService);
    barrierFreeService = appContext.get(BarrierFreeTourInfoService);
    photoGalleryService = appContext.get(PhotoGalleryService);
    goCampingService = appContext.get(GoCampingService);
    audioGuideService = appContext.get(AudioGuideService);
    durunubiService = appContext.get(DurunubiService);
    petTourService = appContext.get(PetTourService);
    medicalTourismService = appContext.get(MedicalTourismService);
    wellnessTourismService = appContext.get(WellnessTourismService);
    photoAwardService = appContext.get(PhotoAwardService);
  });

  afterAll(async () => {
    await appContext.close();
  });

  describe('도구 등록 검증', () => {
    it('McpServer에 65개 KTO 도구(kto_korean_* 15개 + kto_barrier_free_* 10개 + kto_photo_* 4개 + kto_camping_* 5개 + kto_audio_* 8개 + kto_durunubi_* 2개 + kto_pet_* 4개 + kto_medical_* 7개 + kto_wellness_* 8개 + kto_contest_* 2개)가 모두 등록된다 (acceptance criterion 1)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
        { tools: ODII_TOOLS, service: audioGuideService },
        { tools: DURUNUBI_TOOLS, service: durunubiService },
        { tools: PET_TOUR_TOOLS, service: petTourService },
        { tools: MEDICAL_TOURISM_TOOLS, service: medicalTourismService },
        { tools: WELLNESS_TOURISM_TOOLS, service: wellnessTourismService },
        { tools: PHOTO_AWARD_TOOLS, service: photoAwardService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      expect(Object.keys(server._registeredTools).length).toBe(65);
    });

    it('kto_durunubi_* 도구가 정확히 2개여야 한다 (SPEC-KTO-006 Scenario 2)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-durunubi-count-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
        { tools: ODII_TOOLS, service: audioGuideService },
        { tools: DURUNUBI_TOOLS, service: durunubiService },
        { tools: PET_TOUR_TOOLS, service: petTourService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const durunubiTools = Object.keys(server._registeredTools).filter(
        (name) => name.startsWith('kto_durunubi_'),
      );
      expect(durunubiTools).toHaveLength(2);
    });

    it('kto_durunubi_courseList: numOfRows=0 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, Scenario 5)', async () => {
      const mockDurunubiService = {
        courseList: jest.fn().mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as DurunubiService;

      const mcpServer4 = new McpServer({
        name: 'kto-mcp-durunubi-dto-test',
        version: '0.1.0',
      });
      registerAll(mcpServer4, [
        { tools: DURUNUBI_TOOLS, service: mockDurunubiService },
      ]);

      const internalServer = mcpServer4 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_durunubi_courseList'];
      expect(toolEntry).toBeDefined();

      // numOfRows=0 전달 — REQ-UNW-001: KTO 호출 차단
      const result = (await toolEntry.handler({ numOfRows: 0 })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDurunubiService.courseList).not.toHaveBeenCalled();
    });

    it('kto_korean_* 15 + kto_barrier_free_* 10 + kto_photo_* 4 + kto_camping_* 5 + kto_audio_* 8 + kto_durunubi_* 2 + kto_pet_* 4 + kto_medical_* 7 + kto_wellness_* 8 + kto_contest_* 2 도구가 모두 포함된다', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-test-2',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
        { tools: ODII_TOOLS, service: audioGuideService },
        { tools: DURUNUBI_TOOLS, service: durunubiService },
        { tools: PET_TOUR_TOOLS, service: petTourService },
        { tools: MEDICAL_TOURISM_TOOLS, service: medicalTourismService },
        { tools: WELLNESS_TOURISM_TOOLS, service: wellnessTourismService },
        { tools: PHOTO_AWARD_TOOLS, service: photoAwardService },
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
      for (const expectedTool of ODII_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of DURUNUBI_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of PET_TOUR_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      for (const expectedTool of MEDICAL_TOURISM_TOOLS) {
        expect(registeredNames).toContain(expectedTool.name);
      }
      // 두루누비 도구 개별 확인
      expect(registeredNames).toContain('kto_durunubi_courseList');
      expect(registeredNames).toContain('kto_durunubi_routeList');
      // 반려동물 도구 개별 확인 (kto_pet_* 4개)
      expect(registeredNames).toContain('kto_pet_areaBasedList2');
      expect(registeredNames).toContain('kto_pet_locationBasedList2');
      expect(registeredNames).toContain('kto_pet_searchKeyword2');
      expect(registeredNames).toContain('kto_pet_petTourSyncList2');
      // 의료관광 도구 개별 확인 (kto_medical_* 7개)
      expect(registeredNames).toContain('kto_medical_areaBasedList');
      expect(registeredNames).toContain('kto_medical_locationBasedList');
      expect(registeredNames).toContain('kto_medical_searchKeyword');
      expect(registeredNames).toContain('kto_medical_mdclTursmSyncList');
      expect(registeredNames).toContain('kto_medical_detailMdclTursm');
      expect(registeredNames).toContain('kto_medical_detailCommon');
      expect(registeredNames).toContain('kto_medical_detailIntro');
      // 웰니스관광 도구 개별 확인 (kto_wellness_* 8개)
      expect(registeredNames).toContain('kto_wellness_areaBasedList');
      expect(registeredNames).toContain('kto_wellness_locationBasedList');
      expect(registeredNames).toContain('kto_wellness_searchKeyword');
      expect(registeredNames).toContain('kto_wellness_wellnessTursmSyncList');
      expect(registeredNames).toContain('kto_wellness_detailCommon');
      expect(registeredNames).toContain('kto_wellness_detailIntro');
      expect(registeredNames).toContain('kto_wellness_detailInfo');
      expect(registeredNames).toContain('kto_wellness_detailImage');
      // 관광공모전 도구 개별 확인 (kto_contest_* 2개)
      expect(registeredNames).toContain('kto_contest_phokoAwrdList');
      expect(registeredNames).toContain('kto_contest_phokoAwrdSyncList');
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
      // 오디오 가이드 도구 개별 확인 (kto_audio_* 8개)
      expect(registeredNames).toContain('kto_audio_storyBasedList');
      expect(registeredNames).toContain('kto_audio_storyBasedSyncList');
      expect(registeredNames).toContain('kto_audio_storyLocationBasedList');
      expect(registeredNames).toContain('kto_audio_storySearchList');
      expect(registeredNames).toContain('kto_audio_themeBasedList');
      expect(registeredNames).toContain('kto_audio_themeBasedSyncList');
      expect(registeredNames).toContain('kto_audio_themeLocationBasedList');
      expect(registeredNames).toContain('kto_audio_themeSearchList');
    });

    it('kto_audio_* 도구가 정확히 8개여야 한다 (SPEC-KTO-005 Scenario 2)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-audio-count-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
        { tools: ODII_TOOLS, service: audioGuideService },
        { tools: DURUNUBI_TOOLS, service: durunubiService },
        { tools: PET_TOUR_TOOLS, service: petTourService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const audioTools = Object.keys(server._registeredTools).filter((name) =>
        name.startsWith('kto_audio_'),
      );
      expect(audioTools).toHaveLength(8);
    });

    it('kto_pet_* 도구가 정확히 4개여야 한다 (SPEC-KTO-007 Scenario 2)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-pet-count-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: service },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
        { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
        { tools: GO_CAMPING_TOOLS, service: goCampingService },
        { tools: ODII_TOOLS, service: audioGuideService },
        { tools: DURUNUBI_TOOLS, service: durunubiService },
        { tools: PET_TOUR_TOOLS, service: petTourService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const petTools = Object.keys(server._registeredTools).filter((name) =>
        name.startsWith('kto_pet_'),
      );
      expect(petTools).toHaveLength(4);
    });

    it('kto_medical_* 도구가 정확히 7개여야 한다 (SPEC-KTO-008 Scenario 2)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-medical-count-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: MEDICAL_TOURISM_TOOLS, service: medicalTourismService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const medicalTools = Object.keys(server._registeredTools).filter((name) =>
        name.startsWith('kto_medical_'),
      );
      expect(medicalTools).toHaveLength(7);
    });

    it('kto_wellness_* 도구가 정확히 8개여야 한다 (SPEC-KTO-009 S2)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-wellness-count-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: WELLNESS_TOURISM_TOOLS, service: wellnessTourismService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      const wellnessTools = Object.keys(server._registeredTools).filter(
        (name) => name.startsWith('kto_wellness_'),
      );
      expect(wellnessTools).toHaveLength(8);
    });

    it('kto_wellness_ldongCode 도구가 존재하지 않아야 한다 (R1 정책)', () => {
      const mcpServer = new McpServer({
        name: 'kto-mcp-wellness-ldong-test',
        version: '0.1.0',
      });
      registerAll(mcpServer, [
        { tools: WELLNESS_TOURISM_TOOLS, service: wellnessTourismService },
      ]);

      const server = mcpServer as unknown as {
        _registeredTools: Record<string, unknown>;
      };
      expect(Object.keys(server._registeredTools)).not.toContain(
        'kto_wellness_ldongCode',
      );
    });

    it('kto_wellness_areaBasedList: langDivCd 누락 시 MCP 오류를 반환한다 (SPEC-KTO-009 REQ-UNW-001, S4)', async () => {
      const mockWellnessService = {
        areaBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as WellnessTourismService;

      const mcpServerW1 = new McpServer({
        name: 'kto-mcp-wellness-area-test',
        version: '0.1.0',
      });
      registerAll(mcpServerW1, [
        { tools: WELLNESS_TOURISM_TOOLS, service: mockWellnessService },
      ]);

      const internalServer = mcpServerW1 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_wellness_areaBasedList'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({})) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWellnessService.areaBasedList).not.toHaveBeenCalled();
    });

    it('kto_wellness_detailIntro: contentTypeId 누락 시 MCP 오류를 반환한다 (SPEC-KTO-009 S5)', async () => {
      const mockWellnessService = {
        detailIntro: jest.fn().mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as WellnessTourismService;

      const mcpServerW2 = new McpServer({
        name: 'kto-mcp-wellness-detail-intro-test',
        version: '0.1.0',
      });
      registerAll(mcpServerW2, [
        { tools: WELLNESS_TOURISM_TOOLS, service: mockWellnessService },
      ]);

      const internalServer = mcpServerW2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_wellness_detailIntro'];
      expect(toolEntry).toBeDefined();

      // langDivCd/contentId 있음, contentTypeId 없음
      const result = (await toolEntry.handler({
        langDivCd: 'KOR',
        contentId: '2994116',
      })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWellnessService.detailIntro).not.toHaveBeenCalled();
    });

    it('kto_wellness_detailInfo: contentTypeId 누락 시 MCP 오류를 반환한다 (SPEC-KTO-009 S5)', async () => {
      const mockWellnessService = {
        detailInfo: jest.fn().mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as WellnessTourismService;

      const mcpServerW3 = new McpServer({
        name: 'kto-mcp-wellness-detail-info-test',
        version: '0.1.0',
      });
      registerAll(mcpServerW3, [
        { tools: WELLNESS_TOURISM_TOOLS, service: mockWellnessService },
      ]);

      const internalServer = mcpServerW3 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_wellness_detailInfo'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({
        langDivCd: 'KOR',
        contentId: '2994116',
      })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWellnessService.detailInfo).not.toHaveBeenCalled();
    });

    it('kto_wellness_locationBasedList: langDivCd만 전달 시 MCP 오류를 반환한다 (mapX/mapY/radius missing)', async () => {
      const mockWellnessService = {
        locationBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as WellnessTourismService;

      const mcpServerW4 = new McpServer({
        name: 'kto-mcp-wellness-location-test',
        version: '0.1.0',
      });
      registerAll(mcpServerW4, [
        { tools: WELLNESS_TOURISM_TOOLS, service: mockWellnessService },
      ]);

      const internalServer = mcpServerW4 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_wellness_locationBasedList'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockWellnessService.locationBasedList).not.toHaveBeenCalled();
    });

    it('kto_medical_areaBasedList: langDivCd 누락 시 MCP 오류를 반환한다 (SPEC-KTO-008 REQ-UNW-001)', async () => {
      const mockMedicalService = {
        areaBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed1 = new McpServer({
        name: 'kto-mcp-medical-area-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed1, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed1 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_areaBasedList'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({})) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.areaBasedList).not.toHaveBeenCalled();
    });

    it('kto_medical_locationBasedList: langDivCd만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, mapX/mapY/radius missing)', async () => {
      const mockMedicalService = {
        locationBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed2 = new McpServer({
        name: 'kto-mcp-medical-location-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed2, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_locationBasedList'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.locationBasedList).not.toHaveBeenCalled();
    });

    it('kto_medical_searchKeyword: langDivCd만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, keyword missing)', async () => {
      const mockMedicalService = {
        searchKeyword: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed3 = new McpServer({
        name: 'kto-mcp-medical-search-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed3, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed3 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_searchKeyword'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.searchKeyword).not.toHaveBeenCalled();
    });

    it('kto_medical_detailMdclTursm: langDivCd만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, contentId missing)', async () => {
      const mockMedicalService = {
        detailMdclTursm: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed4 = new McpServer({
        name: 'kto-mcp-medical-detail-mdcl-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed4, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed4 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_detailMdclTursm'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.detailMdclTursm).not.toHaveBeenCalled();
    });

    it('kto_medical_detailCommon: langDivCd만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, contentId missing)', async () => {
      const mockMedicalService = {
        detailCommon: jest.fn().mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed5 = new McpServer({
        name: 'kto-mcp-medical-detail-common-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed5, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed5 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_detailCommon'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.detailCommon).not.toHaveBeenCalled();
    });

    it('kto_medical_detailIntro: langDivCd만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, contentId missing)', async () => {
      const mockMedicalService = {
        detailIntro: jest.fn().mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed6 = new McpServer({
        name: 'kto-mcp-medical-detail-intro-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed6, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed6 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_detailIntro'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ langDivCd: 'KOR' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.detailIntro).not.toHaveBeenCalled();
    });

    it('kto_medical_areaBasedList: numOfRows=0 전달 시 MCP 오류를 반환한다 (REQ-UNW-001)', async () => {
      const mockMedicalService = {
        areaBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as MedicalTourismService;

      const mcpServerMed7 = new McpServer({
        name: 'kto-mcp-medical-area-rows-test',
        version: '0.1.0',
      });
      registerAll(mcpServerMed7, [
        { tools: MEDICAL_TOURISM_TOOLS, service: mockMedicalService },
      ]);

      const internalServer = mcpServerMed7 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_medical_areaBasedList'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({
        langDivCd: 'KOR',
        numOfRows: 0,
      })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMedicalService.areaBasedList).not.toHaveBeenCalled();
    });

    it('kto_pet_locationBasedList2: mapX만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, mapY/radius missing)', async () => {
      const mockPetService = {
        locationBasedList2: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as PetTourService;

      const mcpServerPet1 = new McpServer({
        name: 'kto-mcp-pet-location-test',
        version: '0.1.0',
      });
      registerAll(mcpServerPet1, [
        { tools: PET_TOUR_TOOLS, service: mockPetService },
      ]);

      const internalServer = mcpServerPet1 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_pet_locationBasedList2'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ mapX: 126.9779 })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPetService.locationBasedList2).not.toHaveBeenCalled();
    });

    it('kto_pet_searchKeyword2: keyword 미입력 시 MCP 오류를 반환한다 (REQ-UNW-001)', async () => {
      const mockPetService = {
        searchKeyword2: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as PetTourService;

      const mcpServerPet2 = new McpServer({
        name: 'kto-mcp-pet-search-test',
        version: '0.1.0',
      });
      registerAll(mcpServerPet2, [
        { tools: PET_TOUR_TOOLS, service: mockPetService },
      ]);

      const internalServer = mcpServerPet2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_pet_searchKeyword2'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({})) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPetService.searchKeyword2).not.toHaveBeenCalled();
    });

    it('kto_pet_areaBasedList2: numOfRows=0 전달 시 MCP 오류를 반환한다 (REQ-UNW-001)', async () => {
      const mockPetService = {
        areaBasedList2: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as PetTourService;

      const mcpServerPet3 = new McpServer({
        name: 'kto-mcp-pet-area-test',
        version: '0.1.0',
      });
      registerAll(mcpServerPet3, [
        { tools: PET_TOUR_TOOLS, service: mockPetService },
      ]);

      const internalServer = mcpServerPet3 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_pet_areaBasedList2'];
      expect(toolEntry).toBeDefined();

      const result = (await toolEntry.handler({ numOfRows: 0 })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPetService.areaBasedList2).not.toHaveBeenCalled();
    });

    it('kto_audio_storyLocationBasedList: langCode만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, Scenario 4)', async () => {
      const mockAudioService = {
        storyLocationBasedList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as AudioGuideService;

      const mcpServer2 = new McpServer({
        name: 'kto-mcp-audio-dto-test',
        version: '0.1.0',
      });
      registerAll(mcpServer2, [
        { tools: ODII_TOOLS, service: mockAudioService },
      ]);

      const internalServer = mcpServer2 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_audio_storyLocationBasedList'];
      expect(toolEntry).toBeDefined();

      // langCode만 전달, mapX/mapY/radius 누락
      const result = (await toolEntry.handler({ langCode: 'ko' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioService.storyLocationBasedList).not.toHaveBeenCalled();
    });

    it('kto_audio_themeSearchList: langCode만 전달 시 MCP 오류를 반환한다 (REQ-UNW-001, Scenario 5)', async () => {
      const mockAudioService = {
        themeSearchList: jest
          .fn()
          .mockRejectedValue(new Error('SHOULD_NOT_CALL')),
      } as unknown as AudioGuideService;

      const mcpServer3 = new McpServer({
        name: 'kto-mcp-audio-theme-search-test',
        version: '0.1.0',
      });
      registerAll(mcpServer3, [
        { tools: ODII_TOOLS, service: mockAudioService },
      ]);

      const internalServer = mcpServer3 as unknown as {
        _registeredTools: Record<
          string,
          { handler: (args: Record<string, unknown>) => Promise<unknown> }
        >;
      };
      const toolEntry =
        internalServer._registeredTools['kto_audio_themeSearchList'];
      expect(toolEntry).toBeDefined();

      // langCode만 전달, keyword 누락
      const result = (await toolEntry.handler({ langCode: 'ko' })) as {
        isError?: boolean;
        content?: Array<{ text: string }>;
      };

      expect(result.isError).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAudioService.themeSearchList).not.toHaveBeenCalled();
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
