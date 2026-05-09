import { IsString } from 'class-validator';

/** detailCommon2 요청 DTO */
export class DetailCommonDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;
}
