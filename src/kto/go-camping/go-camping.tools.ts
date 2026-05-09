import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { GcBasedListDto } from './dto/based-list.dto';
import { GcBasedSyncListDto } from './dto/based-sync-list.dto';
import { GcLocationBasedListDto } from './dto/location-based-list.dto';
import { GcSearchListDto } from './dto/search-list.dto';
import { GcImageListDto } from './dto/image-list.dto';

// @MX:NOTE: [AUTO] 고캠핑 도구 카탈로그 진입점.
// KOREAN_TOUR_INFO_TOOLS(15개), BARRIER_FREE_TOUR_INFO_TOOLS(10개), PHOTO_GALLERY_TOOLS(4개)와
// 병렬 구조이며 kto_camping_* prefix를 사용한다 (SPEC-KTO-004 §1.2).
// 서비스명 GoCamping은 V/숫자 suffix 없는 평면 형태 — BASE_URL_MAP 3번째 패턴.

/**
 * KTO 고캠핑 도구 정의 목록 (5개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const GO_CAMPING_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_camping_basedList',
    description:
      '고캠핑 캠핑장 기본 목록을 조회합니다. 전체 캠핑장(약 3,067개)의 메타데이터를 페이지네이션으로 제공합니다. ' +
      '캠핑장명(facltNm), 주소(addr1), 좌표(mapX/mapY), 시설 정보 등 60+ 필드를 포함합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: GcBasedListDto,
    methodName: 'basedList',
  },
  {
    name: 'kto_camping_basedSyncList',
    description:
      '고캠핑 동기화 목록을 조회합니다. 신규(A)/수정(U)/삭제(D) 이력을 포함한 전체 변경 목록(약 5,181개)을 제공합니다. ' +
      'syncStatus(A/U/D)와 syncModTime(YYYYMMDDhhmmss)으로 변경 필터링이 가능합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        syncStatus: {
          type: 'string',
          description: '동기화 상태 (A: 신규, U: 수정, D: 삭제)',
          enum: ['A', 'U', 'D'],
        },
        syncModTime: {
          type: 'string',
          description: '동기화 기준 수정일시 (YYYYMMDDhhmmss 형식)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: GcBasedSyncListDto,
    methodName: 'basedSyncList',
  },
  {
    name: 'kto_camping_locationBasedList',
    description:
      '위치기반 고캠핑 목록을 조회합니다. 경도(mapX)/위도(mapY)/반경(radius)으로 주변 캠핑장을 검색합니다. ' +
      '반경은 최대 20,000m(20km)까지 지원합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        mapX: {
          type: 'number',
          description: '경도(x좌표) — 필수',
        },
        mapY: {
          type: 'number',
          description: '위도(y좌표) — 필수',
        },
        radius: {
          type: 'number',
          description: '검색 반경(m) — 필수, 최대 20000',
          maximum: 20000,
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
    dtoClass: GcLocationBasedListDto,
    methodName: 'locationBasedList',
  },
  {
    name: 'kto_camping_searchList',
    description:
      '키워드로 고캠핑 캠핑장을 검색합니다. keyword로 캠핑장명, 소개 등 전체 데이터를 검색합니다. ' +
      '한글 키워드도 지원합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드 — 필수',
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
    dtoClass: GcSearchListDto,
    methodName: 'searchList',
  },
  {
    name: 'kto_camping_imageList',
    description:
      '고캠핑 캠핑장 이미지 목록을 조회합니다. contentId(캠핑장 콘텐츠 ID)로 해당 캠핑장의 사진 메타데이터를 가져옵니다. ' +
      '응답 필드: contentId, serialnum, imageUrl, createdtime, modifiedtime.',
    inputSchema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: '캠핑장 콘텐츠 ID — 필수',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
      required: ['contentId'],
    },
    dtoClass: GcImageListDto,
    methodName: 'imageList',
  },
];
