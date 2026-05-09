import 'reflect-metadata';
import { PhotoAwardService } from './photo-award.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { PhotoAwardItem } from './types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';

describe('PhotoAwardService', () => {
  let service: PhotoAwardService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new PhotoAwardService(mockHttpClient);
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

  it('모든 메서드가 service: PhokoAwrdService로 호출해야 한다 (SPEC-KTO-010 REQ-OPT-001)', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.phokoAwrdList({}, testCredentials);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'PhokoAwrdService' }),
    );
  });

  describe('phokoAwrdList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: PhotoAwardItem[] = [
        {
          contentId: 'DVvwaI',
          koTitle: '한국의 봄',
          enTitle: 'Spring of Korea',
          filmDay: '202303',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.phokoAwrdList(
        { numOfRows: 1 },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhokoAwrdService',
          operation: 'phokoAwrdList',
          params: expect.objectContaining({ numOfRows: 1 }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].contentId).toBe('DVvwaI');
    });

    it('koTitle과 enTitle이 동시에 노출되어야 한다 (dual-language 패턴)', async () => {
      const mockItems: PhotoAwardItem[] = [
        {
          contentId: 'AbCdEf',
          koTitle: '제주 해변',
          enTitle: 'Jeju Beach',
          koFilmst: '제주도',
          enFilmst: 'Jeju Island',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.phokoAwrdList({}, testCredentials);

      expect(result.items[0].koTitle).toBe('제주 해변');
      expect(result.items[0].enTitle).toBe('Jeju Beach');
    });

    it('빈 DTO로 호출 가능해야 한다 (모든 파라미터 선택)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await expect(
        service.phokoAwrdList({}, testCredentials),
      ).resolves.toBeDefined();
    });
  });

  describe('phokoAwrdSyncList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: PhotoAwardItem[] = [
        {
          contentId: 'XyZaBc',
          koTitle: '설악산',
          enTitle: 'Seoraksan',
          showflag: '1',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.phokoAwrdSyncList(
        { showflag: '1' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'PhokoAwrdService',
          operation: 'phokoAwrdSyncList',
          params: expect.objectContaining({ showflag: '1' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items[0].showflag).toBe('1');
    });

    it('showflag 필드가 응답에 포함되어야 한다 (sync 응답 전용)', async () => {
      const mockItems: PhotoAwardItem[] = [
        { contentId: 'AbCdE1', showflag: '1' },
        { contentId: 'AbCdE2', showflag: '0' },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.phokoAwrdSyncList({}, testCredentials);

      expect(result.items[0].showflag).toBeDefined();
      expect(result.items[1].showflag).toBeDefined();
    });

    it('syncModTime 파라미터가 KTO에 그대로 전달되어야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.phokoAwrdSyncList(
        { syncModTime: '20250101000000' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            syncModTime: '20250101000000',
          }) as Record<string, unknown>,
        }),
      );
    });
  });
});
