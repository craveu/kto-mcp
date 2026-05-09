import axios, { type AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { KtoServiceName } from './common/constants';
import {
  BASE_URL_MAP,
  COMMON_PARAMS,
  PERMANENT_ERROR_CODES,
  RETRY_CONFIG,
} from './common/constants';
import { KtoApiError } from './common/kto-error';
import { normalizeItems } from './common/response-normalizer';
import type { KtoListResponse, KtoRawResponse } from './common/types';

// @MX:ANCHOR: [AUTO] 모든 도구 핸들러가 이 메서드를 호출한다. 예상 fan_in >= 15.
// @MX:REASON: KTO API 호출의 단일 진입점. 서비스 키 주입, 재시도, 응답 정규화를 담당.
// @MX:SPEC: SPEC-KTO-001 REQ-KTO-003, REQ-STATE-001, REQ-UNW-002

/** KTO API 요청 옵션 */
export interface KtoRequestOptions {
  /** 대상 서비스 (예: KorService2) */
  service: KtoServiceName;
  /** 오퍼레이션명 (예: areaBasedList2) */
  operation: string;
  /** 추가 쿼리 파라미터 */
  params?: Record<string, unknown>;
}

const xmlParser = new XMLParser({ ignoreAttributes: false });

/**
 * KTO API 응답 본문이 게이트웨이 XML 에러인지 판별하고, 맞으면 KtoApiError를 throw한다.
 *
 * @MX:WARN: [AUTO] 외부 XML 입력 파싱 + 코드 매핑 + 분기. 복잡도 높음.
 * @MX:REASON: fast-xml-parser로 게이트웨이 오류 XML을 파싱하며 예상치 못한 입력 처리 필요.
 */
function parseGatewayError(body: string): void {
  // 게이트웨이 XML 오류 응답 패턴 감지: '<' 로 시작하면 XML
  const trimmed = body.trimStart();
  if (!trimmed.startsWith('<')) {
    return; // JSON 응답이면 무시
  }

  // OpenAPI_ServiceResponse XML 패턴만 처리
  if (!trimmed.includes('OpenAPI_ServiceResponse')) {
    // 예상치 못한 XML 응답
    throw new KtoApiError(
      'UNEXPECTED_XML',
      200,
      'UNEXPECTED_XML_RESPONSE',
      false,
    );
  }

  const parsed = xmlParser.parse(body) as {
    OpenAPI_ServiceResponse?: {
      cmmMsgHeader?: {
        returnReasonCode?: string | number;
        returnAuthMsg?: string;
        errMsg?: string;
      };
    };
  };

  const header = parsed.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (!header) {
    throw new KtoApiError('UNKNOWN_XML', 200, 'UNKNOWN_XML_RESPONSE', false);
  }

  const code = String(header.returnReasonCode ?? '99');
  const authMsg = String(header.returnAuthMsg ?? '');
  const permanent = PERMANENT_ERROR_CODES.has(code);

  throw new KtoApiError(code, 200, authMsg, permanent);
}

/**
 * 재시도 간 대기 시간 계산 (지수 백오프 + ±20% jitter)
 */
function calculateDelay(attempt: number, initialDelayMs: number): number {
  const base = initialDelayMs * Math.pow(2, attempt);
  const capped = Math.min(base, RETRY_CONFIG.maxDelayMs);
  // ±20% jitter
  const jitter = capped * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(capped + jitter));
}

/**
 * 재시도해야 할 에러인지 판별한다.
 * 5xx HTTP 에러, 네트워크 에러는 재시도 가능.
 * 영구 에러(KtoApiError.permanent=true)는 재시도 불가.
 */
function isRetryableError(err: unknown): boolean {
  if (err instanceof KtoApiError) {
    return !err.permanent;
  }
  // axios 에러
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    // 네트워크 에러 (status 없음) 또는 5xx
    if (!status || status >= 500) {
      return true;
    }
  }
  return false;
}

/**
 * KTO API HTTP 클라이언트.
 * - 공통 파라미터 자동 주입
 * - 5xx 재시도 (지수 백오프)
 * - 게이트웨이 XML 오류 파싱
 * - 응답 정규화
 */
