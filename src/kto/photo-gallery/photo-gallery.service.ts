import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';
import type { PhotoGalleryItem } from './types';
import type {
  PgGalleryDetailListDto,
  PgGalleryListDto,
  PgGallerySearchListDto,
  PgGallerySyncDetailListDto,
} from './dto';

/**
 * KTO 관광사진 정보 서비스.
 * PhotoGalleryService1의 4개 오퍼레이션을 메서드로 제공한다.
 * 보조 코드 조회 오퍼레이션(galleryAreaCode1 등)은 KorService2와 중복되므로 미등록 (plan.md R1).
 */
@Injectable()
export class PhotoGalleryService {
  /** PhotoGalleryService1 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'PhotoGalleryService1';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 관광사진 갤러리 목록 조회
   *
   * @MX:NOTE: [AUTO] PhotoGalleryService1 galleryList1 오퍼레이션. gal* prefix 응답 필드
   * (galContentId, galTitle, galWebImageUrl, galPhotographyLocation, galPhotographer, ...)를
   * KTO 원형 그대로 반환한다.
   * @MX:SPEC: SPEC-KTO-003 REQ-EVT-001
   */
  async galleryList1(
    dto: PgGalleryListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoGalleryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'galleryList1',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 관광사진 갤러리 상세 목록 조회 (galContentId 필수)
   *
   * @MX:NOTE: [AUTO] PhotoGalleryService1 핵심 오퍼레이션. galContentId는 KorService2의
   * contentid와 별도 ID 체계다 (plan.md R6). KTO 가이드의 사진 메타 필드를 그대로 반환한다.
   * @MX:SPEC: SPEC-KTO-003 REQ-EVT-001, SPEC-KTO-003 REQ-UNW-001
   */
  async galleryDetailList1(
    dto: PgGalleryDetailListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoGalleryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'galleryDetailList1',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 관광사진 키워드 검색 (keyword 필수)
   *
   * @MX:NOTE: [AUTO] PhotoGalleryService1 gallerySearchList1 오퍼레이션.
   * keyword 파라미터로 전체 갤러리를 검색한다.
   * @MX:SPEC: SPEC-KTO-003 REQ-EVT-001
   */
  async gallerySearchList1(
    dto: PgGallerySearchListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoGalleryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'gallerySearchList1',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 관광사진 동기화 상세 목록 조회
   *
   * @MX:NOTE: [AUTO] PhotoGalleryService1 gallerySyncDetailList1 오퍼레이션.
   * 수정일시 기준으로 변경된 사진 목록을 동기화하는 데 사용한다.
   * syncModTime 파라미터명은 실 API 호출로 확인 필요. [VERIFIED — real call required]
   * @MX:SPEC: SPEC-KTO-003 REQ-EVT-001
   */
  async gallerySyncDetailList1(
    dto: PgGallerySyncDetailListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoGalleryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'gallerySyncDetailList1',
      params: { ...dto },
      credentials,
    });
  }
}
