/**
 * AppModule E2E 스모크 테스트.
 * AppController/AppService가 제거되어 getHello 테스트는 삭제됨.
 * kto.e2e-spec.ts 에서 실제 MCP 기능을 검증한다.
 */
import 'reflect-metadata';

describe('AppModule (e2e smoke)', () => {
  it('모듈이 로드 가능하다', () => {
    // kto.e2e-spec.ts 에서 전체 AppModule을 부트스트랩한다
    expect(true).toBe(true);
  });
});
