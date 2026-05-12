import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { PtAreaBasedListDto } from './dto/area-based-list.dto';
import { PtLocationBasedListDto } from './dto/location-based-list.dto';
import { PtSearchKeywordDto } from './dto/search-keyword.dto';
import { PtPetTourSyncListDto } from './dto/pet-tour-sync-list.dto';

// @MX:NOTE: [AUTO] 반려동물 동반여행(KorPetTourService2) 도구 카탈로그 진입점.
// kto_pet_* prefix 4개 도구 — KorService2 superset에서 pet-friendly 필터링 결과.
// 9개 미노출 오퍼레이션(Code 4 + Detail 5)은 R1 정책으로 kto_korean_* 도구 재사용.
// @MX:SPEC: SPEC-KTO-007 REQ-KTO7-001, REQ-UNW-001

/**
 * KTO 반려동물 동반여행 도구 정의 목록 (4개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const PET_TOUR_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_pet_areaBasedList2',
    description:
      '반려동물 동반 가능 지역기반 관광정보 목록 (pet-friendly 필터). ' +
      'KorService2의 areaBasedList2에서 반려동물 동반 가능 콘텐츠만 필터링한 결과를 반환한다. ' +
      "사전 검증: lDongRegnCd='11'(서울) → 62+ hits. " +
      '반려동물 상세 조회는 kto_korean_detailPetTour2 또는 kto_korean_detailCommon2 사용.',
    inputSchema: {
      type: 'object',
      properties: {
        lDongRegnCd: {
          type: 'string',
          description: '법정동 지역 코드 (11=서울, 28=인천, 26=부산 등)',
        },
        lDongSignguCd: {
          type: 'string',
          description: '법정동 시군구 코드 (lDongRegnCd와 함께 사용)',
        },
        contentTypeId: {
          type: 'string',
          description: '관광타입 ID (12=관광지, 14=문화시설, 39=음식점 등)',
        },
        lclsSystm1: {
          type: 'string',
          description: '분류체계 1단계',
        },
        lclsSystm2: {
          type: 'string',
          description: '분류체계 2단계',
        },
        lclsSystm3: {
          type: 'string',
          description: '분류체계 3단계',
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
    dtoClass: PtAreaBasedListDto,
    methodName: 'areaBasedList2',
  },
  {
    name: 'kto_pet_locationBasedList2',
    description:
      '위치기반 반려동물 동반 가능 관광지 (mapX/mapY/radius 필수). ' +
      'WGS84 경위도 좌표와 반경(m)으로 주변 반려동물 동반 가능 관광지를 조회한다. ' +
      '사전 검증: 서울시청(126.9779, 37.5664) 20km → 75 hits. ' +
      'radius 최대 20000m(20km).',
    inputSchema: {
      type: 'object',
      required: ['mapX', 'mapY', 'radius'],
      properties: {
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
          description: '관광타입 ID',
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
    dtoClass: PtLocationBasedListDto,
    methodName: 'locationBasedList2',
  },
  {
    name: 'kto_pet_searchKeyword2',
    description:
      '키워드로 반려동물 동반 가능 관광지 검색 (keyword 필수). ' +
      '입력 키워드로 반려동물 동반 가능 관광지를 전국 검색한다. ' +
      "사전 검증: keyword='카페' → 19 pet-friendly 카페 hits. " +
      'lDongRegnCd로 지역 범위 한정 가능.',
    inputSchema: {
      type: 'object',
      required: ['keyword'],
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드 — 필수',
        },
        contentTypeId: {
          type: 'string',
          description: '관광타입 ID',
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
    dtoClass: PtSearchKeywordDto,
    methodName: 'searchKeyword2',
  },
  {
    name: 'kto_pet_petTourSyncList2',
    description:
      '반려동물 동반 가능 관광지 전체 동기화 목록 (변경/삭제 이력 포함). ' +
      'KorPetTourService2 고유 오퍼레이션. ' +
      "응답 record의 showflag 필드로 active('1')/deleted('0') 분기. " +
      '사전 검증 totalCount=10167 — 전체 pet 데이터셋 페이지네이션 동기화 가능. ' +
      'syncModTime으로 특정 시각 이후 변경분만 조회 가능.',
    inputSchema: {
      type: 'object',
      properties: {
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
    dtoClass: PtPetTourSyncListDto,
    methodName: 'petTourSyncList2',
  },
];
