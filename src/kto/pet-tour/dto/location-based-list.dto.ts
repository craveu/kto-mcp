import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 반려동물 동반 가능 위치기반 관광정보 목록 요청 DTO.
 * mapX, mapY, radius는 필수 파라미터.
 */
export class PtLocationBasedListDto {
  /** 경도 (WGS84 기준) — 필수 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapX!: number;

  /** 위도 (WGS84 기준) — 필수 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapY!: number;

  /** 반경 거리 (단위: m, 1~20000) — 필수 */
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(20000)
  @Type(() => Number)
  radius!: number;

  /** 관광타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

  /** 정렬 코드 */
  @IsOptional()
  @IsString()
  arrange?: string;

  /** 한 페이지 결과 수 (1~100) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  numOfRows?: number;

  /** 페이지 번호 (1-기반) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo?: number;
}
