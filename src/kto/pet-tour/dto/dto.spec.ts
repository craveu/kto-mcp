import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PtAreaBasedListDto } from './area-based-list.dto';
import { PtLocationBasedListDto } from './location-based-list.dto';
import { PtSearchKeywordDto } from './search-keyword.dto';
import { PtPetTourSyncListDto } from './pet-tour-sync-list.dto';

describe('반려동물 동반여행 DTO 검증 (REQ-UNW-001)', () => {
  describe('PtAreaBasedListDto', () => {
    it('빈 객체도 검증 통과해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 areaCode와 numOfRows는 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, {
        areaCode: '1',
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 101이면 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, { numOfRows: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 문자열이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, { numOfRows: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtAreaBasedListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });

  describe('PtLocationBasedListDto', () => {
    it('빈 객체는 검증 실패해야 한다 (mapX/mapY/radius 필수)', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('mapX만 전달하면 검증 실패해야 한다 (mapY/radius missing)', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, { mapX: 126.9779 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('mapX/mapY/radius 모두 전달하면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, {
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 20000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('mapX가 문자열이면 검증 실패해야 한다 (mapX not number)', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, {
        mapX: 'abc',
        mapY: 37.5664,
        radius: 20000,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const mapXError = errors.find((e) => e.property === 'mapX');
      expect(mapXError).toBeDefined();
    });

    it('radius가 20000 초과면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, {
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 25000,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const radiusError = errors.find((e) => e.property === 'radius');
      expect(radiusError).toBeDefined();
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtLocationBasedListDto, {
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 1000,
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const numOfRowsError = errors.find((e) => e.property === 'numOfRows');
      expect(numOfRowsError).toBeDefined();
    });
  });

  describe('PtSearchKeywordDto', () => {
    it('빈 객체는 검증 실패해야 한다 (keyword 필수)', async () => {
      const dto = plainToInstance(PtSearchKeywordDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('빈 keyword는 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PtSearchKeywordDto, { keyword: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const keywordError = errors.find((e) => e.property === 'keyword');
      expect(keywordError).toBeDefined();
    });

    it('유효한 keyword는 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PtSearchKeywordDto, { keyword: '카페' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtSearchKeywordDto, {
        keyword: '카페',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtSearchKeywordDto, {
        keyword: '카페',
        pageNo: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('PtPetTourSyncListDto', () => {
    it('빈 객체도 검증 통과해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 showflag와 numOfRows는 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, {
        showflag: '1',
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 101이면 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, { numOfRows: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 문자열이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, { numOfRows: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PtPetTourSyncListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });
});
