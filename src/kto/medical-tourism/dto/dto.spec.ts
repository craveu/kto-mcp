import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MtAreaBasedListDto } from './area-based-list.dto';
import { MtLocationBasedListDto } from './location-based-list.dto';
import { MtSearchKeywordDto } from './search-keyword.dto';
import { MtMdclTursmSyncListDto } from './mdcl-tursm-sync-list.dto';
import { MtDetailMdclTursmDto } from './detail-mdcl-tursm.dto';
import { MtDetailCommonDto } from './detail-common.dto';
import { MtDetailIntroDto } from './detail-intro.dto';

describe('의료관광 DTO 검증 (SPEC-KTO-008 REQ-UNW-001)', () => {
  // DTO별 langDivCd 공통 검증
  const dtoClasses = [
    { cls: MtAreaBasedListDto, name: 'MtAreaBasedListDto', extra: {} },
    {
      cls: MtLocationBasedListDto,
      name: 'MtLocationBasedListDto',
      extra: { mapX: 126.9779, mapY: 37.5664, radius: 1000 },
    },
    {
      cls: MtSearchKeywordDto,
      name: 'MtSearchKeywordDto',
      extra: { keyword: 'Rhinoplasty' },
    },
    { cls: MtMdclTursmSyncListDto, name: 'MtMdclTursmSyncListDto', extra: {} },
    {
      cls: MtDetailMdclTursmDto,
      name: 'MtDetailMdclTursmDto',
      extra: { contentId: '1234' },
    },
    {
      cls: MtDetailCommonDto,
      name: 'MtDetailCommonDto',
      extra: { contentId: '1234' },
    },
    {
      cls: MtDetailIntroDto,
      name: 'MtDetailIntroDto',
      extra: { contentId: '1234' },
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

  describe('MtAreaBasedListDto', () => {
    it("langDivCd='KOR' 만으로 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtAreaBasedListDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0 시 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(MtAreaBasedListDto, {
        langDivCd: 'KOR',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows=101 시 검증 실패해야 한다 (Max(100))', async () => {
      const dto = plainToInstance(MtAreaBasedListDto, {
        langDivCd: 'KOR',
        numOfRows: 101,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('numOfRows="abc" 시 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtAreaBasedListDto, {
        langDivCd: 'KOR',
        numOfRows: 'abc',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('numOfRows');
    });

    it('pageNo=0 시 검증 실패해야 한다 (Min(1))', async () => {
      const dto = plainToInstance(MtAreaBasedListDto, {
        langDivCd: 'KOR',
        pageNo: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('pageNo');
    });
  });

  describe('MtLocationBasedListDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (mapX/mapY/radius 필수)", async () => {
      const dto = plainToInstance(MtLocationBasedListDto, {
        langDivCd: 'KOR',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('mapX만 전달하면 검증 실패해야 한다 (mapY/radius missing)', async () => {
      const dto = plainToInstance(MtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('langDivCd/mapX/mapY/radius 모두 전달하면 검증 통과해야 한다', async () => {
      const dto = plainToInstance(MtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 20000,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('mapX가 문자열이면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 'abc',
        mapY: 37.5664,
        radius: 20000,
      });
      const errors = await validate(dto);
      const mapXError = errors.find((e) => e.property === 'mapX');
      expect(mapXError).toBeDefined();
    });

    it('radius가 20000 초과면 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtLocationBasedListDto, {
        langDivCd: 'KOR',
        mapX: 126.9779,
        mapY: 37.5664,
        radius: 25000,
      });
      const errors = await validate(dto);
      const radiusError = errors.find((e) => e.property === 'radius');
      expect(radiusError).toBeDefined();
    });
  });

  describe('MtSearchKeywordDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (keyword 필수)", async () => {
      const dto = plainToInstance(MtSearchKeywordDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('빈 keyword는 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtSearchKeywordDto, {
        langDivCd: 'KOR',
        keyword: '',
      });
      const errors = await validate(dto);
      const kwError = errors.find((e) => e.property === 'keyword');
      expect(kwError).toBeDefined();
    });

    it("langDivCd='KOR', keyword='Rhinoplasty' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtSearchKeywordDto, {
        langDivCd: 'KOR',
        keyword: 'Rhinoplasty',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('MtMdclTursmSyncListDto', () => {
    it("langDivCd='KOR' 만으로 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtMdclTursmSyncListDto, {
        langDivCd: 'KOR',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('numOfRows=0 시 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtMdclTursmSyncListDto, {
        langDivCd: 'KOR',
        numOfRows: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('pageNo=0 시 검증 실패해야 한다', async () => {
      const dto = plainToInstance(MtMdclTursmSyncListDto, {
        langDivCd: 'KOR',
        pageNo: 0,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('MtDetailMdclTursmDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (contentId 필수)", async () => {
      const dto = plainToInstance(MtDetailMdclTursmDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("contentId='' 빈값 시 검증 실패해야 한다", async () => {
      const dto = plainToInstance(MtDetailMdclTursmDto, {
        langDivCd: 'KOR',
        contentId: '',
      });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("langDivCd='KOR', contentId='1234' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtDetailMdclTursmDto, {
        langDivCd: 'KOR',
        contentId: '1234',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('MtDetailCommonDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (contentId 필수)", async () => {
      const dto = plainToInstance(MtDetailCommonDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("contentId='' 빈값 시 검증 실패해야 한다", async () => {
      const dto = plainToInstance(MtDetailCommonDto, {
        langDivCd: 'KOR',
        contentId: '',
      });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("langDivCd='KOR', contentId='1234' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtDetailCommonDto, {
        langDivCd: 'KOR',
        contentId: '1234',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('MtDetailIntroDto', () => {
    it("langDivCd='KOR' 만으로 검증 실패해야 한다 (contentId 필수)", async () => {
      const dto = plainToInstance(MtDetailIntroDto, { langDivCd: 'KOR' });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("contentId='' 빈값 시 검증 실패해야 한다", async () => {
      const dto = plainToInstance(MtDetailIntroDto, {
        langDivCd: 'KOR',
        contentId: '',
      });
      const errors = await validate(dto);
      const cidError = errors.find((e) => e.property === 'contentId');
      expect(cidError).toBeDefined();
    });

    it("langDivCd='KOR', contentId='1234' 는 검증 통과해야 한다", async () => {
      const dto = plainToInstance(MtDetailIntroDto, {
        langDivCd: 'KOR',
        contentId: '1234',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
