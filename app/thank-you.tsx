import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { getOrderById, type OrderDto } from '@/lib/ordersApi';

export default function ThankYouScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const orderId = params.orderId ?? '';
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const maxPoll = 10;

  const loadOrder = useCallback(async () => {
    if (!orderId || !token) {
      setLoading(false);
      return;
    }
    try {
      const res = await getOrderById(orderId, token);
      if (res.success && res.data) setOrder(res.data);
    } catch {
      setError('Không tải được thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!orderId || !token || !order) return;
    const vnPay = order.vnPayStatus?.toLowerCase();
    if (vnPay === 'success' || vnPay === 'paid' || order.vnPayStatus === 'NotApplicable') return;
    if (pollCountRef.current >= maxPoll) return;
    const t = setTimeout(() => {
      pollCountRef.current += 1;
      getOrderById(orderId, token).then((res) => {
        if (res.success && res.data) setOrder(res.data);
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [orderId, token, order]);

  const isVnPaySuccess = order?.vnPayStatus?.toLowerCase() === 'success' || order?.vnPayStatus?.toLowerCase() === 'paid';
  const isCod = !order?.vnPayStatus || order.vnPayStatus === 'NotApplicable';
  const vnPayLower = order?.vnPayStatus?.toLowerCase();
  const isVnPayFailed = vnPayLower === 'failed' || vnPayLower === 'cancelled' || vnPayLower === 'cancel';

  const getMessage = () => {
    if (loading) return 'Đang kiểm tra...';
    if (error) return error;
    if (!orderId) return 'Thiếu thông tin đơn hàng.';
    if (isCod) return 'Đơn hàng đã được đặt thành công!';
    if (isVnPaySuccess) return 'Thanh toán VNPay thành công! Đơn hàng của bạn đã được xác nhận.';
    if (isVnPayFailed) return 'Thanh toán VNPay chưa thành công. Đơn hàng đang chờ. Bạn có thể thanh toán lại trong chi tiết đơn hàng.';
    return 'Đơn hàng đã được tạo. Bạn có thể kiểm tra trạng thái thanh toán VNPay trong chi tiết đơn hàng.';
  };

  const getIcon = () => {
    if (loading) return null;
    if (error) return 'error-outline';
    if (isVnPayFailed) return 'warning';
    return 'check-circle';
  };

  return (
    <ScreenContainer>
      <AppHeader title="Cảm ơn bạn" subtitle="Xác nhận đơn hàng" left={<View />} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : (
          <MaterialIcons
            name={getIcon() as 'check-circle' | 'error-outline' | 'warning'}
            size={72}
            color={error ? '#ef4444' : isVnPayFailed ? '#f59e0b' : theme.primary}
            style={styles.icon}
          />
        )}
        <Text style={[styles.message, { color: theme.text }]}>{getMessage()}</Text>
        {order?.orderNumber && (
          <Text style={styles.orderNum}>Mã đơn: {order.orderNumber}</Text>
        )}
        {order?.shipment?.ghnOrderCode && (
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
            <Text style={styles.orderNum}>Mã vận đơn: {order.shipment.ghnOrderCode}</Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  order.shipment?.trackingUrl ||
                    `https://tracking.ghn.dev/?order_code=${order.shipment?.ghnOrderCode}`
                )
              }
              activeOpacity={0.8}
              style={[styles.trackingLink, { borderColor: theme.primary }]}>
              <MaterialIcons name="local-shipping" size={18} color={theme.primary} />
              <Text style={[styles.trackingLinkText, { color: theme.primary }]}>
                Theo dõi đơn hàng
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={[styles.homeBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.9}>
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>

        {orderId && (
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/order-detail', params: { id: orderId } })}
            style={[styles.detailBtn, { borderColor: theme.primary }]}
            activeOpacity={0.8}>
            <Text style={[styles.detailBtnText, { color: theme.primary }]}>Xem chi tiết đơn hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  loader: { marginBottom: 24 },
  icon: { marginBottom: 24 },
  message: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  orderNum: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  trackingLinkText: { fontSize: 14, fontWeight: '600' },
  homeBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  detailBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderRadius: 12,
  },
  detailBtnText: { fontSize: 15, fontWeight: '600' },
});
