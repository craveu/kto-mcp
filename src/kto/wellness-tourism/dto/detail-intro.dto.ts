import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 웰니스관광 소개 상세 조회 요청 DTO.
 * langDivCd, contentId, contentTypeId 필수.
 */
export class WtDetailIntroDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 콘텐츠 ID (필수) */
  @IsNotEmpty()
  @IsString()
  contentId!: string;

  /** 콘텐츠 타입 ID (필수) — 예: 12, 14, 15, 25, 28, 32, 38, 39 */
  @IsNotEmpty()
  @IsString()
  contentTypeId!: string;
}
