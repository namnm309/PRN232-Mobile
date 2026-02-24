import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HomeHeaderProps = {
  address?: string;
};

export function HomeHeader({ address = 'Quận 1, TP.HCM' }: HomeHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <MaterialIcons name="location-on" size={20} color={theme.primary} />
        <View style={styles.addressTextWrap}>
          <Text style={styles.deliveryLabel}>Giao đến</Text>
          <View style={styles.addressRow}>
            <Text numberOfLines={1} style={styles.address}>
              {address}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={theme.text} />
          </View>
        </View>
      </View>

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
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconWrap: {
    marginLeft: 12,
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

