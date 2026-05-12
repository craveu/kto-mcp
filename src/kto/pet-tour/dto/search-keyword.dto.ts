import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 반려동물 동반 가능 키워드 검색 요청 DTO.
 * keyword는 필수 파라미터.
 */
export class PtSearchKeywordDto {
  /** 검색 키워드 — 필수 */
  @IsNotEmpty()
  @IsString()
  keyword!: string;

  /** 관광타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

  /** 법정동 지역 코드 */
  @IsOptional()
  @IsString()
  lDongRegnCd?: string;

  /** 법정동 시군구 코드 */
  @IsOptional()
  @IsString()
  lDongSignguCd?: string;

  /** 정렬 코드 */
  @IsOptional()
  @IsString()
  arrange?: string;

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
