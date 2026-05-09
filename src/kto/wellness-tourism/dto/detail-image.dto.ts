import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 웰니스관광 이미지 목록 조회 요청 DTO.
 * langDivCd, contentId 필수.
 */
export class WtDetailImageDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 콘텐츠 ID (필수) */
  @IsNotEmpty()
  @IsString()
  contentId!: string;

  /** 원본 이미지 포함 여부 (Y/N) */
  @IsOptional()
  @IsString()
  imageYN?: string;

  /** 서브 이미지 포함 여부 (Y/N) */
  @IsOptional()
  @IsString()
  subImageYN?: string;
}
