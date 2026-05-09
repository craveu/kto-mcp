// @MX:NOTE: [AUTO] KTO_SERVICE_KEY 누락 시 부트스트랩 즉시 실패 계약 (REQ-UNW-001)
// @MX:SPEC: SPEC-KTO-001

export interface AppEnv {
  /** KTO data.go.kr 서비스 키 */
  ktoServiceKey: string;
  /** 서비스 키가 이미 URL 인코딩된 상태로 제공되는지 여부 */
  ktoServiceKeyPreencoded: boolean;
  /** MCP transport 모드: stdio | http-streamable | http */
  mcpTransportMode: string;
  /** HTTP 모드 포트 번호 */
  mcpHttpPort: number;
}

/**
 * 환경변수를 로드하고 파싱된 설정 객체를 반환한다.
 * KTO_SERVICE_KEY가 없거나 빈 문자열이면 즉시 Error를 throw한다.
 */
export function getEnv(): AppEnv {
  const ktoServiceKey = process.env['KTO_SERVICE_KEY'] ?? '';

  if (!ktoServiceKey) {
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
    mcpTransportMode: process.env['MCP_TRANSPORT_MODE'] ?? 'stdio',
    mcpHttpPort: parseInt(process.env['MCP_HTTP_PORT'] ?? '3000', 10),
  };
}
