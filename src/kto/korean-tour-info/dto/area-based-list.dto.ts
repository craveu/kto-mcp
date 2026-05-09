import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** areaBasedList2 요청 DTO */
export class AreaBasedListDto extends KtoPaginationDto {
  /** 지역 코드 */
  @IsOptional()
  @IsString()
  areaCode?: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

  /** 콘텐츠 타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

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

  /** 정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순, E: 거리순, P: 인기순) */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
