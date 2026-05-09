import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type {
  AreaBasedListDto,
  AreaBasedSyncListDto,
  AreaCodeDto,
  CategoryCodeDto,
  DetailCommonDto,
  DetailImageDto,
  DetailInfoDto,
  DetailIntroDto,
  DetailPetTourDto,
  LclsSystmCodeDto,
  LdongCodeDto,
  LocationBasedListDto,
  SearchFestivalDto,
  SearchKeywordDto,
  SearchStayDto,
} from './dto';

/**
 * KTO 국문 관광정보 서비스.
 * 15개 KorService2 오퍼레이션을 메서드로 제공한다.
 */
@Injectable()
export class KoreanTourInfoService {
  /** 기본 서비스명. 다국어 확장 시 생성자 파라미터로 변경 가능. */
  private readonly service: KtoServiceName = 'KorService2';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /** 지역기반 관광정보 목록 조회 */
  async areaBasedList2(
    dto: AreaBasedListDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedList2',
      params: { ...dto },
    });
  }

  /** 지역기반 관광정보 동기화 목록 조회 */
  async areaBasedSyncList2(
    dto: AreaBasedSyncListDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedSyncList2',
      params: { ...dto },
    });
  }

  /** 지역 코드 조회 */
  async areaCode2(
    dto: AreaCodeDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaCode2',
      params: { ...dto },
    });
  }

  /** 서비스 분류 코드 조회 */
  async categoryCode2(
    dto: CategoryCodeDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'categoryCode2',
      params: { ...dto },
    });
  }

  /** 공통정보 조회 */
  async detailCommon2(
    dto: DetailCommonDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailCommon2',
      params: { ...dto },
    });
  }

  /** 이미지 정보 조회 */
  async detailImage2(
    dto: DetailImageDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailImage2',
      params: { ...dto },
    });
  }

  /** 반복 상세정보 조회 */
  async detailInfo2(
    dto: DetailInfoDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailInfo2',
      params: { ...dto },
    });
  }

  /** 소개 정보 조회 */
  async detailIntro2(
    dto: DetailIntroDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailIntro2',
      params: { ...dto },
    });
  }

  /**
   * 반려동물 동반 여행정보 조회
   * [ASSUMED] KorService2 포함 여부 미확인 (research.md §9 참조)
   */
  async detailPetTour2(
    dto: DetailPetTourDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailPetTour2',
      params: { ...dto },
    });
  }

  /** 법정동 코드 조회 */
  async ldongCode2(
    dto: LdongCodeDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'ldongCode2',
      params: { ...dto },
    });
  }

  /** 분류체계 코드 조회 */
  async lclsSystmCode2(
    dto: LclsSystmCodeDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'lclsSystmCode2',
      params: { ...dto },
    });
  }

  /** 위치기반 관광정보 목록 조회 */
  async locationBasedList2(
    dto: LocationBasedListDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList2',
      params: { ...dto },
    });
  }

  /** 행사정보 검색 */
  async searchFestival2(
    dto: SearchFestivalDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchFestival2',
      params: { ...dto },
    });
  }

  /** 키워드 검색 */
  async searchKeyword2(
    dto: SearchKeywordDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchKeyword2',
      params: { ...dto },
    });
  }

  /** 숙박정보 검색 */
  async searchStay2(
    dto: SearchStayDto,
  ): Promise<KtoListResponse<Record<string, unknown>>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchStay2',
      params: { ...dto },
    });
  }
}
