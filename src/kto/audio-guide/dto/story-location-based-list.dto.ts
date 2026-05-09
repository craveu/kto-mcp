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
 * Odii storyLocationBasedList 요청 DTO — 위치기반 오디오 가이드 Story 목록 조회.
 * langCode + mapX + mapY + radius 필수; numOfRows/pageNo 선택.
 *
 * @MX:NOTE: [AUTO] mapX/mapY/radius는 Swagger에서 string 타입이나 실제 KTO API는
 * 숫자값을 그대로 수용한다. @IsNumber + @Type(() => Number)로 number로 강제한다
 * (GoCamping locationBasedList 패턴과 동일).
 * @MX:SPEC: SPEC-KTO-005 REQ-UNW-001
 */
export class AgStoryLocationBasedListDto {
  /** 언어 코드 — 필수. ko 또는 en 권장. */
  @IsNotEmpty()
  @IsString()
  langCode!: string;

  /** 경도(x좌표) — 필수 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapX!: number;

  /** 위도(y좌표) — 필수 */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapY!: number;

  /**
   * 검색 반경(m) — 필수, 최대 20000m
   * @MX:SPEC: SPEC-KTO-005 REQ-UNW-001
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(20000)
  @Type(() => Number)
  radius!: number;

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
