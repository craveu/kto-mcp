import 'reflect-metadata';
import { DurunubiService } from './durunubi.service';
import { KtoHttpClient } from '../kto-http.client';
import type { KtoListResponse } from '../common/types';
import type { DurunubiCourseItem, DurunubiRouteItem } from './types';
import type { KtoCredentials } from '../../mcp/session-credentials.store';

describe('DurunubiService', () => {
  let service: DurunubiService;
  let mockRequest: jest.MockedFunction<KtoHttpClient['request']>;

  beforeEach(() => {
    mockRequest = jest.fn();
    const mockHttpClient = {
      request: mockRequest,
    } as unknown as KtoHttpClient;

    service = new DurunubiService(mockHttpClient);
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

  it('모든 메서드가 service: Durunubi로 호출해야 한다', async () => {
    mockRequest.mockResolvedValue(mockListResponse([]));

    await service.courseList({}, testCredentials);

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'Durunubi' }),
    );
  });

  describe('courseList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: DurunubiCourseItem[] = [
        {
          crsIdx: '1',
          crsKorNm: '해파랑길 1코스',
          crsDstnc: '17.4',
          gpxpath: 'http://example.com/gpx/1.gpx',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.courseList(
        { numOfRows: 1 },
        testCredentials,
      );

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Durunubi',
          operation: 'courseList',
          params: expect.objectContaining({ numOfRows: 1 }) as Record<
            string,
            unknown
          >,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].crsKorNm).toBe('해파랑길 1코스');
    });

    it('빈 파라미터로도 호출 가능해야 한다', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.courseList({}, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Durunubi',
          operation: 'courseList',
        }),
      );
    });

    it('gpxpath URL이 KTO 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const mockItem: DurunubiCourseItem = {
        crsIdx: '10',
        crsKorNm: '남파랑길 10코스',
        crsDstnc: '20.5',
        crsTotlRqrmHour: '480',
        crsLevel: '중',
        gpxpath: 'http://www.durunubi.kr/gpx/namparang_10.gpx',
        sigun: '순천시',
      };
      mockRequest.mockResolvedValueOnce(mockListResponse([mockItem]));

      const result = await service.courseList({}, testCredentials);
      const item = result.items[0];

      expect(item.crsKorNm).toBe('남파랑길 10코스');
      expect(item.gpxpath).toBe('http://www.durunubi.kr/gpx/namparang_10.gpx');
      expect(item.crsDstnc).toBe('20.5');
      expect(item.sigun).toBe('순천시');
    });
  });

  describe('routeList', () => {
    it('KtoHttpClient.request를 올바른 operation으로 호출해야 한다', async () => {
      const mockItems: DurunubiRouteItem[] = [
        {
          routeIdx: '1',
          themeNm: '해파랑길',
          linemsg: '동해안을 따라 걷는 길',
          themedescs: '<p>해파랑길 상세 설명</p>',
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.routeList({}, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Durunubi',
          operation: 'routeList',
          params: expect.objectContaining({}) as Record<string, unknown>,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].themeNm).toBe('해파랑길');
    });

    it('themedescs HTML이 KTO 원형 그대로 보존되어야 한다 (REQ-EVT-001)', async () => {
      const htmlContent =
        '<p>남파랑길은 부산에서 해남까지 이어지는 <br/>남해안 트래킹 코스입니다.</p>';
      const mockItems: DurunubiRouteItem[] = [
        {
          routeIdx: '2',
          themeNm: '남파랑길',
          linemsg: '남해안을 따라 걷는 길',
          themedescs: htmlContent,
        },
      ];
      mockRequest.mockResolvedValueOnce(mockListResponse(mockItems));

      const result = await service.routeList({}, testCredentials);
      const item = result.items[0];

      expect(item.themedescs).toBe(htmlContent);
      expect(item.themeNm).toBe('남파랑길');
      expect(item.linemsg).toBe('남해안을 따라 걷는 길');
    });

    it('빈 파라미터로도 호출 가능해야 한다 (totalCount=3 페이지네이션 무효)', async () => {
      mockRequest.mockResolvedValueOnce(mockListResponse([]));

      await service.routeList({}, testCredentials);

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          service: 'Durunubi',
          operation: 'routeList',
        }),
      );
    });
  });
});
