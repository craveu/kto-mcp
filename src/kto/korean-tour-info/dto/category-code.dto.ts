import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** categoryCode2 요청 DTO */
export class CategoryCodeDto extends KtoPaginationDto {
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
}
