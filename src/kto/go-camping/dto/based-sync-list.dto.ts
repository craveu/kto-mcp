import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/**
 * 고캠핑 basedSyncList 요청 DTO — 캠핑장 동기화 목록 조회
 * 모든 파라미터 선택 사항 (필수 파라미터 없음).
 *
 * @MX:NOTE: [AUTO] syncStatus 값: A=신규, U=수정, D=삭제 (Swagger 명세 확인).
 * @MX:SPEC: SPEC-KTO-004 REQ-EVT-001
 */
export class GcBasedSyncListDto extends KtoPaginationDto {
  /**
   * 동기화 상태 (선택): A=신규, U=수정, D=삭제
   */
  @IsOptional()
  @IsString()
  @IsIn(['A', 'U', 'D'])
  syncStatus?: string;

  /**
   * 동기화 기준 수정일시 (선택): YYYYMMDDhhmmss 형식
   */
  @IsOptional()
  @IsString()
  syncModTime?: string;
}
