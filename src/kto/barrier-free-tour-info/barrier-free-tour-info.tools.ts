import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import {
  BfAreaBasedListDto,
  BfDetailCommonDto,
  BfDetailImageDto,
  BfDetailInfoDto,
  BfDetailIntroDto,
  BfDetailWithTourDto,
  BfLocationBasedListDto,
  BfSearchFestivalDto,
  BfSearchKeywordDto,
  BfSearchStayDto,
} from './dto';

// @MX:NOTE: [AUTO] 무장애 여행정보 도구 카탈로그 진입점.
// KOREAN_TOUR_INFO_TOOLS(15개)와 병렬 구조이며 kto_barrier_free_* prefix를 사용한다.
// 코드 조회 4개(areaCode2 등)는 KorService2와 응답이 동일하므로 중복 등록하지 않는다 (plan.md R1).

/**
 * KTO 무장애 여행정보 도구 정의 목록 (10개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const BARRIER_FREE_TOUR_INFO_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_barrier_free_areaBasedList2',
    description:
      '지역기반 무장애 관광정보 목록을 조회합니다. 무장애 시설 정보가 포함된 관광지, 숙박, 음식점 등을 지역 코드로 검색합니다.',
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
    dtoClass: BfAreaBasedListDto,
    methodName: 'areaBasedList2',
  },
  {
    name: 'kto_barrier_free_locationBasedList2',
    description:
      '좌표 기반 반경 내 무장애 관광정보 목록을 조회합니다. mapX(경도), mapY(위도), radius(미터)가 필수입니다.',
    inputSchema: {
      type: 'object',
      properties: {
        mapX: { type: 'number', description: '경도 (WGS84, 필수)' },
        mapY: { type: 'number', description: '위도 (WGS84, 필수)' },
        radius: {
          type: 'number',
          description: '반경 (미터, 최대 20000, 필수)',
          minimum: 1,
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
    dtoClass: BfLocationBasedListDto,
    methodName: 'locationBasedList2',
  },
  {
    name: 'kto_barrier_free_searchKeyword2',
    description:
      '키워드로 무장애 관광정보를 검색합니다. keyword가 필수입니다. 무장애 시설 접근 정보를 포함한 결과를 반환합니다.',
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
    dtoClass: BfSearchKeywordDto,
    methodName: 'searchKeyword2',
  },
  {
    name: 'kto_barrier_free_searchFestival2',
    description:
      '무장애 행사정보를 검색합니다. eventStartDate(YYYYMMDD)가 필수입니다.',
    inputSchema: {
      type: 'object',
      properties: {
        eventStartDate: {
          type: 'string',
          description: '행사 시작일 (YYYYMMDD, 필수)',
        },
        eventEndDate: {
          type: 'string',
          description: '행사 종료일 (YYYYMMDD)',
        },
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
    dtoClass: BfSearchFestivalDto,
    methodName: 'searchFestival2',
  },
  {
    name: 'kto_barrier_free_searchStay2',
    description:
      '무장애 숙박정보를 검색합니다. 장애인 편의시설을 갖춘 숙박시설을 지역별로 조회합니다.',
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
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: BfSearchStayDto,
    methodName: 'searchStay2',
  },
  {
    name: 'kto_barrier_free_detailCommon2',
    description: '콘텐츠 ID로 무장애 관광정보의 공통 상세정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
      },
      required: ['contentId'],
    },
    dtoClass: BfDetailCommonDto,
    methodName: 'detailCommon2',
  },
  {
    name: 'kto_barrier_free_detailIntro2',
    description:
      '콘텐츠 ID와 타입으로 무장애 관광정보의 소개 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID (필수)',
        },
      },
      required: ['contentId', 'contentTypeId'],
    },
    dtoClass: BfDetailIntroDto,
    methodName: 'detailIntro2',
  },
  {
    name: 'kto_barrier_free_detailInfo2',
    description:
      '콘텐츠 ID와 타입으로 무장애 관광정보의 반복 상세정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
        contentTypeId: {
          type: 'string',
          description: '콘텐츠 타입 ID (필수)',
        },
      },
      required: ['contentId', 'contentTypeId'],
    },
    dtoClass: BfDetailInfoDto,
    methodName: 'detailInfo2',
  },
  {
    name: 'kto_barrier_free_detailImage2',
    description: '콘텐츠 ID로 무장애 관광정보의 이미지 정보를 조회합니다.',
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
    dtoClass: BfDetailImageDto,
    methodName: 'detailImage2',
  },
  {
    name: 'kto_barrier_free_detailWithTour2',
    description:
      '콘텐츠 ID로 무장애 상세정보를 조회합니다 (KorWithService2 고유 오퍼레이션). ' +
      '휠체어(wheelchair), 출입구(exit), 엘리베이터(elevator), 주차(parking), ' +
      '화장실(restroom), 안내시스템(guidesystem), 수어안내(signguide), ' +
      '영상안내(videoguide), 음성안내(audioguide), 점자블록(braileblock), ' +
      '보조견(helpdog), 유모차(stroller) 정보를 포함합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: { type: 'string', description: '콘텐츠 ID (필수)' },
      },
      required: ['contentId'],
    },
    dtoClass: BfDetailWithTourDto,
    methodName: 'detailWithTour2',
  },
];
