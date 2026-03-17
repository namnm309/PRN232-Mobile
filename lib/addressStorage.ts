import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_PREFIX = '@nongxanh:addresses:';

export type ShippingAddress = {
  id: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault?: boolean;
  /** GHN IDs cho tính phí ship - dùng khi checkout */
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  /** Chi tiết địa chỉ (số nhà, đường...) - dùng khi có dropdown Tỉnh/Quận/Xã */
  detailAddress?: string;
};

async function getKey(userId: string): Promise<string> {
  return `${ADDRESS_PREFIX}${userId}`;
}

export async function getAddresses(userId: string): Promise<ShippingAddress[]> {
  try {
    const key = await getKey(userId);
    const json = await AsyncStorage.getItem(key);
    if (json) {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function getDefaultAddress(userId: string): Promise<ShippingAddress | null> {
  const list = await getAddresses(userId);
  return list.find((a) => a.isDefault) ?? list[0] ?? null;
}

export async function saveAddresses(
  userId: string,
  addresses: ShippingAddress[]
): Promise<void> {
  const key = await getKey(userId);
  await AsyncStorage.setItem(key, JSON.stringify(addresses));
}

export async function addAddress(
  userId: string,
  address: Omit<ShippingAddress, 'id'>
): Promise<ShippingAddress> {
  const list = await getAddresses(userId);
  const newAddr: ShippingAddress = {
    ...address,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
  };
  if (address.isDefault) {
    list.forEach((a) => (a.isDefault = false));
  }
  list.push(newAddr);
  await saveAddresses(userId, list);
  return newAddr;
}

export async function updateAddress(
  userId: string,
  id: string,
  updates: Partial<Omit<ShippingAddress, 'id'>>
): Promise<void> {
  const list = await getAddresses(userId);
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  if (updates.isDefault) {
    list.forEach((a) => (a.isDefault = false));
  }
  list[idx] = { ...list[idx], ...updates };
  await saveAddresses(userId, list);
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const list = (await getAddresses(userId)).filter((a) => a.id !== id);
  await saveAddresses(userId, list);
}
