import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 의료관광 sync 목록 요청 DTO.
 * langDivCd 필수; showflag, syncModTime 선택.
 */
export class MtMdclTursmSyncListDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR, ENG, CHS, CHT, JPN */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 활성화 여부 ('1'=active, '0'=deleted) */
  @IsOptional()
  @IsString()
  showflag?: string;

  /** 동기화 기준 시각 (이 시각 이후 변경분 반환) */
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
