import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** lclsSystmCode2 요청 DTO */
export class LclsSystmCodeDto extends KtoPaginationDto {
  /** 분류체계 1단계 */
  @IsOptional()
  @IsString()
  lclsSystm1?: string;

  /** 분류체계 2단계 */
  @IsOptional()
  @IsString()
  lclsSystm2?: string;
}
