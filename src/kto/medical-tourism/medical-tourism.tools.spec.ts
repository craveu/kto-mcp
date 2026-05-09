import 'reflect-metadata';
import { MEDICAL_TOURISM_TOOLS } from './medical-tourism.tools';
import { MtAreaBasedListDto } from './dto/area-based-list.dto';
import { MtLocationBasedListDto } from './dto/location-based-list.dto';
import { MtSearchKeywordDto } from './dto/search-keyword.dto';
import { MtMdclTursmSyncListDto } from './dto/mdcl-tursm-sync-list.dto';
import { MtDetailMdclTursmDto } from './dto/detail-mdcl-tursm.dto';
import { MtDetailCommonDto } from './dto/detail-common.dto';
import { MtDetailIntroDto } from './dto/detail-intro.dto';

describe('MEDICAL_TOURISM_TOOLS', () => {
  it('7개 도구가 정의되어야 한다 (SPEC-KTO-008 REQ-KTO8-001)', () => {
    expect(MEDICAL_TOURISM_TOOLS).toHaveLength(7);
  });

  it('모든 도구가 kto_medical_ prefix를 가져야 한다', () => {
    for (const tool of MEDICAL_TOURISM_TOOLS) {
      expect(tool.name).toMatch(/^kto_medical_/);
    }
  });

  it('7개 도구명이 정확히 매핑되어야 한다 (camelCase 보존)', () => {
    const names = MEDICAL_TOURISM_TOOLS.map((t) => t.name);
    expect(names).toContain('kto_medical_areaBasedList');
    expect(names).toContain('kto_medical_locationBasedList');
    expect(names).toContain('kto_medical_searchKeyword');
    expect(names).toContain('kto_medical_mdclTursmSyncList');
    expect(names).toContain('kto_medical_detailMdclTursm');
    expect(names).toContain('kto_medical_detailCommon');
    expect(names).toContain('kto_medical_detailIntro');
  });

  it('kto_medical_ldongCode 도구가 존재하지 않아야 한다 (R1 정책)', () => {
    const names = MEDICAL_TOURISM_TOOLS.map((t) => t.name);
    expect(names).not.toContain('kto_medical_ldongCode');
  });

  it('모든 도구의 inputSchema에 langDivCd required 필드가 포함되어야 한다', () => {
    for (const tool of MEDICAL_TOURISM_TOOLS) {
      const required = tool.inputSchema.required;
      expect(required).toBeDefined();
      expect(required).toContain('langDivCd');
    }
  });

  describe('kto_medical_areaBasedList', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_areaBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtAreaBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtAreaBasedListDto);
    });

    it('methodName이 areaBasedList여야 한다 (NO suffix)', () => {
      expect(tool?.methodName).toBe('areaBasedList');
    });

    it('required에 langDivCd만 포함되어야 한다 (다른 필드 선택)', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd']),
      );
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('description에 의료관광 관련 내용이 포함되어야 한다', () => {
      expect(tool?.description).toBeTruthy();
      expect(tool?.description.length).toBeGreaterThan(10);
    });
  });

  describe('kto_medical_locationBasedList', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_locationBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtLocationBasedListDto);
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

  describe('kto_medical_searchKeyword', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_searchKeyword',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtSearchKeywordDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtSearchKeywordDto);
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

  describe('kto_medical_mdclTursmSyncList', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_mdclTursmSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtMdclTursmSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtMdclTursmSyncListDto);
    });

    it('methodName이 mdclTursmSyncList여야 한다', () => {
      expect(tool?.methodName).toBe('mdclTursmSyncList');
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

  describe('kto_medical_detailMdclTursm', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_detailMdclTursm',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtDetailMdclTursmDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtDetailMdclTursmDto);
    });

    it('methodName이 detailMdclTursm이어야 한다', () => {
      expect(tool?.methodName).toBe('detailMdclTursm');
    });

    it('required 배열에 langDivCd/contentId가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId']),
      );
    });
  });

  describe('kto_medical_detailCommon', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_detailCommon',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtDetailCommonDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtDetailCommonDto);
    });

    it('methodName이 detailCommon이어야 한다', () => {
      expect(tool?.methodName).toBe('detailCommon');
    });

    it('required 배열에 langDivCd/contentId가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId']),
      );
    });
  });

  describe('kto_medical_detailIntro', () => {
    const tool = MEDICAL_TOURISM_TOOLS.find(
      (t) => t.name === 'kto_medical_detailIntro',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 MtDetailIntroDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(MtDetailIntroDto);
    });

    it('methodName이 detailIntro이어야 한다', () => {
      expect(tool?.methodName).toBe('detailIntro');
    });

    it('required 배열에 langDivCd/contentId가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['langDivCd', 'contentId']),
      );
    });
  });
});
