import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/** 무장애 locationBasedList2 요청 DTO — 위치기반 무장애 정보 목록 조회 */
export class BfLocationBasedListDto extends KtoPaginationDto {
  /** 경도 (WGS84) (필수) */
  @IsNumber()
  @Type(() => Number)
  mapX!: number;

  /** 위도 (WGS84) (필수) */
  @IsNumber()
  @Type(() => Number)
  mapY!: number;

  /** 반경 (미터, 최대 20000) (필수) */
  @IsNumber()
  @Min(1)
  @Max(20000)
  @Type(() => Number)
  radius!: number;

  /** 콘텐츠 타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
