/**
 * Locations API - gọi BE /api/locations (provinces, districts, wards từ GHN).
 * Dùng cho address picker và tính phí ship theo địa chỉ thực.
 */
import { config } from './config';

export type LocationProvince = {
  provinceId: number;
  provinceName: string;
  code?: string | null;
};

export type LocationDistrict = {
  districtId: number;
  provinceId: number;
  districtName: string;
  code?: string | null;
};

export type LocationWard = {
  wardCode: string;
  districtId: number;
  wardName: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T | null;
};

const base = config.apiBaseUrl;

async function get<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${base}${path}`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) {
    throw new Error(data.message ?? `HTTP ${res.status}`);
  }
  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Không thể tải dữ liệu địa chỉ');
  }
  return data.data;
}

export const locationsApi = {
  getProvinces: (): Promise<LocationProvince[]> =>
    get<LocationProvince[]>('/api/locations/provinces'),

  getDistricts: (provinceId: number): Promise<LocationDistrict[]> =>
    get<LocationDistrict[]>(`/api/locations/districts?provinceId=${provinceId}`),

  getWards: (districtId: number): Promise<LocationWard[]> =>
    get<LocationWard[]>(`/api/locations/wards?districtId=${districtId}`),
};
