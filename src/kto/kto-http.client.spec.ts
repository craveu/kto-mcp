import nock from 'nock';
import { KtoHttpClient } from './kto-http.client';
import { KtoApiError } from './common/kto-error';

const TEST_SERVICE_KEY = 'test-service-key-1234';

describe('KtoHttpClient', () => {
  let client: KtoHttpClient;

  beforeEach(() => {
    // 테스트 속도를 위해 초기 지연 시간을 1ms로 단축
    client = new KtoHttpClient(TEST_SERVICE_KEY, false, 1);
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('정상 JSON 응답 처리', () => {
    it('목록 응답이면 normalizeItems를 거쳐 KtoListResponse를 반환해야 한다', async () => {
      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(200, {
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: {
                item: [
                  { contentid: '1', title: '경복궁' },
                  { contentid: '2', title: '남산타워' },
                ],
              },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 2,
            },
          },
        });

      const result = await client.request<Record<string, string>>({
        service: 'KorService2',
        operation: 'areaBasedList2',
        params: { areaCode: '1' },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('contentid', '1');
      expect(result.totalCount).toBe(2);
    });

    it('공통 파라미터(MobileOS, MobileApp, _type)가 자동으로 주입되어야 한다', async () => {
      let capturedQuery: Record<string, string> = {};

      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaCode2')
        .query((query) => {
          capturedQuery = query as Record<string, string>;
          return true;
        })
        .reply(200, {
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: { item: [{ code: '1', name: '서울' }] },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 1,
            },
          },
        });

      await client.request({ service: 'KorService2', operation: 'areaCode2' });

      expect(capturedQuery['MobileOS']).toBe('ETC');
      expect(capturedQuery['MobileApp']).toBe('kto-mcp');
      expect(capturedQuery['_type']).toBe('json');
      expect(capturedQuery['serviceKey']).toBe(TEST_SERVICE_KEY);
    });

    it('serviceName=EngService2이면 EngService2 base URL을 사용해야 한다', async () => {
      nock('http://apis.data.go.kr')
        .get('/B551011/EngService2/areaBasedList2')
        .query(true)
        .reply(200, {
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: '',
              numOfRows: 10,
              pageNo: 1,
              totalCount: 0,
            },
          },
        });

      const result = await client.request({
        service: 'EngService2',
        operation: 'areaBasedList2',
      });

      expect(result.items).toEqual([]);
    });
  });

  describe('재시도 정책', () => {
    it('503 이후 200 응답이면 재시도 후 정상 결과를 반환해야 한다', async () => {
      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(503, 'Service Unavailable')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(200, {
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: { item: [{ contentid: '1' }] },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 1,
            },
          },
        });

      const result = await client.request({
        service: 'KorService2',
        operation: 'areaBasedList2',
      });

      expect(result.items).toHaveLength(1);
    });

    it('503 응답이 4번 연속이면 KtoApiError(permanent=false)를 throw해야 한다', async () => {
      // maxRetries=3이므로 1회 원본 + 3회 재시도 = 4회 총
      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(503, 'Service Unavailable')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(503, 'Service Unavailable')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(503, 'Service Unavailable')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(503, 'Service Unavailable');

      let caught: KtoApiError | undefined;
      try {
        await client.request({
          service: 'KorService2',
          operation: 'areaBasedList2',
        });
      } catch (e) {
        caught = e as KtoApiError;
      }

      expect(caught).toBeInstanceOf(KtoApiError);
      expect(caught?.permanent).toBe(false);
    });
  });

  describe('게이트웨이 XML 에러 처리', () => {
    it('resultCode=30 XML 응답이면 permanent=true KtoApiError를 throw해야 한다', async () => {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>`;

      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(200, xmlBody, { 'Content-Type': 'text/xml' });

      let caught: KtoApiError | undefined;
      try {
        await client.request({
          service: 'KorService2',
          operation: 'areaBasedList2',
        });
      } catch (e) {
        caught = e as KtoApiError;
      }

      expect(caught).toBeInstanceOf(KtoApiError);
      expect(caught?.code).toBe('30');
      expect(caught?.permanent).toBe(true);
    });

    it('resultCode=22 (할당량 초과) XML 응답이면 permanent=true를 throw해야 한다', async () => {
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE ERROR</errMsg>
    <returnAuthMsg>LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR</returnAuthMsg>
    <returnReasonCode>22</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>`;

      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(200, xmlBody, { 'Content-Type': 'text/xml' });

      try {
        await client.request({
          service: 'KorService2',
          operation: 'areaBasedList2',
        });
        fail('에러가 throw되어야 한다');
      } catch (e) {
        const err = e as KtoApiError;
        expect(err).toBeInstanceOf(KtoApiError);
        expect(err.code).toBe('22');
        expect(err.permanent).toBe(true);
      }
    });

    it('빈 items("")가 있는 응답이면 빈 배열로 정규화되어야 한다', async () => {
      nock('http://apis.data.go.kr')
        .get('/B551011/KorService2/areaBasedList2')
        .query(true)
        .reply(200, {
          response: {
            header: { resultCode: '0000', resultMsg: 'OK' },
            body: {
              items: '',
              numOfRows: 10,
              pageNo: 1,
              totalCount: 0,
            },
          },
        });

      const result = await client.request({
        service: 'KorService2',
        operation: 'areaBasedList2',
      });

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
