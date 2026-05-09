import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 의료관광 contentId 소개 정보 조회 요청 DTO.
 * langDivCd, contentId 필수. 페이지네이션 없음 (단일 레코드 오퍼레이션).
 */
export class MtDetailIntroDto {
  /** 응답 언어 코드 (필수) — 권장값: KOR, ENG, CHS, CHT, JPN */
  @IsNotEmpty()
  @IsString()
  langDivCd!: string;

  /** 콘텐츠 ID (필수) */
  @IsNotEmpty()
  @IsString()
  contentId!: string;
}
