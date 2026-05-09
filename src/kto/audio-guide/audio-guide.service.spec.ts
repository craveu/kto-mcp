import 'reflect-metadata';
import { AudioGuideService } from './audio-guide.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { OdiiStoryItem, OdiiThemeItem } from './types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';

describe('AudioGuideService', () => {
  let service: AudioGuideService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new AudioGuideService(mockHttpClient);
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

  it('모든 메서드가 service: Odii로 호출해야 한다', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.storyBasedList({ langCode: 'ko' }, testCredentials);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'Odii' }),
    );
  });

  // ─── Story 계열 ─────────────────────────────────────────────────────────────

  describe('storyBasedList', () => {
    it('올바른 operation으로 KtoHttpClient.request를 호출해야 한다', async () => {
      const mockItems: OdiiStoryItem[] = [
        {
          tid: '100',
          title: '백제문화단지 - 입구',
          audioUrl: 'https://sfj608538.ktcdn.co.kr/file/audio/1.mp3',
          langCode: 'ko',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.storyBasedList(
        {
          langCode: 'ko',
          numOfRows: 1,
        },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'storyBasedList',
          params: expect.objectContaining({
            langCode: 'ko',
            numOfRows: 1,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].audioUrl).toBe(
        'https://sfj608538.ktcdn.co.kr/file/audio/1.mp3',
      );
    });

    it('langCode=ja도 outbound 호출을 실행해야 한다 (enum 미강제)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse<OdiiStoryItem>([]));

      const result = await service.storyBasedList(
        { langCode: 'ja' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'storyBasedList',
          params: expect.objectContaining({ langCode: 'ja' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(0);
    });
  });

  describe('storyBasedSyncList', () => {
    it('syncStatus를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.storyBasedSyncList(
        { langCode: 'ko', syncStatus: 'U' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'storyBasedSyncList',
          params: expect.objectContaining({
            langCode: 'ko',
            syncStatus: 'U',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('storyLocationBasedList', () => {
    it('mapX/mapY/radius와 langCode를 올바르게 전달해야 한다', async () => {
      const mockItems: OdiiStoryItem[] = [
        { tid: '200', title: '경복궁 - 대문', langCode: 'ko' },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.storyLocationBasedList(
        {
          langCode: 'ko',
          mapX: 126.978,
          mapY: 37.5665,
          radius: 5000,
        },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'storyLocationBasedList',
          params: expect.objectContaining({
            langCode: 'ko',
            mapX: 126.978,
            mapY: 37.5665,
            radius: 5000,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items[0].title).toBe('경복궁 - 대문');
    });
  });

  describe('storySearchList', () => {
    it('keyword와 langCode를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.storySearchList(
        { langCode: 'ko', keyword: '경복궁' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'storySearchList',
          params: expect.objectContaining({
            langCode: 'ko',
            keyword: '경복궁',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  // ─── Theme 계열 ─────────────────────────────────────────────────────────────

  describe('themeBasedList', () => {
    it('올바른 operation으로 KtoHttpClient.request를 호출해야 한다', async () => {
      const mockItems: OdiiThemeItem[] = [
        {
          tid: '300',
          title: '백제역사유적지구',
          themeCategory: '백제역사여행',
          langCode: 'ko',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.themeBasedList(
        { langCode: 'ko' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'themeBasedList',
          params: expect.objectContaining({ langCode: 'ko' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items[0].themeCategory).toBe('백제역사여행');
    });

    it('langCode=en은 totalCount=0 정상 응답이어야 한다 (KTO 미정비 정책)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse<OdiiThemeItem>([]));

      const result = await service.themeBasedList(
        { langCode: 'en' },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'themeBasedList',
          params: expect.objectContaining({ langCode: 'en' }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('themeBasedSyncList', () => {
    it('syncStatus 없이도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.themeBasedSyncList({ langCode: 'ko' }, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'themeBasedSyncList',
        }),
      );
    });
  });

  describe('themeLocationBasedList', () => {
    it('mapX/mapY/radius와 langCode를 올바르게 전달해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.themeLocationBasedList(
        {
          langCode: 'ko',
          mapX: 126.978,
          mapY: 37.5665,
          radius: 10000,
        },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'themeLocationBasedList',
          params: expect.objectContaining({
            langCode: 'ko',
            mapX: 126.978,
            radius: 10000,
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('themeSearchList', () => {
    it('keyword와 langCode를 올바르게 전달해야 한다', async () => {
      const mockItems: OdiiThemeItem[] = [
        { tid: '400', title: '서울 관광', langCode: 'ko' },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.themeSearchList(
        {
          langCode: 'ko',
          keyword: '서울',
        },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Odii',
          operation: 'themeSearchList',
          params: expect.objectContaining({
            langCode: 'ko',
            keyword: '서울',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items[0].title).toBe('서울 관광');
    });
  });
});
