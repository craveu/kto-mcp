// @MX:NOTE: [AUTO] SPEC-KTO-011: KTO_SERVICE_KEY는 stdio 모드에서만 필수.
// HTTP 모드에서는 Authorization 헤더로 per-session 키를 수신하므로 env 키는 불필요.
// @MX:SPEC: SPEC-KTO-011 REQ-KTO11-001, REQ-UNW-001

export interface AppEnv {
  /**
   * KTO data.go.kr 서비스 키.
   * stdio 모드: 필수 (미설정 시 부트 실패).
   * HTTP 모드: 선택 (빈 문자열 허용, 런타임 헤더로 수신).
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
 * stdio 모드에서 KTO_SERVICE_KEY가 없거나 빈 문자열이면 즉시 Error를 throw한다.
 * HTTP 모드에서는 KTO_SERVICE_KEY를 검증하지 않는다 (런타임 헤더로 수신).
 */
export function getEnv(): AppEnv {
  const mcpTransportMode = process.env['MCP_TRANSPORT_MODE'] ?? 'stdio';
  const ktoServiceKey = process.env['KTO_SERVICE_KEY'] ?? '';

  // stdio 모드에서만 KTO_SERVICE_KEY 필수 검증
  if (mcpTransportMode === 'stdio' && !ktoServiceKey) {
    throw new Error(
      'KTO_SERVICE_KEY 환경변수가 설정되지 않았거나 빈 문자열입니다. ' +
        'data.go.kr에서 발급받은 서비스 키를 KTO_SERVICE_KEY에 설정해 주세요.',
    );
  }

  return {
    ktoServiceKey,
    ktoServiceKeyPreencoded:
      (process.env['KTO_SERVICE_KEY_PREENCODED'] ?? 'false').toLowerCase() ===
      'true',
    mcpTransportMode,
    mcpHttpPort: parseInt(process.env['MCP_HTTP_PORT'] ?? '3000', 10),
  };
}
