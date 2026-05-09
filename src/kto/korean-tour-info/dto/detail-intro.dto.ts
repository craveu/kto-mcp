import { IsString } from 'class-validator';

/** detailIntro2 요청 DTO */
export class DetailIntroDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;

  /** 콘텐츠 타입 ID (필수) */
  @IsString()
  contentTypeId!: string;
}
