import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from './productsApi';

const CACHE_KEY = '@nongxanh:products_cache';

export async function loadCachedProducts(): Promise<Product[]> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEY);
    if (json) {
      const parsed = JSON.parse(json) as Product[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveProductsToCache(products: Product[]): Promise<void> {
  try {
    if (Array.isArray(products) && products.length > 0) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(products));
    }
  } catch {
    // ignore
  }
}
