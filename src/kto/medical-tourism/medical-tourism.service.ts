import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { MdclTursmItem } from './types';
import type {
  MtAreaBasedListDto,
  MtLocationBasedListDto,
  MtSearchKeywordDto,
  MtMdclTursmSyncListDto,
  MtDetailMdclTursmDto,
  MtDetailCommonDto,
  MtDetailIntroDto,
} from './dto';

// @MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-EVT-001

/**
 * KTO 의료관광 정보 서비스 (MdclTursmService).
 * 외국인 의료관광객 대상 KTO 큐레이팅 의료기관 정보 7개 오퍼레이션을 제공한다.
 * langDivCd 파라미터로 다국어 처리 (KTO 6번째 service path 패턴).
 */
@Injectable()
export class MedicalTourismService {
  /** MdclTursmService 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'MdclTursmService';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 의료관광 지역기반 목록 조회.
   * 사전 검증: langDivCd='KOR' → totalCount=336~337.
   */
  async areaBasedList(
    dto: MtAreaBasedListDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'areaBasedList',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 위치기반 목록 조회.
   * mapX/mapY/radius 필수.
   */
  async locationBasedList(
    dto: MtLocationBasedListDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'locationBasedList',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 키워드 검색.
   * keyword 필수. 영어 검색어 권장 — 의료관광 데이터가 영어 기본.
   */
  async searchKeyword(
    dto: MtSearchKeywordDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'searchKeyword',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 전체 동기화 목록 조회.
   * MdclTursmService 고유 오퍼레이션. showflag/oldContentId 필드 포함.
   */
  async mdclTursmSyncList(
    dto: MtMdclTursmSyncListDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'mdclTursmSyncList',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 전용 상세 조회.
   * treatmentName/medicalDept/infoCenter/homepage 등 의료관광 메타 응답.
   */
  async detailMdclTursm(
    dto: MtDetailMdclTursmDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailMdclTursm',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 contentId 공통 정보 조회.
   * KorService2의 detailCommon2와 응답 스키마 다름.
   */
  async detailCommon(
    dto: MtDetailCommonDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailCommon',
      params: { ...dto },
    });
  }

  /**
   * 의료관광 contentId 소개 정보 조회.
   * KorService2의 detailIntro2와 응답 스키마 다름.
   */
  async detailIntro(
    dto: MtDetailIntroDto,
  ): Promise<KtoListResponse<MdclTursmItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'detailIntro',
      params: { ...dto },
    });
  }
}
