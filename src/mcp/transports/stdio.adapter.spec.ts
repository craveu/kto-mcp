import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioTransportAdapter } from './stdio.adapter';
import {
  SessionCredentialsStore,
  STDIO_SESSION_ID,
} from '../session-credentials.store';
import type { KtoCredentials } from '../session-credentials.store';

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

const testCredentials: KtoCredentials = {
  serviceKey: 'TEST_KEY_STDIO',
  preencoded: false,
};

describe('StdioTransportAdapter', () => {
  let adapter: StdioTransportAdapter;
  let store: SessionCredentialsStore;
  let mockServer: jest.Mocked<McpServer>;

  beforeEach(() => {
    store = new SessionCredentialsStore();
    adapter = new StdioTransportAdapter(store);
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<McpServer>;
  });

  it('인스턴스를 생성할 수 있다', () => {
    expect(adapter).toBeInstanceOf(StdioTransportAdapter);
  });

  it('start()가 McpServer에 transport를 연결한다', async () => {
    await adapter.start(mockServer, testCredentials);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
  });

  it('start() 시 STDIO_SESSION_ID로 credentials를 store에 등록한다', async () => {
    await adapter.start(mockServer, testCredentials);
    expect(store.get(STDIO_SESSION_ID)).toEqual(testCredentials);
  });

  it('start() 후 stop()이 transport를 닫는다', async () => {
    await adapter.start(mockServer, testCredentials);
    await adapter.stop();
    expect(getMockedStdioTransport().close).toHaveBeenCalledTimes(1);
  });

  it('stop() 시 store에서 STDIO_SESSION_ID credentials를 삭제한다', async () => {
    await adapter.start(mockServer, testCredentials);
    expect(store.has(STDIO_SESSION_ID)).toBe(true);
    await adapter.stop();
    expect(store.has(STDIO_SESSION_ID)).toBe(false);
  });

  it('start 전에 stop()을 호출해도 예외가 발생하지 않는다', async () => {
    // store는 존재하지만 transport가 null인 상태
    await expect(adapter.stop()).resolves.not.toThrow();
  });

  it('stdio adapter에는 헤더 처리 코드가 없다 (backward compat)', () => {
    // StdioTransportAdapter 파일에 authorization 관련 코드가 없는지 검증
    // (테스트에서 직접 소스 파일을 읽는 대신, 클래스 메서드를 통해 간접 검증)
    const adapterInstance = new StdioTransportAdapter(store);
    // start signature: (server, credentials) — HTTP 헤더 파라미터 없음
    expect(adapterInstance.start.length).toBe(2); // server + credentials
  });
});
