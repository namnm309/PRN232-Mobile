import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function PromoBanners() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={['#16a34a', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.leftBanner}>
        <View style={styles.dealPill}>
          <Text style={styles.dealPillText}>DEAL HOT</Text>
        </View>
        <Text style={styles.leftTitle}>Rau Xanh Tươi Ngon</Text>
        <Text style={styles.leftSubtitle}>Giảm 20% cho đơn đầu tiên</Text>
        <View style={[styles.primaryButton, { backgroundColor: theme.background }]}>
          <Text style={[styles.primaryButtonText, { color: theme.primary }]}>Mua Ngay</Text>
        </View>
      </LinearGradient>

      <View style={styles.rightBanner}>
        <View style={styles.freePill}>
          <Text style={styles.freePillText}>FREE</Text>
        </View>
        <Text style={styles.rightTitle}>Trái Cây Tươi</Text>
        <View style={[styles.secondaryButton, { borderColor: theme.primary }]}>
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Khám Phá</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftBanner: {
    flex: 2,
    borderRadius: 20,
    padding: 16,
    marginRight: 10,
  },
  dealPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  dealPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  leftTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  leftSubtitle: {
    fontSize: 13,
    color: '#e5e7eb',
    marginBottom: 10,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rightBanner: {
    flex: 1.2,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fef3c7',
    justifyContent: 'space-between',
  },
  freePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fb923c',
    marginBottom: 8,
  },
  freePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  rightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

