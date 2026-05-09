import { IsString } from 'class-validator';

/** 무장애 detailCommon2 요청 DTO — 공통정보 상세 조회 */
export class BfDetailCommonDto {
  /** 콘텐츠 ID (필수) */
  @IsString()
  contentId!: string;
}
