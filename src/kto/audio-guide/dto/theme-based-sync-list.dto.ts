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
 * Odii themeBasedSyncList 요청 DTO — 오디오 가이드 Theme 동기화 목록 조회.
 * langCode 필수; syncStatus/numOfRows/pageNo 선택.
 *
 * @MX:SPEC: SPEC-KTO-005 REQ-UNW-001
 */
export class AgThemeBasedSyncListDto {
  /** 언어 코드 — 필수. ko 또는 en 권장. */
  @IsNotEmpty()
  @IsString()
  langCode!: string;

  /** 동기화 상태 (A: 신규, U: 수정, D: 삭제) */
  @IsOptional()
  @IsString()
  syncStatus?: string;

  /** 한 페이지 결과 수 */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  numOfRows?: number;

  /** 페이지 번호 */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNo?: number;
}
