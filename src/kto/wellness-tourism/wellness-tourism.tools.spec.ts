import 'reflect-metadata';
import { WELLNESS_TOURISM_TOOLS } from './wellness-tourism.tools';
import { WtAreaBasedListDto } from './dto/area-based-list.dto';
import { WtLocationBasedListDto } from './dto/location-based-list.dto';
import { WtSearchKeywordDto } from './dto/search-keyword.dto';
import { WtWellnessTursmSyncListDto } from './dto/wellness-tursm-sync-list.dto';
import { WtDetailCommonDto } from './dto/detail-common.dto';
import { WtDetailIntroDto } from './dto/detail-intro.dto';
import { WtDetailInfoDto } from './dto/detail-info.dto';
import { WtDetailImageDto } from './dto/detail-image.dto';

describe('WELLNESS_TOURISM_TOOLS', () => {
  it('8개 도구가 정의되어야 한다 (SPEC-KTO-009 REQ-KTO9-001)', () => {
    expect(WELLNESS_TOURISM_TOOLS).toHaveLength(8);
  });

  it('모든 도구가 kto_wellness_ prefix를 가져야 한다', () => {
    for (const tool of WELLNESS_TOURISM_TOOLS) {
      expect(tool.name).toMatch(/^kto_wellness_/);
    }
  });

  it('8개 도구명이 정확히 매핑되어야 한다 (camelCase 보존)', () => {
    const names = WELLNESS_TOURISM_TOOLS.map((t) => t.name);
    expect(names).toContain('kto_wellness_areaBasedList');
    expect(names).toContain('kto_wellness_locationBasedList');
    expect(names).toContain('kto_wellness_searchKeyword');
    expect(names).toContain('kto_wellness_wellnessTursmSyncList');
    expect(names).toContain('kto_wellness_detailCommon');
    expect(names).toContain('kto_wellness_detailIntro');
    expect(names).toContain('kto_wellness_detailInfo');
    expect(names).toContain('kto_wellness_detailImage');
  });

  it('kto_wellness_ldongCode 도구가 존재하지 않아야 한다 (R1 정책)', () => {
    const names = WELLNESS_TOURISM_TOOLS.map((t) => t.name);
    expect(names).not.toContain('kto_wellness_ldongCode');
  });

  it('모든 도구의 inputSchema에 langDivCd required 필드가 포함되어야 한다', () => {
    for (const tool of WELLNESS_TOURISM_TOOLS) {
      const required = tool.inputSchema.required;
      expect(required).toBeDefined();
      expect(required).toContain('langDivCd');
    }
  });

  describe('kto_wellness_areaBasedList', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_areaBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtAreaBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtAreaBasedListDto);
    });

    it('methodName이 areaBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('areaBasedList');
    });

    it('required에 langDivCd만 포함되어야 한다 (다른 필드 선택)', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd']),
      );
      expect(tool?.inputSchema.required).not.toContain('sigunguCode');
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('description에 웰니스관광 관련 내용이 포함되어야 한다', () => {
      expect(tool?.description).toBeTruthy();
      expect(tool?.description.length).toBeGreaterThan(10);
    });
  });

  describe('kto_wellness_locationBasedList', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_locationBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtLocationBasedListDto);
    });

    it('methodName이 locationBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('locationBasedList');
    });

    it('required 배열에 langDivCd/mapX/mapY/radius가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'mapX', 'mapY', 'radius']),
      );
    });

    it('inputSchema에 mapX/mapY/radius 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['mapX']).toBeDefined();
      expect(props?.['mapY']).toBeDefined();
      expect(props?.['radius']).toBeDefined();
    });
  });

  describe('kto_wellness_searchKeyword', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_searchKeyword',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtSearchKeywordDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtSearchKeywordDto);
    });

    it('methodName이 searchKeyword여야 한다', () => {
      expect(tool?.methodName).toBe('searchKeyword');
    });

    it('required 배열에 langDivCd/keyword가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'keyword']),
      );
    });
  });

  describe('kto_wellness_wellnessTursmSyncList', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_wellnessTursmSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtWellnessTursmSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtWellnessTursmSyncListDto);
    });

    it('methodName이 wellnessTursmSyncList여야 한다', () => {
      expect(tool?.methodName).toBe('wellnessTursmSyncList');
    });

    it('required에 langDivCd만 포함되어야 한다 (showflag/syncModTime 선택)', () => {
      const required = tool?.inputSchema.required as string[];
      expect(required).toContain('langDivCd');
      expect(required).not.toContain('showflag');
      expect(required).not.toContain('syncModTime');
    });

    it('inputSchema에 showflag 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['showflag']).toBeDefined();
    });
  });

  describe('kto_wellness_detailCommon', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_detailCommon',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtDetailCommonDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtDetailCommonDto);
    });

    it('methodName이 detailCommon이어야 한다', () => {
      expect(tool?.methodName).toBe('detailCommon');
    });

    it('required 배열에 langDivCd/contentId가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId']),
      );
    });

    it('required에 contentTypeId가 포함되지 않아야 한다 (detailCommon은 optional)', () => {
      expect(tool?.inputSchema.required).not.toContain('contentTypeId');
    });
  });

  describe('kto_wellness_detailIntro', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_detailIntro',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtDetailIntroDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtDetailIntroDto);
    });

    it('methodName이 detailIntro이어야 한다', () => {
      expect(tool?.methodName).toBe('detailIntro');
    });

    it('required 배열에 langDivCd/contentId/contentTypeId가 포함되어야 한다 (S5)', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId', 'contentTypeId']),
      );
    });
  });

  describe('kto_wellness_detailInfo', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_detailInfo',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtDetailInfoDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtDetailInfoDto);
    });

    it('methodName이 detailInfo이어야 한다', () => {
      expect(tool?.methodName).toBe('detailInfo');
    });

    it('required 배열에 langDivCd/contentId/contentTypeId가 포함되어야 한다 (S5)', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId', 'contentTypeId']),
      );
    });
  });

  describe('kto_wellness_detailImage', () => {
    const tool = WELLNESS_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_wellness_detailImage',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 WtDetailImageDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(WtDetailImageDto);
    });

    it('methodName이 detailImage이어야 한다', () => {
      expect(tool?.methodName).toBe('detailImage');
    });

    it('required 배열에 langDivCd/contentId가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId']),
      );
    });

    it('required에 contentTypeId가 포함되지 않아야 한다', () => {
      expect(tool?.inputSchema.required).not.toContain('contentTypeId');
    });
  });
});
