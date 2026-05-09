import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GcBasedListDto } from './based-list.dto';
import { GcBasedSyncListDto } from './based-sync-list.dto';
import { GcLocationBasedListDto } from './location-based-list.dto';
import { GcSearchListDto } from './search-list.dto';
import { GcImageListDto } from './image-list.dto';

describe('고캠핑 DTO 검증', () => {
  describe('GcBasedListDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcBasedListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows와 pageNo가 유효한 숫자면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcBasedListDto, {
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(GcBasedListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(GcBasedListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });

  describe('GcBasedSyncListDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcBasedSyncListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('syncStatus A/U/D 값은 검증 통과해야 한다', async () => {
      for (const status of ['A', 'U', 'D']) {
        const dto = plainToInstance(GcBasedSyncListDto, { syncStatus: status });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('syncStatus 유효하지 않은 값은 검증 실패해야 한다', async () => {
      const dto = plainToInstance(GcBasedSyncListDto, { syncStatus: 'X' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('syncStatus');
    });

    it('syncModTime 문자열은 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcBasedSyncListDto, {
        syncModTime: '20240101000000',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(GcBasedSyncListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });

  describe('GcLocationBasedListDto', () => {
    it('mapX/mapY/radius가 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('mapX가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapY: 37.5665,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'mapX')).toBe(true);
    });

    it('mapY가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'mapY')).toBe(true);
    });

    it('radius가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'radius')).toBe(true);
    });

    it('radius가 20000을 초과하면 검증 실패해야 한다 (Max(20000))', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 20001,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('radius');
    });

    it('radius가 20000이면 검증 통과해야 한다 (경계값)', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 20000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('선택 페이지네이션 필드도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcLocationBasedListDto, {
        mapX: 126.978,
        mapY: 37.5665,
        radius: 1000,
        numOfRows: 10,
        pageNo: 2,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('GcSearchListDto', () => {
    it('keyword가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcSearchListDto, { keyword: '가평' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('keyword가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcSearchListDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'keyword')).toBe(true);
    });

    it('keyword가 빈 문자열이면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcSearchListDto, { keyword: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('keyword');
    });

    it('keyword와 페이지네이션이 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcSearchListDto, {
        keyword: '제주',
        numOfRows: 5,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(GcSearchListDto, {
        keyword: '서울',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });

  describe('GcImageListDto', () => {
    it('contentId가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcImageListDto, { contentId: '12345' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('contentId가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcImageListDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'contentId')).toBe(true);
    });

    it('contentId가 빈 문자열이면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(GcImageListDto, { contentId: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('contentId');
    });

    it('contentId와 페이지네이션이 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(GcImageListDto, {
        contentId: '99999',
        numOfRows: 20,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(GcImageListDto, {
        contentId: '12345',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });
});
