import 'reflect-metadata';
import { DURUNUBI_TOOLS } from './durunubi.tools';
import { DuCourseListDto } from './dto/course-list.dto';
import { DuRouteListDto } from './dto/route-list.dto';

describe('DURUNUBI_TOOLS', () => {
  it('2개 도구가 정의되어야 한다', () => {
    expect(DURUNUBI_TOOLS).toHaveLength(2);
  });

  it('모든 도구가 kto_durunubi_ prefix를 가져야 한다 (SPEC-KTO-006 REQ-KTO6-001)', () => {
    for (const tool of DURUNUBI_TOOLS) {
      expect(tool.name).toMatch(/^kto_durunubi_/);
    }
  });

  describe('kto_durunubi_courseList', () => {
    const tool = DURUNUBI_TOOLS.find(
      (t) => t.name === 'kto_durunubi_courseList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 DuCourseListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(DuCourseListDto);
    });

    it('methodName이 courseList여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('courseList');
    });

    it('required 배열이 없어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('description에 gpxpath 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('gpxpath');
    });
  });

  describe('kto_durunubi_routeList', () => {
    const tool = DURUNUBI_TOOLS.find(
      (t) => t.name === 'kto_durunubi_routeList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 DuRouteListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(DuRouteListDto);
    });

    it('methodName이 routeList여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('routeList');
    });

    it('required 배열이 없어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('description에 themedescs 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('themedescs');
    });
  });
});
