import 'reflect-metadata';
import { GoCampingService } from './go-camping.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { GoCampingItem, GoCampingImageItem } from './types';

describe('GoCampingService', () => {
  let service: GoCampingService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new GoCampingService(mockHttpClient);
  });

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: GoCamping으로 호출해야 한다', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.basedList({});

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'GoCamping' }),
    );
  });

  describe('basedList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: GoCampingItem[] = [
        {
          contentId: '100',
          facltNm: '가평 캠핑장',
          addr1: '경기도 가평군',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.basedList({ numOfRows: 5 });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'basedList',
          params: expect.objectContaining({ numOfRows: 5 }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].facltNm).toBe('가평 캠핑장');
    });

    it('빈 파라미터로도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.basedList({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'basedList',
        }),
      );
    });

    it('캠핑 필드가 KTO 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: GoCampingItem = {
        contentId: '200',
        facltNm: '제주 캠핑장',
        lineIntro: '제주 자연을 느끼는 캠핑',
        addr1: '제주특별자치도 서귀포시',
        mapX: '126.5',
        mapY: '33.4',
        induty: '일반야영장',
        firstImageUrl: 'http://example.com/img.jpg',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.basedList({});
      const item = result.items[0];

      expect(item.contentId).toBe('200');
      expect(item.facltNm).toBe('제주 캠핑장');
      expect(item.addr1).toBe('제주특별자치도 서귀포시');
      expect(item.mapX).toBe('126.5');
      expect(item.induty).toBe('일반야영장');
      expect(item.firstImageUrl).toBe('http://example.com/img.jpg');
    });
  });

  describe('basedSyncList', () => {
    it('syncStatus를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([{ contentId: '1' }]));

      await service.basedSyncList({
        syncStatus: 'U',
        syncModTime: '20240101000000',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'basedSyncList',
          params: expect.objectContaining({
            syncStatus: 'U',
            syncModTime: '20240101000000',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('파라미터 없이도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.basedSyncList({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'basedSyncList',
        }),
      );
    });
  });

  describe('locationBasedList', () => {
    it('mapX/mapY/radius를 올바르게 전달해야 한다 (REQ-EVT-001)', async () => {
      const mockItems: GoCampingItem[] = [
        { contentId: '300', facltNm: '근처 캠핑장' },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.locationBasedList({
        mapX: 126.978,
        mapY: 37.5665,
        radius: 5000,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'locationBasedList',
          params: expect.objectContaining({
            mapX: 126.978,
            mapY: 37.5665,
            radius: 5000,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items[0].facltNm).toBe('근처 캠핑장');
    });
  });

  describe('searchList', () => {
    it('keyword를 올바르게 전달해야 한다', async () => {
      const mockItems: GoCampingItem[] = [
        { contentId: '400', facltNm: '가평숲 캠핑장' },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.searchList({ keyword: '가평' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'searchList',
          params: expect.objectContaining({ keyword: '가평' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items[0].facltNm).toBe('가평숲 캠핑장');
    });
  });

  describe('imageList', () => {
    it('contentId를 올바르게 전달하고 GoCampingImageItem을 반환해야 한다 (REQ-KTO4-003)', async () => {
      const mockImages: GoCampingImageItem[] = [
        {
          contentId: '100',
          serialnum: '1',
          imageUrl: 'http://example.com/camp.jpg',
          createdtime: '20240101',
          modifiedtime: '20240101',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockImages));

      const result = await service.imageList({ contentId: '100' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'GoCamping',
          operation: 'imageList',
          params: expect.objectContaining({ contentId: '100' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items[0].imageUrl).toBe('http://example.com/camp.jpg');
      expect(result.items[0].serialnum).toBe('1');
    });
  });
});
