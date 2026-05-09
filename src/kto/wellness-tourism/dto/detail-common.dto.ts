import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 웰니스관광 공통 정보 조회 요청 DTO.
 * langDivCd, contentId 필수.
 */
export class WtDetailCommonDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 콘텐츠 ID (필수) */
  @IsNotEmpty()
  @IsString()
  contentId!: string;
}
