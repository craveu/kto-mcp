import 'reflect-metadata';
import { PHOTO_GALLERY_TOOLS } from './photo-gallery.tools';
import { PgGalleryListDto } from './dto/gallery-list.dto';
import { PgGalleryDetailListDto } from './dto/gallery-detail-list.dto';
import { PgGallerySearchListDto } from './dto/gallery-search-list.dto';
import { PgGallerySyncDetailListDto } from './dto/gallery-sync-detail-list.dto';

describe('PHOTO_GALLERY_TOOLS', () => {
  it('4개 도구가 정의되어야 한다', () => {
    expect(PHOTO_GALLERY_TOOLS).toHaveLength(4);
  });

  it('모든 도구가 kto_photo_ prefix를 가져야 한다 (REQ-KTO3-001)', () => {
    for (const tool of PHOTO_GALLERY_TOOLS) {
      expect(tool.name).toMatch(/^kto_photo_/);
    }
  });

  it('모든 도구 이름이 1 접미사 패턴을 따라야 한다', () => {
    for (const tool of PHOTO_GALLERY_TOOLS) {
      expect(tool.name).toMatch(/1$/);
    }
  });

  describe('kto_photo_galleryList1', () => {
    const tool = PHOTO_GALLERY_TOOLS.find(
      (t) => t.name === 'kto_photo_galleryList1',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PgGalleryListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PgGalleryListDto);
    });

    it('methodName이 galleryList1이여야 한다', () => {
      expect(tool?.methodName).toBe('galleryList1');
    });

    it('inputSchema에 선택적 필드들이 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props).toBeDefined();
      expect(props['numOfRows']).toBeDefined();
      expect(props['pageNo']).toBeDefined();
    });

    it('required 배열이 없거나 비어 있어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });
  });

  describe('kto_photo_galleryDetailList1', () => {
    const tool = PHOTO_GALLERY_TOOLS.find(
      (t) => t.name === 'kto_photo_galleryDetailList1',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PgGalleryDetailListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PgGalleryDetailListDto);
    });

    it('methodName이 galleryDetailList1이여야 한다', () => {
      expect(tool?.methodName).toBe('galleryDetailList1');
    });

    it('title이 required 배열에 포함되어야 한다 (REQ-UNW-001)', () => {
      expect(tool?.inputSchema.required).toContain('title');
    });

    it('inputSchema에 title 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['title']).toBeDefined();
    });

    it('inputSchema에 선택적 페이지네이션 필드들이 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });
  });

  describe('kto_photo_gallerySearchList1', () => {
    const tool = PHOTO_GALLERY_TOOLS.find(
      (t) => t.name === 'kto_photo_gallerySearchList1',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PgGallerySearchListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PgGallerySearchListDto);
    });

    it('methodName이 gallerySearchList1이여야 한다', () => {
      expect(tool?.methodName).toBe('gallerySearchList1');
    });

    it('keyword가 required 배열에 포함되어야 한다', () => {
      expect(tool?.inputSchema.required).toContain('keyword');
    });

    it('inputSchema에 keyword 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['keyword']).toBeDefined();
    });

    it('inputSchema에 선택적 페이지네이션 필드들이 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['numOfRows']).toBeDefined();
      expect(props?.['pageNo']).toBeDefined();
    });
  });

  describe('kto_photo_gallerySyncDetailList1', () => {
    const tool = PHOTO_GALLERY_TOOLS.find(
      (t) => t.name === 'kto_photo_gallerySyncDetailList1',
    );

    it('도구가 존재해야 한다', () => {
      expect(tool).toBeDefined();
    });

    it('dtoClass가 PgGallerySyncDetailListDto여야 한다', () => {
      expect(tool?.dtoClass).toBe(PgGallerySyncDetailListDto);
    });

    it('methodName이 gallerySyncDetailList1이여야 한다', () => {
      expect(tool?.methodName).toBe('gallerySyncDetailList1');
    });

    it('required 배열이 없거나 비어 있어야 한다 (모든 필드 선택)', () => {
      expect(tool?.inputSchema.required).toBeUndefined();
    });

    it('inputSchema에 syncModTime 프로퍼티가 정의되어야 한다', () => {
      const props = tool?.inputSchema.properties as Record<string, unknown>;
      expect(props?.['syncModTime']).toBeDefined();
    });
  });
});
