import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';
import type { WellnessTursmItem } from './types';
import type {
  WtAreaBasedListDto,
  WtLocationBasedListDto,
  WtSearchKeywordDto,
  WtWellnessTursmSyncListDto,
  WtDetailCommonDto,
  WtDetailIntroDto,
  WtDetailInfoDto,
  WtDetailImageDto,
} from './dto';

// @MX:SPEC: SPEC-KTO-009 REQ-KTO9-001, REQ-EVT-001

/**
 * KTO 웰니스관광 정보 서비스 (WellnessTursmService).
 * 웰니스/스파/온천 관광지 대상 KTO 큐레이팅 정보 8개 오퍼레이션을 제공한다.
 * langDivCd 파라미터로 다국어 처리 (KTO 6번째 service path 패턴, KOR 기본).
 */
@Injectable()
export class WellnessTourismService {
  /** WellnessTursmService 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'WellnessTursmService';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 웰니스관광 지역기반 목록 조회.
   * 사전 검증: langDivCd='KOR' → totalCount=174.
   */
  async areaBasedList(
    dto: WtAreaBasedListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedList',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 위치기반 목록 조회.
   * mapX/mapY/radius 필수. dist 필드 포함.
   */
  async locationBasedList(
    dto: WtLocationBasedListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 키워드 검색.
   * keyword 필수. 한국어 검색어 권장 — 웰니스관광 데이터가 한국어 기본.
   */
  async searchKeyword(
    dto: WtSearchKeywordDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchKeyword',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 전체 동기화 목록 조회.
   * WellnessTursmService 고유 오퍼레이션. showflag/oldContentId 필드 포함.
   */
  async wellnessTursmSyncList(
    dto: WtWellnessTursmSyncListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'wellnessTursmSyncList',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 contentId 공통 정보 조회.
   */
  async detailCommon(
    dto: WtDetailCommonDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailCommon',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 contentId 소개 정보 조회.
   * contentId/contentTypeId 필수.
   */
  async detailIntro(
    dto: WtDetailIntroDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailIntro',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 contentId 반복 정보 조회.
   * contentId/contentTypeId 필수.
   */
  async detailInfo(
    dto: WtDetailInfoDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailInfo',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 웰니스관광 이미지 목록 조회.
   * imgname/serialnum 필드 포함.
   */
  async detailImage(
    dto: WtDetailImageDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<WellnessTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailImage',
      params: { ...dto },
      credentials,
    });
  }
}
