import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { KtoPaginationDto } from '../../korean-tour-info/dto/pagination.dto';

/** 무장애 searchFestival2 요청 DTO — 무장애 행사정보 검색 */
export class BfSearchFestivalDto extends KtoPaginationDto {
  /** 행사 시작일 (YYYYMMDD, 필수) */
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'eventStartDate는 YYYYMMDD 형식이어야 합니다',
  })
  eventStartDate!: string;

  /** 행사 종료일 (YYYYMMDD) */
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'eventEndDate는 YYYYMMDD 형식이어야 합니다',
  })
  eventEndDate?: string;

  /** 법정동 지역 코드 */
  @IsOptional()
  @IsString()
  lDongRegnCd?: string;

  /** 법정동 시군구 코드 */
  @IsOptional()
  @IsString()
  lDongSignguCd?: string;

  /** 정렬 기준 */
  @IsOptional()
  @IsIn(['A', 'C', 'D', 'E', 'P'])
  arrange?: string;
}
