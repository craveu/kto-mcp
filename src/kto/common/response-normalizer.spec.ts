import { normalizeItems } from './response-normalizer';
import type { KtoRawResponse } from './types';

interface SampleItem {
  contentid: string;
  title: string;
}

describe('normalizeItems', () => {
  it('배열 items.item이면 그대로 배열로 반환해야 한다', () => {
    const raw: KtoRawResponse<SampleItem> = {
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
    };

    const result = normalizeItems(raw);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.contentid).toBe('1');
    expect(result.items[1]?.contentid).toBe('2');
    expect(result.totalCount).toBe(2);
  });

  it('단일 객체 items.item이면 1-element 배열로 변환해야 한다', () => {
    const raw: KtoRawResponse<SampleItem> = {
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: {
          items: { item: { contentid: '1', title: '경복궁' } },
          numOfRows: 10,
          pageNo: 1,
          totalCount: 1,
        },
      },
    };

    const result = normalizeItems(raw);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.contentid).toBe('1');
  });

  it('items가 빈 문자열("")이면 빈 배열을 반환해야 한다', () => {
    const raw: KtoRawResponse<SampleItem> = {
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: {
          items: '',
          numOfRows: 10,
          pageNo: 1,
          totalCount: 0,
        },
      },
    };

    const result = normalizeItems(raw);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it('items가 undefined이면 빈 배열을 반환해야 한다', () => {
    const raw: KtoRawResponse<SampleItem> = {
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: {
          items: undefined,
          numOfRows: 10,
          pageNo: 1,
          totalCount: 0,
        },
      },
    };

    const result = normalizeItems(raw);

    expect(result.items).toEqual([]);
  });

  it('numOfRows, pageNo, totalCount를 올바르게 반환해야 한다', () => {
    const raw: KtoRawResponse<SampleItem> = {
      response: {
        header: { resultCode: '0000', resultMsg: 'OK' },
        body: {
          items: { item: [{ contentid: '1', title: 'test' }] },
          numOfRows: 20,
          pageNo: 3,
          totalCount: 100,
        },
      },
    };

    const result = normalizeItems(raw);

    expect(result.numOfRows).toBe(20);
    expect(result.pageNo).toBe(3);
    expect(result.totalCount).toBe(100);
  });
});
