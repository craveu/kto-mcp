// @MX:NOTE: [AUTO] 관광공모전 수상작 응답 — dual-language 패턴(ko*/en* 양 prefix 동시 노출). 6자리 base62-like contentId 도메인 분리. KTO 7번째 다국어 패턴.

/**
 * KTO 관광공모전 수상작 응답 아이템.
 * 단일 호출에 koTitle/enTitle 등 양 언어 필드가 동시 포함된다 (KTO 7번째 다국어 패턴).
 * contentId는 6자리 base62-like 문자열로, 다른 KTO 서비스의 숫자형 contentId와 도메인이 다르다.
 * showflag는 phokoAwrdSyncList 응답에만 포함되므로 옵셔널.
 */
export interface PhotoAwardItem {
  contentId?: string;
  koTitle?: string;
  enTitle?: string;
  lDongRegnCd?: string;
  koFilmst?: string;
  enFilmst?: string;
  filmDay?: string;
  koCmanNm?: string;
  enCmanNm?: string;
  koWnprzDiz?: string;
  enWnprzDiz?: string;
  koKeyWord?: string;
  enKeyWord?: string;
  orgImage?: string;
  thumbImage?: string;
  cpyrhtDivCd?: string;
  regDt?: string;
  mdfcnDt?: string;
  showflag?: string;
  [key: string]: string | undefined;
}
