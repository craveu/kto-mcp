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
 * 의료관광 키워드 검색 요청 DTO.
 * langDivCd, keyword 필수.
 */
export class MtSearchKeywordDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR, ENG, CHS, CHT, JPN */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 검색 키워드 (필수) */
  @IsNotEmpty()
  @IsString()
  keyword!: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

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
