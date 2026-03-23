import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { getOrderById, syncShipmentStatus, type OrderDto } from '@/lib/ordersApi';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getGhnDeliveryStatusLabel } from '@/constants/ghnStatusLabels';

const formatPrice = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + '₫';

const formatDate = (s: string) => {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
  DeliveryFailed: 'Giao hàng thất bại',
};

const VNPAY_STATUS_LABELS: Record<string, string> = {
  NotApplicable: 'COD - Không áp dụng',
  Pending: 'Chờ thanh toán',
  Success: 'Đã thanh toán',
  Paid: 'Đã thanh toán',
  Failed: 'Thanh toán thất bại',
  Cancelled: 'Đã hủy',
  Cancel: 'Đã hủy',
};

const GHN_TRACKING_BASE = 'https://tracking.ghn.dev/?order_code=';

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fetchOrder = useCallback(async () => {
    if (!token || !params.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await getOrderById(params.id, token);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message ?? 'Không thể tải chi tiết đơn hàng');
      }
    } catch {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [token, params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSyncGhn = useCallback(async () => {
    if (!token || !params.id) return;
    setSyncing(true);
    try {
      const res = await syncShipmentStatus(params.id, token);
      if (res.success && res.data) {
        await fetchOrder();
        const status = getGhnDeliveryStatusLabel(
          res.data.deliveryStatus ?? res.data.rawStatus ?? ''
        );
        Alert.alert(
          'Trạng thái đơn hàng',
          `Mã GHN: ${res.data.ghnOrderCode ?? '-'}\nTrạng thái vận đơn: ${status}\n✅ Đã cập nhật từ GHN`
        );
      } else {
        Alert.alert('Lỗi', res.message ?? 'Không thể đồng bộ');
      }
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể đồng bộ');
    } finally {
      setSyncing(false);
    }
  }, [token, params.id, fetchOrder]);

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <AppHeader
          title="Chi tiết đơn hàng"
          left={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{ padding: 4 }}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          }
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!order || error) {
    return (
      <ScreenContainer scroll={false}>
        <AppHeader
          title="Chi tiết đơn hàng"
          left={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{ padding: 4 }}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          }
        />
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error ?? 'Không tìm thấy đơn hàng'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchOrder();
            }}
            style={[styles.retryBtn, { borderColor: theme.primary }]}
            activeOpacity={0.8}>
            <Text style={[styles.retryBtnText, { color: theme.primary }]}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const statusLabel = STATUS_LABELS[order.status ?? ''] ?? (order.status || 'Chờ xử lý');

  return (
    <ScreenContainer>
      <AppHeader
        title="Chi tiết đơn hàng"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={{ padding: 4 }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Mã đơn hàng</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              #{order.orderNumber ?? order.orderId.slice(0, 8)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Ngày đặt</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {formatDate(order.orderDate)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Trạng thái</Text>
            <Text style={[styles.statusText, { color: theme.primary }]}>{statusLabel}</Text>
          </View>
          {order.vnPayStatus && order.vnPayStatus !== 'NotApplicable' && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.text }]}>Thanh toán VNPay</Text>
              <Text style={[styles.statusText, { color: theme.primary }]}>
                {VNPAY_STATUS_LABELS[order.vnPayStatus] ?? order.vnPayStatus}
              </Text>
            </View>
          )}
          {order.shipment?.ghnOrderCode && (
            <>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.text }]}>Mã vận đơn GHN</Text>
                <Text style={[styles.value, { color: theme.text }]}>{order.shipment.ghnOrderCode}</Text>
              </View>
              {(order.shipment.deliveryStatus || order.shipment.rawStatus) && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: theme.text }]}>Trạng thái vận đơn</Text>
                  <Text style={[styles.statusText, { color: theme.primary }]}>
                    {getGhnDeliveryStatusLabel(order.shipment.deliveryStatus ?? order.shipment.rawStatus)}
                  </Text>
                </View>
              )}
            </>
          )}
          {(order.shipment?.trackingUrl || (order.shipment?.ghnOrderCode && `${GHN_TRACKING_BASE}${order.shipment.ghnOrderCode}`)) && (
            <TouchableOpacity
              style={[styles.trackingBtn, { borderColor: theme.primary }]}
              onPress={() =>
                Linking.openURL(order.shipment!.trackingUrl || `${GHN_TRACKING_BASE}${order.shipment!.ghnOrderCode!}`)
              }
              activeOpacity={0.8}>
              <MaterialIcons name="local-shipping" size={18} color={theme.primary} />
              <Text style={[styles.trackingBtnText, { color: theme.primary }]}>Theo dõi đơn hàng</Text>
            </TouchableOpacity>
          )}
          {(order.status === 'Confirmed' || order.status === 'Shipping') &&
            order.shipment?.ghnOrderCode && (
              <TouchableOpacity
                style={[styles.syncBtn, { backgroundColor: theme.primary }]}
                onPress={handleSyncGhn}
                disabled={syncing}
                activeOpacity={0.8}>
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="sync" size={18} color="#fff" />
                    <Text style={styles.syncBtnText}>Cập nhật tình trạng</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          {order.shippingAddress && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.text }]}>Địa chỉ giao hàng</Text>
              <Text style={[styles.value, { color: theme.text }]} numberOfLines={3}>
                {order.shippingAddress}
              </Text>
            </View>
          )}
        </View>

        {order.orderDetails && order.orderDetails.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sản phẩm</Text>
            {order.orderDetails.map((d, i) => (
              <View
                key={d.orderDetailId ?? i}
                style={[styles.detailRow, { borderBottomColor: '#e5e7eb' }]}>
                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
                  {d.productName ?? 'Sản phẩm'}
                </Text>
                <Text style={[styles.detailMeta, { color: theme.text }]}>
                  x{d.quantity ?? 0} • {formatPrice(d.totalPrice ?? d.unitPrice ?? 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Tạm tính</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {formatPrice(order.totalAmount ?? 0)}
            </Text>
          </View>
          {order.shippingFee ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.text }]}>Phí giao hàng</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {formatPrice(order.shippingFee)}
              </Text>
            </View>
          ) : null}
          {order.discountAmount ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.text }]}>Giảm giá</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                -{formatPrice(order.discountAmount)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Tổng cộng</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              {formatPrice(order.finalAmount ?? order.totalAmount ?? 0)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14 },
  value: { fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 12 },
  statusText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: { fontSize: 14, flex: 1 },
  detailMeta: { fontSize: 14, marginLeft: 12 },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
  },
  trackingBtnText: { fontSize: 14, fontWeight: '600' },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderRadius: 10,
  },
  syncBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
});
