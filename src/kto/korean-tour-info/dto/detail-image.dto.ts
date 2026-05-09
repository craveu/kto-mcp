import { IsIn, IsOptional, IsString } from 'class-validator';

/** detailImage2 요청 DTO */
export class DetailImageDto {
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
