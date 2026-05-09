import { IsNotEmpty, IsString } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/**
 * 고캠핑 searchList 요청 DTO — 키워드 캠핑장 검색
 *
 * REQ-UNW-001: keyword 누락 시 outbound HTTP 호출 없이 검증 에러 반환
 */
export class GcSearchListDto extends KtoPaginationDto {
  /**
   * 검색 키워드 — 필수 (한글 인코딩은 클라이언트 책임)
   *
   * @MX:NOTE: [AUTO] @IsNotEmpty로 SPEC-KTO-004 REQ-UNW-001 강제 적용 —
   * keyword 누락 시 outbound HTTP 차단.
   */
  @IsString()
  @IsNotEmpty()
  keyword!: string;
}
