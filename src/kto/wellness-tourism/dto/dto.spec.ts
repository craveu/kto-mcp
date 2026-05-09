import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WtAreaBasedListDto } from './area-based-list.dto';
import { WtLocationBasedListDto } from './location-based-list.dto';
import { WtSearchKeywordDto } from './search-keyword.dto';
import { WtWellnessTursmSyncListDto } from './wellness-tursm-sync-list.dto';
import { WtDetailCommonDto } from './detail-common.dto';
import { WtDetailIntroDto } from './detail-intro.dto';
import { WtDetailInfoDto } from './detail-info.dto';
import { WtDetailImageDto } from './detail-image.dto';

describe('웰니스관광 DTO 검증 (SPEC-KTO-009 REQ-UNW-001)', () => {
  // DTO별 langDivCd 공통 검증
  const dtoClasses = [
    { cls: WtAreaBasedListDto, name: 'WtAreaBasedListDto', extra: {} },
    {
      cls: WtLocationBasedListDto,
      name: 'WtLocationBasedListDto',
      extra: { mapX: 126.9779, mapY: 37.5664, radius: 1000 },
    },
    {
      cls: WtSearchKeywordDto,
      name: 'WtSearchKeywordDto',
      extra: { keyword: '온천' },
    },
    {
      cls: WtWellnessTursmSyncListDto,
      name: 'WtWellnessTursmSyncListDto',
      extra: {},
    },
    {
      cls: WtDetailCommonDto,
      name: 'WtDetailCommonDto',
      extra: { contentId: '2994116' },
    },
    {
      cls: WtDetailIntroDto,
      name: 'WtDetailIntroDto',
      extra: { contentId: '2994116', contentTypeId: '25' },
    },
    {
      cls: WtDetailInfoDto,
      name: 'WtDetailInfoDto',
      extra: { contentId: '2994116', contentTypeId: '25' },
    },
    {
      cls: WtDetailImageDto,
      name: 'WtDetailImageDto',
      extra: { contentId: '2994116' },
    },
  ] as const;

  for (const { cls, name, extra } of dtoClasses) {
    describe(`${name} — langDivCd 검증`, () => {
      it('langDivCd 누락 시 검증 실패해야 한다', async () => {
        const dto = plainToInstance(cls, { ...extra });
        const errors = await validate(dto);
        const langErr = errors.find((e) => e.property === 'langDivCd');
        expect(langErr).toBeDefined();
      });

      it("langDivCd='' 빈값 시 검증 실패해야 한다", async () => {
        const dto = plainToInstance(cls, { ...extra, langDivCd: '' });
        const errors = await validate(dto);
        const langErr = errors.find((e) => e.property === 'langDivCd');
        expect(langErr).toBeDefined();
      });

      it("langDivCd='KOR' 시 검증 통과해야 한다", async () => {
        const dto = plainToInstance(cls, { ...extra, langDivCd: 'KOR' });
        const errors = await validate(dto);
        const langErr = errors.find((e) => e.property === 'langDivCd');
        expect(langErr).toBeUndefined();
      });

      it("langDivCd='random_string' 시 검증 통과해야 한다 (enum 미강제)", async () => {
        const dto = plainToInstance(cls, {
          ...extra,
          langDivCd: 'random_string',
        });
        const errors = await validate(dto);
        const langErr = errors.find((e) => e.property === 'langDivCd');
        expect(langErr).toBeUndefined();
      });

      it('langDivCd=123(숫자) 시 검증 실패해야 한다 (string 아님)', async () => {
        const dto = plainToInstance(cls, { ...extra, langDivCd: 123 });
        const errors = await validate(dto);
        const langErr = errors.find((e) => e.property === 'langDivCd');
        expect(langErr).toBeDefined();
      });
    });
  }

  describe('WtAreaBasedListDto', () => {
    it("langDivCd='KOR' 만으로 검증 통과해야 한다", async () => {
      const dto = plainToInstance(WtAreaBasedListDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0 시 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(WtAreaBasedListDto, {
        langDivCd: 'KOR',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows=101 시 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(WtAreaBasedListDto, {
        langDivCd: 'KOR',
        numOfRows: 101,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo=0 시 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(WtAreaBasedListDto, {
        langDivCd: 'KOR',
        pageNo: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });

  describe('WtLocationBasedListDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (mapX/mapY/radius 필수)", async () => {
      const dto = plainToInstance(WtLocationBasedListDto, {
        langDivCd: 'KOR',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('mapX만 전달하면 검증 실패해야 한다 (mapY/radius missing)', async () => {
      const dto = plainToInstance(WtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('langDivCd/mapX/mapY/radius 모두 전달하면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(WtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 5000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('radius가 20000 초과면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(WtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 25000,
      });
      const errors = await validate(dto);
      const radiusError = errors.find((e) => e.property === 'radius');
      expect(radiusError).toBeDefined();
    });

    it('radius=0 이면 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(WtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 0,
      });
      const errors = await validate(dto);
      const radiusError = errors.find((e) => e.property === 'radius');
      expect(radiusError).toBeDefined();
    });
  });

  describe('WtSearchKeywordDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (keyword 필수)", async () => {
      const dto = plainToInstance(WtSearchKeywordDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('빈 keyword는 검증 실패해야 한다', async () => {
      const dto = plainToInstance(WtSearchKeywordDto, {
        langDivCd: 'KOR',
        keyword: '',
      });
      const errors = await validate(dto);
      const kwError = errors.find((e) => e.property === 'keyword');
      expect(kwError).toBeDefined();
    });

    it("langDivCd='KOR', keyword='온천' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(WtSearchKeywordDto, {
        langDivCd: 'KOR',
        keyword: '온천',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('WtWellnessTursmSyncListDto', () => {
    it("langDivCd='KOR' 만으로 검증 통과해야 한다", async () => {
      const dto = plainToInstance(WtWellnessTursmSyncListDto, {
        langDivCd: 'KOR',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0 시 검증 실패해야 한다', async () => {
      const dto = plainToInstance(WtWellnessTursmSyncListDto, {
        langDivCd: 'KOR',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('showflag는 선택 필드여야 한다', async () => {
      const dto = plainToInstance(WtWellnessTursmSyncListDto, {
        langDivCd: 'KOR',
        showflag: '1',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('WtDetailCommonDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (contentId 필수)", async () => {
      const dto = plainToInstance(WtDetailCommonDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("contentId='' 빈값 시 검증 실패해야 한다", async () => {
      const dto = plainToInstance(WtDetailCommonDto, {
        langDivCd: 'KOR',
        contentId: '',
      });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("langDivCd='KOR', contentId='2994116' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(WtDetailCommonDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('WtDetailIntroDto', () => {
    it('langDivCd/contentId 만으로 검증 실패해야 한다 (contentTypeId 필수)', async () => {
      const dto = plainToInstance(WtDetailIntroDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
      });
      const errors = await validate(dto);
      const ctError = errors.find((e) => e.property === 'contentTypeId');
      expect(ctError).toBeDefined();
    });

    it('langDivCd/contentId/contentTypeId 모두 제공 시 검증 통과', async () => {
      const dto = plainToInstance(WtDetailIntroDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
        contentTypeId: '25',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("contentTypeId='' 빈값 시 검증 실패해야 한다", async () => {
      const dto = plainToInstance(WtDetailIntroDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
        contentTypeId: '',
      });
      const errors = await validate(dto);
      const ctError = errors.find((e) => e.property === 'contentTypeId');
      expect(ctError).toBeDefined();
    });
  });

  describe('WtDetailInfoDto', () => {
    it('langDivCd/contentId 만으로 검증 실패해야 한다 (contentTypeId 필수)', async () => {
      const dto = plainToInstance(WtDetailInfoDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
      });
      const errors = await validate(dto);
      const ctError = errors.find((e) => e.property === 'contentTypeId');
      expect(ctError).toBeDefined();
    });

    it('langDivCd/contentId/contentTypeId 모두 제공 시 검증 통과', async () => {
      const dto = plainToInstance(WtDetailInfoDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
        contentTypeId: '25',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('WtDetailImageDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (contentId 필수)", async () => {
      const dto = plainToInstance(WtDetailImageDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("langDivCd='KOR', contentId='2994116' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(WtDetailImageDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('imageYN은 선택 필드여야 한다', async () => {
      const dto = plainToInstance(WtDetailImageDto, {
        langDivCd: 'KOR',
        contentId: '2994116',
        imageYN: 'Y',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
