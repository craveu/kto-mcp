import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  BfAreaBasedListDto,
  BfDetailWithTourDto,
  BfLocationBasedListDto,
  BfSearchFestivalDto,
  BfSearchKeywordDto,
  BfDetailCommonDto,
  BfDetailIntroDto,
  BfDetailInfoDto,
  BfDetailImageDto,
  BfSearchStayDto,
} from './index';

describe('무장애 DTO 검증', () => {
  describe('BfDetailWithTourDto', () => {
    it('contentId가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfDetailWithTourDto, { contentId: '126508' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('contentId가 없으면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(BfDetailWithTourDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('contentId');
    });

    it('contentId가 빈 문자열이면 검증 실패해야 한다 (REQ-UNW-001)', async () => {
      const dto = plainToInstance(BfDetailWithTourDto, { contentId: '' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('contentId');
    });
  });

  describe('BfAreaBasedListDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfAreaBasedListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 arrange 값은 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfAreaBasedListDto, {
        areaCode: '1',
        arrange: 'A',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('잘못된 arrange 값은 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfAreaBasedListDto, { arrange: 'Z' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('arrange');
    });
  });

  describe('BfLocationBasedListDto', () => {
    it('mapX, mapY, radius가 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfLocationBasedListDto, {
        mapX: 126.977,
        mapY: 37.579,
        radius: 1000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('radius가 없으면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfLocationBasedListDto, {
        mapX: 126.977,
        mapY: 37.579,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'radius')).toBe(true);
    });
  });

  describe('BfSearchKeywordDto', () => {
    it('keyword가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfSearchKeywordDto, {
        keyword: '무장애 관광지',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('keyword가 없으면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfSearchKeywordDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('keyword');
    });
  });

  describe('BfSearchFestivalDto', () => {
    it('eventStartDate가 유효한 형식이면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfSearchFestivalDto, {
        eventStartDate: '20240101',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('eventStartDate가 없으면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfSearchFestivalDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('eventStartDate');
    });

    it('eventStartDate가 잘못된 형식이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfSearchFestivalDto, {
        eventStartDate: '2024-01-01',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('BfDetailCommonDto', () => {
    it('contentId가 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfDetailCommonDto, { contentId: '126508' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BfDetailIntroDto', () => {
    it('contentId와 contentTypeId가 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfDetailIntroDto, {
        contentId: '126508',
        contentTypeId: '12',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BfDetailInfoDto', () => {
    it('contentId와 contentTypeId가 모두 있으면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfDetailInfoDto, {
        contentId: '126508',
        contentTypeId: '12',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BfDetailImageDto', () => {
    it('contentId만 있어도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfDetailImageDto, { contentId: '126508' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('잘못된 imageYN 값은 검증 실패해야 한다', async () => {
      const dto = plainToInstance(BfDetailImageDto, {
        contentId: '126508',
        imageYN: 'X',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('imageYN');
    });
  });

  describe('BfSearchStayDto', () => {
    it('모든 필드가 선택 사항이므로 빈 객체도 검증 통과해야 한다', async () => {
      const dto = plainToInstance(BfSearchStayDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
