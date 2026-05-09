// @MX:NOTE: [AUTO] Course = 코스 GPX 단위 (228개, gpxpath URL 포함), Route = 상위 카테고리 (남파랑길/해파랑길 등 3개 테마).
// DurunubiCourseItem은 개별 트래킹 코스이며 DurunubiRouteItem은 코스들을 묶는 상위 테마 카탈로그다.
// @MX:SPEC: SPEC-KTO-006 REQ-KTO6-003

/**
 * 코리아둘레길 트래킹 코스 아이템 (courseList 응답 단위).
 * gpxpath 필드는 GPX 파일 URL — 다운로드/파싱은 클라이언트 책임.
 */
export interface DurunubiCourseItem {
  routeIdx?: string;
  crsIdx?: string;
  crsKorNm?: string;
  /** 코스 거리 (km 단위 문자열) */
  crsDstnc?: string;
  /** 코스 총 소요 시간 (분 단위 문자열) */
  crsTotlRqrmHour?: string;
  crsLevel?: string;
  crsCycle?: string;
  crsContents?: string;
  crsSummary?: string;
  crsTourInfo?: string;
  travelerinfo?: string;
  sigun?: string;
  brdDiv?: string;
  /** GPX 파일 URL — 트래킹 워치/외부 앱이 처리 */
  gpxpath?: string;
  createdtime?: string;
  modifiedtime?: string;
  [key: string]: string | undefined;
}

/**
 * 코리아둘레길 상위 경로(테마) 아이템 (routeList 응답 단위).
 * themedescs 필드는 HTML 태그 포함 — sanitization은 LLM 클라이언트 책임.
 */
export interface DurunubiRouteItem {
  routeIdx?: string;
  themeNm?: string;
  linemsg?: string;
  /** HTML 태그 포함 상세 설명 — KTO 원형 그대로 전달 */
  themedescs?: string;
  createdtime?: string;
  modifiedtime?: string;
  [key: string]: string | undefined;
}
