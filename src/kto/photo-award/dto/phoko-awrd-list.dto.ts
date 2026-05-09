import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 관광공모전 수상작 목록 요청 DTO.
 * 페이지네이션 파라미터만 선택 허용.
 * REQ-UNW-001: langCode/langDivCd/lang 일체 미포함 — KTO가 거부(resultCode=10).
 */
export class PaPhokoAwrdListDto {
  /** 한 페이지 결과 수 (1-기반) */
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
