import {
  SessionCredentialsStore,
  STDIO_SESSION_ID,
} from './session-credentials.store';
import type { KtoCredentials } from './session-credentials.store';

describe('SessionCredentialsStore', () => {
  let store: SessionCredentialsStore;

  const testCreds: KtoCredentials = {
    serviceKey: 'test-key-abcd1234',
    preencoded: false,
  };

  const testCreds2: KtoCredentials = {
    serviceKey: 'other-key-wxyz5678',
    preencoded: true,
  };

  beforeEach(() => {
    store = new SessionCredentialsStore();
  });

  describe('register + get round-trip', () => {
    it('등록 후 동일 sessionId로 조회하면 creds를 반환해야 한다', () => {
      store.register('session-1', testCreds);
      const result = store.get('session-1');
      expect(result).toEqual(testCreds);
    });

    it('다른 sessionId로 등록한 creds는 서로 격리되어야 한다', () => {
      store.register('session-1', testCreds);
      store.register('session-2', testCreds2);

      expect(store.get('session-1')).toEqual(testCreds);
      expect(store.get('session-2')).toEqual(testCreds2);
    });
  });

  describe('unregister', () => {
    it('unregister 후 get은 undefined를 반환해야 한다', () => {
      store.register('session-1', testCreds);
      store.unregister('session-1');
      expect(store.get('session-1')).toBeUndefined();
    });

    it('등록되지 않은 sessionId를 unregister해도 에러가 발생하지 않아야 한다', () => {
      expect(() => store.unregister('not-registered')).not.toThrow();
    });
  });

  describe('has', () => {
    it('등록된 sessionId에 대해 true를 반환해야 한다', () => {
      store.register('session-1', testCreds);
      expect(store.has('session-1')).toBe(true);
    });

    it('등록되지 않은 sessionId에 대해 false를 반환해야 한다', () => {
      expect(store.has('unknown-session')).toBe(false);
    });

    it('unregister 후 has는 false를 반환해야 한다', () => {
      store.register('session-1', testCreds);
      store.unregister('session-1');
      expect(store.has('session-1')).toBe(false);
    });
  });

  describe('동일 sessionId 재등록', () => {
    it('동일 sessionId로 재등록하면 이전 creds를 덮어써야 한다', () => {
      store.register('session-1', testCreds);
      store.register('session-1', testCreds2);
      expect(store.get('session-1')).toEqual(testCreds2);
    });
  });

  describe('등록되지 않은 sessionId 조회', () => {
    it('등록되지 않은 sessionId 조회는 undefined를 반환해야 한다', () => {
      expect(store.get('never-registered')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clear 후 모든 sessionId 조회는 undefined를 반환해야 한다', () => {
      store.register('session-1', testCreds);
      store.register('session-2', testCreds2);
      store.clear();

      expect(store.get('session-1')).toBeUndefined();
      expect(store.get('session-2')).toBeUndefined();
    });
  });

  describe('STDIO_SESSION_ID 상수', () => {
    it('STDIO_SESSION_ID가 올바른 값을 가져야 한다', () => {
      expect(STDIO_SESSION_ID).toBe('__stdio_default__');
    });

    it('STDIO_SESSION_ID를 sessionId로 등록하고 조회할 수 있어야 한다', () => {
      store.register(STDIO_SESSION_ID, testCreds);
      expect(store.get(STDIO_SESSION_ID)).toEqual(testCreds);
    });
  });
});
