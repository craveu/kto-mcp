import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { DurunubiCourseItem, DurunubiRouteItem } from './types';
import type { DuCourseListDto, DuRouteListDto } from './dto';

// @MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-EVT-001

/**
 * KTO 두루누비(코리아둘레길) 정보 서비스.
 * Durunubi 서비스의 2개 오퍼레이션을 메서드로 제공한다.
 */
@Injectable()
export class DurunubiService {
  /** Durunubi 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'Durunubi';

  constructor(private readonly httpClient: KtoHttpClient) {}

  /**
   * 코리아둘레길 트래킹 코스 목록 조회
   *
   * @MX:NOTE: [AUTO] Durunubi courseList 오퍼레이션. totalCount=228 코스.
   * gpxpath 필드에 GPX 파일 URL 포함 — 다운로드/파싱은 클라이언트 책임.
   * @MX:SPEC: SPEC-KTO-006 REQ-EVT-001
   */
  async courseList(
    dto: DuCourseListDto,
  ): Promise<KtoListResponse<DurunubiCourseItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'courseList',
      params: { ...dto },
    });
  }

  /**
   * 코리아둘레길 상위 경로(테마) 목록 조회
   *
   * @MX:NOTE: [AUTO] Durunubi routeList 오퍼레이션. totalCount=3 (남파랑길/해파랑길 등).
   * themedescs 필드는 HTML 태그 포함 — sanitization은 LLM 클라이언트 책임.
   * @MX:SPEC: SPEC-KTO-006 REQ-EVT-001
   */
  async routeList(
    dto: DuRouteListDto,
  ): Promise<KtoListResponse<DurunubiRouteItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'routeList',
      params: { ...dto },
    });
  }
}
