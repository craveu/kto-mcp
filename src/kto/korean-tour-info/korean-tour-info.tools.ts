import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import {
  AreaBasedListDto,
  AreaBasedSyncListDto,
  DetailCommonDto,
  DetailImageDto,
  DetailInfoDto,
  DetailIntroDto,
  DetailPetTourDto,
  LclsSystmCodeDto,
  LdongCodeDto,
  LocationBasedListDto,
  SearchFestivalDto,
  SearchKeywordDto,
  SearchStayDto,
} from './dto';

/**
 * KTO 국문 관광정보 도구 정의 목록.
 * Phase 4 ToolRegistry.registerAll()에서 MCP 서버에 일괄 등록된다.
 */
export const KOREAN_TOUR_INFO_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_korean_areaBasedList2',
    description:
      '지역기반 관광정보 목록을 조회합니다. 법정동 지역 코드, 콘텐츠 유형, 분류체계별 필터링이 가능합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID' },
        lclsSystm1: { type: 'string', description: '분류체계 1단계' },
        lclsSystm2: { type: 'string', description: '분류체계 2단계' },
        lclsSystm3: { type: 'string', description: '분류체계 3단계' },
        arrange: {
          type: 'string',
          description:
            '정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순, E: 거리순, P: 인기순)',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: AreaBasedListDto,
    methodName: 'areaBasedList2',
  },
  {
    name: 'kto_korean_areaBasedSyncList2',
    description:
      '지역기반 관광정보 동기화 목록을 조회합니다. 공개 여부, 수정 시간 기준 필터링이 가능합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID' },
        lclsSystm1: { type: 'string', description: '분류체계 1단계' },
        lclsSystm2: { type: 'string', description: '분류체계 2단계' },
        lclsSystm3: { type: 'string', description: '분류체계 3단계' },
        showflag: {
          type: 'string',
          description: '공개 여부 (1: 공개, 0: 비공개)',
          enum: ['0', '1'],
        },
        modifiedtime: {
          type: 'string',
          description: '수정 시간 (YYYYMMDDHHMMSS)',
        },
        arrange: {
          type: 'string',
          description: '정렬 기준',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: AreaBasedSyncListDto,
    methodName: 'areaBasedSyncList2',
  },
  {
    name: 'kto_korean_detailCommon2',
    description: '콘텐츠 ID로 공통 상세정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
      },
      required: ['contentId'],
    },
    dtoClass: DetailCommonDto,
    methodName: 'detailCommon2',
  },
  {
    name: 'kto_korean_detailImage2',
    description: '콘텐츠 ID로 이미지 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
        imageYN: {
          type: 'string',
          description: '원본 이미지 포함 여부 (Y/N)',
          enum: ['Y', 'N'],
        },
        subImageYN: {
          type: 'string',
          description: '서브 이미지 포함 여부 (Y/N)',
          enum: ['Y', 'N'],
        },
      },
      required: ['contentId'],
    },
    dtoClass: DetailImageDto,
    methodName: 'detailImage2',
  },
  {
    name: 'kto_korean_detailInfo2',
    description: '콘텐츠 ID와 타입으로 반복 상세정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID (필수)' },
      },
      required: ['contentId', 'contentTypeId'],
    },
    dtoClass: DetailInfoDto,
    methodName: 'detailInfo2',
  },
  {
    name: 'kto_korean_detailIntro2',
    description: '콘텐츠 ID와 타입으로 소개 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID (필수)' },
      },
      required: ['contentId', 'contentTypeId'],
    },
    dtoClass: DetailIntroDto,
    methodName: 'detailIntro2',
  },
  {
    name: 'kto_korean_detailPetTour2',
    description:
      '반려동물 동반 여행정보를 조회합니다. [ASSUMED] KorService2 포함 여부 미확인.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: '콘텐츠 ID (미지정 시 전체 목록)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: DetailPetTourDto,
    methodName: 'detailPetTour2',
  },
  {
    name: 'kto_korean_ldongCode2',
    description: '법정동 코드를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: LdongCodeDto,
    methodName: 'ldongCode2',
  },
  {
    name: 'kto_korean_lclsSystmCode2',
    description: '관광 분류체계 코드를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lclsSystm1: { type: 'string', description: '분류체계 1단계' },
        lclsSystm2: { type: 'string', description: '분류체계 2단계' },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: LclsSystmCodeDto,
    methodName: 'lclsSystmCode2',
  },
  {
    name: 'kto_korean_locationBasedList2',
    description:
      '좌표 기반 반경 내 관광정보 목록을 조회합니다. mapX(경도), mapY(위도), radius(미터)가 필수입니다.',
    inputSchema: {
      type: 'object',
      properties: {
        mapX: { type: 'number', description: '경도 (WGS84, 필수)' },
        mapY: { type: 'number', description: '위도 (WGS84, 필수)' },
        radius: {
          type: 'number',
          description: '반경 (미터, 최대 20000, 필수)',
          minimum: 1,
          maximum: 20000,
        },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID' },
        arrange: {
          type: 'string',
          description: '정렬 기준',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
      required: ['mapX', 'mapY', 'radius'],
    },
    dtoClass: LocationBasedListDto,
    methodName: 'locationBasedList2',
  },
  {
    name: 'kto_korean_searchFestival2',
    description:
      '행사 날짜 기간으로 행사정보를 검색합니다. eventStartDate(YYYYMMDD)가 필수입니다.',
    inputSchema: {
      type: 'object',
      properties: {
        eventStartDate: {
          type: 'string',
          description: '행사 시작일 (YYYYMMDD, 필수)',
        },
        eventEndDate: { type: 'string', description: '행사 종료일 (YYYYMMDD)' },
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        arrange: {
          type: 'string',
          description: '정렬 기준',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
      required: ['eventStartDate'],
    },
    dtoClass: SearchFestivalDto,
    methodName: 'searchFestival2',
  },
  {
    name: 'kto_korean_searchKeyword2',
    description: '키워드로 관광정보를 검색합니다. keyword가 필수입니다.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '검색 키워드 (필수)' },
        contentTypeId: { type: 'string', description: '콘텐츠 타입 ID' },
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        lclsSystm1: { type: 'string', description: '분류체계 1단계' },
        lclsSystm2: { type: 'string', description: '분류체계 2단계' },
        lclsSystm3: { type: 'string', description: '분류체계 3단계' },
        arrange: {
          type: 'string',
          description: '정렬 기준',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
      required: ['keyword'],
    },
    dtoClass: SearchKeywordDto,
    methodName: 'searchKeyword2',
  },
  {
    name: 'kto_korean_searchStay2',
    description:
      '숙박정보를 검색합니다. 지역, 편의시설 여부로 필터링 가능합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lDongRegnCd: { type: 'string', description: '법정동 지역 코드' },
        lDongSignguCd: { type: 'string', description: '법정동 시군구 코드' },
        arrange: {
          type: 'string',
          description: '정렬 기준',
          enum: ['A', 'C', 'D', 'E', 'P'],
        },
        hanOk: {
          type: 'string',
          description: '한옥 여부 (Y/N)',
          enum: ['Y', 'N'],
        },
        shower: {
          type: 'string',
          description: '샤워 시설 여부 (Y/N)',
          enum: ['Y', 'N'],
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: SearchStayDto,
    methodName: 'searchStay2',
  },
];
