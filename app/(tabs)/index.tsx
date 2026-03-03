import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { HomeHeader } from '@/components/layout/HomeHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { PromoBanners } from '@/components/home/PromoBanners';
import { ProductCard } from '@/components/ui/ProductCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { InlineSectionFilter } from '@/components/ui/InlineSectionFilter';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { 
  getProducts, 
  mapProductToCardData, 
  getUniqueOrigins,
  getUniqueProviders,
  filterProductsByOrigin,
  filterProductsByProvider,
  selectDefaultOrigin,
  type Product,
  getPrimaryImageUrl,
} from '@/lib/productsApi';
import { config } from '@/lib/config';
import { getDefaultAddress } from '@/lib/addressStorage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [defaultAddress, setDefaultAddress] = useState<string>('Chọn địa chỉ giao hàng');
  const { token, user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // State for products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown selections
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getDefaultAddress(user.id).then((addr) => {
          setDefaultAddress(addr?.fullAddress ?? 'Chọn địa chỉ giao hàng');
        });
      } else {
        setDefaultAddress('Chọn địa chỉ giao hàng');
      }
    }, [user?.id])
  );

  // Fetch products on mount or when token changes
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        // Call API with or without token (backend allows anonymous for GET)
        const response = await getProducts(token || undefined, 1, 50);
        
        if (response.success && response.data) {
          setProducts(response.data.items);
          console.log('✅ Products fetched:', response.data.items.length);
          console.log('📦 Total count:', response.data.totalCount);
          
          // Debug: Check if provider object is included
          const sampleProduct = response.data.items[0];
          if (sampleProduct) {
            console.log('🔍 Sample product:', {
              id: sampleProduct.productId,
              name: sampleProduct.productName,
              providerId: sampleProduct.providerId,
              hasProvider: !!sampleProduct.provider,
              providerName: sampleProduct.provider?.providerName || 'N/A',
            });
          }
        } else {
          setError(response.message || 'Không thể tải sản phẩm');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Có lỗi xảy ra khi tải sản phẩm');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [token]);

  // Auto-select random origin when products load
  useEffect(() => {
    if (products.length > 0 && !selectedOrigin) {
      const origins = getUniqueOrigins(products);
      if (origins.length > 0) {
        // TODO: Get user location from AuthContext or user profile
        // For now: userLocation = undefined (random selection)
        // Future: userLocation = user.city || user.address?.city
        const userLocation = undefined; // Replace with actual user location
        
        const defaultOrigin = selectDefaultOrigin(origins, userLocation);
        setSelectedOrigin(defaultOrigin);
        console.log('🎲 Auto-selected origin:', defaultOrigin);
      }
    }
  }, [products, selectedOrigin]);

  // Search filter
  const searchLower = search.trim().toLowerCase();
  const filteredBySearch = useMemo(() => {
    if (!searchLower) return products;
    return products.filter((p) =>
      p.productName.toLowerCase().includes(searchLower)
    );
  }, [products, searchLower]);

  // Split products into sections (sau khi lọc search)
  const featuredProducts = filteredBySearch.slice(0, 3);

  // Get unique origins and providers from filtered products
  const availableOrigins = useMemo(() => getUniqueOrigins(filteredBySearch), [filteredBySearch]);
  const availableProviders = useMemo(() => getUniqueProviders(filteredBySearch), [filteredBySearch]);

  // Products for filtering (exclude featured)
  const productsForFiltering = filteredBySearch.slice(3);

  const handleAddToCart = (product: Product) => {
    const imageUrl = getPrimaryImageUrl(product.productImages);
    const imageSource = imageUrl
      ? { uri: imageUrl.startsWith('http') ? imageUrl : `${config.apiBaseUrl}${imageUrl}` }
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

  // Filtered products by origin
  const originFilteredProducts = useMemo(() => {
    return filterProductsByOrigin(productsForFiltering, selectedOrigin);
  }, [productsForFiltering, selectedOrigin]);

  // Filtered products by provider
  const providerFilteredProducts = useMemo(() => {
    return filterProductsByProvider(productsForFiltering, selectedProvider);
  }, [productsForFiltering, selectedProvider]);

  // Suggested products: products not shown in origin/provider sections
  const suggestedProducts = useMemo(() => {
    // If no filter selected, show all products for filtering
    if (!selectedOrigin && !selectedProvider) {
      return productsForFiltering;
    }
    
    // If both selected, exclude products shown in either section
    const shownIds = new Set<string>();
    originFilteredProducts.forEach(p => shownIds.add(p.productId));
    providerFilteredProducts.forEach(p => shownIds.add(p.productId));
    
    return productsForFiltering.filter(p => !shownIds.has(p.productId));
  }, [productsForFiltering, selectedOrigin, selectedProvider, originFilteredProducts, providerFilteredProducts]);

  return (
    <ScreenContainer>
      <HomeHeader address={defaultAddress} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Bạn muốn tìm gì hôm nay?"
        showFilter
      />

      <PromoBanners
        onPrimaryPress={() => router.push('/(tabs)/market')}
        onSecondaryPress={() => router.push('/(tabs)/market')}
      />

      <CategoryGrid onCategoryPress={(id) => router.push(`/(tabs)/market?category=${id}`)} />

      {/* Loading state */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Đang tải sản phẩm...
          </Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Chưa có sản phẩm nào
          </Text>
        </View>
      )}

      {/* Featured Products Section */}
      {!loading && !error && featuredProducts.length > 0 && (
        <>
          <SectionHeader title="Sản phẩm mới" onPressSeeAll={() => router.push('/(tabs)/market')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalRow}
            contentContainerStyle={styles.horizontalContent}>
            {featuredProducts.map((product) => {
              const cardData = mapProductToCardData(product, 'Mới');
              return (
                <ProductCard
                  key={cardData.id}
                  name={cardData.name}
                  price={cardData.price}
                  weight={cardData.weight}
                  image={cardData.image}
                  badge={cardData.badge}
                  showAddButton
                  onPress={() => router.push(`/(tabs)/market?product=${product.productId}`)}
                  onAddPress={() => handleAddToCart(product)}
                />
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Origin Section with Inline Dropdown Filter */}
      {!loading && !error && availableOrigins.length > 0 && (
        <>
          <InlineSectionFilter
            title="Sản phẩm từ"
            options={availableOrigins}
            selectedValue={selectedOrigin}
            onValueChange={setSelectedOrigin}
            placeholder="Chọn nguồn gốc"
            onPressSeeAll={selectedOrigin ? () => setSelectedOrigin(null) : undefined}
          />
          {selectedOrigin && originFilteredProducts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalRow}
              contentContainerStyle={styles.horizontalContent}>
              {originFilteredProducts.map((product) => {
                const cardData = mapProductToCardData(product);
                return (
                  <ProductCard
                    key={cardData.id}
                    name={cardData.name}
                    price={cardData.price}
                    weight={cardData.weight}
                    image={cardData.image}
                    showAddButton
                    onPress={() => router.push(`/(tabs)/market?product=${product.productId}`)}
                    onAddPress={() => handleAddToCart(product)}
                  />
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {/* Provider Section with Inline Dropdown Filter */}
      {!loading && !error && availableProviders.length > 0 && (
        <>
          <InlineSectionFilter
            title="Sản phẩm từ nhà cung cấp"
            options={availableProviders}
            selectedValue={selectedProvider}
            onValueChange={setSelectedProvider}
            placeholder="Chọn nhà cung cấp"
            onPressSeeAll={selectedProvider ? () => setSelectedProvider(null) : undefined}
          />
          {selectedProvider && providerFilteredProducts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalRow}
              contentContainerStyle={styles.horizontalContent}>
              {providerFilteredProducts.map((product) => {
                const cardData = mapProductToCardData(product);
                return (
                  <ProductCard
                    key={cardData.id}
                    name={cardData.name}
                    price={cardData.price}
                    weight={cardData.weight}
                    image={cardData.image}
                    showAddButton
                    onPress={() => router.push(`/(tabs)/market?product=${product.productId}`)}
                    onAddPress={() => handleAddToCart(product)}
                  />
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {/* Suggested Products */}
      {!loading && !error && suggestedProducts.length > 0 && (
        <>
          <SectionHeader title="Gợi ý cho bạn" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalRow}
            contentContainerStyle={styles.horizontalContent}>
            {suggestedProducts.map((product) => {
              const cardData = mapProductToCardData(product);
              return (
                <ProductCard
                  key={cardData.id}
                  name={cardData.name}
                  price={cardData.price}
                  weight={cardData.weight}
                  image={cardData.image}
                  showAddButton
                  onPress={() => router.push(`/(tabs)/market?product=${product.productId}`)}
                  onAddPress={() => handleAddToCart(product)}
                />
              );
            })}
          </ScrollView>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  horizontalRow: {
    marginBottom: 16,
  },
  horizontalContent: {
    paddingVertical: 4,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
