import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { AgStoryBasedListDto } from './dto/story-based-list.dto';
import { AgStoryBasedSyncListDto } from './dto/story-based-sync-list.dto';
import { AgStoryLocationBasedListDto } from './dto/story-location-based-list.dto';
import { AgStorySearchListDto } from './dto/story-search-list.dto';
import { AgThemeBasedListDto } from './dto/theme-based-list.dto';
import { AgThemeBasedSyncListDto } from './dto/theme-based-sync-list.dto';
import { AgThemeLocationBasedListDto } from './dto/theme-location-based-list.dto';
import { AgThemeSearchListDto } from './dto/theme-search-list.dto';

// @MX:NOTE: [AUTO] 오디오 가이드 도구 카탈로그 진입점 (Odii 서비스).
// kto_audio_* prefix 8개 도구 — Story 4개(내레이션 위치 단위) + Theme 4개(테마 카탈로그 단위).
// KTO 4번째 다국어 패턴: 단일 path + langCode 파라미터. enum 미강제 (KTO 0 records 정책).
// @MX:SPEC: SPEC-KTO-005 REQ-KTO5-001

/** 공통 langCode 프로퍼티 정의 */
const LANG_CODE_PROP = {
  langCode: {
    type: 'string',
    description:
      'KTO 오디오 가이드 언어 코드 — ko 또는 en 권장. 기타 값은 KTO 정책상 totalCount=0 정상 응답.',
  },
} as const;

/** 공통 페이지네이션 프로퍼티 정의 */
const PAGINATION_PROPS = {
  numOfRows: {
    type: 'number',
    description: '한 페이지 결과 수 (기본값 10)',
    minimum: 1,
  },
  pageNo: { type: 'number', description: '페이지 번호 (기본값 1)', minimum: 1 },
} as const;

/** 공통 좌표 프로퍼티 정의 */
const COORD_PROPS = {
  mapX: { type: 'number', description: '경도(x좌표) — 필수' },
  mapY: { type: 'number', description: '위도(y좌표) — 필수' },
  radius: {
    type: 'number',
    description: '검색 반경(m) — 필수, 최대 20000',
    maximum: 20000,
  },
} as const;

