import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AreaBasedListDto,
  LocationBasedListDto,
  SearchKeywordDto,
  SearchFestivalDto,
  KtoPaginationDto,
  DetailCommonDto,
  AreaCodeDto,
  CategoryCodeDto,
  DetailImageDto,
  DetailInfoDto,
  DetailIntroDto,
  DetailPetTourDto,
  LdongCodeDto,
  LclsSystmCodeDto,
  SearchStayDto,
  AreaBasedSyncListDto,
} from './index';

describe('KtoPaginationDto 검증', () => {
  it('numOfRows=0이면 검증 실패해야 한다', async () => {
    const dto = plainToInstance(KtoPaginationDto, { numOfRows: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('numOfRows=1이면 통과해야 한다', async () => {
    const dto = plainToInstance(KtoPaginationDto, { numOfRows: 1 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('LocationBasedListDto 검증', () => {
  it('mapX, mapY, radius가 모두 있으면 통과해야 한다', async () => {
    const dto = plainToInstance(LocationBasedListDto, {
      mapX: '126.977',
      mapY: '37.579',
      radius: '1000',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('radius가 20000 초과이면 검증 실패해야 한다', async () => {
    const dto = plainToInstance(LocationBasedListDto, {
      mapX: '126.977',
      mapY: '37.579',
      radius: '20001',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('mapX 누락이면 검증 실패해야 한다', async () => {
    const dto = plainToInstance(LocationBasedListDto, {
      mapY: '37.579',
      radius: '1000',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SearchKeywordDto 검증', () => {
  it('keyword가 있으면 통과해야 한다', async () => {
    const dto = plainToInstance(SearchKeywordDto, { keyword: '경복궁' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('keyword 누락이면 검증 실패해야 한다', async () => {
    const dto = plainToInstance(SearchKeywordDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SearchFestivalDto 검증', () => {
  it('eventStartDate가 YYYYMMDD이면 통과해야 한다', async () => {
    const dto = plainToInstance(SearchFestivalDto, {
      eventStartDate: '20260101',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('eventStartDate가 잘못된 형식이면 검증 실패해야 한다', async () => {
    const dto = plainToInstance(SearchFestivalDto, {
      eventStartDate: '2026-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('DetailCommonDto 검증', () => {
  it('contentId가 있으면 통과해야 한다', async () => {
    const dto = plainToInstance(DetailCommonDto, { contentId: '126508' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('DTO 인스턴스화 (커버리지)', () => {
  it('모든 DTO를 인스턴스화할 수 있어야 한다', () => {
    expect(new AreaBasedListDto()).toBeDefined();
    expect(new AreaBasedSyncListDto()).toBeDefined();
    expect(new AreaCodeDto()).toBeDefined();
    expect(new CategoryCodeDto()).toBeDefined();
    expect(new DetailCommonDto()).toBeDefined();
    expect(new DetailImageDto()).toBeDefined();
    expect(new DetailInfoDto()).toBeDefined();
    expect(new DetailIntroDto()).toBeDefined();
    expect(new DetailPetTourDto()).toBeDefined();
    expect(new LdongCodeDto()).toBeDefined();
    expect(new LclsSystmCodeDto()).toBeDefined();
    expect(new LocationBasedListDto()).toBeDefined();
    expect(new SearchFestivalDto()).toBeDefined();
    expect(new SearchKeywordDto()).toBeDefined();
    expect(new SearchStayDto()).toBeDefined();
  });
});
