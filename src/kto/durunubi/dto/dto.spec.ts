import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DuCourseListDto } from './course-list.dto';
import { DuRouteListDto } from './route-list.dto';

describe('두루누비 DTO 검증 (REQ-UNW-001)', () => {
  describe('DuCourseListDto', () => {
    it('빈 객체도 검증 통과해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(DuCourseListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 numOfRows와 pageNo는 검증 통과해야 한다', async () => {
      const dto = plainToInstance(DuCourseListDto, {
        numOfRows: 10,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(DuCourseListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 101이면 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(DuCourseListDto, { numOfRows: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 문자열이면 정수 변환 실패로 검증 실패해야 한다', async () => {
      const dto = plainToInstance(DuCourseListDto, { numOfRows: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(DuCourseListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });

    it('numOfRows 100은 경계값으로 검증 통과해야 한다', async () => {
      const dto = plainToInstance(DuCourseListDto, { numOfRows: 100 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('DuRouteListDto', () => {
    it('빈 객체도 검증 통과해야 한다 (모든 필드 선택)', async () => {
      const dto = plainToInstance(DuRouteListDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('유효한 numOfRows와 pageNo는 검증 통과해야 한다', async () => {
      const dto = plainToInstance(DuRouteListDto, {
        numOfRows: 3,
        pageNo: 1,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(DuRouteListDto, { numOfRows: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 101이면 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(DuRouteListDto, { numOfRows: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows가 문자열이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(DuRouteListDto, { numOfRows: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo가 0이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(DuRouteListDto, { pageNo: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });
});
