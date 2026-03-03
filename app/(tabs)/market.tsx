import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProductCard } from '@/components/ui/ProductCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getProducts,
  mapProductToCardData,
  getPrimaryImageUrl,
  type Product,
} from '@/lib/productsApi';
import { config } from '@/lib/config';

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

/** Lấy categoryName từ product (API trả về categoryName ở root hoặc trong category) */
function getProductCategoryName(p: { categoryName?: string | null; category?: { categoryName?: string | null } | null }): string | null {
  return p.categoryName ?? p.category?.categoryName ?? null;
}

/**
 * Map danh mục app -> tên category từ backend.
 * Backend hiện có: Rau củ, Trái cây, Thảo mộc & Gia vị, Nấm tươi.
 * Hải sản, Thịt & Trứng, Đồ khô chưa có trong backend -> trả về rỗng.
 */
const CATEGORY_NAME_MAP: Record<string, string[]> = {
  vegetable: ['rau củ', 'rau ăn lá', 'củ quả', 'nấm tươi'],
  fruit: ['trái cây', 'trái cây nhiệt đới', 'trái cây ôn đới'],
  meat_egg: [], // backend chưa có
  seafood: [],  // backend chưa có
  dry: ['thảo mộc & gia vị', 'rau gia vị'],
};

function matchCategory(catId: string, categoryName: string | null | undefined): boolean {
  if (!categoryName) return false;
  const lower = categoryName.toLowerCase().trim();
  const allowed = CATEGORY_NAME_MAP[catId] ?? [];
  if (allowed.length === 0) return false;
  return allowed.some((name) => lower === name || lower.startsWith(name) || name.startsWith(lower));
}

const MAIN_CATEGORIES = [
  { id: 'vegetable', label: 'Rau củ', icon: 'spa' as const, heading: 'Rau củ tươi' },
  { id: 'fruit', label: 'Trái cây', icon: 'local-grocery-store' as const, heading: 'Trái cây tươi' },
  { id: 'meat_egg', label: 'Thịt & Trứng', icon: 'set-meal' as const, heading: 'Thịt & trứng' },
  { id: 'seafood', label: 'Hải sản', icon: 'water' as const, heading: 'Hải sản tươi' },
  { id: 'dry', label: 'Đồ khô', icon: 'inventory-2' as const, heading: 'Đồ khô' },
] as const;

const SUB_CATEGORIES: Record<
  (typeof MAIN_CATEGORIES)[number]['id'],
  { id: string; label: string }[]
> = {
  vegetable: [
    { id: 'leafy', label: 'Rau ăn lá' },
    { id: 'root', label: 'Củ quả' },
    { id: 'mushroom', label: 'Nấm các loại' },
    { id: 'herb', label: 'Rau gia vị' },
    { id: 'organic_combo', label: 'Combo hữu cơ' },
    { id: 'tuber', label: 'Khoai & Củ' },
  ],
  fruit: [
    { id: 'tropical', label: 'Trái cây nhiệt đới' },
    { id: 'imported', label: 'Trái cây nhập khẩu' },
    { id: 'citrus', label: 'Trái cây có múi' },
    { id: 'berry', label: 'Dâu, việt quất' },
  ],
  meat_egg: [
    { id: 'pork', label: 'Thịt heo' },
    { id: 'beef', label: 'Thịt bò' },
    { id: 'chicken', label: 'Thịt gà' },
    { id: 'egg', label: 'Trứng gà, vịt' },
  ],
  seafood: [
    { id: 'fish', label: 'Cá tươi' },
    { id: 'shrimp', label: 'Tôm, tép' },
    { id: 'shell', label: 'Ngao, sò, ốc' },
    { id: 'frozen', label: 'Hải sản đông lạnh' },
  ],
  dry: [
    { id: 'beans', label: 'Các loại đậu' },
    { id: 'spice', label: 'Gia vị khô' },
    { id: 'grain', label: 'Gạo, ngũ cốc' },
    { id: 'snack', label: 'Đồ ăn vặt' },
  ],
};

