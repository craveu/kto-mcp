import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { GoCampingItem, GoCampingImageItem } from './types';
import type {
  GcBasedListDto,
  GcBasedSyncListDto,
  GcLocationBasedListDto,
  GcSearchListDto,
  GcImageListDto,
} from './dto';

/**
 * KTO 고캠핑 정보 서비스.
 * GoCamping의 5개 오퍼레이션을 메서드로 제공한다.
 */
@Injectable()
export class GoCampingService {
  /** GoCamping 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'GoCamping';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 고캠핑 캠핑장 기본 목록 조회
   *
   * @MX:NOTE: [AUTO] GoCamping basedList 오퍼레이션. 전체 캠핑장 메타데이터를
   * 페이지네이션으로 조회한다. totalCount ≈ 3,067 (운영 중인 캠핑장).
   * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001
   */
  async basedList(
    dto: GcBasedListDto,
  ): Promise<KtoListResponse<GoCampingItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'basedList',
      params: { ...dto },
    });
  }

  /**
   * 고캠핑 동기화 목록 조회 (변경/삭제 이력 포함)
   *
   * @MX:NOTE: [AUTO] GoCamping basedSyncList 오퍼레이션. syncStatus(A/U/D) 및
   * syncModTime으로 변경 이력을 필터링한다. totalCount ≈ 5,181 (삭제 이력 포함).
   * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001
   */
  async basedSyncList(
    dto: GcBasedSyncListDto,
  ): Promise<KtoListResponse<GoCampingItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'basedSyncList',
      params: { ...dto },
    });
  }

  /**
   * 위치기반 고캠핑 목록 조회
   *
   * @MX:NOTE: [AUTO] GoCamping locationBasedList 오퍼레이션.
   * mapX/mapY/radius 필수, radius ≤ 20000m.
   * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001, SPEC-KTO-004 REQ-UNW-001
   */
  async locationBasedList(
    dto: GcLocationBasedListDto,
  ): Promise<KtoListResponse<GoCampingItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList',
      params: { ...dto },
    });
  }

  /**
   * 키워드로 고캠핑 검색
   *
   * @MX:NOTE: [AUTO] GoCamping searchList 오퍼레이션.
   * keyword 필수, 한글 인코딩은 클라이언트 책임.
   * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001, SPEC-KTO-004 REQ-UNW-001
   */
  async searchList(
    dto: GcSearchListDto,
  ): Promise<KtoListResponse<GoCampingItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchList',
      params: { ...dto },
    });
  }

  /**
   * 고캠핑 이미지 목록 조회
   *
   * @MX:NOTE: [AUTO] GoCamping imageList 오퍼레이션. contentId 필수.
   * 사진 없는 캠핑장은 빈 결과(items: [])를 반환한다 (response-normalizer 처리).
   * 반환 타입이 GoCampingItem이 아닌 GoCampingImageItem으로 분기된다 (REQ-KTO4-003).
   * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001, SPEC-KTO-004 REQ-UNW-001, SPEC-KTO-004 REQ-KTO4-003
   */
  async imageList(
    dto: GcImageListDto,
  ): Promise<KtoListResponse<GoCampingImageItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'imageList',
      params: { ...dto },
    });
  }
}
