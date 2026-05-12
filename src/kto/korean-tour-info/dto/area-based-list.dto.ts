import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** areaBasedList2 요청 DTO */
export class AreaBasedListDto extends KtoPaginationDto {
  /** 법정동 지역 코드 */
  @IsOptional()
  @IsString()
  lDongRegnCd?: string;

  /** 법정동 시군구 코드 */
  @IsOptional()
  @IsString()
  lDongSignguCd?: string;

  /** 콘텐츠 타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

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

  /** 정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순, E: 거리순, P: 인기순) */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
