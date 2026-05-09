import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** 페이지네이션 공통 파라미터 기반 DTO */
export class KtoPaginationDto {
  /** 한 페이지 결과 수 (기본 10) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  numOfRows?: number;

  /** 페이지 번호 (1-기반) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo?: number;
}
