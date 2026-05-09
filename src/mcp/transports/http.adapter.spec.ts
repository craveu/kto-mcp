import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpTransportAdapter } from './http.adapter';
import { SessionCredentialsStore } from '../session-credentials.store';
import type { ToolRegistry } from '../tool-registry';

type MockTransport = {
  handleRequest: jest.Mock;
  close: jest.Mock;
  sessionId?: string;
  onclose?: (() => void) | null;
};

type MockTransportCtor = jest.Mock<MockTransport>;

// StreamableHTTPServerTransport 모킹 (enableJsonResponse: true 모드)
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation((opts: {
    sessionIdGenerator?: () => string;
    onsessioninitialized?: (id: string) => void;
    onsessionclosed?: (id: string) => void;
    enableJsonResponse?: boolean;
  }) => {
    const instance: MockTransport = {
      handleRequest: jest
        .fn()
        .mockImplementation(
          (
            _req: unknown,
            res: { writeHead: (s: number) => void; end: () => void },
          ) => {
            // initialize 요청 시뮬레이션: onsessioninitialized 호출
            const sid = opts.sessionIdGenerator?.() ?? 'mock-json-session';
            opts.onsessioninitialized?.(sid);
            instance.sessionId = sid;
            res.writeHead(200);
            res.end();
            return Promise.resolve(undefined);
          },
        ),
      close: jest.fn().mockResolvedValue(undefined),
      sessionId: undefined,
      onclose: null,
    };
    return instance;
  }),
}));

// McpServer 모킹
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    registerTool: jest.fn(),
  })),
}));

// tool-registry 모킹 (registerAll은 no-op)
jest.mock('../tool-registry', () => ({
  registerAll: jest.fn(),
}));

function getMockedTransportInstances(): MockTransport[] {
  const mod: { StreamableHTTPServerTransport: MockTransportCtor } =
    jest.requireMock('@modelcontextprotocol/sdk/server/streamableHttp.js');
  return mod.StreamableHTTPServerTransport.mock.results.map(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (r) => r.value,
  );
}

function getMockedTransportCtor(): MockTransportCtor {
  const mod: { StreamableHTTPServerTransport: MockTransportCtor } =
    jest.requireMock('@modelcontextprotocol/sdk/server/streamableHttp.js');
  return mod.StreamableHTTPServerTransport;
}

const EMPTY_REGISTRIES: ToolRegistry[] = [];

describe('HttpTransportAdapter', () => {
  let adapter: HttpTransportAdapter;
  let store: SessionCredentialsStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new SessionCredentialsStore();
    adapter = new HttpTransportAdapter(store);
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('인스턴스를 생성할 수 있다', () => {
    expect(adapter).toBeInstanceOf(HttpTransportAdapter);
  });

  it('start()가 HTTP 서버를 시작하고 포트를 할당한다', async () => {
    await adapter.start(EMPTY_REGISTRIES, 0);
    const port = adapter.getPort();
    expect(port).toBeGreaterThan(0);
  });

  it('stop()이 예외 없이 완료된다', async () => {
    await adapter.start(EMPTY_REGISTRIES, 0);
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  it('start 전 stop()은 예외 없이 완료된다', async () => {
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  describe('HTTP request handling', () => {
    it('POST 요청은 새 transport를 생성하고 handleRequest를 호출한다', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
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

      const instances = getMockedTransportInstances();
      expect(instances.length).toBeGreaterThan(0);
      expect(instances[instances.length - 1].handleRequest).toHaveBeenCalled();
    });

    it('허용되지 않는 메서드(GET)는 405를 반환한다', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
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

    it('신규 initialize POST + Authorization → onsessioninitialized 시 store.register', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const body = '{}';
        const req = request(
          {
            hostname: 'localhost',
            port,
            path: '/mcp',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': String(Buffer.byteLength(body)),
              Authorization: 'Bearer JSON_PENDING_KEY',
            },
          },
          (res) => {
            res.resume();
            resolve();
          },
        );
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      const instances = getMockedTransportInstances();
      const lastTransport = instances[instances.length - 1];
      const sid = lastTransport.sessionId;
      expect(sid).toBeDefined();
      expect(store.get(sid!)).toEqual({
        serviceKey: 'JSON_PENDING_KEY',
        preencoded: false,
      });
    });

    it('onsessionclosed → store.unregister 호출', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      // transport를 생성하기 위해 POST 요청을 먼저 보낸다
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const req = request(
          {
            hostname: 'localhost',
            port,
            path: '/mcp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': '2' },
          },
          (res) => { res.resume(); resolve(); },
        );
        req.on('error', reject);
        req.write('{}');
        req.end();
      });

      const ctor = getMockedTransportCtor();
      const callArgs = ctor.mock.calls[ctor.mock.calls.length - 1] as [
        {
          onsessionclosed?: (id: string) => void;
        },
      ];
      const { onsessionclosed } = callArgs[0];

      store.register('json-close-session', {
        serviceKey: 'KEY_TO_REMOVE',
        preencoded: false,
      });
      expect(store.has('json-close-session')).toBe(true);

      onsessionclosed?.('json-close-session');
      expect(store.has('json-close-session')).toBe(false);
    });

    it('x-kto-service-key-preencoded: true 헤더 시 preencoded=true로 store.register', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const body = '{}';
        const req = request(
          {
            hostname: 'localhost',
            port,
            path: '/mcp',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': String(Buffer.byteLength(body)),
              Authorization: 'Bearer ENCODED_KEY',
              'x-kto-service-key-preencoded': 'true',
            },
          },
          (res) => {
            res.resume();
            resolve();
          },
        );
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      const instances = getMockedTransportInstances();
      const lastTransport = instances[instances.length - 1];
      const sid = lastTransport.sessionId;
      expect(sid).toBeDefined();
      expect(store.get(sid!)).toEqual({
        serviceKey: 'ENCODED_KEY',
        preencoded: true,
      });
    });

    it('존재하지 않는 sessionId 헤더 → 404 반환', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      const status = await new Promise<number>((resolve, reject) => {
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
              'mcp-session-id': 'nonexistent-session',
            },
          },
          (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          },
        );
        req.on('error', reject);
        req.write('{}');
        req.end();
      });

      expect(status).toBe(404);
    });

    it('StreamableHTTPServerTransport를 stateful + enableJsonResponse:true 모드로 생성한다', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
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
            headers: { 'Content-Type': 'application/json', 'Content-Length': '2' },
          },
          (res) => { res.resume(); resolve(); },
        );
        req.on('error', reject);
        req.write('{}');
        req.end();
      });

      const ctor = getMockedTransportCtor();
      const callArgs = ctor.mock.calls[ctor.mock.calls.length - 1] as [
        { sessionIdGenerator?: unknown; enableJsonResponse?: boolean },
      ];
      expect(typeof callArgs[0].sessionIdGenerator).toBe('function');
      expect(callArgs[0].enableJsonResponse).toBe(true);
    });

    it('McpServer를 세션마다 새로 생성한다 (다중 세션)', async () => {
      const { McpServer: MockMcpServer } = jest.requireMock(
        '@modelcontextprotocol/sdk/server/mcp.js',
      ) as { McpServer: jest.Mock };

      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      const sendPost = () =>
        new Promise<void>((resolve, reject) => {
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
            (res) => { res.resume(); resolve(); },
          );
          req.on('error', reject);
          req.write('{}');
          req.end();
        });

      const beforeCount = MockMcpServer.mock.instances.length;
      await sendPost();
      await sendPost();
      expect(MockMcpServer.mock.instances.length).toBe(beforeCount + 2);
    });
  });
});
