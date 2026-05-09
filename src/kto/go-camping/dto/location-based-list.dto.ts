import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/**
 * 고캠핑 locationBasedList 요청 DTO — 위치기반 캠핑장 목록 조회
 *
 * @MX:NOTE: [AUTO] mapX/mapY/radius는 Swagger에서 string 타입이나 실제 KTO API는
 * 숫자값을 그대로 수용한다. @IsNumber + @Type(() => Number)로 number로 강제하고
 * 그대로 전달한다 (PhotoGalleryService1의 locationBasedList 패턴과 동일).
 * @MX:SPEC: SPEC-KTO-004 REQ-UNW-001
 *
 * REQ-UNW-001: mapX/mapY/radius 누락 시 outbound HTTP 호출 없이 검증 에러 반환
 */
export class GcLocationBasedListDto extends KtoPaginationDto {
  /**
   * 경도(x좌표) — 필수
   */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapX!: number;

  /**
   * 위도(y좌표) — 필수
   */
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  mapY!: number;

  /**
   * 검색 반경(m) — 필수, 최대 20000m
   *
   * @MX:NOTE: [AUTO] KTO Swagger 명세에서 radius ≤ 20000 으로 명시.
   * @MX:SPEC: SPEC-KTO-004 REQ-UNW-001
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(20000)
  @Type(() => Number)
  radius!: number;
}
