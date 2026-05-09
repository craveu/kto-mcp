import 'reflect-metadata';
import { BarrierFreeTourInfoService } from './barrier-free-tour-info.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';

describe('BarrierFreeTourInfoService', () => {
  let service: BarrierFreeTourInfoService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new BarrierFreeTourInfoService(mockHttpClient);
  });

  const testCredentials: KtoCredentials = {
    serviceKey: 'TEST_KEY',
    preencoded: false,
  };

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: KorWithService2로 호출해야 한다', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.areaBasedList2({}, testCredentials);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'KorWithService2' }),
    );
  });

  describe('areaBasedList2', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems = [{ contentid: '126508', title: '무장애 관광지' }];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.areaBasedList2(
        { areaCode: '1' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'areaBasedList2',
          params: expect.objectContaining({ areaCode: '1' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('locationBasedList2', () => {
    it('mapX, mapY, radius를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.locationBasedList2(
        {
          mapX: 126.977,
          mapY: 37.579,
          radius: 1000,
        },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'locationBasedList2',
          params: expect.objectContaining({
            mapX: 126.977,
            mapY: 37.579,
            radius: 1000,
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('searchKeyword2', () => {
    it('keyword를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchKeyword2(
        { keyword: '무장애 관광지' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'searchKeyword2',
          params: expect.objectContaining({
            keyword: '무장애 관광지',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('searchFestival2', () => {
    it('eventStartDate를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchFestival2(
        { eventStartDate: '20240101' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'searchFestival2',
          params: expect.objectContaining({
            eventStartDate: '20240101',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('searchStay2', () => {
    it('빈 파라미터로도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchStay2({}, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'searchStay2',
        }),
      );
    });
  });

  describe('detailCommon2', () => {
    it('contentId를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.detailCommon2({ contentId: '126508' }, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'detailCommon2',
          params: expect.objectContaining({ contentId: '126508' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });
  });

  describe('detailIntro2', () => {
    it('contentId와 contentTypeId를 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.detailIntro2(
        { contentId: '126508', contentTypeId: '12' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'detailIntro2',
          params: expect.objectContaining({
            contentId: '126508',
            contentTypeId: '12',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('detailInfo2', () => {
    it('contentId와 contentTypeId를 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.detailInfo2(
        { contentId: '126508', contentTypeId: '12' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'detailInfo2',
        }),
      );
    });
  });

  describe('detailImage2', () => {
    it('contentId를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.detailImage2({ contentId: '126508' }, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'detailImage2',
        }),
      );
    });
  });

  describe('detailWithTour2', () => {
    it('KorWithService2 고유 오퍼레이션으로 호출해야 한다', async () => {
      const mockItem = {
        contentid: '126508',
        wheelchair: '휠체어 대여 가능',
        exit: '주출입구 단차 없음',
        elevator: '엘리베이터 1대',
        parking: '장애인 전용 2면',
        restroom: '장애인 화장실 1층',
        guidesystem: '점자 안내도 비치',
        signguide: 'N',
        videoguide: 'Y',
        audioguide: 'Y',
        braileblock: 'Y',
        helpdog: 'Y',
        stroller: 'Y',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.detailWithTour2(
        { contentId: '126508' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorWithService2',
          operation: 'detailWithTour2',
          params: expect.objectContaining({ contentId: '126508' }) as Record<
            string,
            unknown
          >,
        }),
      );
      // 무장애 필드가 KTO 원형 그대로 보존되는지 확인
      const item = result.items[0] as typeof mockItem;
      expect(item.wheelchair).toBe('휠체어 대여 가능');
      expect(item.braileblock).toBe('Y');
    });
  });
});
