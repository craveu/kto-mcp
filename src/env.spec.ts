import { getEnv } from './env';

describe('getEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env['MCP_TRANSPORT_MODE'] = 'stdio';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('KTO_SERVICE_KEY는 모든 모드에서 선택', () => {
    it('stdio 모드에서 KTO_SERVICE_KEY가 없어도 throw하지 않는다', () => {
      process.env['MCP_TRANSPORT_MODE'] = 'stdio';
      delete process.env['KTO_SERVICE_KEY'];
      expect(() => getEnv()).not.toThrow();
    });

    it('stdio 모드에서 KTO_SERVICE_KEY가 빈 문자열이어도 throw하지 않는다', () => {
      process.env['MCP_TRANSPORT_MODE'] = 'stdio';
      process.env['KTO_SERVICE_KEY'] = '';
      const env = getEnv();
      expect(env.ktoServiceKey).toBe('');
    });

    it('http-streamable 모드에서 KTO_SERVICE_KEY가 없어도 throw하지 않는다', () => {
      process.env['MCP_TRANSPORT_MODE'] = 'http-streamable';
      delete process.env['KTO_SERVICE_KEY'];
      expect(() => getEnv()).not.toThrow();
    });

    it('http-json 모드에서 KTO_SERVICE_KEY가 없어도 throw하지 않는다', () => {
      process.env['MCP_TRANSPORT_MODE'] = 'http-json';
      delete process.env['KTO_SERVICE_KEY'];
      expect(() => getEnv()).not.toThrow();
    });

    it('키 미설정 시 ktoServiceKey는 빈 문자열', () => {
      process.env['MCP_TRANSPORT_MODE'] = 'http-streamable';
      delete process.env['KTO_SERVICE_KEY'];
      const env = getEnv();
      expect(env.ktoServiceKey).toBe('');
    });
  });

  describe('공통 설정', () => {
    it('환경변수가 모두 설정되면 파싱된 설정 객체를 반환해야 한다', () => {
      process.env['KTO_SERVICE_KEY'] = 'test-service-key';
      process.env['KTO_SERVICE_KEY_PREENCODED'] = 'true';
      process.env['MCP_TRANSPORT_MODE'] = 'stdio';
      process.env['MCP_HTTP_PORT'] = '8080';

      const env = getEnv();

      expect(env.ktoServiceKey).toBe('test-service-key');
      expect(env.ktoServiceKeyPreencoded).toBe(true);
      expect(env.mcpTransportMode).toBe('stdio');
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
});
