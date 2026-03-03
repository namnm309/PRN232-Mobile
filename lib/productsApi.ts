import { config } from './config';
import { authenticatedRequest } from './api';

// Types matching backend entities (camelCase for JSON serialization)
export type ProductImage = {
  imageId: string; // Changed from number to string (GUID)
  imageUrl: string | null;
  isPrimary: boolean;
  productId: string; // Changed from number to string (GUID)
  createdAt: string;
};

export type Product = {
  productId: string; // Changed from number to string (GUID)
  productName: string;
  description: string | null;
  origin: string | null;
  unit: string | null;
  basePrice: number;
  isOrganic: boolean;
  status: string | null;
  createdAt: string;
  updatedAt: string | null;
  categoryId: string | null; // Changed from number to string (GUID)
  categoryName?: string | null; // API trả về categoryName ở root
  category?: Category | null; // Optional category object
  providerId: string | null; // Changed from number to string (GUID)
  provider?: Provider | null; // Optional provider object
  isDeleted: boolean;
  productImages: ProductImage[];
};

export type Category = {
  categoryId: string;
  categoryName: string;
  description: string | null;
};

export type Provider = {
  providerId: string;
  providerName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  ratingAverage: number | null;
  status: string | null;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
};

// API functions
export async function getProducts(
  token?: string,
  pageNumber: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PagedResult<Product>>> {
  const url = `${config.apiBaseUrl}/api/Products?pageNumber=${pageNumber}&pageSize=${pageSize}`;
  return authenticatedRequest<ApiResponse<PagedResult<Product>>>(url, {
    method: 'GET',
    token,
  });
}

export async function getProductById(
  productId: number,
  token?: string
): Promise<ApiResponse<Product>> {
  const url = `${config.apiBaseUrl}/api/Products/${productId}`;
  return authenticatedRequest<ApiResponse<Product>>(url, {
    method: 'GET',
    token,
  });
}

// Mappers for UI
export type ProductCardData = {
  id: string;
  name: string;
  price: string;
  image: { uri: string } | number; // URI object or require() for placeholder
  weight?: string;
  rating?: number;
  originalPrice?: string;
  discountBadge?: string;
  badge?: string;
};

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

/**
 * Format price to Vietnamese currency format
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + '₫';
}

/**
 * Get primary image URL from product images array
 */
export function getPrimaryImageUrl(productImages: ProductImage[]): string | null {
  if (!productImages || productImages.length === 0) {
    return null;
  }
  
  // Try to find primary image
  const primaryImage = productImages.find(img => img.isPrimary && img.imageUrl);
  if (primaryImage?.imageUrl) {
    return primaryImage.imageUrl;
  }
  
  // Fallback to first image with URL
  const firstImage = productImages.find(img => img.imageUrl);
  return firstImage?.imageUrl || null;
}

/**
 * Map backend Product to ProductCard props
 */
export function mapProductToCardData(product: Product, badge?: string): ProductCardData {
  const imageUrl = getPrimaryImageUrl(product.productImages);
  
  // Check if imageUrl is relative path and needs base URL
  let imageSource: { uri: string } | number = PLACEHOLDER_IMAGE;
  if (imageUrl) {
    const fullImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${config.apiBaseUrl}${imageUrl}`;
    imageSource = { uri: fullImageUrl };
  }
  
  return {
    id: product.productId.toString(), // Already a string, but keep toString() for safety
    name: product.productName,
    price: formatPrice(product.basePrice),
    image: imageSource,
    weight: product.unit || product.origin || undefined,
    badge,
    // Backend doesn't have discount/rating yet
    // originalPrice: undefined,
    // discountBadge: undefined,
    // rating: undefined,
  };
}

/**
 * Group products by their origin
 */
export function groupProductsByOrigin(products: Product[]): Map<string, Product[]> {
  const grouped = new Map<string, Product[]>();
  
  products.forEach(product => {
    if (product.origin && product.origin.trim() !== '') {
      const origin = product.origin.trim();
      if (!grouped.has(origin)) {
        grouped.set(origin, []);
      }
      grouped.get(origin)!.push(product);
    }
  });
  
  return grouped;
}

/**
 * Group products by their provider
 */
export function groupProductsByProvider(products: Product[]): Map<string, Product[]> {
  const grouped = new Map<string, Product[]>();
  
  products.forEach(product => {
    if (product.providerId && product.providerId.trim() !== '') {
      // Use provider name if available, otherwise use providerId
      const providerKey = product.provider?.providerName || product.providerId;
      if (!grouped.has(providerKey)) {
        grouped.set(providerKey, []);
      }
      grouped.get(providerKey)!.push(product);
    }
  });
  
  return grouped;
}

/**
 * Get unique origins from products
 */
export function getUniqueOrigins(products: Product[]): string[] {
  const origins = new Set<string>();
  products.forEach(product => {
    if (product.origin && product.origin.trim() !== '') {
      origins.add(product.origin.trim());
    }
  });
  return Array.from(origins).sort();
}

/**
 * Get unique provider names from products
 * Returns only provider names (filters out null/empty and GUIDs)
 */
export function getUniqueProviders(products: Product[]): string[] {
  const providers = new Set<string>();
  products.forEach(product => {
    // Only add if we have a valid provider name (not GUID, not null)
    const providerName = product.provider?.providerName;
    if (providerName && providerName.trim() !== '') {
      // Skip if it looks like a GUID (contains dashes and is 36 chars)
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerName);
      if (!isGuid) {
        providers.add(providerName.trim());
      }
    }
  });
  return Array.from(providers).sort();
}

/**
 * Filter products by origin
 */
export function filterProductsByOrigin(products: Product[], origin: string | null): Product[] {
  if (!origin) return products;
  return products.filter(p => p.origin?.trim() === origin);
}

/**
 * Filter products by provider name
 */
export function filterProductsByProvider(products: Product[], providerName: string | null): Product[] {
  if (!providerName) return products;
  return products.filter(p => {
    const name = p.provider?.providerName;
    return name?.trim() === providerName;
  });
}

/**
 * Select default origin with priority: user location > random
 * @param origins - List of available origins
 * @param userLocation - User's location/city (optional, e.g., "Tiền Giang")
 * @returns Selected origin or null
 */
export function selectDefaultOrigin(origins: string[], userLocation?: string | null): string | null {
  if (origins.length === 0) return null;
  
  // Priority 1: User's location (case-insensitive match)
  if (userLocation) {
    const matchedOrigin = origins.find(
      origin => origin.toLowerCase() === userLocation.toLowerCase()
    );
    if (matchedOrigin) {
      console.log('✅ Matched user location:', matchedOrigin);
      return matchedOrigin;
    }
  }
  
  // Priority 2: Random selection
  const randomIndex = Math.floor(Math.random() * origins.length);
  return origins[randomIndex];
}
