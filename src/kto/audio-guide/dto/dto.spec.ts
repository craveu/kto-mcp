/**
 * 오디오 가이드 DTO 검증 테스트 (REQ-UNW-001)
 * langCode 필수 + 오퍼레이션별 추가 필수 필드 검증
 */
import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AgStoryBasedListDto } from './story-based-list.dto';
import { AgStoryBasedSyncListDto } from './story-based-sync-list.dto';
import { AgStoryLocationBasedListDto } from './story-location-based-list.dto';
import { AgStorySearchListDto } from './story-search-list.dto';
import { AgThemeBasedListDto } from './theme-based-list.dto';
import { AgThemeBasedSyncListDto } from './theme-based-sync-list.dto';
import { AgThemeLocationBasedListDto } from './theme-location-based-list.dto';
import { AgThemeSearchListDto } from './theme-search-list.dto';

// 8 DTO 클래스 배열 — langCode 필수 공통 검증에 사용
const ALL_BASIC_DTOS = [
  { name: 'AgStoryBasedListDto', cls: AgStoryBasedListDto },
  { name: 'AgStoryBasedSyncListDto', cls: AgStoryBasedSyncListDto },
  { name: 'AgThemeBasedListDto', cls: AgThemeBasedListDto },
  { name: 'AgThemeBasedSyncListDto', cls: AgThemeBasedSyncListDto },
];

describe('오디오 가이드 DTO 검증 (REQ-UNW-001)', () => {
  // ─── langCode 필수 — 8 DTO 공통 ───────────────────────────────────────────

  describe('langCode 필수 검증 (8 DTO 공통)', () => {
    for (const { name, cls } of ALL_BASIC_DTOS) {
      it(`${name}: langCode 없으면 검증 실패해야 한다`, async () => {
        const dto = plainToInstance(cls, {});
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'langCode')).toBe(true);
      });

      it(`${name}: langCode 빈 문자열이면 검증 실패해야 한다`, async () => {
        const dto = plainToInstance(cls, { langCode: '' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'langCode')).toBe(true);
      });

      it(`${name}: langCode='ko'면 검증 통과해야 한다`, async () => {
        const dto = plainToInstance(cls, { langCode: 'ko' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it(`${name}: langCode='en'면 검증 통과해야 한다`, async () => {
        const dto = plainToInstance(cls, { langCode: 'en' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it(`${name}: langCode='ja'도 enum 미강제이므로 검증 통과해야 한다 (REQ-KTO5 Exclusion 10)`, async () => {
        const dto = plainToInstance(cls, { langCode: 'ja' });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });
    }
  });

  // ─── AgStoryBasedListDto ───────────────────────────────────────────────────

  describe('AgStoryBasedListDto', () => {
    it('langCode만 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStoryBasedListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(AgStoryBasedListDto, {
        langCode: 'ko',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('모든 선택 필드와 함께 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStoryBasedListDto, {
        langCode: 'ko',
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ─── AgStoryBasedSyncListDto ───────────────────────────────────────────────

  describe('AgStoryBasedSyncListDto', () => {
    it('langCode만 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStoryBasedSyncListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('syncStatus 옵션 필드와 함께 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStoryBasedSyncListDto, {
        langCode: 'ko',
        syncStatus: 'U',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('langCode 누락 시 검증 실패해야 한다', async () => {
      const dto = plainToInstance(AgStoryBasedSyncListDto, {
        syncStatus: 'A',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'langCode')).toBe(true);
    });
  });

  // ─── AgStoryLocationBasedListDto ──────────────────────────────────────────

  describe('AgStoryLocationBasedListDto', () => {
    it('langCode + mapX + mapY + radius 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('langCode 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'langCode')).toBe(true);
    });

    it('mapX 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'mapX')).toBe(true);
    });

    it('mapY 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'mapY')).toBe(true);
    });

    it('radius 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'radius')).toBe(true);
    });

    it('radius가 20000을 초과하면 검증 실패해야 한다 (Max(20000))', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
        radius: 20001,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'radius')).toBe(true);
    });

    it('radius가 20000이면 검증 통과해야 한다 (경계값)', async () => {
      const dto = plainToInstance(AgStoryLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
        radius: 20000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ─── AgStorySearchListDto ─────────────────────────────────────────────────

  describe('AgStorySearchListDto', () => {
    it('langCode + keyword 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgStorySearchListDto, {
        langCode: 'ko',
        keyword: '경복궁',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('langCode 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStorySearchListDto, { keyword: '경복궁' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'langCode')).toBe(true);
    });

    it('keyword 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStorySearchListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'keyword')).toBe(true);
    });

    it('keyword 빈 문자열이면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgStorySearchListDto, {
        langCode: 'ko',
        keyword: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'keyword')).toBe(true);
    });
  });

  // ─── AgThemeBasedListDto ──────────────────────────────────────────────────

  describe('AgThemeBasedListDto', () => {
    it('langCode만 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeBasedListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('langCode + 페이지네이션으로 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeBasedListDto, {
        langCode: 'en',
        numOfRows: 5,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ─── AgThemeBasedSyncListDto ──────────────────────────────────────────────

  describe('AgThemeBasedSyncListDto', () => {
    it('langCode만 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeBasedSyncListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('syncStatus 옵션 필드와 함께 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeBasedSyncListDto, {
        langCode: 'ko',
        syncStatus: 'A',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ─── AgThemeLocationBasedListDto ──────────────────────────────────────────

  describe('AgThemeLocationBasedListDto', () => {
    it('langCode + mapX + mapY + radius 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
        radius: 10000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('langCode 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgThemeLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'langCode')).toBe(true);
    });

    it('mapX/mapY/radius 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgThemeLocationBasedListDto, {
        langCode: 'ko',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // mapX, mapY, radius 중 하나 이상이 에러
      expect(
        errors.some(
          (e) =>
            e.property === 'mapX' ||
            e.property === 'mapY' ||
            e.property === 'radius',
        ),
      ).toBe(true);
    });

    it('radius가 20001이면 검증 실패해야 한다 (Max(20000))', async () => {
      const dto = plainToInstance(AgThemeLocationBasedListDto, {
        langCode: 'ko',
        mapX: 126.978,
        mapY: 37.5665,
        radius: 20001,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'radius')).toBe(true);
    });
  });

  // ─── AgThemeSearchListDto ─────────────────────────────────────────────────

  describe('AgThemeSearchListDto', () => {
    it('langCode + keyword 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(AgThemeSearchListDto, {
        langCode: 'ko',
        keyword: '서울',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('keyword 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgThemeSearchListDto, { langCode: 'ko' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'keyword')).toBe(true);
    });

    it('langCode 누락 시 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(AgThemeSearchListDto, { keyword: '서울' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'langCode')).toBe(true);
    });
  });
});
