// @MX:NOTE: [AUTO] 의료관광 응답 — camelCase 필드명, KorService2 family(`KoreanTourItem`)와 도메인 분리.
// lDong* 행정코드 + langDivCd 응답 언어 코드 포함. sync 전용 showflag/oldContentId,
// detail 전용 treatmentName/medicalDept 등 인덱스 시그니처가 자동 흡수.
// @MX:SPEC: SPEC-KTO-008 REQ-KTO8-003

/**
 * KTO 의료관광 콘텐츠 아이템 (MdclTursmService 7개 오퍼레이션 응답 흡수).
 * camelCase 명명 — KorService2 계열의 lowercase 명명(KoreanTourItem)과 별도 도메인.
 * showflag/oldContentId는 mdclTursmSyncList 전용 필드.
 * 인덱스 시그니처가 의료관광 전용 메타(treatmentName/medicalDept/infoCenter/homepage 등) 흡수.
 */
export interface MdclTursmItem {
  contentId?: string;
  title?: string;
  baseAddr?: string;
  detailAddr?: string;
  zipCd?: string;
  tel?: string;
  mapX?: string;
  mapY?: string;
  mlevel?: string;
  lDongRegnCd?: string;
  lDongSignguCd?: string;
  orgImage?: string;
  thumbImage?: string;
  cpyrhtDivCd?: string;
  regDt?: string;
  mdfcnDt?: string;
  langDivCd?: string;
  /** mdclTursmSyncList 전용: '1'=active, '0'=deleted */
  showflag?: string;
  /** mdclTursmSyncList 전용: 이전 contentId */
  oldContentId?: string;
  [key: string]: string | undefined;
}
