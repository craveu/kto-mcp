import { Injectable } from '@nestjs/common';

/**
 * KTO 서비스 키와 인코딩 여부를 담는 자격증명 타입.
 * stdio(env 기반)와 HTTP(헤더 기반) 양쪽 모두 동일 타입을 사용한다.
 */
export interface KtoCredentials {
  /** KTO data.go.kr 서비스 키 */
  serviceKey: string;
  /** 서비스 키가 이미 URL 인코딩된 상태로 제공되는지 여부 */
  preencoded: boolean;
}

/**
 * stdio transport 전용 고정 sessionId.
 * 사용자 세션 ID(randomUUID)와 충돌하지 않도록 양쪽 밑줄 마커를 사용한다.
 */
export const STDIO_SESSION_ID = '__stdio_default__';

// @MX:ANCHOR: [AUTO] 멀티 테넌트 키 라이프사이클 진입점 — register/get은 모든 transport에서 호출된다.
// @MX:REASON: 모든 transport 어댑터(stdio, http-streamable, http)가 register/unregister를 호출하며,
// tool-registry가 모든 도구 호출마다 get()을 호출한다. fan_in >= 4.
// @MX:SPEC: SPEC-KTO-011 REQ-KTO11-001, REQ-EVT-001

/**
 * MCP 세션 단위로 KTO 서비스 키를 인메모리에 저장하는 싱글톤 스토어.
 *
 * - 키 등록: transport adapter가 세션 초기화 시 호출
 * - 키 조회: tool-registry가 tools/call 시마다 호출
 * - 키 해제: transport adapter가 세션 종료 시 호출
 *
 * thread-safety: Node.js 단일 스레드 모델이므로 별도 lock 불필요.
 */
@Injectable()
export class SessionCredentialsStore {
  private readonly store = new Map<string, KtoCredentials>();

  // @MX:ANCHOR: [AUTO] 도구 호출 시점 키 조회 단일 통로
  // @MX:REASON: tool-registry가 65개 도구 호출마다 이 메서드를 통해 키를 조회한다. fan_in >= 65.

  /**
   * sessionId에 대한 KTO 자격증명을 등록한다.
   * 동일 sessionId로 재등록 시 이전 creds를 덮어쓴다.
   */
  register(sessionId: string, creds: KtoCredentials): void {
    this.store.set(sessionId, creds);
  }

  /**
   * sessionId에 대한 KTO 자격증명을 조회한다.
   * 등록되지 않은 sessionId이면 undefined를 반환한다.
   */
  get(sessionId: string): KtoCredentials | undefined {
    return this.store.get(sessionId);
  }

  /**
   * sessionId에 대한 KTO 자격증명을 삭제한다.
   * 세션 종료 시 호출하여 메모리 누수를 방지한다.
   * 등록되지 않은 sessionId이면 no-op으로 처리한다.
   */
  unregister(sessionId: string): void {
    this.store.delete(sessionId);
  }

  /**
   * sessionId가 등록되어 있는지 확인한다.
   */
  has(sessionId: string): boolean {
    return this.store.has(sessionId);
  }

  /**
   * 모든 세션 자격증명을 삭제한다.
   * 테스트에서 상태 초기화 용도로 사용한다.
   */
  clear(): void {
    this.store.clear();
  }
}
