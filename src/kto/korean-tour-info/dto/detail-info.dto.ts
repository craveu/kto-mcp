import { IsString } from 'class-validator';

/** detailInfo2 요청 DTO */
export class DetailInfoDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;

  /** 콘텐츠 타입 ID (필수) */
  @IsString()
  contentTypeId!: string;
}
