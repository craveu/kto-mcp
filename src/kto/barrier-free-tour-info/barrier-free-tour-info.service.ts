import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type {
  BfAreaBasedListDto,
  BfDetailCommonDto,
  BfDetailImageDto,
  BfDetailInfoDto,
  BfDetailIntroDto,
  BfDetailWithTourDto,
  BfLocationBasedListDto,
  BfSearchFestivalDto,
  BfSearchKeywordDto,
  BfSearchStayDto,
} from './dto';

/**
 * KTO 무장애 여행정보 서비스.
 * KorWithService2의 10개 오퍼레이션을 메서드로 제공한다.
 * 코드 조회 4개(areaCode2 등)는 KorService2와 응답이 동일하므로 중복 등록하지 않는다 (plan.md R1).
 */
@Injectable()
export class BarrierFreeTourInfoService {
  /** KorWithService2 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'KorWithService2';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /** 지역기반 무장애 관광정보 목록 조회 */
  async areaBasedList2(
    dto: BfAreaBasedListDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedList2',
      params: { ...dto },
    });
  }

  /** 위치기반 무장애 정보 목록 조회 */
  async locationBasedList2(
    dto: BfLocationBasedListDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList2',
      params: { ...dto },
    });
  }

  /** 키워드 무장애 관광정보 검색 */
  async searchKeyword2(
    dto: BfSearchKeywordDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchKeyword2',
      params: { ...dto },
    });
  }

  /** 무장애 행사정보 검색 */
  async searchFestival2(
    dto: BfSearchFestivalDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchFestival2',
      params: { ...dto },
    });
  }

  /** 무장애 숙박정보 검색 */
  async searchStay2(
    dto: BfSearchStayDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchStay2',
      params: { ...dto },
    });
  }

  /** 공통정보 상세 조회 */
  async detailCommon2(
    dto: BfDetailCommonDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailCommon2',
      params: { ...dto },
    });
  }

  /** 소개 정보 조회 */
  async detailIntro2(
    dto: BfDetailIntroDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailIntro2',
      params: { ...dto },
    });
  }

  /** 반복 상세정보 조회 */
  async detailInfo2(
    dto: BfDetailInfoDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailInfo2',
      params: { ...dto },
    });
  }

  /** 이미지 정보 조회 */
  async detailImage2(
    dto: BfDetailImageDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailImage2',
      params: { ...dto },
    });
  }

  /**
   * 무장애 정보 상세 조회 (KorWithService2 고유 오퍼레이션)
   *
   * @MX:NOTE: [AUTO] KorWithService2 고유 오퍼레이션. 무장애 응답 필드
   * (wheelchair, exit, elevator, parking, restroom, guidesystem, signguide,
   *  videoguide, audioguide, braileblock, helpdog, stroller) 를 KTO 원형 그대로 반환한다.
   * @MX:SPEC: SPEC-KTO-002 REQ-EVT-001
   */
  async detailWithTour2(
    dto: BfDetailWithTourDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailWithTour2',
      params: { ...dto },
    });
  }
}
