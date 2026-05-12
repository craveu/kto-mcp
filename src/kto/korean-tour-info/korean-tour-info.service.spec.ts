import { KoreanTourInfoService } from './korean-tour-info.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';

describe('KoreanTourInfoService', () => {
  let service: KoreanTourInfoService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new KoreanTourInfoService(mockHttpClient);
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

  describe('areaBasedList2', () => {
    it('KtoHttpClient.request를 올바른 service와 operation으로 호출해야 한다', async () => {
      const mockItems = [{ contentid: '1', title: '경복궁' }];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.areaBasedList2(
        { lDongRegnCd: '11' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'KorService2',
          operation: 'areaBasedList2',
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('searchKeyword2', () => {
    it('keyword 파라미터를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchKeyword2({ keyword: '경복궁' }, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'searchKeyword2',
          params: expect.objectContaining({ keyword: '경복궁' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });
  });

  describe('locationBasedList2', () => {
    it('mapX, mapY, radius 파라미터를 전달해야 한다', async () => {
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

  describe('detailCommon2', () => {
    it('contentId로 상세 공통 정보를 조회해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentid: '126508', title: '경복궁' }]),
      );

      await service.detailCommon2({ contentId: '126508' }, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'detailCommon2',
          params: expect.objectContaining({ contentId: '126508' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });
  });

  describe('searchFestival2', () => {
    it('eventStartDate 파라미터를 필수로 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.searchFestival2(
        { eventStartDate: '20260101' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'searchFestival2',
          params: expect.objectContaining({
            eventStartDate: '20260101',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('나머지 오퍼레이션', () => {
    const operations: [string, () => Promise<unknown>][] = [
      [
        'areaBasedSyncList2',
        () => service.areaBasedSyncList2({}, testCredentials),
      ],
      [
        'detailImage2',
        () => service.detailImage2({ contentId: '1' }, testCredentials),
      ],
      [
        'detailInfo2',
        () =>
          service.detailInfo2(
            { contentId: '1', contentTypeId: '12' },
            testCredentials,
          ),
      ],
      [
        'detailIntro2',
        () =>
          service.detailIntro2(
            { contentId: '1', contentTypeId: '12' },
            testCredentials,
          ),
      ],
      ['detailPetTour2', () => service.detailPetTour2({}, testCredentials)],
      ['ldongCode2', () => service.ldongCode2({}, testCredentials)],
      ['lclsSystmCode2', () => service.lclsSystmCode2({}, testCredentials)],
      ['searchStay2', () => service.searchStay2({}, testCredentials)],
    ];

    it.each(operations)(
      '%s 메서드가 올바른 operation으로 httpClient.request를 호출해야 한다',
      async (operationName, callMethod) => {
        mockRequest.mockResolvedValueOnce(mockListResponse([]));

        await callMethod();

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({ operation: operationName }),
        );
      },
    );
  });
});
