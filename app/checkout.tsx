import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GHN_DEFAULT } from '@/constants/ghnDefaults';
import {
  getAddresses,
  getDefaultAddress,
  type ShippingAddress,
} from '@/lib/addressStorage';
import { addCartItem, clearBeCart } from '@/lib/cartApi';
import { checkout, previewCheckout, type CheckoutPreviewDto } from '@/lib/checkoutApi';
import { getProductById, getProductVariants } from '@/lib/productsApi';

const formatPrice = (v: number) => `${v.toLocaleString('vi-VN')}đ`;
const SHIPPING_METHOD = 'road';

type PaymentMethod = 'COD' | 'VNPay';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ voucherCode?: string }>();
  const { token, user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [voucherCode, setVoucherCode] = useState<string | null>(params.voucherCode ?? null);
  const [preview, setPreview] = useState<CheckoutPreviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;
    const list = await getAddresses(user.id);
    setAddresses(list);
    const def = await getDefaultAddress(user.id);
    setSelectedAddress(def ?? list[0] ?? null);
  }, [user?.id]);

  const syncCartAndPreview = useCallback(async () => {
    if (!token || items.length === 0) return;
    try {
      const resolvedItems: Array<{ variantId: string; quantity: number; productName: string }> = [];
      const invalidNames: string[] = [];

      for (const item of items) {
        let vid = item.variantId;
        let productName = item.name;
        let stockOk = true;

        const prodRes = await getProductById(item.productId, token);
        const prod = prodRes.success ? prodRes.data : null;

        if (!prod) {
          invalidNames.push(productName);
          continue;
        }
        productName = prod.productName ?? productName;

        if (prod.isDeleted) {
          invalidNames.push(productName);
          continue;
        }
        const statusLower = prod.status?.toLowerCase() ?? '';
        if (['inactive', 'deleted', 'discontinued', 'outofstock'].includes(statusLower)) {
          invalidNames.push(productName);
          continue;
        }

        const variant = prod.productVariants?.[0] ?? prod.productVariants?.find((v) => v.variantId === vid);
        if (!variant) {
          const varRes = await getProductVariants(token);
          const v = varRes.success && varRes.data?.find((x) => x.productId === item.productId);
          if (v) vid = v.variantId;
        } else {
          vid = variant.variantId;
          if (variant.stockQuantity != null && variant.stockQuantity < item.quantity) {
            stockOk = false;
            invalidNames.push(`${productName} (hết hàng, còn ${variant.stockQuantity})`);
          }
        }

        if (!vid) {
          invalidNames.push(productName);
          continue;
        }
        if (stockOk) {
          resolvedItems.push({ variantId: vid, quantity: item.quantity, productName });
        }
      }

      if (invalidNames.length > 0) {
        setError(
          `Sản phẩm không còn khả dụng: ${invalidNames.join(', ')}. Vui lòng xóa khỏi giỏ hàng và thử lại.`
        );
        return;
      }
      if (resolvedItems.length === 0) {
        setError('Không thể xác định biến thể sản phẩm. Vui lòng xóa và thêm lại từ trang chủ/danh mục.');
        return;
      }
      await clearBeCart(token);
      const cartItemIds: string[] = [];
      for (const item of resolvedItems) {
        const cart = await addCartItem(token, {
          variantId: item.variantId,
          quantity: item.quantity,
        });
        const added = cart.cartItems.find((c) => c.variantId === item.variantId);
        if (added) cartItemIds.push(added.cartItemId);
      }
      if (cartItemIds.length === 0) {
        setError('Không thể đồng bộ giỏ hàng.');
        return;
      }
      const addr = selectedAddress;
      // Dùng địa chỉ đã chọn nếu có đủ GHN IDs; fallback GHN_DEFAULT (TP.HCM)
      const hasGhnAddress =
        addr?.provinceId != null &&
        addr?.districtId != null &&
        addr?.wardCode != null &&
        addr?.wardCode.trim() !== '';
      const provinceId = hasGhnAddress ? addr!.provinceId! : GHN_DEFAULT.provinceId;
      const districtId = hasGhnAddress ? addr!.districtId! : GHN_DEFAULT.districtId;
      const wardCode = hasGhnAddress ? addr!.wardCode! : GHN_DEFAULT.wardCode;
      const insuranceValue = Math.min(subtotal, 5_000_000);
      const p = await previewCheckout(token, {
        cartItemIds,
        provinceId,
        toDistrictId: districtId,
        toWardCode: wardCode,
        insuranceValue,
        voucherCode: voucherCode || undefined,
      });
      setPreview(p);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thể tải xem trước đơn hàng.';
      console.error('Preview error:', e);
      setError(
        msg.toLowerCase().includes('no longer available') || msg.toLowerCase().includes('không còn khả dụng')
          ? 'Một số sản phẩm trong giỏ không còn khả dụng (hết hàng hoặc ngừng bán). Vui lòng quay lại giỏ hàng để xóa và thử lại.'
          : msg
      );
    }
  }, [token, items, selectedAddress, subtotal, voucherCode]);

  useFocusEffect(useCallback(() => void loadAddresses(), [loadAddresses]));

  useEffect(() => {
    if (!token || !user?.id) {
      setLoading(false);
      setError('Vui lòng đăng nhập để đặt hàng.');
      setPreview(null);
      return;
    }
    if (items.length === 0) {
      setPreview(null);
      setError('Giỏ hàng trống.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    syncCartAndPreview().finally(() => setLoading(false));
  }, [token, user?.id, items, selectedAddress, voucherCode, syncCartAndPreview]);

  const handleConfirm = async () => {
    if (!token || !user || !selectedAddress || !preview) return;
    if (!preview.items?.length) {
      Alert.alert('Lỗi', 'Giỏ hàng có sản phẩm chưa hợp lệ.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const cartItemIds = preview.items.map((i) => i.cartItemId);
      const hasGhnAddress =
        selectedAddress.provinceId != null &&
        selectedAddress.districtId != null &&
        selectedAddress.wardCode != null &&
        selectedAddress.wardCode.trim() !== '';
      const provinceCode = hasGhnAddress && selectedAddress.provinceCode
        ? selectedAddress.provinceCode
        : GHN_DEFAULT.provinceCode;
      const provinceId = hasGhnAddress ? selectedAddress.provinceId! : GHN_DEFAULT.provinceId;
      const toDistrictId = hasGhnAddress ? selectedAddress.districtId! : GHN_DEFAULT.districtId;
      const toWardCode = hasGhnAddress ? selectedAddress.wardCode! : GHN_DEFAULT.wardCode;

      const result = await checkout(token, {
        cartItemIds,
        shippingAddress: selectedAddress.fullAddress,
        shippingMethod: SHIPPING_METHOD,
        paymentMethod,
        recipientName: selectedAddress.recipientName,
        recipientPhone: selectedAddress.phone,
        provinceCode,
        provinceId,
        toWardCode,
        toDistrictId,
        insuranceValue: Math.min(subtotal, 5_000_000),
        voucherCode: voucherCode || undefined,
      });

      clearCart();

      if (paymentMethod === 'VNPay' && result.paymentUrl) {
        router.replace({
          pathname: '/vnpay-payment',
          params: { url: result.paymentUrl, orderId: result.order.orderId },
        });
      } else {
        router.replace({
          pathname: '/thank-you',
          params: { orderId: result.order.orderId },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm = token && preview && selectedAddress;

  return (
    <ScreenContainer>
      <AppHeader
        title="Đặt hàng"
        subtitle="Xác nhận đơn hàng"
        left={
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Địa chỉ giao hàng */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Địa chỉ giao hàng</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/addresses')}
              style={[styles.addAddrBtn, { borderColor: theme.primary }]}
              activeOpacity={0.8}>
              <MaterialIcons name="add-location-alt" size={24} color={theme.primary} />
              <Text style={[styles.addAddrText, { color: theme.primary }]}>Thêm địa chỉ</Text>
            </TouchableOpacity>
          ) : (
            <>
              {addresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  onPress={() => setSelectedAddress(addr)}
                  activeOpacity={0.8}
                  style={[
                    styles.addrRow,
                    selectedAddress?.id === addr.id && { borderColor: theme.primary, borderWidth: 2 },
                  ]}>
                  <MaterialIcons
                    name={selectedAddress?.id === addr.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={theme.primary}
                  />
                  <View style={styles.addrBody}>
                    <Text style={[styles.addrName, { color: theme.text }]}>{addr.recipientName}</Text>
                    <Text style={styles.addrPhone}>{addr.phone}</Text>
                    <Text style={styles.addrFull}>{addr.fullAddress}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => router.push('/addresses')}
                style={styles.changeAddr}
                activeOpacity={0.8}>
                <MaterialIcons name="edit" size={18} color={theme.primary} />
                <Text style={[styles.changeAddrText, { color: theme.primary }]}>Quản lý địa chỉ</Text>
              </TouchableOpacity>
            </>
          )}
          {selectedAddress &&
            addresses.length > 0 &&
            !(
              selectedAddress.provinceId != null &&
              selectedAddress.districtId != null &&
              selectedAddress.wardCode != null &&
              String(selectedAddress.wardCode).trim() !== ''
            ) && (
              <Text style={[styles.addrHint, { color: theme.textSecondary ?? '#6b7280' }]}>
                Địa chỉ chưa có Tỉnh/Quận/Xã từ danh sách. Phí ship tính theo TP.HCM. Cập nhật địa chỉ để tính chính xác.
              </Text>
            )}
        </View>

        {/* Hình thức thanh toán */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hình thức thanh toán</Text>
          <TouchableOpacity
            onPress={() => setPaymentMethod('COD')}
            style={[
              styles.payRow,
              paymentMethod === 'COD' && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            activeOpacity={0.8}>
            <MaterialIcons
              name={paymentMethod === 'COD' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.payLabel, { color: theme.text }]}>Thanh toán khi nhận hàng (COD)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMethod('VNPay')}
            style={[
              styles.payRow,
              paymentMethod === 'VNPay' && { borderColor: theme.primary, borderWidth: 2 },
            ]}
            activeOpacity={0.8}>
            <MaterialIcons
              name={paymentMethod === 'VNPay' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.payLabel, { color: theme.text }]}>VNPay (Thẻ, QR, Ngân hàng)</Text>
          </TouchableOpacity>
        </View>

        {/* Mã giảm giá (vd: SALE10, FREESHIP50) */}
        <View style={[styles.voucherRow, { borderColor: '#e5e7eb', backgroundColor: theme.background }]}>
          <MaterialIcons name="local-offer" size={20} color={theme.primary} />
          <TextInput
            value={voucherCode ?? ''}
            onChangeText={(t) => setVoucherCode(t.trim() || null)}
            placeholder="Mã giảm giá (SALE10, FREESHIP50...)"
            placeholderTextColor="#9ca3af"
            style={[styles.voucherInput, { color: theme.text }]}
          />
          {voucherCode ? (
            <TouchableOpacity onPress={() => setVoucherCode(null)} activeOpacity={0.8}>
              <Text style={styles.voucherRemove}>Xóa</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tóm tắt đơn hàng */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tóm tắt đơn hàng</Text>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
          ) : preview ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{formatPrice(preview.totalAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>-{formatPrice(preview.discountAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{formatPrice(preview.shippingFee)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>Tổng thanh toán</Text>
                <Text style={[styles.summaryTotalValue, { color: theme.primary }]}>{formatPrice(preview.finalAmount)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/orders')}
              style={[styles.backToCartBtn, { borderColor: theme.primary }]}
              activeOpacity={0.8}>
              <MaterialIcons name="shopping-cart" size={18} color={theme.primary} />
              <Text style={[styles.backToCartText, { color: theme.primary }]}>Quay lại giỏ hàng</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Nút xác nhận */}
      {canConfirm && (
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={submitting}
            style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.9}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Xác nhận đặt hàng</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  addAddrText: { fontSize: 15, fontWeight: '500' },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 8,
  },
  addrBody: { flex: 1 },
  addrName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  addrPhone: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  addrFull: { fontSize: 13, color: '#6b7280' },
  changeAddr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  changeAddrText: { fontSize: 14, fontWeight: '500' },
  addrHint: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 8,
  },
  payLabel: { fontSize: 15 },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  voucherInput: { flex: 1, fontSize: 14 },
  voucherRemove: { fontSize: 14, color: '#ef4444' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '500' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 12 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { fontSize: 16, fontWeight: '700' },
  loader: { paddingVertical: 24 },
  errorBox: { marginBottom: 12 },
  errText: { fontSize: 13, color: '#ef4444', marginBottom: 8 },
  backToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
  },
  backToCartText: { fontSize: 14, fontWeight: '600' },
  spacer: { height: 24 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
