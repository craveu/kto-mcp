import { IsNotEmpty, IsString } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/**
 * 고캠핑 imageList 요청 DTO — 캠핑장 이미지 목록 조회
 *
 * REQ-UNW-001: contentId 누락 시 outbound HTTP 호출 없이 검증 에러 반환
 */
export class GcImageListDto extends KtoPaginationDto {
  /**
   * 콘텐츠 ID — 필수
   *
   * @MX:NOTE: [AUTO] @IsNotEmpty로 SPEC-KTO-004 REQ-UNW-001 강제 적용 —
   * contentId 누락 시 outbound HTTP 차단.
   */
  @IsString()
  @IsNotEmpty()
  contentId!: string;
}
