import type { McpToolDefinition } from '../../mcp/types/mcp.types';
import { DuCourseListDto } from './dto/course-list.dto';
import { DuRouteListDto } from './dto/route-list.dto';

// @MX:NOTE: [AUTO] 두루누비(코리아둘레길) 도구 카탈로그 진입점.
// kto_durunubi_* prefix 2개 도구 — 가장 작은 KTO 모듈 (SPEC-KTO-006).
// 서비스명 Durunubi는 suffix 없는 평면 형태 — BASE_URL_MAP 패턴 C.
// @MX:SPEC: SPEC-KTO-006 REQ-KTO6-001, REQ-UNW-001

/**
 * KTO 두루누비 도구 정의 목록 (2개).
 * tool-registry에서 McpServer에 일괄 등록된다.
 */
export const DURUNUBI_TOOLS: McpToolDefinition[] = [
  {
    name: 'kto_durunubi_courseList',
    description:
      '코리아둘레길 코스 목록 (228 코스, GPX URL 포함). ' +
      '각 코스는 한글명(crsKorNm), 거리(crsDstnc, km), 소요시간(crsTotlRqrmHour, 분), ' +
      '난이도(crsLevel), GPX 파일 URL(gpxpath)을 포함한다. ' +
      'GPX URL은 트래킹 워치/외부 앱이 직접 다운로드하여 처리한다.',
    inputSchema: {
      type: 'object',
      properties: {
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
    dtoClass: DuCourseListDto,
    methodName: 'courseList',
  },
  {
    name: 'kto_durunubi_routeList',
    description:
      '코리아둘레길 상위 경로(테마) 목록 (3 routes: 남파랑길/해파랑길/평화누리길 등). ' +
      '각 테마는 한글 테마명(themeNm), 한 줄 설명(linemsg), HTML 포함 상세 설명(themedescs)을 포함한다. ' +
      'totalCount=3이므로 페이지네이션 없이 빈 입력({})으로 전체 조회 가능.',
    inputSchema: {
      type: 'object',
      properties: {
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
    dtoClass: DuRouteListDto,
    methodName: 'routeList',
  },
];
