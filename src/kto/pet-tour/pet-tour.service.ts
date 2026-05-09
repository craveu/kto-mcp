import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { KorPetTourItem } from './types';
import type {
  PtAreaBasedListDto,
  PtLocationBasedListDto,
  PtSearchKeywordDto,
  PtPetTourSyncListDto,
} from './dto';

// @MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-EVT-001

/**
 * KTO 반려동물 동반여행 정보 서비스 (KorPetTourService2).
 * KorService2 superset에서 반려동물 동반 가능 콘텐츠만 필터링한 4개 오퍼레이션을 제공한다.
 */
@Injectable()
export class PetTourService {
  /** KorPetTourService2 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'KorPetTourService2';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 반려동물 동반 가능 지역기반 관광정보 목록 조회.
   * 사전 검증: areaCode='1'(서울) → totalCount=62.
   */
  async areaBasedList2(
    dto: PtAreaBasedListDto,
  ): Promise<KtoListResponse<KorPetTourItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedList2',
      params: { ...dto },
    });
  }

  /**
   * 반려동물 동반 가능 위치기반 관광정보 목록 조회.
   * mapX/mapY/radius 필수. 사전 검증: 서울시청 20km → totalCount=75.
   */
  async locationBasedList2(
    dto: PtLocationBasedListDto,
  ): Promise<KtoListResponse<KorPetTourItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList2',
      params: { ...dto },
    });
  }

  /**
   * 반려동물 동반 가능 키워드 검색.
   * keyword 필수. 사전 검증: keyword='카페' → totalCount=19.
   */
  async searchKeyword2(
    dto: PtSearchKeywordDto,
  ): Promise<KtoListResponse<KorPetTourItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchKeyword2',
      params: { ...dto },
    });
  }

  /**
   * 반려동물 동반 가능 관광지 전체 동기화 목록 조회.
   * KorPetTourService2 고유 오퍼레이션. showflag 필드로 active/deleted 분기.
   * 사전 검증: 전체 totalCount=10167.
   */
  async petTourSyncList2(
    dto: PtPetTourSyncListDto,
  ): Promise<KtoListResponse<KorPetTourItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'petTourSyncList2',
      params: { ...dto },
    });
  }
}
