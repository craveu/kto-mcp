import 'reflect-metadata';
import { GO_CAMPING_TOOLS } from './go-camping.tools';
import { GcBasedListDto } from './dto/based-list.dto';
import { GcBasedSyncListDto } from './dto/based-sync-list.dto';
import { GcLocationBasedListDto } from './dto/location-based-list.dto';
import { GcSearchListDto } from './dto/search-list.dto';
import { GcImageListDto } from './dto/image-list.dto';

describe('GO_CAMPING_TOOLS', () => {
  it('5개 도구가 정의되어야 한다', () => {
    expect(GO_CAMPING_TOOLS).toHaveLength(5);
  });

  it('모든 도구가 kto_camping_ prefix를 가져야 한다 (REQ-KTO4-001)', () => {
    for (const tool of GO_CAMPING_TOOLS) {
      expect(tool.name).toMatch(/^kto_camping_/);
    }
  });

  describe('kto_camping_basedList', () => {
    const tool = GO_CAMPING_TOOLS.find(
      (t) => t.name === 'kto_camping_basedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 GcBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(GcBasedListDto);
    });

    it('methodName이 basedList여야 한다', () => {
      expect(tool?.methodName).toBe('basedList');
    });

    it('required 배열이 없거나 비어 있어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });
  });

  describe('kto_camping_basedSyncList', () => {
    const tool = GO_CAMPING_TOOLS.find(
      (t) => t.name === 'kto_camping_basedSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 GcBasedSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(GcBasedSyncListDto);
    });

    it('methodName이 basedSyncList여야 한다', () => {
      expect(tool?.methodName).toBe('basedSyncList');
    });

    it('required 배열이 없거나 비어 있어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 syncStatus 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['syncStatus']).toBeDefined();
    });

    it('inputSchema에 syncModTime 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['syncModTime']).toBeDefined();
    });
  });

  describe('kto_camping_locationBasedList', () => {
    const tool = GO_CAMPING_TOOLS.find(
      (t) => t.name === 'kto_camping_locationBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 GcLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(GcLocationBasedListDto);
    });

    it('methodName이 locationBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('locationBasedList');
    });

    it('mapX/mapY/radius가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('mapX');
      expect(tool?.inputSchema.required).toContain('mapY');
      expect(tool?.inputSchema.required).toContain('radius');
    });

    it('inputSchema에 mapX/mapY/radius 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['mapX']).toBeDefined();
      expect(props?.['mapY']).toBeDefined();
      expect(props?.['radius']).toBeDefined();
    });
  });

  describe('kto_camping_searchList', () => {
    const tool = GO_CAMPING_TOOLS.find(
      (t) => t.name === 'kto_camping_searchList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 GcSearchListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(GcSearchListDto);
    });

    it('methodName이 searchList여야 한다', () => {
      expect(tool?.methodName).toBe('searchList');
    });

    it('keyword가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('keyword');
    });

    it('inputSchema에 keyword 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['keyword']).toBeDefined();
    });
  });

  describe('kto_camping_imageList', () => {
    const tool = GO_CAMPING_TOOLS.find(
      (t) => t.name === 'kto_camping_imageList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 GcImageListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(GcImageListDto);
    });

    it('methodName이 imageList여야 한다', () => {
      expect(tool?.methodName).toBe('imageList');
    });

    it('contentId가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('contentId');
    });

    it('inputSchema에 contentId 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['contentId']).toBeDefined();
    });
  });
});
