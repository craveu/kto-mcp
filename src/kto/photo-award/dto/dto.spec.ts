import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaPhokoAwrdListDto } from './phoko-awrd-list.dto';
import { PaPhokoAwrdSyncListDto } from './phoko-awrd-sync-list.dto';

describe('관광공모전 수상작 DTO 검증 (SPEC-KTO-010 REQ-UNW-001)', () => {
  describe('PaPhokoAwrdListDto', () => {
    it('빈 객체도 유효해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(PaPhokoAwrdListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 페이지네이션 파라미터를 수용해야 한다', async () => {
      const dto = plainToInstance(PaPhokoAwrdListDto, {
        numOfRows: 10,
        pageNo: 2,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0이면 검증 실패해야 한다 (REQ-UNW-001 Min(1))', async () => {
      const dto = plainToInstance(PaPhokoAwrdListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'numOfRows');
      expect(err).toBeDefined();
    });

    it('pageNo=0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PaPhokoAwrdListDto, { pageNo: 0 });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'pageNo');
      expect(err).toBeDefined();
    });

    it('DTO에 langCode 필드가 없어야 한다 (REQ-UNW-001)', () => {
      const dto = new PaPhokoAwrdListDto();
      expect('langCode' in dto).toBe(false);
    });

    it('DTO에 langDivCd 필드가 없어야 한다 (REQ-UNW-001)', () => {
      const dto = new PaPhokoAwrdListDto();
      expect('langDivCd' in dto).toBe(false);
    });
  });

  describe('PaPhokoAwrdSyncListDto', () => {
    it('빈 객체도 유효해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(PaPhokoAwrdSyncListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 모든 파라미터를 수용해야 한다', async () => {
      const dto = plainToInstance(PaPhokoAwrdSyncListDto, {
        numOfRows: 10,
        pageNo: 1,
        showflag: '1',
        syncModTime: '20250101000000',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PaPhokoAwrdSyncListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      const err = errors.find((e) => e.property === 'numOfRows');
      expect(err).toBeDefined();
    });

    it('DTO에 langCode 필드가 없어야 한다 (REQ-UNW-001)', () => {
      const dto = new PaPhokoAwrdSyncListDto();
      expect('langCode' in dto).toBe(false);
    });
  });
});
