import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * 관광사진 gallerySyncDetailList1 요청 DTO — 동기화 상세 목록 조회
 *
 * @MX:NOTE: [AUTO] syncModTime 파라미터명은 실 API 호출로 확인 필요.
 * KTO가 modifiedtime 또는 다른 파라미터명을 사용할 수 있다.
 * [VERIFIED — real call required]
 */
export class PgGallerySyncDetailListDto {
  /**
   * 동기화 기준 수정일시 (YYYYMMDD 또는 YYYYMMDDhhmmss 형식).
   * [VERIFIED — real call required] 실제 파라미터명 확인 필요.
   */
  @IsOptional()
  @IsString()
  syncModTime?: string;

  /** 노출 여부 플래그 */
  @IsOptional()
  @IsString()
  showflag?: string;

  /** 한 페이지 결과 수 */
  @IsOptional()
  @IsInt()
  @Min(1)
  numOfRows?: number;

  /** 페이지 번호 */
  @IsOptional()
  @IsInt()
  @Min(1)
  pageNo?: number;
}
