import { IsIn, IsOptional, IsString } from 'class-validator';

/** 무장애 detailImage2 요청 DTO — 이미지 정보 조회 */
export class BfDetailImageDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;

  /** 원본 이미지 포함 여부 (Y/N) */
  @IsOptional()
  @IsIn(['Y', 'N'])
  imageYN?: string;

  /** 서브 이미지 포함 여부 (Y/N) */
  @IsOptional()
  @IsIn(['Y', 'N'])
  subImageYN?: string;
}