/**
 * KTO 관광지 오디오 가이드정보 도구 목록 (8개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const ODII_TOOLS: McpToolDefinition[] = [
  // ─── Story 계열 (4) ──────────────────────────────────────────────────────

  {
    name: 'kto_audio_storyBasedList',
    description:
      'KTO 오디오 가이드 Story 기본 목록을 조회합니다. ' +
      '관광지 내 위치(입구·본관·정원 등) 단위의 오디오 내레이션 항목 전체를 페이지네이션으로 제공합니다. ' +
      'audioUrl(MP3), script(텍스트), playTime(초) 포함. langCode: ko 또는 en 권장. ' +
      'totalCount ≈ 6,281(ko) / 4,412(en).',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        ...PAGINATION_PROPS,
      },
      required: ['langCode'],
    },
    dtoClass: AgStoryBasedListDto,
    methodName: 'storyBasedList',
  },
  {
    name: 'kto_audio_storyBasedSyncList',
    description:
      'KTO 오디오 가이드 Story 동기화 목록을 조회합니다. ' +
      '신규(A)/수정(U)/삭제(D) 이력을 포함한 전체 변경 목록을 제공합니다. ' +
      'langCode: ko 또는 en 권장. syncStatus로 변경 유형 필터링 가능.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        syncStatus: {
          type: 'string',
          description: '동기화 상태 필터 (A: 신규, U: 수정, D: 삭제)',
        },
        ...PAGINATION_PROPS,
      },
      required: ['langCode'],
    },
    dtoClass: AgStoryBasedSyncListDto,
    methodName: 'storyBasedSyncList',
  },
  {
    name: 'kto_audio_storyLocationBasedList',
    description:
      'KTO 오디오 가이드 위치기반 Story 목록을 조회합니다. ' +
      '경도(mapX)/위도(mapY)/반경(radius)으로 주변 오디오 가이드 Story를 검색합니다. ' +
      '반경은 최대 20,000m(20km). langCode: ko 또는 en 권장.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        ...COORD_PROPS,
        ...PAGINATION_PROPS,
      },
      required: ['langCode', 'mapX', 'mapY', 'radius'],
    },
    dtoClass: AgStoryLocationBasedListDto,
    methodName: 'storyLocationBasedList',
  },
  {
    name: 'kto_audio_storySearchList',
    description:
      'KTO 오디오 가이드 Story를 키워드로 검색합니다. ' +
      '관광지명, 제목, 스크립트 등 전체 Story 데이터를 keyword로 검색합니다. ' +
      'langCode: ko 또는 en 권장.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        keyword: {
          type: 'string',
          description: '검색 키워드 — 필수. 한글 지원.',
        },
        ...PAGINATION_PROPS,
      },
      required: ['langCode', 'keyword'],
    },
    dtoClass: AgStorySearchListDto,
    methodName: 'storySearchList',
  },

  // ─── Theme 계열 (4) ──────────────────────────────────────────────────────

  {
    name: 'kto_audio_themeBasedList',
    description:
      'KTO 오디오 가이드 Theme 기본 목록을 조회합니다. ' +
      '테마 카탈로그 관광지(themeCategory, 주소, 좌표, langCheck)를 페이지네이션으로 제공합니다. ' +
      'langCode: ko 권장 (en은 KTO 카탈로그 미정비로 totalCount=0 정상). ' +
      'totalCount ≈ 2,231(ko).',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        ...PAGINATION_PROPS,
      },
      required: ['langCode'],
    },
    dtoClass: AgThemeBasedListDto,
    methodName: 'themeBasedList',
  },
  {
    name: 'kto_audio_themeBasedSyncList',
    description:
      'KTO 오디오 가이드 Theme 동기화 목록을 조회합니다. ' +
      '테마 카탈로그의 신규/수정/삭제 이력을 포함한 변경 목록을 제공합니다. ' +
      'langCode: ko 또는 en 권장.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        syncStatus: {
          type: 'string',
          description: '동기화 상태 필터 (A: 신규, U: 수정, D: 삭제)',
        },
        ...PAGINATION_PROPS,
      },
      required: ['langCode'],
    },
    dtoClass: AgThemeBasedSyncListDto,
    methodName: 'themeBasedSyncList',
  },
  {
    name: 'kto_audio_themeLocationBasedList',
    description:
      'KTO 오디오 가이드 위치기반 Theme 목록을 조회합니다. ' +
      '경도(mapX)/위도(mapY)/반경(radius)으로 주변 테마 관광지를 검색합니다. ' +
      '반경은 최대 20,000m(20km). langCode: ko 또는 en 권장.',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        ...COORD_PROPS,
        ...PAGINATION_PROPS,
      },
      required: ['langCode', 'mapX', 'mapY', 'radius'],
    },
    dtoClass: AgThemeLocationBasedListDto,
    methodName: 'themeLocationBasedList',
  },
  {
    name: 'kto_audio_themeSearchList',
    description:
      'KTO 오디오 가이드 Theme를 키워드로 검색합니다. ' +
      '테마 카탈로그 관광지를 keyword로 검색합니다. ' +
      'langCode: ko 또는 en 권장. (예: keyword=서울 → totalCount ≈ 18)',
    inputSchema: {
      type: 'object',
      properties: {
        ...LANG_CODE_PROP,
        keyword: {
          type: 'string',
          description: '검색 키워드 — 필수. 한글 지원.',
        },
        ...PAGINATION_PROPS,
      },
      required: ['langCode', 'keyword'],
    },
    dtoClass: AgThemeSearchListDto,
    methodName: 'themeSearchList',
  },
];
