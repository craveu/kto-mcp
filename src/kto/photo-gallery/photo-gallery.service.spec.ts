import 'reflect-metadata';
import { PhotoGalleryService } from './photo-gallery.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { PhotoGalleryItem } from './types';

describe('PhotoGalleryService', () => {
  let service: PhotoGalleryService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new PhotoGalleryService(mockHttpClient);
  });

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: PhotoGalleryService1로 호출해야 한다', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.galleryList1({});

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'PhotoGalleryService1' }),
    );
  });

  describe('galleryList1', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: PhotoGalleryItem[] = [
        {
          galContentId: 'gal-001',
          galTitle: '제주 성산일출봉',
          galWebImageUrl: 'http://example.com/image.jpg',
          galPhotographyLocation: '제주 서귀포시',
          galPhotographer: '홍길동',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.galleryList1({
        numOfRows: 5,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'galleryList1',
          params: expect.objectContaining({
            numOfRows: 5,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.galContentId).toBe('gal-001');
      expect(item.galTitle).toBe('제주 성산일출봉');
      expect(item.galPhotographer).toBe('홍길동');
    });

    it('빈 파라미터로도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.galleryList1({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'galleryList1',
        }),
      );
    });

    it('gal* 필드가 KTO 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: PhotoGalleryItem = {
        galContentId: 'gal-123',
        galContentTypeId: '1',
        galTitle: '경복궁',
        galWebImageUrl: 'http://example.com/gyeongbok.jpg',
        galCreatedtime: '20240101120000',
        galModifiedtime: '20240102080000',
        galPhotographyLocation: '서울 종로구',
        galPhotographyMonth: '01',
        galPhotographer: '김사진',
        galSearchKeyword: '경복궁,서울,고궁',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.galleryList1({});
      const item = result.items[0];

      expect(item.galContentId).toBe('gal-123');
      expect(item.galContentTypeId).toBe('1');
      expect(item.galTitle).toBe('경복궁');
      expect(item.galWebImageUrl).toBe('http://example.com/gyeongbok.jpg');
      expect(item.galCreatedtime).toBe('20240101120000');
      expect(item.galPhotographyLocation).toBe('서울 종로구');
      expect(item.galPhotographyMonth).toBe('01');
      expect(item.galPhotographer).toBe('김사진');
      expect(item.galSearchKeyword).toBe('경복궁,서울,고궁');
    });
  });

  describe('galleryDetailList1', () => {
    it('title을 올바르게 전달해야 한다', async () => {
      const mockItem: PhotoGalleryItem = {
        galContentId: 'gal-detail-001',
        galTitle: '한라산 백록담',
        galPhotographyLocation: '제주 한라산',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.galleryDetailList1({
        title: '한라산',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'galleryDetailList1',
          params: expect.objectContaining({
            title: '한라산',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items[0].galContentId).toBe('gal-detail-001');
    });

    it('PhotoGalleryService1 고유 오퍼레이션으로 호출해야 한다 (REQ-EVT-001)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.galleryDetailList1({ title: '경복궁' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'galleryDetailList1',
        }),
      );
    });
  });

  describe('gallerySearchList1', () => {
    it('keyword를 올바르게 전달해야 한다', async () => {
      const mockItems: PhotoGalleryItem[] = [
        {
          galContentId: 'gal-search-001',
          galTitle: '경복궁 야경',
          galPhotographyLocation: '서울 종로구',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.gallerySearchList1({ keyword: '경복궁' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'gallerySearchList1',
          params: expect.objectContaining({
            keyword: '경복궁',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].galContentId).toBe('gal-search-001');
    });

    it('페이지네이션 파라미터를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.gallerySearchList1({
        keyword: '서울',
        numOfRows: 20,
        pageNo: 2,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'gallerySearchList1',
          params: expect.objectContaining({
            keyword: '서울',
            numOfRows: 20,
            pageNo: 2,
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('gallerySyncDetailList1', () => {
    it('동기화 파라미터 없이도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.gallerySyncDetailList1({});

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'gallerySyncDetailList1',
        }),
      );
    });

    it('syncModTime 및 showflag를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.gallerySyncDetailList1({
        syncModTime: '20240101000000',
        showflag: '1',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'gallerySyncDetailList1',
          params: expect.objectContaining({
            syncModTime: '20240101000000',
            showflag: '1',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('페이지네이션 파라미터를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.gallerySyncDetailList1({
        numOfRows: 100,
        pageNo: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhotoGalleryService1',
          operation: 'gallerySyncDetailList1',
          params: expect.objectContaining({
            numOfRows: 100,
            pageNo: 1,
          }) as Record<string, unknown>,
        }),
      );
    });
  });
});
