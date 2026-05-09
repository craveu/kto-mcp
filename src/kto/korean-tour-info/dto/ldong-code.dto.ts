import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** ldongCode2 요청 DTO */
export class LdongCodeDto extends KtoPaginationDto {
  /** 법정동 지역 코드 */
  @IsOptional()
  @IsString()
  lDongRegnCd?: string;

  /** 법정동 시군구 코드 */
  @IsOptional()
  @IsString()
  lDongSignguCd?: string;
}
