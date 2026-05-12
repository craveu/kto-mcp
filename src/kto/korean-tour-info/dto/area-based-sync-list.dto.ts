import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** areaBasedSyncList2 요청 DTO */
export class AreaBasedSyncListDto extends KtoPaginationDto {
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

  /** 공개 여부 필터 (1: 공개, 0: 비공개) */
  @IsOptional()
  @IsIn(['0', '1'])
  showflag?: string;

  /** 수정 시간 (YYYYMMDDHHMMSS 형식) */
  @IsOptional()
  @IsString()
  modifiedtime?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
