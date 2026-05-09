import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { KOREAN_TOUR_INFO_TOOLS } from '../kto/korean-tour-info/korean-tour-info.tools';
import { BARRIER_FREE_TOUR_INFO_TOOLS } from '../kto/barrier-free-tour-info/barrier-free-tour-info.tools';
import { registerAll } from './tool-registry';
import { KtoApiError, KtoValidationError } from '../kto/common/kto-error';
import {
  SessionCredentialsStore,
  STDIO_SESSION_ID,
} from './session-credentials.store';
import type { KtoCredentials } from './session-credentials.store';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';

type ToolHandler = (
  args: Record<string, unknown>,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => Promise<unknown>;

const testCredentials: KtoCredentials = {
  serviceKey: 'TEST_KEY_1234',
  preencoded: false,
};

/** extra with sessionId registered in store */
const makeExtra = (
  sessionId: string,
): RequestHandlerExtra<ServerRequest, ServerNotification> =>
  ({
    sessionId,
    signal: new AbortController().signal,
    requestId: 'req-1',
  }) as RequestHandlerExtra<ServerRequest, ServerNotification>;

describe('registerAll()', () => {
  let mcpServer: jest.Mocked<McpServer>;
  let koreanService: Record<string, jest.Mock>;
  let barrierFreeService: Record<string, jest.Mock>;
  let store: SessionCredentialsStore;

  beforeEach(() => {
    // McpServer 모킹 — registerTool 호출 추적
    mcpServer = {
      registerTool: jest.fn(),
    } as unknown as jest.Mocked<McpServer>;

    // KoreanTourInfoService 모킹
    koreanService = {};
    for (const tool of KOREAN_TOUR_INFO_TOOLS) {
      koreanService[tool.methodName] = jest.fn();
    }

    // BarrierFreeTourInfoService 모킹
    barrierFreeService = {};
    for (const tool of BARRIER_FREE_TOUR_INFO_TOOLS) {
      barrierFreeService[tool.methodName] = jest.fn();
    }

    // SessionCredentialsStore 생성 및 stdio 기본 creds 등록
    store = new SessionCredentialsStore();
    store.register(STDIO_SESSION_ID, testCredentials);
  });

  it('15개 KTO 도구와 10개 무장애 도구를 합쳐 25개를 McpServer에 등록한다', () => {
    registerAll(
      mcpServer,
      [
        { tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService },
        { tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService },
      ],
      store,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mcpServer.registerTool).toHaveBeenCalledTimes(25);
    const names = (mcpServer.registerTool as jest.Mock).mock.calls.map(
      (call: unknown[]) => call[0],
    );
    // 한국 관광정보 도구 15개 포함 확인
    for (const tool of KOREAN_TOUR_INFO_TOOLS) {
      expect(names).toContain(tool.name);
    }
    // 무장애 도구 10개 포함 확인
    for (const tool of BARRIER_FREE_TOUR_INFO_TOOLS) {
      expect(names).toContain(tool.name);
    }
  });

  it('단일 레지스트리 사용 시 15개 도구를 등록한다 (하위 호환 패턴)', () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mcpServer.registerTool).toHaveBeenCalledTimes(15);
    const names = (mcpServer.registerTool as jest.Mock).mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(names).toEqual(KOREAN_TOUR_INFO_TOOLS.map((t) => t.name));
  });

  it('도구 핸들러가 서비스 메서드를 호출하고 결과를 MCP 형식으로 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    // 첫 번째 도구 (areaBasedList2) 핸들러 추출
    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    const mockResult = { items: { item: [{ contentid: '123' }] } };
    koreanService['areaBasedList2'].mockResolvedValue(mockResult);

    const result = (await handler(
      { areaCode: '1' },
      makeExtra(STDIO_SESSION_ID),
    )) as {
      content: Array<{ type: string; text: string }>;
    };

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text) as unknown;
    expect(parsed).toEqual(mockResult);
  });

  it('credentials이 store에 있으면 서비스 메서드를 credentials와 함께 호출한다', async () => {
    const sessionId = 'http-session-001';
    store.register(sessionId, testCredentials);

    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    koreanService['areaBasedList2'].mockResolvedValue({ items: [] });

    await handler({ areaCode: '1' }, makeExtra(sessionId));

    // 서비스 메서드가 credentials와 함께 호출됐는지 검증
    expect(koreanService['areaBasedList2']).toHaveBeenCalledWith(
      expect.anything(), // dto
      testCredentials,
    );
  });

  it('sessionId가 store에 없으면 KtoServiceKeyMissingError 메시지를 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    const result = (await handler(
      { areaCode: '1' },
      makeExtra('unknown-session-xyz'),
    )) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('KTO service key not provided');
    expect(koreanService['areaBasedList2']).not.toHaveBeenCalled();
  });

  it('sessionId가 undefined이면 STDIO_SESSION_ID로 fallback한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    koreanService['areaBasedList2'].mockResolvedValue({ items: [] });

    // extra without sessionId (simulates stdio or stateless mode)
    const extraWithoutSessionId = {
      signal: new AbortController().signal,
      requestId: 'req-2',
    } as unknown as RequestHandlerExtra<ServerRequest, ServerNotification>;

    await handler({ areaCode: '1' }, extraWithoutSessionId);

    // STDIO_SESSION_ID의 credentials로 서비스가 호출되어야 함
    expect(koreanService['areaBasedList2']).toHaveBeenCalledWith(
      expect.anything(),
      testCredentials,
    );
  });

  it('KtoApiError 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    koreanService['areaBasedList2'].mockRejectedValue(
      new KtoApiError('30', 400, '서비스 키 미등록', true),
    );

    const result = (await handler({}, makeExtra(STDIO_SESSION_ID))) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('30');
  });

  it('KtoValidationError 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    // detailCommon2 도구 (contentId 필수) 핸들러 추출
    const detailCommonCall = (
      mcpServer.registerTool as jest.Mock
    ).mock.calls.find(
      (call: unknown[]) => call[0] === 'kto_korean_detailCommon2',
    ) as [string, unknown, ToolHandler];
    const handler = detailCommonCall[2];

    const result = (await handler({}, makeExtra(STDIO_SESSION_ID))) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    // contentId 미입력이므로 검증 오류
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('contentId');
  });

  it('서비스가 KtoValidationError를 throw하면 MCP 오류 응답을 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    koreanService['areaBasedList2'].mockRejectedValue(
      new KtoValidationError('서비스 검증 오류', ['field']),
    );

    const result = (await handler(
      { areaCode: '1' },
      makeExtra(STDIO_SESSION_ID),
    )) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('서비스 검증 오류');
  });

  it('일반 Error 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(
      mcpServer,
      [{ tools: KOREAN_TOUR_INFO_TOOLS, service: koreanService }],
      store,
    );

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      ToolHandler,
    ];
    const handler = firstCall[2];

    koreanService['areaBasedList2'].mockRejectedValue(
      new Error('예기치 않은 오류'),
    );

    const result = (await handler({}, makeExtra(STDIO_SESSION_ID))) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('예기치 않은 오류');
  });

  describe('BARRIER_FREE_TOUR_INFO_TOOLS 검증', () => {
    it('코드 조회 도구 4개가 포함되지 않는다 (R1: 중복 등록 금지)', () => {
      const names = BARRIER_FREE_TOUR_INFO_TOOLS.map((t) => t.name);
      expect(names).not.toContain('kto_barrier_free_areaCode2');
      expect(names).not.toContain('kto_barrier_free_categoryCode2');
      expect(names).not.toContain('kto_barrier_free_ldongCode2');
      expect(names).not.toContain('kto_barrier_free_lclsSystmCode2');
    });

    it('detailWithTour2가 포함된다', () => {
      const names = BARRIER_FREE_TOUR_INFO_TOOLS.map((t) => t.name);
      expect(names).toContain('kto_barrier_free_detailWithTour2');
    });

    it('무장애 도구의 description에 무장애 의도가 명시된다', () => {
      for (const tool of BARRIER_FREE_TOUR_INFO_TOOLS) {
        expect(tool.description).toMatch(/무장애|barrier.free/i);
      }
    });

    it('무장애 detailWithTour2 핸들러가 contentId 누락 시 오류를 반환한다', async () => {
      registerAll(
        mcpServer,
        [{ tools: BARRIER_FREE_TOUR_INFO_TOOLS, service: barrierFreeService }],
        store,
      );

      const detailWithTourCall = (
        mcpServer.registerTool as jest.Mock
      ).mock.calls.find(
        (call: unknown[]) => call[0] === 'kto_barrier_free_detailWithTour2',
      ) as [string, unknown, ToolHandler];
      const handler = detailWithTourCall[2];

      const result = (await handler({}, makeExtra(STDIO_SESSION_ID))) as {
        isError: boolean;
        content: Array<{ type: string; text: string }>;
      };

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('contentId');
      expect(barrierFreeService['detailWithTour2']).not.toHaveBeenCalled();
    });
  });
});
