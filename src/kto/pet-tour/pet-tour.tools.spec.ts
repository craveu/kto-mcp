import 'reflect-metadata';
import { PET_TOUR_TOOLS } from './pet-tour.tools';
import { PtAreaBasedListDto } from './dto/area-based-list.dto';
import { PtLocationBasedListDto } from './dto/location-based-list.dto';
import { PtSearchKeywordDto } from './dto/search-keyword.dto';
import { PtPetTourSyncListDto } from './dto/pet-tour-sync-list.dto';

describe('PET_TOUR_TOOLS', () => {
  it('4개 도구가 정의되어야 한다 (SPEC-KTO-007 REQ-KTO7-001)', () => {
    expect(PET_TOUR_TOOLS).toHaveLength(4);
  });

  it('모든 도구가 kto_pet_ prefix를 가져야 한다', () => {
    for (const tool of PET_TOUR_TOOLS) {
      expect(tool.name).toMatch(/^kto_pet_/);
    }
  });

  it('4개 도구명이 정확히 매핑되어야 한다', () => {
    const names = PET_TOUR_TOOLS.map((t) => t.name);
    expect(names).toContain('kto_pet_areaBasedList2');
    expect(names).toContain('kto_pet_locationBasedList2');
    expect(names).toContain('kto_pet_searchKeyword2');
    expect(names).toContain('kto_pet_petTourSyncList2');
  });

  describe('kto_pet_areaBasedList2', () => {
    const tool = PET_TOUR_TOOLS.find(
      (t) => t.name === 'kto_pet_areaBasedList2',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PtAreaBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PtAreaBasedListDto);
    });

    it('methodName이 areaBasedList2여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('areaBasedList2');
    });

    it('required 배열이 없어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('inputSchema에 areaCode 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['areaCode']).toBeDefined();
    });
  });

  describe('kto_pet_locationBasedList2', () => {
    const tool = PET_TOUR_TOOLS.find(
      (t) => t.name === 'kto_pet_locationBasedList2',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PtLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PtLocationBasedListDto);
    });

    it('methodName이 locationBasedList2여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('locationBasedList2');
    });

    it('required 배열에 mapX/mapY/radius가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['mapX', 'mapY', 'radius']),
      );
    });

    it('inputSchema에 mapX/mapY/radius 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['mapX']).toBeDefined();
      expect(props?.['mapY']).toBeDefined();
      expect(props?.['radius']).toBeDefined();
    });

    it('description에 mapX/mapY/radius 필수 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('mapX');
      expect(tool?.description).toContain('mapY');
      expect(tool?.description).toContain('radius');
    });
  });

  describe('kto_pet_searchKeyword2', () => {
    const tool = PET_TOUR_TOOLS.find(
      (t) => t.name === 'kto_pet_searchKeyword2',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PtSearchKeywordDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PtSearchKeywordDto);
    });

    it('methodName이 searchKeyword2여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('searchKeyword2');
    });

    it('required 배열에 keyword가 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toEqual(
        expect.arrayContaining(['keyword']),
      );
    });

    it('inputSchema에 keyword 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['keyword']).toBeDefined();
    });

    it('description에 keyword 필수 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('keyword');
    });
  });

  describe('kto_pet_petTourSyncList2', () => {
    const tool = PET_TOUR_TOOLS.find(
      (t) => t.name === 'kto_pet_petTourSyncList2',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PtPetTourSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PtPetTourSyncListDto);
    });

    it('methodName이 petTourSyncList2여야 한다 (camelCase 보존)', () => {
      expect(tool?.methodName).toBe('petTourSyncList2');
    });

    it('required 배열이 없어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 showflag 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['showflag']).toBeDefined();
    });

    it('description에 showflag 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('showflag');
    });

    it('description에 totalCount 언급이 포함되어야 한다 (사전 검증)', () => {
      expect(tool?.description).toContain('10167');
    });
  });
});
