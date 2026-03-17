import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { getOrders, syncGhnStatus, type OrderDto } from '@/lib/ordersApi';
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
  Confirmed: 'Đã xác nhận',
  Shipping: 'Đang giao',
  Shipped: 'Đã giao',
  Delivered: 'Đã nhận',
  Returned: 'Đã trả hàng',
  Cancelled: 'Đã hủy',
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const loadOrders = useCallback(async (refresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      if (!refresh) setLoading(true);
      else setRefreshing(true);
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
      setRefreshing(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await getOrders(token, 1, 50);
      const items = res.success && res.data ? res.data.items ?? [] : [];
      setOrders(items);
      setError(null);
      const ghnOrders = items.filter(
        (o: OrderDto) =>
          (o.status === 'Confirmed' || o.status === 'Shipping') &&
          o.shipment?.ghnOrderCode
      );
      if (ghnOrders.length > 0) {
        await Promise.all(
          ghnOrders.map((o: OrderDto) => syncGhnStatus(o.orderId, token).catch(() => null))
        );
        const res2 = await getOrders(token, 1, 50);
        if (res2.success && res2.data) setOrders(res2.data.items ?? []);
      }
    } catch {
      setError('Có lỗi xảy ra');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    loadOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [loadOrders]);

  const handleCheckGhnStatus = useCallback(
    async (orderId: string) => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await syncGhnStatus(orderId, token);
        if (res.success && res.data) {
          await loadOrders(true);
          Alert.alert(
            'Trạng thái đơn hàng',
            `Mã GHN: ${res.data.ghnOrderCode}\nTrạng thái GHN: ${res.data.ghnStatus}\nTrạng thái đơn: ${res.data.orderStatus}${res.data.statusChanged ? '\n✅ Đã cập nhật' : '\nℹ️ Không có thay đổi'}`
          );
        } else {
          Alert.alert('Lỗi', res.message ?? 'Không thể lấy trạng thái');
        }
      } catch (e) {
        Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể lấy trạng thái');
      } finally {
        setLoading(false);
      }
    },
    [token, loadOrders]
  );

  const renderItem = ({ item }: { item: OrderDto }) => {
    const statusLabel =
      STATUS_LABELS[item.status ?? ''] ?? (item.status || 'Chờ xử lý');
    const itemCount = item.orderDetails?.length ?? 0;
    const showGhnBtn =
      (item.status === 'Confirmed' || item.status === 'Shipping') &&
      item.shipment?.ghnOrderCode;

    return (
      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          activeOpacity={0.8}
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
        {showGhnBtn && (
          <TouchableOpacity
            style={[styles.ghnBtn, { borderColor: theme.primary }]}
            onPress={() => handleCheckGhnStatus(item.orderId)}
            activeOpacity={0.8}>
            <MaterialIcons name="local-shipping" size={18} color={theme.primary} />
            <Text style={[styles.ghnBtnText, { color: theme.primary }]}>Tình trạng</Text>
          </TouchableOpacity>
        )}
      </View>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
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
  ghnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
  },
  ghnBtnText: { fontSize: 14, fontWeight: '600' },
});
