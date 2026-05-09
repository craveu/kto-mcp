import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 코리아둘레길 courseList 요청 DTO.
 * 모든 파라미터 선택 사항 (필수 파라미터 없음).
 */
export class DuCourseListDto {
  /** 한 페이지 결과 수 (1~100) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  numOfRows?: number;

  /** 페이지 번호 (1-기반) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo?: number;
}
