import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { HomeHeader } from '@/components/layout/HomeHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { PromoBanners } from '@/components/home/PromoBanners';
import { ProductCard } from '@/components/ui/ProductCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { featuredProducts, bestSellerProducts } from '@/data/mockProducts';

export default function HomeScreen() {
  const [search, setSearch] = useState('');

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

      <SectionHeader title="Sản phẩm mới" onPressSeeAll={() => {}} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalRow}
        contentContainerStyle={styles.horizontalContent}>
        {featuredProducts.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.price}
            weight={p.weight}
            image={require('@/assets/images/splash-icon.png')}
            badge="Mới"
            showAddButton
          />
        ))}
      </ScrollView>

      <SectionHeader title="Gợi ý cho bạn" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalRow}
        contentContainerStyle={styles.horizontalContent}>
        {bestSellerProducts.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.price}
            weight={p.weight}
            rating={p.rating}
            originalPrice={p.originalPrice}
            discountBadge={p.discountBadge}
            image={require('@/assets/images/splash-icon.png')}
            showAddButton
          />
        ))}
      </ScrollView>
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
});
