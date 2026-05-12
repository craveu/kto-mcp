import { IsIn, IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** searchStay2 요청 DTO */
export class SearchStayDto extends KtoPaginationDto {
  /** 법정동 지역 코드 */
  @IsOptional()
  @IsString()
  lDongRegnCd?: string;

  /** 법정동 시군구 코드 */
  @IsOptional()
  @IsString()
  lDongSignguCd?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;

  /** 한옥 여부 (Y/N) */
  @IsOptional()
  @IsIn(['Y', 'N'])
  hanOk?: string;

  /** 샤워 시설 여부 (Y/N) */
  @IsOptional()
  @IsIn(['Y', 'N'])
  shower?: string;
}
