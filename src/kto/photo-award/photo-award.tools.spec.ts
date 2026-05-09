import 'reflect-metadata';
import { PHOTO_AWARD_TOOLS } from './photo-award.tools';
import { PaPhokoAwrdListDto } from './dto/phoko-awrd-list.dto';
import { PaPhokoAwrdSyncListDto } from './dto/phoko-awrd-sync-list.dto';

describe('PHOTO_AWARD_TOOLS', () => {
  it('2개 도구가 정의되어야 한다 (SPEC-KTO-010 REQ-KTO10-001)', () => {
    expect(PHOTO_AWARD_TOOLS).toHaveLength(2);
  });

  it('모든 도구가 kto_contest_ prefix를 가져야 한다', () => {
    for (const tool of PHOTO_AWARD_TOOLS) {
      expect(tool.name).toMatch(/^kto_contest_/);
    }
  });

  it('2개 도구명이 정확히 매핑되어야 한다 (KTO operation name 보존)', () => {
    const names = PHOTO_AWARD_TOOLS.map((t) => t.name);
    expect(names).toContain('kto_contest_phokoAwrdList');
    expect(names).toContain('kto_contest_phokoAwrdSyncList');
  });

  it('kto_contest_ldongCode 도구가 존재하지 않아야 한다 (R1 정책)', () => {
    const names = PHOTO_AWARD_TOOLS.map((t) => t.name);
    expect(names).not.toContain('kto_contest_ldongCode');
  });

  it('모든 도구의 inputSchema에 langCode 필드가 없어야 한다 (REQ-UNW-001)', () => {
    for (const tool of PHOTO_AWARD_TOOLS) {
      const props = tool.inputSchema.properties ?? {};
      expect(Object.keys(props)).not.toContain('langCode');
    }
  });

  it('모든 도구의 inputSchema에 langDivCd 필드가 없어야 한다 (REQ-UNW-001)', () => {
    for (const tool of PHOTO_AWARD_TOOLS) {
      const props = tool.inputSchema.properties ?? {};
      expect(Object.keys(props)).not.toContain('langDivCd');
    }
  });

  it('모든 도구에 required 필드가 없어야 한다 (모든 파라미터 선택)', () => {
    for (const tool of PHOTO_AWARD_TOOLS) {
      const required = tool.inputSchema.required;
      expect(!required || required.length === 0).toBe(true);
    }
  });

  describe('kto_contest_phokoAwrdList', () => {
    const tool = PHOTO_AWARD_TOOLS.find(
      (t) => t.name === 'kto_contest_phokoAwrdList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PaPhokoAwrdListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PaPhokoAwrdListDto);
    });

    it('description에 koTitle/enTitle 패턴 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('koTitle');
      expect(tool?.description).toContain('enTitle');
    });
  });

  describe('kto_contest_phokoAwrdSyncList', () => {
    const tool = PHOTO_AWARD_TOOLS.find(
      (t) => t.name === 'kto_contest_phokoAwrdSyncList',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PaPhokoAwrdSyncListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PaPhokoAwrdSyncListDto);
    });

    it('description에 showflag 언급이 포함되어야 한다', () => {
      expect(tool?.description).toContain('showflag');
    });
  });
});
