import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HomeHeaderProps = {
  address?: string;
};

export function HomeHeader({ address = 'Chọn địa chỉ giao hàng' }: HomeHeaderProps) {
  const router = useRouter();
  const { count } = useCart();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleAddressPress = () => {
    router.push('/addresses');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.left} onPress={handleAddressPress} activeOpacity={0.8}>
        <MaterialIcons name="location-on" size={20} color={theme.primary} />
        <View style={styles.addressTextWrap}>
          <Text style={styles.deliveryLabel}>Giao đến</Text>
          <View style={styles.addressRow}>
            <Text numberOfLines={1} style={[styles.address, { color: theme.text }]}>
              {address}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.text} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.right}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="notifications-none" size={22} color={theme.icon} />
          <View style={styles.notificationDot} />
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/orders')}
          style={styles.iconWrap}>
          <MaterialIcons name="shopping-cart" size={22} color={theme.icon} />
          {count > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.cartBadgeText}>
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTextWrap: {
    marginLeft: 8,
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconWrap: {
    marginLeft: 12,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
});

