import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/** 무장애 searchStay2 요청 DTO — 무장애 숙박정보 검색 */
export class BfSearchStayDto extends KtoPaginationDto {
  /** 지역 코드 */
  @IsOptional()
  @IsString()
  areaCode?: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
