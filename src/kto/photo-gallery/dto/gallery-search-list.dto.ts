import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * 관광사진 gallerySearchList1 요청 DTO — 키워드로 사진 검색
 */
export class PgGallerySearchListDto {
  /** 검색 키워드 (필수) */
  @IsString()
  @IsNotEmpty()
  keyword!: string;

  /** 정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순) */
  @IsOptional()
  @IsString()
  arrange?: string;

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
