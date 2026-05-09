import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 반려동물 동반 가능 관광지 동기화 목록 요청 DTO.
 * 모든 파라미터 선택 사항 (필수 파라미터 없음).
 */
export class PtPetTourSyncListDto {
  /** 활성화 여부 ('1'=active, '0'=deleted) */
  @IsOptional()
  @IsString()
  showflag?: string;

  /** 동기화 기준 시각 (형식은 KTO API 문서 참조) */
  @IsOptional()
  @IsString()
  syncModTime?: string;

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
