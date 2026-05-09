import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/** areaCode2 요청 DTO */
export class AreaCodeDto extends KtoPaginationDto {
  /** 지역 코드 (미지정 시 17개 시도 반환) */
  @IsOptional()
  @IsString()
  areaCode?: string;
}
