// @MX:NOTE: [AUTO] BASE_URL_MAP은 다국어 확장 지점이다. 차기 이터레이션에서 언어별 서비스를 추가할 때 이 맵을 확장한다.
// @MX:SPEC: SPEC-KTO-001 REQ-OPT-001

/**
 * KTO 서비스명 → base URL 매핑.
 * 다국어 확장 시 이 맵에 새 항목을 추가한다.
 */
export const BASE_URL_MAP = {
  KorService2: 'http://apis.data.go.kr/B551011/KorService2',
  EngService2: 'http://apis.data.go.kr/B551011/EngService2',
  JpnService2: 'http://apis.data.go.kr/B551011/JpnService2',
  ChsService2: 'http://apis.data.go.kr/B551011/ChsService2',
  ChtService2: 'http://apis.data.go.kr/B551011/ChtService2',
  GerService2: 'http://apis.data.go.kr/B551011/GerService2',
  FreService2: 'http://apis.data.go.kr/B551011/FreService2',
  SpnService2: 'http://apis.data.go.kr/B551011/SpnService2',
  RusService2: 'http://apis.data.go.kr/B551011/RusService2',
} as const;

/** 지원하는 KTO 서비스명 union 타입 */
export type KtoServiceName = keyof typeof BASE_URL_MAP;

/** 모든 요청에 자동 주입되는 공통 파라미터 */
export const COMMON_PARAMS = {
  MobileOS: 'ETC',
  MobileApp: 'kto-mcp',
  _type: 'json',
} as const;

/** 게이트웨이 에러 코드 → 식별자 매핑 */
export const GATEWAY_ERROR_CODES = {
  '00': 'NORMAL',
  '01': 'APPLICATION_ERROR',
  '02': 'DB_ERROR',
  '03': 'NODATA_ERROR',
  '04': 'HTTP_ERROR',
  '05': 'SERVICETIMEOUT_ERROR',
  '10': 'INVALID_REQUEST_PARAMETER_ERROR',
  '11': 'NO_MANDATORY_REQUEST_PARAMETERS_ERROR',
  '12': 'NO_OPENAPI_SERVICE_ERROR',
  '20': 'SERVICE_ACCESS_DENIED_ERROR',
  '22': 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
  '30': 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
  '31': 'DEADLINE_HAS_EXPIRED_ERROR',
  '32': 'UNREGISTERED_IP_ERROR',
  '99': 'UNKNOWN_ERROR',
} as const;

export type GatewayErrorCode = keyof typeof GATEWAY_ERROR_CODES;

/**
 * 영구 에러 코드 목록.
 * 이 코드가 반환되면 재시도하지 않는다.
 */
export const PERMANENT_ERROR_CODES: ReadonlySet<string> = new Set([
  '22', // 일일 호출 한도 초과
  '30', // 등록되지 않은 서비스 키
  '31', // 활용 기간 만료
  '32', // 등록되지 않은 IP
]);

/** 재시도 설정 */
export const RETRY_CONFIG = {
  /** 최대 재시도 횟수 */
  maxRetries: 3,
  /** 초기 지연 시간 (ms) — base 200ms, 실제 delay = 200 * 2^n */
  initialDelayMs: 200,
  /** 최대 지연 시간 (ms) */
  maxDelayMs: 2000,
} as const;
