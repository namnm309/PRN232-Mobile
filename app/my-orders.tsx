import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { getOrders, type OrderDto } from '@/lib/ordersApi';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const formatPrice = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + '₫';

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

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ xử lý',
  Processing: 'Đang xử lý',
  Shipped: 'Đã giao',
  Delivered: 'Đã nhận',
  Cancelled: 'Đã hủy',
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const loadOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getOrders(token, 1, 50);
      if (res.success && res.data) {
        setOrders(res.data.items ?? []);
      } else {
        setError(res.message ?? 'Không thể tải đơn hàng');
      }
    } catch (e) {
      setError('Có lỗi xảy ra khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const renderItem = ({ item }: { item: OrderDto }) => {
    const statusLabel =
      STATUS_LABELS[item.status ?? ''] ?? (item.status || 'Chờ xử lý');
    const itemCount = item.orderDetails?.length ?? 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, { backgroundColor: theme.background }]}
        onPress={() => router.push({ pathname: '/order-detail', params: { id: item.orderId } })}>
        <View style={styles.cardHeader}>
          <Text style={[styles.orderNumber, { color: theme.text }]}>
            #{item.orderNumber ?? item.orderId.slice(0, 8)}
          </Text>
          <Text style={[styles.date, { color: theme.text }]}>
            {formatDate(item.orderDate)}
          </Text>
        </View>
        <Text style={[styles.status, { color: theme.primary }]}>{statusLabel}</Text>
        <Text style={[styles.summary, { color: theme.text }]} numberOfLines={2}>
          {item.orderDetails?.[0]?.productName ?? 'Sản phẩm'}
          {itemCount > 1 ? ` và ${itemCount - 1} sản phẩm khác` : ''}
        </Text>
        <Text style={[styles.amount, { color: theme.primary }]}>
          {formatPrice(item.finalAmount ?? item.totalAmount ?? 0)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Đơn hàng của tôi"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Đang tải đơn hàng...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadOrders}
            style={[styles.retryBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.retryBtnText, { color: theme.primary }]}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="receipt-long" size={64} color="#9ca3af" />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Chưa có đơn hàng nào
          </Text>
          <Text style={styles.emptyHint}>
            Đơn hàng của bạn sẽ hiển thị tại đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  list: { paddingBottom: 24 },
  separator: { height: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 13 },
  status: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  summary: { fontSize: 14, marginBottom: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
