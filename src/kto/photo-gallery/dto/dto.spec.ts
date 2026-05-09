import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PgGalleryListDto } from './gallery-list.dto';
import { PgGalleryDetailListDto } from './gallery-detail-list.dto';
import { PgGallerySearchListDto } from './gallery-search-list.dto';
import { PgGallerySyncDetailListDto } from './gallery-sync-detail-list.dto';

describe('관광사진 DTO 검증', () => {
  describe('PgGalleryDetailListDto', () => {
    it('title이 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGalleryDetailListDto, {
        title: '경복궁',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('title과 선택 필드(numOfRows, pageNo)가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGalleryDetailListDto, {
        title: '한라산',
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('title이 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(PgGalleryDetailListDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('title이 빈 문자열이면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(PgGalleryDetailListDto, { title: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PgGalleryDetailListDto, {
        title: '서울',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });

  describe('PgGalleryListDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGalleryListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows와 pageNo가 유효한 숫자면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGalleryListDto, {
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('keyword 문자열은 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGalleryListDto, { keyword: '제주도' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PgGalleryListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });

  describe('PgGallerySearchListDto', () => {
    it('keyword가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGallerySearchListDto, {
        keyword: '경복궁',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('keyword가 없으면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PgGallerySearchListDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'keyword')).toBe(true);
    });

    it('keyword가 빈 문자열이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(PgGallerySearchListDto, { keyword: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('keyword');
    });

    it('선택 필드(arrange, numOfRows, pageNo)가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGallerySearchListDto, {
        keyword: '서울',
        arrange: 'A',
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PgGallerySearchListDto, {
        keyword: '서울',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });
  });

  describe('PgGallerySyncDetailListDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGallerySyncDetailListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('syncModTime 문자열은 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGallerySyncDetailListDto, {
        syncModTime: '20240101',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('showflag 문자열은 검증 통과해야 한다', async () => {
      const dto = plainToInstance(PgGallerySyncDetailListDto, {
        showflag: '1',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PgGallerySyncDetailListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(PgGallerySyncDetailListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });
});
