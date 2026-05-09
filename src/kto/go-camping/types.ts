// @MX:NOTE: [AUTO] GoCampingItem은 KTO GoCamping 서비스 응답 스키마 계약이다.
// KTO GoCamping API는 60+ 개의 캠핑 도메인 특화 필드를 가지며, 모두 명시적으로 타입하면
// 인터페이스가 방대해진다. 핵심 30개 필드만 named optional로 노출하고
// 나머지는 인덱스 시그니처 [key: string]: string | undefined 로 흡수한다.
// KTO 원형 보존 정책에 따라 필드명·케이싱·Y/N 등을 변환 없이 그대로 노출한다.
// @MX:SPEC: SPEC-KTO-004 REQ-KTO4-003

/**
 * KTO 고캠핑 응답 item 타입.
 * GoCamping basedList / basedSyncList / locationBasedList / searchList 공통 응답 구조.
 * contentId는 KorService2의 contentid와 동일 ID 체계다.
 */
export interface GoCampingItem {
  /** 콘텐츠 ID */
  contentId?: string;
  /** 캠핑장명 */
  facltNm?: string;
  /** 한줄소개 */
  lineIntro?: string;
  /** 소개 */
  intro?: string;
  /** 면적 */
  allar?: string;
  /** 보험가입여부 */
  insrncAt?: string;
  /** 여행사사업자등록번호 */
  trsagntNo?: string;
  /** 사업자등록번호 */
  bizrno?: string;
  /** 캠핑장구분명 */
  facltDivNm?: string;
  /** 관리주체구분명 */
  mangeDivNm?: string;
  /** 관리상태 */
  manageSttus?: string;
  /** 운영형태구분 */
  mgcDiv?: string;
  /** 휴무일 */
  hvof?: string;
  /** 주소1 */
  addr1?: string;
  /** 주소2 */
  addr2?: string;
  /** 우편번호 */
  zipcode?: string;
  /** 도명 */
  doNm?: string;
  /** 시군구명 */
  sigunguNm?: string;
  /** 경도 */
  mapX?: string;
  /** 위도 */
  mapY?: string;
  /** 방향 */
  direction?: string;
  /** 전화번호 */
  tel?: string;
  /** 홈페이지 */
  homepage?: string;
  /** 예약 URL */
  resveUrl?: string;
  /** 예약 구분 */
  resveCl?: string;
  /** 관리인원수 */
  manageNmpr?: string;
  /** 일반야영장수 */
  gnrlSiteCo?: string;
  /** 자동차야영장수 */
  autoSiteCo?: string;
  /** 글램핑수 */
  glampSiteCo?: string;
  /** 카라반수 */
  caravSiteCo?: string;
  /** 개인카라반수 */
  indvdlCaravSiteCo?: string;
  /** 부대시설구분 */
  sbrsCl?: string;
  /** 부대시설기타 */
  sbrsEtc?: string;
  /** 가능시설구분 */
  posblFcltyCl?: string;
  /** 가능시설기타 */
  posblFcltyEtc?: string;
  /** 테마환경구분 */
  themaEnvrnCl?: string;
  /** 장비대여구분 */
  eqpmnLendCl?: string;
  /** 애완동물출입구분 */
  animalCmgCl?: string;
  /** 여행시기구분 */
  tourEraCl?: string;
  /** 대표이미지 URL */
  firstImageUrl?: string;
  /** 등록일시 */
  createdtime?: string;
  /** 수정일시 */
  modifiedtime?: string;
  /** 미명시 KTO 응답 필드 흡수용 인덱스 시그니처 */
  [key: string]: string | undefined;
}

/**
 * KTO 고캠핑 이미지 응답 item 타입.
 * GoCamping imageList 전용 응답 구조 — 5개 필드만 존재.
 */
export interface GoCampingImageItem {
  /** 콘텐츠 ID */
  contentId?: string;
  /** 일련번호 */
  serialnum?: string;
  /** 이미지 URL */
  imageUrl?: string;
  /** 등록일시 */
  createdtime?: string;
  /** 수정일시 */
  modifiedtime?: string;
  /** 미명시 KTO 응답 필드 흡수용 인덱스 시그니처 */
  [key: string]: string | undefined;
}
