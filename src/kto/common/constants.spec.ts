import { BASE_URL_MAP } from './constants';

describe('BASE_URL_MAP', () => {
  it('PhotoGalleryService1 URL이 등록되어 있어야 한다 (SPEC-KTO-003 REQ-OPT-001)', () => {
    expect(BASE_URL_MAP.PhotoGalleryService1).toBe(
      'http://apis.data.go.kr/B551011/PhotoGalleryService1',
    );
  });

  it('기존 KorService2 URL이 변경되지 않아야 한다 (REQ-UNW-002)', () => {
    expect(BASE_URL_MAP.KorService2).toBe(
      'http://apis.data.go.kr/B551011/KorService2',
    );
  });

  it('기존 KorWithService2 URL이 변경되지 않아야 한다 (REQ-UNW-002)', () => {
    expect(BASE_URL_MAP.KorWithService2).toBe(
      'http://apis.data.go.kr/B551011/KorWithService2',
    );
  });

  it('GoCamping URL이 등록되어 있어야 한다 (SPEC-KTO-004 REQ-OPT-001)', () => {
    expect(BASE_URL_MAP.GoCamping).toBe(
      'http://apis.data.go.kr/B551011/GoCamping',
    );
  });
});
