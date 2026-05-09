import 'reflect-metadata';
import { ODII_TOOLS } from './audio-guide.tools';
import { AgStoryBasedListDto } from './dto/story-based-list.dto';
import { AgStoryBasedSyncListDto } from './dto/story-based-sync-list.dto';
import { AgStoryLocationBasedListDto } from './dto/story-location-based-list.dto';
import { AgStorySearchListDto } from './dto/story-search-list.dto';
import { AgThemeBasedListDto } from './dto/theme-based-list.dto';
import { AgThemeBasedSyncListDto } from './dto/theme-based-sync-list.dto';
import { AgThemeLocationBasedListDto } from './dto/theme-location-based-list.dto';
import { AgThemeSearchListDto } from './dto/theme-search-list.dto';

describe('ODII_TOOLS', () => {
  it('8개 도구가 정의되어야 한다', () => {
    expect(ODII_TOOLS).toHaveLength(8);
  });

  it('모든 도구가 kto_audio_ prefix를 가져야 한다 (REQ-KTO5-001)', () => {
    for (const tool of ODII_TOOLS) {
      expect(tool.name).toMatch(/^kto_audio_/);
    }
  });

  it('모든 도구 inputSchema에 langCode가 required로 포함되어야 한다 (REQ-UNW-001)', () => {
    for (const tool of ODII_TOOLS) {
      expect(tool.inputSchema.required).toContain('langCode');
    }
  });

  it('모든 도구 description에 langCode 안내가 포함되어야 한다', () => {
    for (const tool of ODII_TOOLS) {
      expect(tool.description).toMatch(/langCode|언어|ko|en/i);
    }
  });

  // ─── Story 계열 ─────────────────────────────────────────────────────────────

  describe('kto_audio_storyBasedList', () => {
    const tool = ODII_TOOLS.find((t) => t.name === 'kto_audio_storyBasedList');

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgStoryBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgStoryBasedListDto);
    });

    it('methodName이 storyBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('storyBasedList');
    });

    it('langCode가 required에 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
    });

    it('inputSchema에 페이지네이션 필드가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });

    it('mapX/mapY/radius가 required에 없어야 한다', () => {
      expect(tool?.inputSchema.required).not.toContain('mapX');
      expect(tool?.inputSchema.required).not.toContain('mapY');
      expect(tool?.inputSchema.required).not.toContain('radius');
    });
  });

  describe('kto_audio_storyBasedSyncList', () => {
    const tool = ODII_TOOLS.find(
      (t) => t.name === 'kto_audio_storyBasedSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgStoryBasedSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgStoryBasedSyncListDto);
    });

    it('methodName이 storyBasedSyncList여야 한다', () => {
      expect(tool?.methodName).toBe('storyBasedSyncList');
    });

    it('inputSchema에 syncStatus 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['syncStatus']).toBeDefined();
    });
  });

  describe('kto_audio_storyLocationBasedList', () => {
    const tool = ODII_TOOLS.find(
      (t) => t.name === 'kto_audio_storyLocationBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgStoryLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgStoryLocationBasedListDto);
    });

    it('methodName이 storyLocationBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('storyLocationBasedList');
    });

    it('langCode/mapX/mapY/radius가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
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

  describe('kto_audio_storySearchList', () => {
    const tool = ODII_TOOLS.find((t) => t.name === 'kto_audio_storySearchList');

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgStorySearchListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgStorySearchListDto);
    });

    it('methodName이 storySearchList여야 한다', () => {
      expect(tool?.methodName).toBe('storySearchList');
    });

    it('langCode/keyword가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
      expect(tool?.inputSchema.required).toContain('keyword');
    });
  });

  // ─── Theme 계열 ─────────────────────────────────────────────────────────────

  describe('kto_audio_themeBasedList', () => {
    const tool = ODII_TOOLS.find((t) => t.name === 'kto_audio_themeBasedList');

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgThemeBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgThemeBasedListDto);
    });

    it('methodName이 themeBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('themeBasedList');
    });

    it('langCode가 required에 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
    });
  });

  describe('kto_audio_themeBasedSyncList', () => {
    const tool = ODII_TOOLS.find(
      (t) => t.name === 'kto_audio_themeBasedSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgThemeBasedSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgThemeBasedSyncListDto);
    });

    it('methodName이 themeBasedSyncList여야 한다', () => {
      expect(tool?.methodName).toBe('themeBasedSyncList');
    });
  });

  describe('kto_audio_themeLocationBasedList', () => {
    const tool = ODII_TOOLS.find(
      (t) => t.name === 'kto_audio_themeLocationBasedList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgThemeLocationBasedListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgThemeLocationBasedListDto);
    });

    it('methodName이 themeLocationBasedList여야 한다', () => {
      expect(tool?.methodName).toBe('themeLocationBasedList');
    });

    it('langCode/mapX/mapY/radius가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
      expect(tool?.inputSchema.required).toContain('mapX');
      expect(tool?.inputSchema.required).toContain('mapY');
      expect(tool?.inputSchema.required).toContain('radius');
    });
  });

  describe('kto_audio_themeSearchList', () => {
    const tool = ODII_TOOLS.find((t) => t.name === 'kto_audio_themeSearchList');

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 AgThemeSearchListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(AgThemeSearchListDto);
    });

    it('methodName이 themeSearchList여야 한다', () => {
      expect(tool?.methodName).toBe('themeSearchList');
    });

    it('langCode/keyword가 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('langCode');
      expect(tool?.inputSchema.required).toContain('keyword');
    });
  });
});