export default function MarketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { count, addItem } = useCart();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    (typeof MAIN_CATEGORIES)[number]['id']
  >((params.category as (typeof MAIN_CATEGORIES)[number]['id']) || 'vegetable');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const selectedCategory =
    MAIN_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? MAIN_CATEGORIES[0];

  useEffect(() => {
    if (params.category && MAIN_CATEGORIES.some((c) => c.id === params.category)) {
      setSelectedCategoryId(params.category as (typeof MAIN_CATEGORIES)[number]['id']);
    }
  }, [params.category]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await getProducts(token || undefined, 1, 100);
        if (res.success && res.data) {
          setProducts(res.data.items);
        } else {
          setError(res.message || 'Không thể tải sản phẩm');
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải sản phẩm');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [token]);

  const productsInCategory = useMemo(() => {
    return products.filter((p) =>
      matchCategory(selectedCategoryId, getProductCategoryName(p))
    );
  }, [products, selectedCategoryId]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productsInCategory;
    return productsInCategory.filter((p) =>
      p.productName.toLowerCase().includes(q)
    );
  }, [productsInCategory, search]);

  const handleAddToCart = (product: Product) => {
    const imageUrl = getPrimaryImageUrl(product.productImages);
    const imageSource = imageUrl
      ? {
          uri: imageUrl.startsWith('http')
            ? imageUrl
            : `${config.apiBaseUrl}${imageUrl}`,
        }
      : PLACEHOLDER_IMAGE;
    addItem({
      id: product.productId,
      productId: product.productId,
      name: product.productName,
      unitPrice: product.basePrice,
      image: imageSource,
      weight: product.unit || product.origin || undefined,
    });
  };

  // Khi category không có sản phẩm: chỉ filter theo search, KHÔNG fallback hiển thị tất cả
  const displayProducts =
    productsInCategory.length > 0
      ? filteredProducts
      : search.trim()
        ? products.filter((p) =>
            p.productName.toLowerCase().includes(search.trim().toLowerCase())
          )
        : []; // Danh mục không có sản phẩm -> hiển thị trống

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Danh mục"
        left={
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/')}
            activeOpacity={0.8}
            style={styles.headerIconButton}>
            <View style={styles.headerIconCircle}>
              <MaterialIcons name="arrow-back" size={18} color={theme.text} />
            </View>
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/orders')}
            style={styles.headerIconButton}>
            <View style={styles.headerIconCircle}>
              <MaterialIcons name="shopping-cart" size={18} color={theme.text} />
              {count > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.cartBadgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        }
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm nông sản tươi..."
      />

      <View style={styles.bodyRow}>
        <View style={styles.sidebar}>
          <ScrollView
            style={styles.sidebarScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}>
            {MAIN_CATEGORIES.map((cat) => {
              const isActive = cat.id === selectedCategoryId;

              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}>
                  <View
                    style={[
                      styles.sidebarItemInner,
                      isActive && styles.sidebarItemInnerActive,
                    ]}>
                    <View
                      style={[
                        styles.sidebarIconCircle,
                        isActive
                          ? {
                              borderColor: theme.primary,
                              backgroundColor: '#ecfdf3',
                            }
                          : null,
                      ]}>
                      <MaterialIcons
                        name={cat.icon}
                        size={24}
                        color={isActive ? theme.primary : '#6b7280'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sidebarLabel,
                        isActive && { color: '#0f172a', fontWeight: '700' },
                      ]}>
                      {cat.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{selectedCategory.heading}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { color: theme.primary }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.promoBanner}>
              <View style={styles.promoTextBlock}>
                <Text style={styles.promoLabel}>KHUYẾN MÃI</Text>
                <Text style={styles.promoTitle}>
                  Giảm 20% cho các loại{'\n'}rau hữu cơ
                </Text>
              </View>
              <View style={styles.promoImagePlaceholder}>
                <MaterialIcons name="spa" size={36} color={theme.primary} />
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Đang tải sản phẩm...
                </Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.grid}>
                {displayProducts.map((product) => {
                  const cardData = mapProductToCardData(product);
                  return (
                    <View key={product.productId} style={styles.gridItem}>
                      <ProductCard
                        name={cardData.name}
                        price={cardData.price}
                        weight={cardData.weight}
                        image={cardData.image}
                        variant="compact"
                        showAddButton
                        onPress={() => {}}
                        onAddPress={() => handleAddToCart(product)}
                      />
                    </View>
                  );
                })}
                {displayProducts.length === 0 && (
                  <Text style={styles.emptyGridText}>
                    {productsInCategory.length === 0 && !search.trim()
                      ? `Chưa có sản phẩm trong danh mục ${selectedCategory.label}.`
                      : 'Không có sản phẩm phù hợp.'}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0e3a12',
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 12,
  },
  sidebar: {
    width: 90,
    marginRight: 12,
    flex: 0,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarContent: {
    paddingVertical: 4,
    paddingBottom: 24,
  },
  sidebarItem: {
    marginBottom: 8,
  },
  sidebarItemActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  sidebarItemInner: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  sidebarItemInnerActive: {},
  sidebarIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  sidebarLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    paddingBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ecfdf3',
  },
  promoTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  promoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  promoImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
  },
  gridImagePlaceholder: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptyGridText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

