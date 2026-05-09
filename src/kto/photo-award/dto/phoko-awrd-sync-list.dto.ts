import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 관광공모전 수상작 동기화 목록 요청 DTO.
 * showflag/syncModTime 포함. 언어 파라미터 미포함.
 * REQ-UNW-001: langCode/langDivCd/lang 일체 미포함 — KTO가 거부(resultCode=10).
 */
export class PaPhokoAwrdSyncListDto {
  /** 한 페이지 결과 수 (1-기반) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  numOfRows?: number;

  /** 페이지 번호 (1-기반) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo?: number;

  /** 활성화 여부 ('1'=active, '0'=deleted) */
  @IsOptional()
  @IsString()
  showflag?: string;

  /** 동기화 기준 시각 (YYYYMMDDHHmmss) — 이 시각 이후 변경분 반환 */
  @IsOptional()
  @IsString()
  syncModTime?: string;
}
