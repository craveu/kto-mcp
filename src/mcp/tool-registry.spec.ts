import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { KOREAN_TOUR_INFO_TOOLS } from '../kto/korean-tour-info/korean-tour-info.tools';
import { KoreanTourInfoService } from '../kto/korean-tour-info/korean-tour-info.service';
import { registerAll } from './tool-registry';
import { KtoApiError, KtoValidationError } from '../kto/common/kto-error';

describe('registerAll()', () => {
  let mcpServer: jest.Mocked<McpServer>;
  let service: jest.Mocked<KoreanTourInfoService>;

  beforeEach(() => {
    // McpServer 모킹 — registerTool 호출 추적
    mcpServer = {
      registerTool: jest.fn(),
    } as unknown as jest.Mocked<McpServer>;

    // KoreanTourInfoService 모킹 — 모든 메서드 jest.fn()으로 초기화
    service = {} as jest.Mocked<KoreanTourInfoService>;
    for (const tool of KOREAN_TOUR_INFO_TOOLS) {
      (service as Record<string, unknown>)[tool.methodName] = jest.fn();
    }
  });

  it('15개 도구를 McpServer에 등록한다', () => {
    registerAll(mcpServer, service);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mcpServer.registerTool).toHaveBeenCalledTimes(15);
    const names = (mcpServer.registerTool as jest.Mock).mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(names).toEqual(KOREAN_TOUR_INFO_TOOLS.map((t) => t.name));
  });

  it('도구 핸들러가 서비스 메서드를 호출하고 결과를 MCP 형식으로 반환한다', async () => {
    registerAll(mcpServer, service);

    // 첫 번째 도구 (areaBasedList2) 핸들러 추출
    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      (args: Record<string, unknown>) => Promise<unknown>,
    ];
    const handler = firstCall[2];

    const mockResult = { items: { item: [{ contentid: '123' }] } };
    (service as Record<string, jest.Mock>)['areaBasedList2'].mockResolvedValue(
      mockResult,
    );

    const result = (await handler({ areaCode: '1' })) as {
      content: Array<{ type: string; text: string }>;
    };

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text) as unknown;
    expect(parsed).toEqual(mockResult);
  });

  it('KtoApiError 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(mcpServer, service);

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      (args: Record<string, unknown>) => Promise<unknown>,
    ];
    const handler = firstCall[2];

    (service as Record<string, jest.Mock>)['areaBasedList2'].mockRejectedValue(
      new KtoApiError('30', 400, '서비스 키 미등록', true),
    );

    const result = (await handler({})) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('30');
  });

  it('KtoValidationError 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(mcpServer, service);

    // detailCommon2 도구 (contentId 필수) 핸들러 추출
    const detailCommonCall = (
      mcpServer.registerTool as jest.Mock
    ).mock.calls.find(
      (call: unknown[]) => call[0] === 'kto_korean_detailCommon2',
    ) as [string, unknown, (args: Record<string, unknown>) => Promise<unknown>];
    const handler = detailCommonCall[2];

    const result = (await handler({})) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    // contentId 미입력이므로 검증 오류
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('contentId');
  });

  it('서비스가 KtoValidationError를 throw하면 MCP 오류 응답을 반환한다', async () => {
    registerAll(mcpServer, service);

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      (args: Record<string, unknown>) => Promise<unknown>,
    ];
    const handler = firstCall[2];

    (service as Record<string, jest.Mock>)['areaBasedList2'].mockRejectedValue(
      new KtoValidationError('서비스 검증 오류', ['field']),
    );

    const result = (await handler({ areaCode: '1' })) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('서비스 검증 오류');
  });

  it('일반 Error 발생 시 MCP 오류 응답을 반환한다', async () => {
    registerAll(mcpServer, service);

    const firstCall = (mcpServer.registerTool as jest.Mock).mock.calls[0] as [
      string,
      unknown,
      (args: Record<string, unknown>) => Promise<unknown>,
    ];
    const handler = firstCall[2];

    (service as Record<string, jest.Mock>)['areaBasedList2'].mockRejectedValue(
      new Error('예기치 않은 오류'),
    );

    const result = (await handler({})) as {
      isError: boolean;
      content: Array<{ type: string; text: string }>;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('예기치 않은 오류');
  });
});
