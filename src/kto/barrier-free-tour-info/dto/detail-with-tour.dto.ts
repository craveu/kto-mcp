import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 무장애 detailWithTour2 요청 DTO — 무장애 정보 상세 조회 (KorWithService2 고유 오퍼레이션)
 *
 * @MX:NOTE: [AUTO] KorWithService2 고유 오퍼레이션. 무장애 시설 메타 필드
 * (wheelchair, exit, elevator, parking, restroom, guidesystem, signguide,
 *  videoguide, audioguide, braileblock, helpdog, stroller) 를 KTO 원형 그대로 반환한다.
 * @MX:SPEC: SPEC-KTO-002 REQ-EVT-001
 *
 * REQ-UNW-001: contentId 누락 시 outbound HTTP 호출 없이 검증 에러 반환
 * @MX:SPEC: SPEC-KTO-002 REQ-UNW-001
 */
export class BfDetailWithTourDto {
  /**
   * 콘텐츠 ID (필수)
   * @MX:NOTE: [AUTO] @IsNotEmpty로 SPEC-KTO-002 REQ-UNW-001 강제 적용 — contentId 누락 시 outbound 차단
   */
  @IsString()
  @IsNotEmpty()
  contentId!: string;
}
