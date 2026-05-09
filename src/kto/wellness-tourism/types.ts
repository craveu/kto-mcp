// @MX:NOTE: [AUTO] 웰니스관광 응답 — camelCase, MdclTursmItem과 도메인 분리. 한국어 콘텐츠 기본(의료관광 ENG와 다름).
// WellnessTursmService 8개 오퍼레이션 응답 흡수. sync 전용 showflag/oldContentId,
// image 전용 imgname/serialnum, location 전용 dist 필드.
// @MX:SPEC: SPEC-KTO-009 REQ-KTO9-001

/**
 * KTO 웰니스관광 콘텐츠 아이템 (WellnessTursmService 8개 오퍼레이션 응답 흡수).
 * camelCase 명명 — MdclTursmItem과 도메인 분리 (의도적 중복, SPEC-KTO-009 설계 결정).
 * showflag/oldContentId는 wellnessTursmSyncList 전용 필드.
 * imgname/serialnum는 detailImage 전용 필드.
 * dist는 locationBasedList 전용 필드.
 */
export interface WellnessTursmItem {
  contentId?: string;
  contentTypeId?: string;
  title?: string;
  baseAddr?: string;
  detailAddr?: string;
  zipCd?: string;
  tel?: string;
  telname?: string;
  homepage?: string;
  mapX?: string;
  mapY?: string;
  mlevel?: string;
  orgImage?: string;
  thumbImage?: string;
  cpyrhtDivCd?: string;
  regDt?: string;
  mdfcnDt?: string;
  langDivCd?: string;
  /** locationBasedList 전용: 거리 (m) */
  dist?: string;
  /** wellnessTursmSyncList 전용: '1'=active, '0'=deleted */
  showflag?: string;
  /** wellnessTursmSyncList 전용: 이전 contentId */
  oldContentId?: string;
  /** detailImage 전용: 이미지 파일명 */
  imgname?: string;
  /** detailImage 전용: 순번 */
  serialnum?: string;
  [key: string]: string | undefined;
}
