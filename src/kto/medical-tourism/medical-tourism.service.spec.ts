import 'reflect-metadata';
import { MedicalTourismService } from './medical-tourism.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { MdclTursmItem } from './types';

describe('MedicalTourismService', () => {
  let service: MedicalTourismService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new MedicalTourismService(mockHttpClient);
  });

  const mockListResponse = <T>(items: T[]): KtoListResponse<T> => ({
    items,
    numOfRows: 10,
    pageNo: 1,
    totalCount: items.length,
  });

  it('모든 메서드가 service: MdclTursmService로 호출해야 한다 (SPEC-KTO-008 REQ-OPT-001)', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.areaBasedList({ langDivCd: 'KOR' });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'MdclTursmService' }),
    );
  });

  describe('areaBasedList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: MdclTursmItem[] = [
        {
          contentId: '3010001',
          title: 'Seoul Aesthetic Clinic',
          baseAddr: '서울특별시 강남구',
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
          service: 'MdclTursmService',
          operation: 'areaBasedList',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            numOfRows: 1,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Seoul Aesthetic Clinic');
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

    it('MdclTursmItem camelCase 필드가 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: MdclTursmItem = {
        contentId: '3010001',
        title: 'Plastic Surgery Center',
        baseAddr: '서울특별시 강남구',
        mapX: '127.0495',
        mapY: '37.5172',
        regDt: '20230101',
        mdfcnDt: '20231201',
        langDivCd: 'KOR',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.areaBasedList({ langDivCd: 'KOR' });
      const item = result.items[0];

      expect(item.contentId).toBe('3010001');
      expect(item.mapX).toBe('127.0495');
      expect(item.mapY).toBe('37.5172');
      expect(item.regDt).toBe('20230101');
      expect(item.mdfcnDt).toBe('20231201');
    });
  });

  describe('locationBasedList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: MdclTursmItem[] = [
        {
          contentId: '3010002',
          title: 'Gangnam Dental Clinic',
          mapX: '127.0495',
          mapY: '37.5172',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.locationBasedList({
        langDivCd: 'KOR',
        mapX: 127.0495,
        mapY: 37.5172,
        radius: 5000,
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'locationBasedList',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            mapX: 127.0495,
            mapY: 37.5172,
            radius: 5000,
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('searchKeyword', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: MdclTursmItem[] = [
        {
          contentId: '3010003',
          title: 'Rhinoplasty Center Korea',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.searchKeyword({
        langDivCd: 'ENG',
        keyword: 'Rhinoplasty',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'searchKeyword',
          params: expect.objectContaining({
            langDivCd: 'ENG',
            keyword: 'Rhinoplasty',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('mdclTursmSyncList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: MdclTursmItem[] = [
        {
          contentId: '3010004',
          title: 'Deleted Clinic',
          showflag: '0',
          oldContentId: '2010001',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.mdclTursmSyncList({
        langDivCd: 'KOR',
        numOfRows: 1,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'mdclTursmSyncList',
        }),
      );
      expect(result.items[0].showflag).toBe('0');
      expect(result.items[0].oldContentId).toBe('2010001');
    });

    it('showflag/oldContentId 필드가 인덱스 시그니처로 흡수되어야 한다', async () => {
      const mockItem: MdclTursmItem = {
        contentId: '3010005',
        showflag: '1',
        oldContentId: '2010002',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.mdclTursmSyncList({ langDivCd: 'KOR' });
      expect(result.items[0].showflag).toBe('1');
    });
  });

  describe('detailMdclTursm', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: MdclTursmItem[] = [
        {
          contentId: '3010001',
          title: 'Medical Center',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.detailMdclTursm({
        langDivCd: 'KOR',
        contentId: '3010001',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'detailMdclTursm',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '3010001',
          }) as Record<string, unknown>,
        }),
      );
      expect(result.items[0].contentId).toBe('3010001');
    });
  });

  describe('detailCommon', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentId: '3010001' }]),
      );

      await service.detailCommon({ langDivCd: 'KOR', contentId: '3010001' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'detailCommon',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '3010001',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('detailIntro', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(
        mockListResponse([{ contentId: '3010001' }]),
      );

      await service.detailIntro({ langDivCd: 'KOR', contentId: '3010001' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'MdclTursmService',
          operation: 'detailIntro',
          params: expect.objectContaining({
            langDivCd: 'KOR',
            contentId: '3010001',
          }) as Record<string, unknown>,
        }),
      );
    });
  });
});