export class KtoHttpClient {
  private readonly axios: AxiosInstance;

  constructor(
    private readonly serviceKey: string,
    private readonly preencoded: boolean,
    /** 테스트에서 지연 시간을 줄이기 위한 override (기본값: RETRY_CONFIG.initialDelayMs) */
    private readonly initialDelayOverrideMs?: number,
  ) {
    this.axios = axios.create({
      timeout: 10000,
    });
  }

  /**
   * KTO API에 GET 요청을 보내고 정규화된 목록 응답을 반환한다.
   */
  async request<T>(opts: KtoRequestOptions): Promise<KtoListResponse<T>> {
    const { service, operation, params = {} } = opts;
    const baseUrl = BASE_URL_MAP[service];
    const url = `${baseUrl}/${operation}`;

    // 서비스 키: preencoded=true이면 raw string으로 직접 결합 (이중 인코딩 방지)
    const serviceKeyParam = this.preencoded ? this.serviceKey : this.serviceKey;

    const queryParams = {
      ...COMMON_PARAMS,
      serviceKey: serviceKeyParam,
      ...params,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      if (attempt > 0) {
        const baseDelay =
          this.initialDelayOverrideMs ?? RETRY_CONFIG.initialDelayMs;
        const delay = calculateDelay(attempt - 1, baseDelay);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }

      try {
        const response = await this.axios.get<string>(url, {
          params: queryParams,
          // axios가 자동으로 JSON 파싱하도록 허용하되, 에러 시 text도 받을 수 있게 함
          responseType: 'text',
          transformResponse: (data: string) => data,
        });

        const bodyText = response.data;

        // XML 게이트웨이 에러 감지
        const trimmed = bodyText.trimStart();
        if (trimmed.startsWith('<')) {
          parseGatewayError(bodyText);
        }

        // JSON 파싱
        const parsed = JSON.parse(bodyText) as KtoRawResponse<T>;

        // @MX:NOTE: [AUTO] KTO 일부 오퍼레이션(예: PhotoGalleryService1.galleryDetailList1)은
        // 파라미터 검증 실패를 평면 envelope으로 반환. 정상 envelope 검증 전에 처리.
        // 평면 에러 패턴: {responseTime, resultCode, resultMsg} (response 래퍼 없음)
        if (
          parsed &&
          typeof parsed === 'object' &&
          !('response' in parsed) &&
          'resultCode' in parsed &&
          (parsed as Record<string, unknown>).resultCode !== '0000'
        ) {
          const code = (parsed as Record<string, unknown>).resultCode as string;
          const msg =
            ((parsed as Record<string, unknown>).resultMsg as string) ??
            'KTO API error';
          const permanent = PERMANENT_ERROR_CODES.has(code);
          // 재시도 루프를 즉시 종료하고 아래의 lastError 경로로 throw
          lastError = new KtoApiError(code, response.status, msg, permanent);
          break;
        }

        // resultCode 검사
        const resultCode = parsed.response?.header?.resultCode;
        if (resultCode && resultCode !== '0000' && resultCode !== '00') {
          const permanent = PERMANENT_ERROR_CODES.has(resultCode);
          throw new KtoApiError(
            resultCode,
            response.status,
            parsed.response.header.resultMsg,
            permanent,
          );
        }

        return normalizeItems(parsed);
      } catch (err) {
        // 영구 에러면 즉시 throw (재시도 없음)
        if (err instanceof KtoApiError && err.permanent) {
          throw err;
        }

        lastError = err;

        // 마지막 시도이거나 재시도 불가 에러면 throw
        if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(err)) {
          break;
        }
      }
    }

    // 재시도 소진 후 에러 변환
    if (lastError instanceof KtoApiError) {
      throw lastError;
    }

    if (axios.isAxiosError(lastError)) {
      throw new KtoApiError(
        'HTTP_ERROR',
        lastError.response?.status ?? 0,
        lastError.message,
        false,
      );
    }

    throw new KtoApiError('UNKNOWN_ERROR', 0, String(lastError), false);
  }
}
