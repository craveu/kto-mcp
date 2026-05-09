import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 반려동물 동반 가능 지역기반 관광정보 목록 요청 DTO.
 * 모든 파라미터 선택 사항 (필수 파라미터 없음).
 */
export class PtAreaBasedListDto {
  /** 지역 코드 */
  @IsOptional()
  @IsString()
  areaCode?: string;

  /** 시군구 코드 */
  @IsOptional()
  @IsString()
  sigunguCode?: string;

  /** 관광타입 ID */
  @IsOptional()
  @IsString()
  contentTypeId?: string;

  /** 대분류 코드 */
  @IsOptional()
  @IsString()
  cat1?: string;

  /** 중분류 코드 */
  @IsOptional()
  @IsString()
  cat2?: string;

  /** 소분류 코드 */
  @IsOptional()
  @IsString()
  cat3?: string;

  /** 정렬 코드 (A=제목순, C=수정일순, D=생성일순, E=거리순) */
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
