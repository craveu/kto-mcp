import { Injectable } from '@nestjs/common';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoServiceName } from '../common/constants';
import type { KtoListResponse } from '../common/types';
import type { OdiiStoryItem, OdiiThemeItem } from './types';
import type {
  AgStoryBasedListDto,
  AgStoryBasedSyncListDto,
  AgStoryLocationBasedListDto,
  AgStorySearchListDto,
  AgThemeBasedListDto,
  AgThemeBasedSyncListDto,
  AgThemeLocationBasedListDto,
  AgThemeSearchListDto,
} from './dto';

/**
 * KTO 관광지 오디오 가이드정보 서비스 (Odii).
 * Odii 서비스의 8개 오퍼레이션(Story 4 + Theme 4)을 메서드로 제공한다.
 *
 * @MX:NOTE: [AUTO] Odii는 KTO 4번째 다국어 패턴 — 단일 path + langCode 파라미터.
 * 모든 메서드가 service: 'Odii'를 사용하며 langCode는 DTO 레벨에서 필수 검증된다.
 * @MX:SPEC: SPEC-KTO-005 REQ-KTO5-001, REQ-UNW-001
 */
@Injectable()
export class AudioGuideService {
  /** Odii 고유 서비스명 — 모든 메서드가 이 서비스를 사용한다 */
  private readonly service: KtoServiceName = 'Odii';

  constructor(private readonly httpClient: KtoHttpClient) {}

  // ─── Story 계열 ───────────────────────────────────────────────────────────

  /**
   * 오디오 가이드 Story 기본 목록 조회.
   * langCode 필수 (ko / en 권장). 미보유 언어는 totalCount=0 정상 응답.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001
   */
  async storyBasedList(
    dto: AgStoryBasedListDto,
  ): Promise<KtoListResponse<OdiiStoryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'storyBasedList',
      params: { ...dto },
    });
  }

  /**
   * 오디오 가이드 Story 동기화 목록 조회 (변경/삭제 이력 포함).
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001
   */
  async storyBasedSyncList(
    dto: AgStoryBasedSyncListDto,
  ): Promise<KtoListResponse<OdiiStoryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'storyBasedSyncList',
      params: { ...dto },
    });
  }

  /**
   * 위치기반 오디오 가이드 Story 목록 조회.
   * mapX/mapY/radius 필수, radius ≤ 20000m.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001, SPEC-KTO-005 REQ-UNW-001
   */
  async storyLocationBasedList(
    dto: AgStoryLocationBasedListDto,
  ): Promise<KtoListResponse<OdiiStoryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'storyLocationBasedList',
      params: { ...dto },
    });
  }

  /**
   * 키워드로 오디오 가이드 Story 검색.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001, SPEC-KTO-005 REQ-UNW-001
   */
  async storySearchList(
    dto: AgStorySearchListDto,
  ): Promise<KtoListResponse<OdiiStoryItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'storySearchList',
      params: { ...dto },
    });
  }

  // ─── Theme 계열 ───────────────────────────────────────────────────────────

  /**
   * 오디오 가이드 Theme 기본 목록 조회.
   * langCode=en은 KTO 카탈로그 미정비로 totalCount=0 정상 응답.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001
   */
  async themeBasedList(
    dto: AgThemeBasedListDto,
  ): Promise<KtoListResponse<OdiiThemeItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'themeBasedList',
      params: { ...dto },
    });
  }

  /**
   * 오디오 가이드 Theme 동기화 목록 조회 (변경/삭제 이력 포함).
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001
   */
  async themeBasedSyncList(
    dto: AgThemeBasedSyncListDto,
  ): Promise<KtoListResponse<OdiiThemeItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'themeBasedSyncList',
      params: { ...dto },
    });
  }

  /**
   * 위치기반 오디오 가이드 Theme 목록 조회.
   * mapX/mapY/radius 필수, radius ≤ 20000m.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001, SPEC-KTO-005 REQ-UNW-001
   */
  async themeLocationBasedList(
    dto: AgThemeLocationBasedListDto,
  ): Promise<KtoListResponse<OdiiThemeItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'themeLocationBasedList',
      params: { ...dto },
    });
  }

  /**
   * 키워드로 오디오 가이드 Theme 검색.
   *
   * @MX:SPEC: SPEC-KTO-005 REQ-EVT-001, SPEC-KTO-005 REQ-UNW-001
   */
  async themeSearchList(
    dto: AgThemeSearchListDto,
  ): Promise<KtoListResponse<OdiiThemeItem>> {
    return this.httpClient.request({
      service: this.service,
      operation: 'themeSearchList',
      params: { ...dto },
    });
  }
}
