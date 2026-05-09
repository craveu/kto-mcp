import type { KtoListResponse, KtoRawResponse } from './types';

// @MX:ANCHOR: [AUTO] 모든 KTO API 응답이 이 함수를 통과한다. fan_in >= 15 예상.
// @MX:REASON: 모든 도구의 응답 정규화 진입점. 단일 객체/배열/빈 결과 모두 처리.
// @MX:SPEC: SPEC-KTO-001 REQ-KTO-004

/**
 * KTO API의 원시 응답을 정규화된 목록 응답으로 변환한다.
 * - items.item이 배열이면 그대로 사용
 * - items.item이 단일 객체이면 1-element 배열로 변환
 * - items가 빈 문자열이거나 undefined이면 빈 배열로 변환
 */
export function normalizeItems<T>(raw: KtoRawResponse<T>): KtoListResponse<T> {
  const body = raw.response.body;
  const items = body.items;

  let normalizedItems: T[];

  if (!items || (items as unknown) === '') {
    // 빈 결과
    normalizedItems = [];
  } else {
    const item = items.item;
    if (Array.isArray(item)) {
      normalizedItems = item;
    } else {
      // 단일 객체를 배열로 래핑
      normalizedItems = [item];
    }
  }

  return {
    items: normalizedItems,
    numOfRows: body.numOfRows,
    pageNo: body.pageNo,
    totalCount: body.totalCount,
  };
}
