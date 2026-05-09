import { KtoApiError, KtoValidationError } from './kto-error';

describe('KtoApiError', () => {
  it('code, httpStatus, resultMsg, permanent 속성을 가져야 한다', () => {
    const err = new KtoApiError(
      '30',
      200,
      'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
      true,
    );
    expect(err.code).toBe('30');
    expect(err.httpStatus).toBe(200);
    expect(err.resultMsg).toBe('SERVICE_KEY_IS_NOT_REGISTERED_ERROR');
    expect(err.permanent).toBe(true);
  });

  it('Error를 상속해야 한다', () => {
    const err = new KtoApiError('01', 500, 'APPLICATION_ERROR', false);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('KtoApiError');
  });

  it('permanent=false이면 재시도 가능 에러이다', () => {
    const err = new KtoApiError('01', 503, 'APPLICATION_ERROR', false);
    expect(err.permanent).toBe(false);
  });

  it('permanent=true이면 영구 에러이다', () => {
    const err = new KtoApiError('22', 200, 'QUOTA_EXCEEDED', true);
    expect(err.permanent).toBe(true);
  });
});

describe('KtoValidationError', () => {
  it('message와 fields 속성을 가져야 한다', () => {
    const err = new KtoValidationError('유효성 검사 실패', ['mapX', 'mapY']);
    expect(err.message).toContain('유효성 검사 실패');
    expect(err.fields).toEqual(['mapX', 'mapY']);
  });

  it('Error를 상속해야 한다', () => {
    const err = new KtoValidationError('검증 실패', []);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('KtoValidationError');
  });
});
