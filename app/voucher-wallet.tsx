import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { VOUCHER_RULES } from '@/lib/vouchers';

const formatDate = (s: string) => {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return s;
  }
};

const now = new Date();
const VALID_VOUCHERS = VOUCHER_RULES.map((r, i) => ({
  id: String(i + 1),
  code: r.code,
  description: r.description,
  discountType: r.discountType,
  discountValue: r.discountValue,
  minOrderValue: r.minOrderValue,
  maxDiscount: r.maxDiscount,
  endDate: new Date(now.getTime() + (30 - i * 7) * 24 * 60 * 60 * 1000).toISOString(),
}));

type VoucherItem = (typeof VALID_VOUCHERS)[number];

export default function VoucherWalletScreen() {
  const router = useRouter();

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Đã sao chép', `Mã ${code} đã được sao chép. Dán tại bước thanh toán.`);
  };
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const renderDiscount = (v: VoucherItem) => {
    if (v.discountType === 'Percentage') {
      return (
        <View style={styles.discountBadge}>
          <Text style={styles.discountPercent} numberOfLines={1} adjustsFontSizeToFit>
            {v.discountValue}%
          </Text>
          <Text style={styles.discountOff}>GIẢM</Text>
        </View>
      );
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(v.discountValue) + '₫';
    return (
      <View style={styles.discountBadge}>
        <Text style={styles.discountFixed} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {formatted}
        </Text>
        <Text style={styles.discountOff}>GIẢM</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: VoucherItem }) => (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={[styles.cardLeft, { borderRightColor: '#e5e7eb' }]}>
        {renderDiscount(item)}
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.code, { color: theme.text }]}>{item.code}</Text>
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.expiry, { color: theme.text }]}>
          HSD: {formatDate(item.endDate)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleCopy(item.code)}
        style={[styles.copyBtn, { backgroundColor: theme.primary }]}
        activeOpacity={0.8}>
        <Text style={styles.copyBtnText}>Sao chép</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Ví voucher"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.info}>
        <MaterialIcons name="info-outline" size={18} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.text }]}>
          Voucher áp dụng khi thanh toán đơn hàng. Sao chép mã và dán tại bước thanh toán.
        </Text>
      </View>

      <FlatList
        data={VALID_VOUCHERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="card-giftcard" size={64} color="#9ca3af" />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Chưa có voucher nào
            </Text>
            <Text style={styles.emptyHint}>
              Tham gia chương trình khuyến mãi để nhận voucher
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ecfdf3',
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  list: { paddingBottom: 24 },
  separator: { height: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    minHeight: 100,
  },
  cardLeft: {
    minWidth: 100,
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRightWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
  },
  discountFixed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
    textAlign: 'center',
  },
  discountOff: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  code: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  description: { fontSize: 12, marginBottom: 4, opacity: 0.9, lineHeight: 18, flexShrink: 1 },
  expiry: { fontSize: 12, opacity: 0.7 },
  copyBtn: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
