import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/**
 * 관광사진 galleryList1 요청 DTO — 관광사진 갤러리 목록 조회
 */
export class PgGalleryListDto extends KtoPaginationDto {
  /** 검색 키워드 */
  @IsOptional()
  @IsString()
  keyword?: string;

  /** 정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순) */
  @IsOptional()
  @IsString()
  arrange?: string;
}
