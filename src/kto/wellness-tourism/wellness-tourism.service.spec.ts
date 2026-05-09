import 'reflect-metadata';
import { WellnessTourismService } from './wellness-tourism.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { WellnessTursmItem } from './types';

describe('WellnessTourismService', () => {
  let service: WellnessTourismService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new WellnessTourismService(mockHttpClient);
  });

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: WellnessTursmService로 호출해야 한다 (SPEC-KTO-009 REQ-OPT-001)', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.areaBasedList({ langDivCd: 'KOR' });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'WellnessTursmService' }),
    );
  });

  describe('areaBasedList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: WellnessTursmItem[] = [
        {
          contentId: '2994116',
          title: '가곡유황온천&스파',
          baseAddr: '충청남도 서천군',
          langDivCd: 'KOR',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.areaBasedList({
        langDivCd: 'KOR',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'areaBasedList',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            numOfRows: 1,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('가곡유황온천&스파');
    });

    it('langDivCd 파라미터가 KTO에 그대로 전달되어야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.areaBasedList({ langDivCd: 'ENG' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ langDivCd: 'ENG' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });

    it('WellnessTursmItem camelCase 필드가 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: WellnessTursmItem = {
        contentId: '2994116',
        title: '가곡유황온천&스파',
        baseAddr: '충청남도 서천군',
        mapX: '126.6904',
        mapY: '36.0748',
        regDt: '20230101',
        mdfcnDt: '20231201',
        langDivCd: 'KOR',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.areaBasedList({ langDivCd: 'KOR' });
      const item = result.items[0];

      expect(item.contentId).toBe('2994116');
      expect(item.mapX).toBe('126.6904');
      expect(item.mapY).toBe('36.0748');
      expect(item.regDt).toBe('20230101');
      expect(item.mdfcnDt).toBe('20231201');
    });
  });

  describe('locationBasedList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: WellnessTursmItem[] = [
        {
          contentId: '2994116',
          title: '가곡유황온천&스파',
          mapX: '126.6904',
          mapY: '36.0748',
          dist: '1234',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.locationBasedList({
        langDivCd: 'KOR',
        mapX: 126.6904,
        mapY: 36.0748,
        radius: 5000,
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'locationBasedList',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            mapX: 126.6904,
            mapY: 36.0748,
            radius: 5000,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].dist).toBe('1234');
    });
  });

  describe('searchKeyword', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: WellnessTursmItem[] = [
        {
          contentId: '2994116',
          title: '온천 스파',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.searchKeyword({
        langDivCd: 'KOR',
        keyword: '온천',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'searchKeyword',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            keyword: '온천',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('wellnessTursmSyncList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: WellnessTursmItem[] = [
        {
          contentId: '2994116',
          title: '삭제된 스파',
          showflag: '0',
          oldContentId: '1234567',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.wellnessTursmSyncList({
        langDivCd: 'KOR',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'wellnessTursmSyncList',
        }),
      );
      expect(result.items[0].showflag).toBe('0');
      expect(result.items[0].oldContentId).toBe('1234567');
    });

    it('showflag/oldContentId 필드가 보존되어야 한다 (S7 — REQ-EVT-003)', async () => {
      const mockItem: WellnessTursmItem = {
        contentId: '2994117',
        showflag: '1',
        oldContentId: '2994000',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.wellnessTursmSyncList({ langDivCd: 'KOR' });
      expect(result.items[0].showflag).toBe('1');
      expect(result.items[0].oldContentId).toBe('2994000');
    });
  });

  describe('detailCommon', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentId: '2994116' }]),
      );

      await service.detailCommon({ langDivCd: 'KOR', contentId: '2994116' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'detailCommon',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '2994116',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('detailIntro', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentId: '2994116' }]),
      );

      await service.detailIntro({
        langDivCd: 'KOR',
        contentId: '2994116',
        contentTypeId: '25',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'detailIntro',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '2994116',
            contentTypeId: '25',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('detailInfo', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentId: '2994116' }]),
      );

      await service.detailInfo({
        langDivCd: 'KOR',
        contentId: '2994116',
        contentTypeId: '25',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'detailInfo',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '2994116',
            contentTypeId: '25',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('detailImage', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: WellnessTursmItem[] = Array.from(
        { length: 7 },
        (_, i) => ({
          contentId: '2994116',
          imgname: `image_${String(i + 1)}.jpg`,
          serialnum: String(i + 1),
        }),
      );
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.detailImage({
        langDivCd: 'KOR',
        contentId: '2994116',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'WellnessTursmService',
          operation: 'detailImage',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '2994116',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(7);
      expect(result.items[0].imgname).toBe('image_1.jpg');
      expect(result.items[0].serialnum).toBe('1');
    });

    it('imgname/serialnum 필드가 보존되어야 한다 (S6 — REQ-EVT-002)', async () => {
      const mockItem: WellnessTursmItem = {
        contentId: '2994116',
        imgname: 'wellness_spa.jpg',
        serialnum: '3',
        orgImage: 'http://example.com/full.jpg',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.detailImage({
        langDivCd: 'KOR',
        contentId: '2994116',
      });
      expect(result.items[0].imgname).toBe('wellness_spa.jpg');
      expect(result.items[0].serialnum).toBe('3');
    });
  });
});
