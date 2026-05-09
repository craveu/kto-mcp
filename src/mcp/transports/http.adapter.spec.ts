import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpTransportAdapter } from './http.adapter';

type MockTransport = {
  handleRequest: jest.Mock;
  close: jest.Mock;
};

type MockTransportCtor = jest.Mock<MockTransport>;

// StreamableHTTPServerTransport 모킹 (enableJsonResponse: true 모드)
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({
    handleRequest: jest
      .fn()
      .mockImplementation(
        (
          _req: unknown,
          res: { writeHead: (s: number) => void; end: () => void },
        ) => {
          res.writeHead(200);
          res.end();
          return Promise.resolve(undefined);
        },
      ),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

function getMockedTransport(): MockTransport {
  const mod: { StreamableHTTPServerTransport: MockTransportCtor } =
    jest.requireMock('@modelcontextprotocol/sdk/server/streamableHttp.js');
  const { results } = mod.StreamableHTTPServerTransport.mock;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return results[results.length - 1].value;
}

describe('HttpTransportAdapter', () => {
  let adapter: HttpTransportAdapter;
  let mockServer: jest.Mocked<McpServer>;

  beforeEach(() => {
    adapter = new HttpTransportAdapter();
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<McpServer>;
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('인스턴스를 생성할 수 있다', () => {
    expect(adapter).toBeInstanceOf(HttpTransportAdapter);
  });

  it('start()가 McpServer에 transport를 연결하고 포트를 할당한다', async () => {
    await adapter.start(mockServer, 0);
    const port = adapter.getPort();
    expect(port).toBeGreaterThan(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
  });

  it('stop()이 예외 없이 완료된다', async () => {
    await adapter.start(mockServer, 0);
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  it('start 전 stop()은 예외 없이 완료된다', async () => {
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  describe('HTTP request handling', () => {
    it('POST 요청은 transport.handleRequest로 전달된다', async () => {
      await adapter.start(mockServer, 0);
      const port = adapter.getPort();

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const req = request(
          {
            hostname: 'localhost',
            port,
            path: '/mcp',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': '2',
            },
          },
          (res) => {
            res.resume();
            resolve();
          },
        );
        req.on('error', reject);
        req.write('{}');
        req.end();
      });

      expect(getMockedTransport().handleRequest).toHaveBeenCalled();
    });

    it('허용되지 않는 메서드(GET)는 405를 반환한다', async () => {
      await adapter.start(mockServer, 0);
      const port = adapter.getPort();

      const status = await new Promise<number>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const req = request(
          { hostname: 'localhost', port, path: '/mcp', method: 'GET' },
          (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          },
        );
        req.on('error', reject);
        req.end();
      });

      expect(status).toBe(405);
    });
  });
});
