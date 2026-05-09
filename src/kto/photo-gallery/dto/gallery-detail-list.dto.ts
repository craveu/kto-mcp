import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * 관광사진 galleryDetailList1 요청 DTO — 제목 검색어로 사진 상세 정보 조회
 *
 * @MX:NOTE: [AUTO] KTO 실 API 확인 결과 galleryDetailList1의 필수 파라미터는
 * galContentId가 아닌 title(검색어)이다. galContentId를 입력하면 NO_MANDATORY_REQUEST_PARAMETERS_ERROR가 반환된다.
 * @MX:SPEC: SPEC-KTO-003 REQ-UNW-001
 *
 * REQ-UNW-001: title 누락 시 outbound HTTP 호출 없이 검증 에러 반환
 */
export class PgGalleryDetailListDto {
  /**
   * 갤러리 제목 검색어 (필수)
   *
   * @MX:NOTE: [AUTO] @IsNotEmpty로 SPEC-KTO-003 REQ-UNW-001 강제 적용 —
   * title 누락 시 outbound HTTP 차단
   */
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** 한 페이지 결과 수 (선택) */
  @IsOptional()
  @IsInt()
  @Min(1)
  numOfRows?: number;

  /** 페이지 번호 (선택) */
  @IsOptional()
  @IsInt()
  @Min(1)
  pageNo?: number;
}
