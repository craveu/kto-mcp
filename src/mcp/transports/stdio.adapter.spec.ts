import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioTransportAdapter } from './stdio.adapter';

type MockStdioTransport = {
  start: jest.Mock;
  close: jest.Mock;
};

type MockStdioTransportCtor = jest.Mock<MockStdioTransport>;

// SDK StdioServerTransport 모킹
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

function getMockedStdioTransport(): MockStdioTransport {
  const mod: { StdioServerTransport: MockStdioTransportCtor } =
    jest.requireMock('@modelcontextprotocol/sdk/server/stdio.js');
  const { results } = mod.StdioServerTransport.mock;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return results[results.length - 1].value;
}

describe('StdioTransportAdapter', () => {
  let adapter: StdioTransportAdapter;
  let mockServer: jest.Mocked<McpServer>;

  beforeEach(() => {
    adapter = new StdioTransportAdapter();
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<McpServer>;
  });

  it('인스턴스를 생성할 수 있다', () => {
    expect(adapter).toBeInstanceOf(StdioTransportAdapter);
  });

  it('start()가 McpServer에 transport를 연결한다', async () => {
    await adapter.start(mockServer);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
  });

  it('start() 후 stop()이 transport를 닫는다', async () => {
    await adapter.start(mockServer);
    await adapter.stop();
    expect(getMockedStdioTransport().close).toHaveBeenCalledTimes(1);
  });

  it('start 전에 stop()을 호출해도 예외가 발생하지 않는다', async () => {
    await expect(adapter.stop()).resolves.not.toThrow();
  });
});
