import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { PaPhokoAwrdListDto } from './dto/phoko-awrd-list.dto';
import { PaPhokoAwrdSyncListDto } from './dto/phoko-awrd-sync-list.dto';

// @MX:ANCHOR: [AUTO] kto_contest_* 도구 카탈로그 진입점 — PhokoAwrdService 2개 도구.
// @MX:REASON: PHOTO_AWARD_TOOLS는 main.ts의 registerAll 호출과 e2e 테스트에서 fan_in >= 3.
// @MX:SPEC: SPEC-KTO-010 REQ-KTO10-001, REQ-UNW-001

/** 공통 페이지네이션 프로퍼티 */
const PAGINATION_PROPERTIES = {
  numOfRows: {
    type: 'integer' as const,
    description: '한 페이지 결과 수 (최소 1)',
    minimum: 1,
  },
  pageNo: {
    type: 'integer' as const,
    description: '페이지 번호 (1-기반)',
    minimum: 1,
  },
};

/**
 * KTO 관광공모전 수상작 도구 정의 목록 (2개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 * kto_contest_ldongCode 미노출 (R1 dedup — KorService2 ldongCode2와 중복).
 * 언어 파라미터(langCode/langDivCd) 미포함 — KTO가 거부(resultCode=10).
 */
export const PHOTO_AWARD_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_contest_phokoAwrdList',
    description:
      '관광공모전 수상작 사진 목록 (한/영 동시 응답: koTitle/enTitle 등 ko*/en* prefix 필드 페어로 노출. 95 수상작.). ' +
      '단일 호출로 한국어/영어 필드를 동시에 취득할 수 있다. ' +
      'langCode/langDivCd 미지원 — KTO가 거부(resultCode=10).',
    inputSchema: {
      type: 'object',
      properties: {
        ...PAGINATION_PROPERTIES,
      },
    },
    dtoClass: PaPhokoAwrdListDto,
    methodName: 'phokoAwrdList',
  },
  {
    name: 'kto_contest_phokoAwrdSyncList',
    description:
      '관광공모전 수상작 sync 목록 (showflag 포함, 변경/삭제 이력). ' +
      'showflag 필드로 활성/삭제 상태를 구분할 수 있다. ' +
      'syncModTime 파라미터로 특정 시각 이후의 변경분만 조회 가능.',
    inputSchema: {
      type: 'object',
      properties: {
        ...PAGINATION_PROPERTIES,
        showflag: {
          type: 'string',
          description: "활성화 여부 ('1'=active, '0'=deleted)",
        },
        syncModTime: {
          type: 'string',
          description:
            '동기화 기준 시각 (YYYYMMDDHHmmss) — 이 시각 이후 변경분 반환',
        },
      },
    },
    dtoClass: PaPhokoAwrdSyncListDto,
    methodName: 'phokoAwrdSyncList',
  },
];
