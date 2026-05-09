/** KTO API 호출 중 발생하는 에러 */
export class KtoApiError extends Error {
  readonly name = 'KtoApiError';

  constructor(
    /** 게이트웨이 에러 코드 (예: '30') */
    readonly code: string,
    /** HTTP 상태 코드 */
    readonly httpStatus: number,
    /** KTO 게이트웨이 에러 메시지 */
    readonly resultMsg: string,
    /**
     * 영구 에러 여부.
     * true이면 재시도하지 않는다 (예: 키 미등록, 할당량 초과).
     */
    readonly permanent: boolean,
  ) {
    super(
      `KTO API 오류 [${code}]: ${resultMsg} (httpStatus=${httpStatus}, permanent=${permanent.toString()})`,
    );
  }
}

/** DTO 검증 실패 에러 */
export class KtoValidationError extends Error {
  readonly name = 'KtoValidationError';

  constructor(
    message: string,
    /** 검증에 실패한 필드 이름 목록 */
    readonly fields: string[],
  ) {
    super(message);
  }
}
