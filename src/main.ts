import { NestFactory } from '@nestjs/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AppModule } from './app.module';
import { getEnv } from './env';
import { registerAll } from './mcp/tool-registry';
import type { ToolRegistry } from './mcp/tool-registry';
import { KoreanTourInfoService } from './kto/korean-tour-info/korean-tour-info.service';
import { KOREAN_TOUR_INFO_TOOLS } from './kto/korean-tour-info/korean-tour-info.tools';
import { BarrierFreeTourInfoService } from './kto/barrier-free-tour-info/barrier-free-tour-info.service';
import { BARRIER_FREE_TOUR_INFO_TOOLS } from './kto/barrier-free-tour-info/barrier-free-tour-info.tools';
import { PhotoGalleryService } from './kto/photo-gallery/photo-gallery.service';
import { PHOTO_GALLERY_TOOLS } from './kto/photo-gallery/photo-gallery.tools';
import { GoCampingService } from './kto/go-camping/go-camping.service';
import { GO_CAMPING_TOOLS } from './kto/go-camping/go-camping.tools';
import { AudioGuideService } from './kto/audio-guide/audio-guide.service';
import { ODII_TOOLS } from './kto/audio-guide/audio-guide.tools';
import { DurunubiService } from './kto/durunubi/durunubi.service';
import { DURUNUBI_TOOLS } from './kto/durunubi/durunubi.tools';
import { PetTourService } from './kto/pet-tour/pet-tour.service';
import { PET_TOUR_TOOLS } from './kto/pet-tour/pet-tour.tools';
import { MedicalTourismService } from './kto/medical-tourism/medical-tourism.service';
import { MEDICAL_TOURISM_TOOLS } from './kto/medical-tourism/medical-tourism.tools';
import { WellnessTourismService } from './kto/wellness-tourism/wellness-tourism.service';
import { WELLNESS_TOURISM_TOOLS } from './kto/wellness-tourism/wellness-tourism.tools';
import { PhotoAwardService } from './kto/photo-award/photo-award.service';
import { PHOTO_AWARD_TOOLS } from './kto/photo-award/photo-award.tools';
import { StdioTransportAdapter } from './mcp/transports/stdio.adapter';
import { HttpStreamableTransportAdapter } from './mcp/transports/http-streamable.adapter';
import { HttpTransportAdapter } from './mcp/transports/http.adapter';
import { SessionCredentialsStore } from './mcp/session-credentials.store';

async function bootstrap() {
  // REQ-KTO-007: 환경변수 로드 — KTO_SERVICE_KEY는 모든 모드에서 선택 (SPEC-KTO-011)
  const env = getEnv();

  if (env.mcpTransportMode === 'stdio' && !env.ktoServiceKey) {
    console.error(
      '[kto-mcp] 경고: KTO_SERVICE_KEY가 설정되지 않았습니다. ' +
        'stdio 모드에서 도구 호출 시 missing-key 에러로 실패합니다. ' +
        'data.go.kr 서비스 키를 KTO_SERVICE_KEY 환경변수에 설정하세요.',
    );
  }

  // NestJS 애플리케이션 컨텍스트 생성 (HTTP 서버 미기동)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // SessionCredentialsStore DI 인스턴스 획득
  const store = app.get(SessionCredentialsStore);

  // 도구 레지스트리 빌드 (REQ-KTO-005, REQ-KTO-006, SPEC-KTO-002 ~ SPEC-KTO-010, SPEC-KTO-011)
  const koreanTourInfoService = app.get(KoreanTourInfoService);
  const barrierFreeTourInfoService = app.get(BarrierFreeTourInfoService);
  const photoGalleryService = app.get(PhotoGalleryService);
  const goCampingService = app.get(GoCampingService);
  const audioGuideService = app.get(AudioGuideService);
  const durunubiService = app.get(DurunubiService);
  const petTourService = app.get(PetTourService);
  const medicalTourismService = app.get(MedicalTourismService);
  const wellnessTourismService = app.get(WellnessTourismService);
  // KTO 10/10 — final API integration
  const photoAwardService = app.get(PhotoAwardService);

  const registries: ToolRegistry[] = [
    { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanTourInfoService },
    {
      tools: BARRIER_FREE_TOUR_INFO_TOOLS,
      service: barrierFreeTourInfoService,
    },
    { tools: PHOTO_GALLERY_TOOLS, service: photoGalleryService },
    { tools: GO_CAMPING_TOOLS, service: goCampingService },
    { tools: ODII_TOOLS, service: audioGuideService },
    { tools: DURUNUBI_TOOLS, service: durunubiService },
    { tools: PET_TOUR_TOOLS, service: petTourService },
    { tools: MEDICAL_TOURISM_TOOLS, service: medicalTourismService },
    { tools: WELLNESS_TOURISM_TOOLS, service: wellnessTourismService },
    { tools: PHOTO_AWARD_TOOLS, service: photoAwardService },
  ];

  // transport 선택 및 시작 (REQ-KTO-002)
  let adapter:
    | StdioTransportAdapter
    | HttpStreamableTransportAdapter
    | HttpTransportAdapter;

  const mode = env.mcpTransportMode;

  if (mode === 'stdio') {
    // stdio: 단일 세션 — 기존 단일 McpServer 플로우 유지
    const mcpServer = new McpServer({ name: 'kto-mcp', version: '0.1.0' });
    registerAll(mcpServer, registries, store);
    const stdioAdapter = app.get(StdioTransportAdapter);
    // SPEC-KTO-011: env 기반 creds가 있으면 __stdio_default__로 등록.
    // 키가 비어 있으면 register를 건너뛰고 도구 호출 시 missing-key로 실패한다.
    await stdioAdapter.start(
      mcpServer,
      env.ktoServiceKey
        ? {
            serviceKey: env.ktoServiceKey,
            preencoded: env.ktoServiceKeyPreencoded,
          }
        : undefined,
    );
    adapter = stdioAdapter;
  } else if (mode === 'http-streamable') {
    // HTTP: 세션별 McpServer 팩토리 — registries를 어댑터에 전달
    const httpAdapter = app.get(HttpStreamableTransportAdapter);
    await httpAdapter.start(registries, env.mcpHttpPort);
    adapter = httpAdapter;
    console.error(
      `[kto-mcp] HTTP streamable transport 시작 (port=${httpAdapter.getPort()})`,
    );
  } else if (mode === 'http-json') {
    const httpAdapter = app.get(HttpTransportAdapter);
    await httpAdapter.start(registries, env.mcpHttpPort);
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
