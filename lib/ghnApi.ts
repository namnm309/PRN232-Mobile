import { locationsApi } from './locationsApi';

export type GhnProvince = {
  provinceID: number;
  provinceName: string;
  code?: string | null;
};

export type GhnDistrict = {
  districtID: number;
  provinceID: number;
  districtName: string;
};

export type GhnWard = {
  wardCode: string;
  districtID: number;
  wardName: string;
};

/** Gọi BE /api/locations (dữ liệu GHN) - dùng cho address picker và tính phí ship */
export const ghnApi = {
  getProvinces: async (): Promise<GhnProvince[]> => {
    const list = await locationsApi.getProvinces();
    return list.map((p) => ({
      provinceID: p.provinceId,
      provinceName: p.provinceName,
      code: p.code,
    }));
  },
  getDistricts: async (provinceId: number): Promise<GhnDistrict[]> => {
    const list = await locationsApi.getDistricts(provinceId);
    return list.map((d) => ({
      districtID: d.districtId,
      provinceID: d.provinceId,
      districtName: d.districtName,
    }));
  },
  getWards: async (districtId: number): Promise<GhnWard[]> => {
    const list = await locationsApi.getWards(districtId);
    return list.map((w) => ({
      wardCode: w.wardCode,
      districtID: w.districtId,
      wardName: w.wardName,
    }));
  },
};
