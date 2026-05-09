import 'reflect-metadata';
import { PetTourService } from './pet-tour.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { KorPetTourItem } from './types';

describe('PetTourService', () => {
  let service: PetTourService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new PetTourService(mockHttpClient);
  });

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: KorPetTourService2로 호출해야 한다 (SPEC-KTO-007 REQ-OPT-001)', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.areaBasedList2({});

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'KorPetTourService2' }),
    );
  });

  describe('areaBasedList2', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: KorPetTourItem[] = [
        {
          contentid: '123456',
          title: '반려동물 동반 카페',
          addr1: '서울특별시 종로구',
          areacode: '1',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.areaBasedList2({
        areaCode: '1',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'areaBasedList2',
          params: expect.objectContaining({
            areaCode: '1',
            numOfRows: 1,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('반려동물 동반 카페');
    });

    it('빈 파라미터로도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.areaBasedList2({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'areaBasedList2',
        }),
      );
    });

    it('KorPetTourItem 필드가 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: KorPetTourItem = {
        contentid: '2769783',
        contenttypeid: '39',
        title: '펫프렌즈 카페',
        addr1: '서울특별시 마포구 와우산로',
        areacode: '1',
        sigungucode: '4',
        cat1: 'A05',
        cat2: 'A0502',
        cat3: 'A05020900',
        mapx: '126.920',
        mapy: '37.549',
        firstimage: 'http://example.com/img.jpg',
        cpyrhtDivCd: 'Type1',
        createdtime: '20231001120000',
        modifiedtime: '20231015130000',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.areaBasedList2({});
      const item = result.items[0];

      expect(item.contentid).toBe('2769783');
      expect(item.contenttypeid).toBe('39');
      expect(item.title).toBe('펫프렌즈 카페');
      expect(item.mapx).toBe('126.920');
      expect(item.cpyrhtDivCd).toBe('Type1');
    });
  });

  describe('locationBasedList2', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: KorPetTourItem[] = [
        {
          contentid: '654321',
          title: '서울 반려견 공원',
          mapx: '126.9779',
          mapy: '37.5664',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.locationBasedList2({
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 20000,
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'locationBasedList2',
          params: expect.objectContaining({
            mapX: 126.9779,
            mapY: 37.5664,
            radius: 20000,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('서울 반려견 공원');
    });

    it('mapX/mapY/radius 파라미터가 요청에 포함되어야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.locationBasedList2({
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 5000,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            mapX: 126.9779,
            mapY: 37.5664,
            radius: 5000,
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('searchKeyword2', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: KorPetTourItem[] = [
        {
          contentid: '111111',
          title: '펫카페 종로',
          cat1: 'A05',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.searchKeyword2({
        keyword: '카페',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'searchKeyword2',
          params: expect.objectContaining({
            keyword: '카페',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('펫카페 종로');
    });

    it('keyword 파라미터가 요청에 포함되어야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchKeyword2({ keyword: '반려견' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'searchKeyword2',
          params: expect.objectContaining({ keyword: '반려견' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });
  });

  describe('petTourSyncList2', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: KorPetTourItem[] = [
        {
          contentid: '222222',
          title: '반려동물 펜션',
          showflag: '1',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.petTourSyncList2({ numOfRows: 1 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'petTourSyncList2',
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].showflag).toBe('1');
    });

    it('빈 파라미터로도 호출 가능해야 한다 (showflag/syncModTime 선택)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.petTourSyncList2({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorPetTourService2',
          operation: 'petTourSyncList2',
        }),
      );
    });

    it('showflag 필드가 KTO 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: KorPetTourItem = {
        contentid: '333333',
        title: '삭제된 반려동물 시설',
        showflag: '0',
        modifiedtime: '20240101000000',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.petTourSyncList2({});
      const item = result.items[0];

      expect(item.showflag).toBe('0');
      expect(item.contentid).toBe('333333');
    });
  });
});
