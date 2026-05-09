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
 * 의료관광 지역기반 목록 요청 DTO.
 * langDivCd 필수; 나머지 파라미터 선택.
 */
export class MtAreaBasedListDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR, ENG, CHS, CHT, JPN */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

  /** 대분류 코드 */
  @IsOptional()
  @IsString()
  cat1?: string;

  /** 중분류 코드 */
  @IsOptional()
  @IsString()
  cat2?: string;

  /** 소분류 코드 */
  @IsOptional()
  @IsString()
  cat3?: string;

  /** 정렬 코드 (A=제목순, C=수정일순, D=생성일순) */
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
