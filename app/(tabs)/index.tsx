import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';

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
import { 
  getProducts, 
  mapProductToCardData, 
  getUniqueOrigins,
  getUniqueProviders,
  filterProductsByOrigin,
  filterProductsByProvider,
  selectDefaultOrigin,
  type Product 
} from '@/lib/productsApi';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // State for products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown selections
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

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

  // Split products into sections
  const featuredProducts = products.slice(0, 3);

  // Get unique origins and providers from all products (not just slice)
  const availableOrigins = useMemo(() => getUniqueOrigins(products), [products]);
  const availableProviders = useMemo(() => getUniqueProviders(products), [products]);

  // Products for filtering (exclude featured)
  const productsForFiltering = products.slice(3);

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
      <HomeHeader />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Bạn muốn tìm gì hôm nay?"
        showFilter
      />

      <PromoBanners />

      <CategoryGrid />

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
          <SectionHeader title="Sản phẩm mới" onPressSeeAll={() => {}} />
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
                  onPress={() => {
                    console.log('Product pressed:', cardData.id);
                  }}
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
                    onPress={() => console.log('Product pressed:', cardData.id)}
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
                    onPress={() => console.log('Product pressed:', cardData.id)}
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
                  onPress={() => console.log('Product pressed:', cardData.id)}
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
