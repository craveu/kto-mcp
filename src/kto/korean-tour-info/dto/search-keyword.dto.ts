import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** searchKeyword2 요청 DTO */
export class SearchKeywordDto extends KtoPaginationDto {
  /** 검색 키워드 (필수) */
  @IsString()
  keyword!: string;

  /** 콘텐츠 타입 ID */
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

  /** 분류체계 1단계 */
  @IsOptional()
  @IsString()
  lclsSystm1?: string;

  /** 분류체계 2단계 */
  @IsOptional()
  @IsString()
  lclsSystm2?: string;

  /** 분류체계 3단계 */
  @IsOptional()
  @IsString()
  lclsSystm3?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
