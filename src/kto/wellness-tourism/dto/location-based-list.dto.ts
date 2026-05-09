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
 * 웰니스관광 위치기반 목록 요청 DTO.
 * langDivCd, mapX, mapY, radius 필수.
 */
export class WtLocationBasedListDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 경도 (WGS84 기준) — 필수. 예: 126.9779 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapX!: number;

  /** 위도 (WGS84 기준) — 필수. 예: 37.5664 */
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

  /** 콘텐츠 타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

  /** 정렬 코드 (A=제목순, E=거리순) */
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
