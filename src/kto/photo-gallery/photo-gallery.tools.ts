import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { PgGalleryListDto } from './dto/gallery-list.dto';
import { PgGalleryDetailListDto } from './dto/gallery-detail-list.dto';
import { PgGallerySearchListDto } from './dto/gallery-search-list.dto';
import { PgGallerySyncDetailListDto } from './dto/gallery-sync-detail-list.dto';

// @MX:NOTE: [AUTO] 관광사진 도구 카탈로그 진입점.
// KOREAN_TOUR_INFO_TOOLS(15개), BARRIER_FREE_TOUR_INFO_TOOLS(10개)와 병렬 구조이며
// kto_photo_* prefix를 사용한다 (plan.md §1.2).
// 보조 코드 조회 오퍼레이션은 KorService2와 중복되므로 미등록 (plan.md R1).

/**
 * KTO 관광사진 도구 정의 목록 (4개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const PHOTO_GALLERY_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_photo_galleryList1',
    description:
      '관광사진 갤러리 목록을 조회합니다. PhotoKorea 데이터셋의 약 6,000여 장 사진 메타데이터를 조회합니다. ' +
      '정렬 기준(arrange), 페이지네이션(numOfRows, pageNo)을 지원합니다. ' +
      '응답 필드는 galContentId, galTitle, galWebImageUrl, galPhotographyLocation, galPhotographer 등 gal* prefix를 사용합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        arrange: {
          type: 'string',
          description: '정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: PgGalleryListDto,
    methodName: 'galleryList1',
  },
  {
    name: 'kto_photo_galleryDetailList1',
    description:
      '갤러리 제목 검색어(title)로 관광사진 상세 정보를 조회합니다. ' +
      'title은 부분 일치 검색을 지원합니다. ' +
      '페이지네이션(numOfRows, pageNo)을 지원합니다. ' +
      '응답 필드는 galContentId, galTitle, galWebImageUrl 등 gal* prefix를 사용합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '갤러리 제목 검색어 (필수)',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
      required: ['title'],
    },
    dtoClass: PgGalleryDetailListDto,
    methodName: 'galleryDetailList1',
  },
  {
    name: 'kto_photo_gallerySearchList1',
    description:
      '키워드로 관광사진을 검색합니다. keyword 파라미터로 갤러리 전체를 검색합니다. ' +
      '정렬 기준(arrange), 페이지네이션(numOfRows, pageNo)을 지원합니다. ' +
      '응답 필드는 galContentId, galTitle, galWebImageUrl 등 gal* prefix를 사용합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드 (필수)',
        },
        arrange: {
          type: 'string',
          description: '정렬 기준 (A: 제목순, C: 수정일순, D: 생성일순)',
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
    dtoClass: PgGallerySearchListDto,
    methodName: 'gallerySearchList1',
  },
  {
    name: 'kto_photo_gallerySyncDetailList1',
    description:
      '관광사진 동기화 상세 목록을 조회합니다. 수정일시 기준으로 변경된 사진 목록을 가져와 데이터 동기화에 활용합니다. ' +
      'syncModTime(수정일시), showflag(노출 여부), 페이지네이션(numOfRows, pageNo)을 지원합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        syncModTime: {
          type: 'string',
          description:
            '동기화 기준 수정일시 (YYYYMMDD 또는 YYYYMMDDhhmmss 형식)',
        },
        showflag: {
          type: 'string',
          description: '노출 여부 플래그',
        },
        numOfRows: {
          type: 'number',
          description: '한 페이지 결과 수',
          minimum: 1,
        },
        pageNo: { type: 'number', description: '페이지 번호', minimum: 1 },
      },
    },
    dtoClass: PgGallerySyncDetailListDto,
    methodName: 'gallerySyncDetailList1',
  },
];
