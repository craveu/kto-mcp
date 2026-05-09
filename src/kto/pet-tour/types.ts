// @MX:NOTE: [AUTO] pet-filtered KTO content 응답 (KorService2의 KoreanTourItem과 동일 골격, sync 전용 showflag 추가).
// KorPetTourService2는 KorService2 superset에서 반려동물 동반 가능 콘텐츠만 필터링한 부분집합이다.
// @MX:SPEC: SPEC-KTO-007 REQ-KTO7-003

/**
 * KTO 반려동물 동반 가능 관광 콘텐츠 아이템.
 * 4개 오퍼레이션(areaBasedList2, locationBasedList2, searchKeyword2, petTourSyncList2) 응답을 흡수한다.
 * showflag 필드는 petTourSyncList2 전용 ('1'=active, '0'=deleted).
 */
export interface KorPetTourItem {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  areacode?: string;
  sigungucode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  mapx?: string;
  mapy?: string;
  mlevel?: string;
  firstimage?: string;
  firstimage2?: string;
  cpyrhtDivCd?: string;
  createdtime?: string;
  modifiedtime?: string;
  /** petTourSyncList2 전용: '1'=active, '0'=deleted */
  showflag?: string;
  [key: string]: string | undefined;
}
