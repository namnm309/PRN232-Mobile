import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ImageSourcePropType } from 'react-native';

type ProductCardProps = {
  name: string;
  price: string;
  image: ImageSourcePropType;
  badge?: string;
  weight?: string;
  rating?: number;
  originalPrice?: string;
  discountBadge?: string;
  /** Kiểu card: mặc định (dùng cho list ngang) hoặc compact (dùng cho grid 2 cột) */
  variant?: 'default' | 'compact';
  /** Hiển thị nút thêm (+) hoặc icon giỏ hàng */
  showAddButton?: boolean;
  /** Vô hiệu hóa nút thêm (vd: hết hàng) - vẫn hiển thị nhưng không cho bấm */
  addDisabled?: boolean;
  onPress?: () => void;
  /** Gọi khi bấm nút thêm vào giỏ (tránh trigger onPress của card) */
  onAddPress?: () => void;
};

export function ProductCard({
  name,
  price,
  image,
  badge,
  weight,
  rating,
  originalPrice,
  discountBadge,
  variant = 'default',
  showAddButton,
  addDisabled,
  onPress,
  onAddPress,
}: ProductCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.background,
          width: isCompact ? '100%' : 150,
        },
      ]}>
      <View style={[styles.imageWrap, isCompact && styles.imageWrapCompact]}>
        <Image source={image} style={styles.image} contentFit="cover" />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        {discountBadge ? (
          <View style={[styles.discountBadge]}>
            <Text style={styles.discountText}>{discountBadge}</Text>
          </View>
        ) : null}
        {typeof rating === 'number' ? (
          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <MaterialIcons name="star" size={12} color="#facc15" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
      {weight ? (
        <Text numberOfLines={1} style={styles.weight}>
          {weight}
        </Text>
      ) : null}
      <View style={styles.bottomRow}>
        <View style={styles.priceColumn}>
          {originalPrice ? (
            <Text style={styles.originalPrice}>{originalPrice}</Text>
          ) : null}
          <Text style={[styles.price, { color: theme.primary }]}>{price}</Text>
        </View>
        {showAddButton ? (
          addDisabled ? (
            <View style={[styles.addButton, styles.addButtonDisabled]}>
              <Text style={styles.addButtonDisabledText}>Hết hàng</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onAddPress?.()}
              style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <MaterialIcons
                name={isCompact ? 'shopping-cart' : 'add'}
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>
          )
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 10,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 100,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ef4444',
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  weight: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flexDirection: 'column',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#e5e7eb',
    minWidth: 64,
  },
  addButtonDisabledText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  imageWrapCompact: {
    marginBottom: 6,
  },
});

