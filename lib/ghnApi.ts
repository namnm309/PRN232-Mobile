import { addressData } from './addressData';

export type GhnProvince = {
  provinceID: number;
  provinceName: string;
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

/** Dùng dữ liệu địa chỉ hardcoded (API GHN đang không khả dụng) */
export const ghnApi = {
  getProvinces: (): Promise<GhnProvince[]> =>
    Promise.resolve(addressData.getProvinces()),
  getDistricts: (provinceId: number): Promise<GhnDistrict[]> =>
    Promise.resolve(addressData.getDistricts(provinceId)),
  getWards: (districtId: number): Promise<GhnWard[]> =>
    Promise.resolve(addressData.getWards(districtId)),
};
