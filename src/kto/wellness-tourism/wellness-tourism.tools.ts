import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { WtAreaBasedListDto } from './dto/area-based-list.dto';
import { WtLocationBasedListDto } from './dto/location-based-list.dto';
import { WtSearchKeywordDto } from './dto/search-keyword.dto';
import { WtWellnessTursmSyncListDto } from './dto/wellness-tursm-sync-list.dto';
import { WtDetailCommonDto } from './dto/detail-common.dto';
import { WtDetailIntroDto } from './dto/detail-intro.dto';
import { WtDetailInfoDto } from './dto/detail-info.dto';
import { WtDetailImageDto } from './dto/detail-image.dto';

// @MX:ANCHOR: [AUTO] kto_wellness_* 도구 카탈로그 진입점 — WellnessTursmService 8개 도구.
// @MX:REASON: WELLNESS_TOURISM_TOOLS는 main.ts의 registerAll 호출과 e2e 테스트에서 fan_in >= 3.
// @MX:SPEC: SPEC-KTO-009 REQ-KTO9-001, REQ-UNW-001

/** langDivCd 파라미터 공통 설명 */
const LANG_DIV_CD_DESCRIPTION =
  '응답 언어 코드. 권장값 KOR (웰니스관광 데이터는 한국어 기본). (필수)';

/**
 * KTO 웰니스관광 도구 정의 목록 (8개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 * kto_wellness_ldongCode 미노출 (R1 dedup — KorService2 ldongCode2와 동일 응답 추정).
 */
export const WELLNESS_TOURISM_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_wellness_areaBasedList',
    description:
      '지역기반 웰니스/스파/온천 관광지 목록 (174+ 업체). ' +
      '웰니스/스파/온천 등 건강증진 관광지를 지역 기반으로 조회한다. ' +
      "사전 검증: langDivCd='KOR' → totalCount=174. " +
      'langDivCd 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        sigunguCode: {
          type: 'string',
          description: '시군구 코드',
        },
        areaCode: {
          type: 'string',
          description: '지역 코드',
        },
        cat1: {
          type: 'string',
          description: '대분류 코드',
        },
        cat2: {
          type: 'string',
          description: '중분류 코드',
        },
        cat3: {
          type: 'string',
          description: '소분류 코드',
        },
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID',
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
    dtoClass: WtAreaBasedListDto,
    methodName: 'areaBasedList',
  },
  {
    name: 'kto_wellness_locationBasedList',
    description:
      '위치기반 웰니스 관광지 (mapX/mapY/radius 필수). ' +
      'WGS84 경위도 좌표와 반경(m)으로 주변 웰니스/스파/온천 관광지를 조회한다. ' +
      'radius 최대 20000m(20km). 응답에 dist(거리) 필드 포함. langDivCd 필수.',
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
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID',
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
    dtoClass: WtLocationBasedListDto,
    methodName: 'locationBasedList',
  },
  {
    name: 'kto_wellness_searchKeyword',
    description:
      '키워드로 웰니스 관광지 검색 (온천/스파/힐링 등). ' +
      '입력 키워드로 웰니스/스파/온천 관광지를 전국 검색한다. ' +
      '한국어 검색어 권장 — 웰니스관광 데이터가 한국어 기본. langDivCd/keyword 필수.',
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
          description: '검색 키워드 — 필수 (한국어 권장: 온천, 스파, 힐링 등)',
        },
        sigunguCode: {
          type: 'string',
          description: '시군구 코드 (검색 범위 한정)',
        },
        areaCode: {
          type: 'string',
          description: '지역 코드',
        },
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID',
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
    dtoClass: WtSearchKeywordDto,
    methodName: 'searchKeyword',
  },
  {
    name: 'kto_wellness_wellnessTursmSyncList',
    description:
      '웰니스 관광지 sync 목록 (showflag/oldContentId 포함). ' +
      'WellnessTursmService 고유 오퍼레이션. ' +
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
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID',
        },
        arrange: {
          type: 'string',
          description: '정렬 코드',
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
    dtoClass: WtWellnessTursmSyncListDto,
    methodName: 'wellnessTursmSyncList',
  },
  {
    name: 'kto_wellness_detailCommon',
    description:
      '웰니스 관광지 공통 상세 (contentId 필수). ' +
      '웰니스/스파/온천 관광지 contentId 기반 공통 정보 조회. ' +
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
          description: '웰니스관광 콘텐츠 ID — 필수',
        },
      },
    },
    dtoClass: WtDetailCommonDto,
    methodName: 'detailCommon',
  },
  {
    name: 'kto_wellness_detailIntro',
    description:
      '웰니스 관광지 소개 상세 (contentId, contentTypeId 필수). ' +
      '웰니스/스파/온천 관광지 contentId 기반 소개 정보 조회. ' +
      'langDivCd/contentId/contentTypeId 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'contentId', 'contentTypeId'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        contentId: {
          type: 'string',
          description: '웰니스관광 콘텐츠 ID — 필수',
        },
        contentTypeId: {
          type: 'string',
          description:
            '콘텐츠 타입 ID — 필수 (예: 12, 14, 15, 25, 28, 32, 38, 39)',
        },
      },
    },
    dtoClass: WtDetailIntroDto,
    methodName: 'detailIntro',
  },
  {
    name: 'kto_wellness_detailInfo',
    description:
      '웰니스 관광지 반복 상세 (contentId, contentTypeId 필수). ' +
      '웰니스/스파/온천 관광지 contentId 기반 반복 상세 조회. ' +
      'langDivCd/contentId/contentTypeId 필수.',
    inputSchema: {
      type: 'object',
      required: ['langDivCd', 'contentId', 'contentTypeId'],
      properties: {
        langDivCd: {
          type: 'string',
          description: LANG_DIV_CD_DESCRIPTION,
        },
        contentId: {
          type: 'string',
          description: '웰니스관광 콘텐츠 ID — 필수',
        },
        contentTypeId: {
          type: 'string',
          description:
            '콘텐츠 타입 ID — 필수 (예: 12, 14, 15, 25, 28, 32, 38, 39)',
        },
      },
    },
    dtoClass: WtDetailInfoDto,
    methodName: 'detailInfo',
  },
  {
    name: 'kto_wellness_detailImage',
    description:
      '웰니스 관광지 이미지 목록 (contentId 필수). ' +
      '웰니스/스파/온천 관광지 contentId 기반 이미지 목록 조회. ' +
      '응답에 imgname/serialnum/orgImage 필드 포함. langDivCd/contentId 필수.',
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
          description: '웰니스관광 콘텐츠 ID — 필수',
        },
        imageYN: {
          type: 'string',
          description: '원본 이미지 포함 여부 (Y/N)',
        },
        subImageYN: {
          type: 'string',
          description: '서브 이미지 포함 여부 (Y/N)',
        },
      },
    },
    dtoClass: WtDetailImageDto,
    methodName: 'detailImage',
  },
];
