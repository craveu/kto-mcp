import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** areaBasedSyncList2 요청 DTO */
export class AreaBasedSyncListDto extends KtoPaginationDto {
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
