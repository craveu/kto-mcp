import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { MtAreaBasedListDto } from './dto/area-based-list.dto';
import { MtLocationBasedListDto } from './dto/location-based-list.dto';
import { MtSearchKeywordDto } from './dto/search-keyword.dto';
import { MtMdclTursmSyncListDto } from './dto/mdcl-tursm-sync-list.dto';
import { MtDetailMdclTursmDto } from './dto/detail-mdcl-tursm.dto';
import { MtDetailCommonDto } from './dto/detail-common.dto';
import { MtDetailIntroDto } from './dto/detail-intro.dto';

// @MX:NOTE: [AUTO] 의료관광(MdclTursmService) 도구 카탈로그 진입점.
// kto_medical_* prefix 7개 도구 — 외국인 의료관광객 대상 KTO 큐레이팅 의료기관 정보.
// ldongCode 1개 미노출 (R1 정책: kto_korean_ldongCode2와 동일 응답 추정).
// @MX:SPEC: SPEC-KTO-008 REQ-KTO8-001, REQ-UNW-001

/** langDivCd 파라미터 공통 설명 */
const LANG_DIV_CD_DESCRIPTION =
  '응답 언어 코드. 권장값 KOR/ENG/CHS/CHT/JPN. 모든 값 수용되며 응답은 영어 기본. (필수)';

/**
 * KTO 의료관광 도구 정의 목록 (7개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const MEDICAL_TOURISM_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_medical_areaBasedList',
    description:
      '의료관광 지역기반 목록 (336+ 의료기관, 외국인 대상). ' +
      '외국인 의료관광객 대상 KTO 큐레이팅 의료기관(성형/치과/피부 등)을 지역 기반으로 조회한다. ' +
      "사전 검증: langDivCd='KOR' → totalCount=336~337. " +
      'langDivCd 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        lDongRegnCd: {
          type: 'string',
          description: '법정동 지역 코드',
        },
        lDongSignguCd: {
          type: 'string',
          description: '법정동 시군구 코드',
        },
        arrange: {
          type: 'string',
          description: '정렬 코드 (A=제목순, C=수정일순, D=생성일순)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수 (1~100)',
          minimum: 1,
          maximum: 100,
        },
        pageNo: {
          type: 'number',
          description: '페이지 번호 (1-기반)',
          minimum: 1,
        },
      },
    },
    dtoClass: MtAreaBasedListDto,
    methodName: 'areaBasedList',
  },
  {
    name: 'kto_medical_locationBasedList',
    description:
      '위치기반 의료관광 목록 (mapX/mapY/radius 필수). ' +
      'WGS84 경위도 좌표와 반경(m)으로 주변 의료관광 의료기관을 조회한다. ' +
      'radius 최대 20000m(20km). langDivCd 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'mapX', 'mapY', 'radius'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        mapX: {
          type: 'number',
          description: '경도 (WGS84) — 필수. 예: 126.9779',
        },
        mapY: {
          type: 'number',
          description: '위도 (WGS84) — 필수. 예: 37.5664',
        },
        radius: {
          type: 'number',
          description: '반경 거리 (단위: m, 1~20000) — 필수',
          minimum: 1,
          maximum: 20000,
        },
        arrange: {
          type: 'string',
          description: '정렬 코드 (A=제목순, E=거리순)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수 (1~100)',
          minimum: 1,
          maximum: 100,
        },
        pageNo: {
          type: 'number',
          description: '페이지 번호 (1-기반)',
          minimum: 1,
        },
      },
    },
    dtoClass: MtLocationBasedListDto,
    methodName: 'locationBasedList',
  },
  {
    name: 'kto_medical_searchKeyword',
    description:
      '키워드로 의료관광 검색 (성형/치과/피부과 등). ' +
      '입력 키워드로 의료관광 의료기관을 전국 검색한다. ' +
      '영어 검색어 권장 — 의료관광 데이터가 영어 기본. langDivCd/keyword 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'keyword'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        keyword: {
          type: 'string',
          description:
            '검색 키워드 — 필수 (영어 검색어 권장: Rhinoplasty, Dental 등)',
        },
        lDongRegnCd: {
          type: 'string',
          description: '법정동 지역 코드 (검색 범위 한정)',
        },
        lDongSignguCd: {
          type: 'string',
          description: '법정동 시군구 코드',
        },
        arrange: {
          type: 'string',
          description: '정렬 코드 (A=제목순)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수 (1~100)',
          minimum: 1,
          maximum: 100,
        },
        pageNo: {
          type: 'number',
          description: '페이지 번호 (1-기반)',
          minimum: 1,
        },
      },
    },
    dtoClass: MtSearchKeywordDto,
    methodName: 'searchKeyword',
  },
  {
    name: 'kto_medical_mdclTursmSyncList',
    description:
      '의료관광 sync 목록 (showflag/oldContentId 포함). ' +
      'MdclTursmService 고유 오퍼레이션. ' +
      "응답 record의 showflag 필드로 active('1')/deleted('0') 분기. " +
      'oldContentId 필드로 컨텐츠 병합 추적. langDivCd 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        showflag: {
          type: 'string',
          description: "활성화 여부 ('1'=active, '0'=deleted)",
        },
        syncModTime: {
          type: 'string',
          description: '동기화 기준 시각 (이 시각 이후 변경분 반환)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수 (1~100)',
          minimum: 1,
          maximum: 100,
        },
        pageNo: {
          type: 'number',
          description: '페이지 번호 (1-기반)',
          minimum: 1,
        },
      },
    },
    dtoClass: MtMdclTursmSyncListDto,
    methodName: 'mdclTursmSyncList',
  },
  {
    name: 'kto_medical_detailMdclTursm',
    description:
      '의료관광 전용 상세 (의료기관 진료과 등). ' +
      '의료기관 contentId 기반 의료관광 전용 상세 조회. ' +
      '진료과목(medicalDept), 진료항목(treatmentName), 안내센터(infoCenter), 홈페이지(homepage) 등 의료관광 메타 응답. ' +
      'langDivCd/contentId 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'contentId'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        contentId: {
          type: 'string',
          description: '의료관광 콘텐츠 ID — 필수',
        },
      },
    },
    dtoClass: MtDetailMdclTursmDto,
    methodName: 'detailMdclTursm',
  },
  {
    name: 'kto_medical_detailCommon',
    description:
      '의료관광 contentId 공통 정보. ' +
      '의료기관 contentId 기반 공통 정보 조회. ' +
      'KorService2의 detailCommon2와 응답 스키마 다름 — 의료관광 전용 필드 반환. ' +
      'langDivCd/contentId 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'contentId'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        contentId: {
          type: 'string',
          description: '의료관광 콘텐츠 ID — 필수',
        },
      },
    },
    dtoClass: MtDetailCommonDto,
    methodName: 'detailCommon',
  },
  {
    name: 'kto_medical_detailIntro',
    description:
      '의료관광 contentId 소개 정보. ' +
      '의료기관 contentId 기반 소개 정보 조회. ' +
      'KorService2의 detailIntro2와 응답 스키마 다름 — 의료관광 전용 필드 반환. ' +
      'langDivCd/contentId 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'contentId'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        contentId: {
          type: 'string',
          description: '의료관광 콘텐츠 ID — 필수',
        },
      },
    },
    dtoClass: MtDetailIntroDto,
    methodName: 'detailIntro',
  },
];
