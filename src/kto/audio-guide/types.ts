/**
 * KTO 관광지 오디오 가이드정보 (Odii) 응답 타입 정의.
 * Odii 서비스의 두 entity(Story / Theme)를 분리된 인터페이스로 표현한다.
 */

// @MX:NOTE: [AUTO] OdiiStoryItem — Story 계열 응답 entity.
// 오디오 내레이션 위치 단위(관광지 내 입구·본관·정원 등)를 표현한다.
// 4개 Story 오퍼레이션(storyBasedList, storyBasedSyncList, storyLocationBasedList, storySearchList)의 공용 응답 타입.
// audioUrl(MP3 CDN URL), script(텍스트 스크립트), playTime(초)이 핵심 필드다.
// @MX:SPEC: SPEC-KTO-005 REQ-KTO5-001

/**
 * KTO Odii storyBasedList / storyBasedSyncList / storyLocationBasedList / storySearchList
 * 응답의 개별 아이템 타입.
 * 오디오 내레이션이 부착된 관광지 위치 단위.
 */
export interface OdiiStoryItem {
  /** 관광지 식별자 */
  tid?: string;
  /** 관광지 링크 ID */
  tlid?: string;
  /** 스토리 식별자 */
  stid?: string;
  /** 스토리 링크 ID */
  stlid?: string;
  /** 위치 제목 (예: "백제문화단지 - 입구") */
  title?: string;
  /** 경도 (string) */
  mapX?: string;
  /** 위도 (string) */
  mapY?: string;
  /** 오디오 제목 */
  audioTitle?: string;
  /** 오디오 스크립트 텍스트 */
  script?: string;
  /** 재생 시간(초, string) */
  playTime?: string;
  /** MP3 오디오 URL */
  audioUrl?: string;
  /** 응답 언어 코드 (ko / en) */
  langCode?: string;
  /** 위치 이미지 URL */
  imageUrl?: string;
  /** KTO 생성 타임스탬프 (yyyymmddhhmmss) */
  createdtime?: string;
  /** KTO 갱신 타임스탬프 */
  modifiedtime?: string;
  [key: string]: string | undefined;
}

// @MX:NOTE: [AUTO] OdiiThemeItem — Theme 계열 응답 entity.
// 테마 관광지 카탈로그 단위(관광지 자체)를 표현한다. 오디오 URL은 없으며 테마 카테고리와 langCheck 비트마스크를 보유한다.
// 4개 Theme 오퍼레이션(themeBasedList, themeBasedSyncList, themeLocationBasedList, themeSearchList)의 공용 응답 타입.
// @MX:SPEC: SPEC-KTO-005 REQ-KTO5-001

/**
 * KTO Odii themeBasedList / themeBasedSyncList / themeLocationBasedList / themeSearchList
 * 응답의 개별 아이템 타입.
 * 테마 카탈로그 관광지 단위.
 */
export interface OdiiThemeItem {
  /** 관광지 식별자 */
  tid?: string;
  /** 관광지 링크 ID */
  tlid?: string;
  /** 테마 카테고리 (예: "백제역사여행") */
  themeCategory?: string;
  /** 시도 주소 */
  addr1?: string;
  /** 시군구 상세 주소 */
  addr2?: string;
  /** 관광지 제목 */
  title?: string;
  /** 경도 (string) */
  mapX?: string;
  /** 위도 (string) */
  mapY?: string;
  /** 5비트 다국어 보유 마스크 (예: "11110") */
  langCheck?: string;
  /** 응답 언어 코드 (ko / en) */
  langCode?: string;
  /** 관광지 대표 이미지 URL */
  imageUrl?: string;
  /** KTO 생성 타임스탬프 */
  createdtime?: string;
  /** KTO 갱신 타임스탬프 */
  modifiedtime?: string;
  [key: string]: string | undefined;
}
