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

  /** 지역 코드 */
  @IsOptional()
  @IsString()
  areaCode?: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

  /** 대분류 */
  @IsOptional()
  @IsString()
  cat1?: string;

  /** 중분류 */
  @IsOptional()
  @IsString()
  cat2?: string;

  /** 소분류 */
  @IsOptional()
  @IsString()
  cat3?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
