import { IsString } from 'class-validator';

/** 무장애 detailIntro2 요청 DTO — 소개 정보 조회 */
export class BfDetailIntroDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;

  /** 콘텐츠 타입 ID (필수) */
  @IsString()
  contentTypeId!: string;
}
