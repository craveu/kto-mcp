import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';
import type { PhotoAwardItem } from './types';
import type { PaPhokoAwrdListDto, PaPhokoAwrdSyncListDto } from './dto';

// @MX:SPEC: SPEC-KTO-010 REQ-KTO10-001, REQ-EVT-001

/**
 * KTO 관광공모전 수상작 서비스 (PhokoAwrdService).
 * 응답에 ko prefix/en prefix 양 언어 필드가 동시 포함 (KTO 7번째 다국어 패턴).
 * 언어 파라미터 미사용 (langCode, langDivCd) — KTO가 거부(resultCode=10).
 */
@Injectable()
export class PhotoAwardService {
  /** PhokoAwrdService 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'PhokoAwrdService';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 관광공모전 수상작 사진 목록 조회.
   * 응답에 koTitle/enTitle 등 양 언어 필드 동시 포함 (dual-language 패턴).
   * 사전 검증: totalCount=95.
   */
  async phokoAwrdList(
    dto: PaPhokoAwrdListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoAwardItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'phokoAwrdList',
      params: { ...dto },
      credentials,
    });
  }

  /**
   * 관광공모전 수상작 동기화 목록 조회.
   * showflag 필드 포함. 변경/삭제 이력 반영.
   */
  async phokoAwrdSyncList(
    dto: PaPhokoAwrdSyncListDto,
    credentials: KtoCredentials,
  ): Promise<KtoListResponse<PhotoAwardItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'phokoAwrdSyncList',
      params: { ...dto },
      credentials,
    });
  }
}
