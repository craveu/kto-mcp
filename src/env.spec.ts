import { getEnv } from './env';

describe('getEnv', () => {
  // 원본 환경변수 백업
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('KTO_SERVICE_KEY가 없을 때 명시적 에러를 throw해야 한다', () => {
    delete process.env['KTO_SERVICE_KEY'];
    expect(() => getEnv()).toThrow('KTO_SERVICE_KEY');
  });

  it('KTO_SERVICE_KEY가 빈 문자열일 때 에러를 throw해야 한다', () => {
    process.env['KTO_SERVICE_KEY'] = '';
    expect(() => getEnv()).toThrow('KTO_SERVICE_KEY');
  });

  it('환경변수가 모두 설정되면 파싱된 설정 객체를 반환해야 한다', () => {
    process.env['KTO_SERVICE_KEY'] = 'test-service-key';
    process.env['KTO_SERVICE_KEY_PREENCODED'] = 'true';
    process.env['MCP_TRANSPORT_MODE'] = 'http';
    process.env['MCP_HTTP_PORT'] = '8080';

    const env = getEnv();

    expect(env.ktoServiceKey).toBe('test-service-key');
    expect(env.ktoServiceKeyPreencoded).toBe(true);
    expect(env.mcpTransportMode).toBe('http');
    expect(env.mcpHttpPort).toBe(8080);
  });

  it('MCP_HTTP_PORT가 미설정이면 기본값 3000을 반환해야 한다', () => {
    process.env['KTO_SERVICE_KEY'] = 'test-key';
    delete process.env['MCP_HTTP_PORT'];

    const env = getEnv();
    expect(env.mcpHttpPort).toBe(3000);
  });

  it('MCP_TRANSPORT_MODE가 미설정이면 기본값 stdio를 반환해야 한다', () => {
    process.env['KTO_SERVICE_KEY'] = 'test-key';
    delete process.env['MCP_TRANSPORT_MODE'];

    const env = getEnv();
    expect(env.mcpTransportMode).toBe('stdio');
  });
});
