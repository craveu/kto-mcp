import 'reflect-metadata';
import type { IncomingMessage } from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  HttpStreamableTransportAdapter,
  extractCredentialsFromRequest,
} from './http-streamable.adapter';
import { SessionCredentialsStore } from '../session-credentials.store';
import type { ToolRegistry } from '../tool-registry';

type MockTransport = {
  handleRequest: jest.Mock;
  close: jest.Mock;
  sessionId?: string;
  onclose?: (() => void) | null;
};

type MockTransportCtor = jest.Mock<MockTransport>;

// StreamableHTTPServerTransport 모킹 (enableJsonResponse: false 모드)
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
            const sid = opts.sessionIdGenerator?.() ?? 'mock-session-id';
            opts.onsessioninitialized?.(sid);
            // sessionId를 인스턴스에 설정
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

describe('extractCredentialsFromRequest', () => {
  function makeReq(headers: Record<string, string>): IncomingMessage {
    return { headers } as unknown as IncomingMessage;
  }

  it('Authorization: Bearer 헤더에서 serviceKey를 추출한다', () => {
    const req = makeReq({ authorization: 'Bearer MY_KEY_123' });
    expect(extractCredentialsFromRequest(req)).toEqual({
      serviceKey: 'MY_KEY_123',
      preencoded: false,
    });
  });

  it('Authorization 헤더가 없으면 null을 반환한다', () => {
    const req = makeReq({});
    expect(extractCredentialsFromRequest(req)).toBeNull();
  });

  it('Bearer 형식이 아닌 헤더는 null을 반환한다', () => {
    const req = makeReq({ authorization: 'Basic user:pass' });
    expect(extractCredentialsFromRequest(req)).toBeNull();
  });

  it('빈 Bearer 토큰은 null을 반환한다', () => {
    const req = makeReq({ authorization: 'Bearer ' });
    expect(extractCredentialsFromRequest(req)).toBeNull();
  });

  it('x-kto-service-key-preencoded: true 헤더 시 preencoded=true', () => {
    const req = makeReq({
      authorization: 'Bearer MY_KEY',
      'x-kto-service-key-preencoded': 'true',
    });
    expect(extractCredentialsFromRequest(req)).toEqual({
      serviceKey: 'MY_KEY',
      preencoded: true,
    });
  });

  it('x-kto-service-key-preencoded: false 헤더 시 preencoded=false', () => {
    const req = makeReq({
      authorization: 'Bearer MY_KEY',
      'x-kto-service-key-preencoded': 'false',
    });
    expect(extractCredentialsFromRequest(req)).toEqual({
      serviceKey: 'MY_KEY',
      preencoded: false,
    });
  });
});

describe('HttpStreamableTransportAdapter', () => {
  let adapter: HttpStreamableTransportAdapter;
  let store: SessionCredentialsStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new SessionCredentialsStore();
    adapter = new HttpStreamableTransportAdapter(store);
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('인스턴스를 생성할 수 있다', () => {
    expect(adapter).toBeInstanceOf(HttpStreamableTransportAdapter);
  });

  it('start()가 HTTP 서버를 시작하고 포트를 할당한다', async () => {
    await adapter.start(EMPTY_REGISTRIES, 0);
    const port = adapter.getPort();
    expect(port).toBeGreaterThan(0);
  });

  it('stop()이 HTTP 서버를 닫는다', async () => {
    await adapter.start(EMPTY_REGISTRIES, 0);
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  it('start 전 stop()은 예외 없이 완료된다', async () => {
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  describe('HTTP request handling', () => {
    it('POST 요청(신규 세션)은 새 transport를 생성하고 handleRequest를 호출한다', async () => {
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

    it('허용되지 않는 메서드(PUT)는 405를 반환한다', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      const status = await new Promise<number>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { request } = require('http') as typeof import('http');
        const req = request(
          { hostname: 'localhost', port, path: '/mcp', method: 'PUT' },
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
              Authorization: 'Bearer PENDING_KEY',
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

      // mock transport의 handleRequest가 onsessioninitialized를 호출하므로
      // store에 등록되어 있어야 한다
      const instances = getMockedTransportInstances();
      const lastTransport = instances[instances.length - 1];
      const sid = lastTransport.sessionId;
      expect(sid).toBeDefined();
      expect(store.get(sid!)).toEqual({
        serviceKey: 'PENDING_KEY',
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
          onsessioninitialized?: (id: string) => void;
          onsessionclosed?: (id: string) => void;
        },
      ];
      const { onsessionclosed } = callArgs[0];

      store.register('close-session-id', {
        serviceKey: 'KEY_TO_REMOVE',
        preencoded: false,
      });
      expect(store.has('close-session-id')).toBe(true);

      onsessionclosed?.('close-session-id');
      expect(store.has('close-session-id')).toBe(false);
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

    it('StreamableHTTPServerTransport를 stateful 모드(sessionIdGenerator 있음)로 생성한다', async () => {
      await adapter.start(EMPTY_REGISTRIES, 0);
      const port = adapter.getPort();

      // POST 요청을 보내야 transport가 생성됨
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
      expect(callArgs[0].enableJsonResponse).toBe(false);
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
      // 세션마다 새 McpServer 인스턴스가 생성되어야 한다
      expect(MockMcpServer.mock.instances.length).toBe(beforeCount + 2);
    });
  });
});
