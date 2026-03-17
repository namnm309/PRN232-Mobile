/**
 * Dữ liệu địa chỉ Việt Nam (tỉnh, quận, xã) - hardcoded khi API GHN không khả dụng.
 * Nguồn: vietnamese-provinces-database (thanglequoc)
 */

import addressJson from '../data/addressData.json';

type Province = { provinceID: number; provinceName: string };
type District = { districtID: number; provinceID: number; districtName: string };
type Ward = { wardCode: string; districtID: number; wardName: string };

const data = addressJson as {
  provinces: Province[];
  districtsByProvince: Record<string, District[]>;
  wardsByDistrict: Record<string, Ward[]>;
};

export const addressData = {
  getProvinces: (): Province[] => data.provinces || [],
  getDistricts: (provinceId: number): District[] =>
    data.districtsByProvince?.[String(provinceId)] || [],
  getWards: (districtId: number): Ward[] =>
    data.wardsByDistrict?.[String(districtId)] || [],
};
