// @MX:NOTE: [AUTO] KTO_SERVICE_KEY는 모든 transport 모드에서 선택적이다.
// stdio/HTTP 공통으로 키가 없어도 서버는 부팅된다. 도구 호출 시점에 키 부재가 감지되면
// tool-registry가 KtoServiceKeyMissingError로 응답한다.
// @MX:SPEC: SPEC-KTO-011 REQ-KTO11-001

export interface AppEnv {
  /**
   * KTO data.go.kr 서비스 키.
   * 모든 모드에서 선택. 미설정 시 빈 문자열.
   * stdio 모드: env 키가 없으면 도구 호출이 missing-key 에러로 실패.
   * HTTP 모드: per-session 헤더로 키 수신 (env 키 무관).
   */
  ktoServiceKey: string;
  /** 서비스 키가 이미 URL 인코딩된 상태로 제공되는지 여부 */
  ktoServiceKeyPreencoded: boolean;
  /** MCP transport 모드: stdio | http-streamable | http-json */
  mcpTransportMode: string;
  /** HTTP 모드 포트 번호 */
  mcpHttpPort: number;
}

/**
 * 환경변수를 로드하고 파싱된 설정 객체를 반환한다.
 * 키 부재 시 throw하지 않고 빈 문자열을 반환한다 — 부팅을 차단하지 않는다.
 */
export function getEnv(): AppEnv {
  return {
    ktoServiceKey: process.env['KTO_SERVICE_KEY'] ?? '',
    ktoServiceKeyPreencoded:
      (process.env['KTO_SERVICE_KEY_PREENCODED'] ?? 'false').toLowerCase() ===
      'true',
    mcpTransportMode: process.env['MCP_TRANSPORT_MODE'] ?? 'stdio',
    mcpHttpPort: parseInt(process.env['MCP_HTTP_PORT'] ?? '3000', 10),
  };
}
