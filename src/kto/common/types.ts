/** 페이지네이션을 지원하는 기본 쿼리 파라미터 */
export interface KtoBaseQuery {
  /** 한 페이지 결과 수 (기본 10) */
  numOfRows?: number;
  /** 페이지 번호 (1-기반) */
  pageNo?: number;
}

/** 정규화된 KTO 목록 응답 */
export interface KtoListResponse<T> {
  /** 결과 아이템 배열 (항상 배열로 정규화됨) */
  items: T[];
  /** 한 페이지 결과 수 */
  numOfRows: number;
  /** 현재 페이지 번호 */
  pageNo: number;
  /** 전체 결과 수 */
  totalCount: number;
}

/** KTO API 원시 응답 봉투 타입 */
export interface KtoRawResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      /**
       * items는 정상 결과가 있으면 { item: T | T[] },
       * 결과가 없으면 빈 문자열("") 또는 undefined
       */
      items:
        | {
            item: T | T[];
          }
        | ''
        | undefined;
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}
