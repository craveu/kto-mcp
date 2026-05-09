import { IsOptional, IsString } from 'class-validator';
import { KtoPaginationDto } from './pagination.dto';

/**
 * detailPetTour2 요청 DTO
 *
 * [ASSUMED] KorService2에 detailPetTour2 포함 여부 미확인 (research.md §9 참조).
 * 통합 테스트에서 404 응답 시 도구 비활성화 예정.
 */
export class DetailPetTourDto extends KtoPaginationDto {
  /** 콘텐츠 ID (미지정 시 전체 페이징 반환) */
  @IsOptional()
  @IsString()
  contentId?: string;
}
