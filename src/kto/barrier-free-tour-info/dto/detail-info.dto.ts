import { IsString } from 'class-validator';

/** 무장애 detailInfo2 요청 DTO — 반복 상세정보 조회 */
export class BfDetailInfoDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;

  /** 콘텐츠 타입 ID (필수) */
  @IsString()
  contentTypeId!: string;
}
