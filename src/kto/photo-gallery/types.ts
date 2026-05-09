// @MX:NOTE: [AUTO] PhotoGalleryItem은 KTO PhotoGalleryService1 응답 스키마 계약이다.
// gal* prefix 필드(galContentId, galTitle, galWebImageUrl, ...)는 KorService2/KorWithService2의
// 평면 필드 컨벤션(addr1, contentid, ...)과 다른 별도 도메인 ID 체계다.
// KTO 원형 보존 정책(SPEC-KTO-001 Exclusion 5)에 따라 필드명·케이싱을 변환 없이 노출한다.
// @MX:SPEC: SPEC-KTO-003 REQ-KTO3-003

/**
 * KTO 관광사진(PhotoKorea) 응답 item 타입.
 * PhotoGalleryService1 galleryList1 / galleryDetailList1 / gallerySearchList1 / gallerySyncDetailList1 공통 응답 구조.
 * galContentId는 KorService2의 contentid와 별도 ID 체계다 (plan.md R6).
 */
export interface PhotoGalleryItem {
  /** 사진 갤러리 콘텐츠 ID (KorService2 contentid와 별도 ID 체계) */
  galContentId: string;
  /** 콘텐츠 타입 ID */
  galContentTypeId?: string;
  /** 사진 제목 */
  galTitle?: string;
  /** 웹 서비스용 이미지 URL */
  galWebImageUrl?: string;
  /** 생성 시각 (YYYYMMDDHHmmss 형식) */
  galCreatedtime?: string;
  /** 수정 시각 (YYYYMMDDHHmmss 형식) */
  galModifiedtime?: string;
  /** 촬영 위치 */
  galPhotographyLocation?: string;
  /** 촬영 월 (MM 형식) */
  galPhotographyMonth?: string;
  /** 촬영자 */
  galPhotographer?: string;
  /** 검색 키워드 (다중 값 구분자: 콤마) */
  galSearchKeyword?: string;
  /** 노출 여부 플래그 (gallerySyncDetailList1 응답 필드) */
  galUseFlag?: string;
}
