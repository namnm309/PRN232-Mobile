import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useCart, type CartItem } from '@/context/CartContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';
import { GHN_DEFAULT } from '@/constants/ghnDefaults';
import { clearBeCart, addCartItem } from '@/lib/cartApi';
import { previewCheckout } from '@/lib/checkoutApi';
import { getProductById, getProductVariants } from '@/lib/productsApi';
import { applyVoucher } from '@/lib/vouchers';

const formatPrice = (v: number) => `${v.toLocaleString('vi-VN')}đ`;

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

export default function CartScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { items, updateQuantity, subtotal } = useCart();
  const { token } = useAuth();
  
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  
  const [estimatedShippingFee, setEstimatedShippingFee] = useState(0);
  const [isEstimatingConfig, setIsEstimatingConfig] = useState(false);
  const [estimationError, setEstimationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const handleApplyVoucher = () => {
    const result = applyVoucher(voucherCode, subtotal, estimatedShippingFee);
    if (result.success) {
      setAppliedDiscount(result.discount);
      setAppliedCode(voucherCode.trim().toUpperCase());
      Alert.alert('Thành công', result.message);
    } else {
      setAppliedDiscount(0);
      setAppliedCode(null);
      Alert.alert('Mã không hợp lệ', result.message);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedDiscount(0);
    setAppliedCode(null);
    setVoucherCode('');
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push({
      pathname: '/checkout',
      params: appliedCode ? { voucherCode: appliedCode } : undefined,
    });
  };

  const updateQuantityHandler = (productId: string, delta: number) => {
    updateQuantity(productId, delta);
    if (appliedDiscount > 0) {
      setAppliedDiscount(0);
      setAppliedCode(null);
    }
  };

  React.useEffect(() => {
    let mounted = true;
    
    if (!isFocused || items.length === 0 || !token) {
       setEstimatedShippingFee(0);
       setEstimationError(null);
       return;
    }

    const estimateFee = async () => {
      setIsEstimatingConfig(true);
      setEstimationError(null);
      try {
        const resolvedItems: Array<{variantId: string; quantity: number}> = [];
        const invalidNames: string[] = [];
        for (const item of items) {
          if (!mounted) return;
          let vid = item.variantId;
          
          try {
            const prodRes = await getProductById(item.productId, token);
            if (!mounted) return;
            const prod = prodRes.success ? prodRes.data : null;
            
            if (!prod || prod.isDeleted || ['inactive', 'deleted', 'discontinued', 'outofstock'].includes(prod.status?.toLowerCase() ?? '')) {
              invalidNames.push(item.name);
              continue;
            }

            if (!vid) {
               const varRes = await getProductVariants(token);
               if (!mounted) return;
               const v = varRes.success && varRes.data?.find((x) => x.productId === item.productId);
               if (v) vid = v.variantId;
            }
            if (vid) {
              resolvedItems.push({ variantId: vid, quantity: item.quantity });
            }
          } catch (err) {
            invalidNames.push(item.name);
          }
        }
        
        if (invalidNames.length > 0) {
           if (mounted) {
              setIsEstimatingConfig(false);
              setEstimatedShippingFee(0);
              setEstimationError(`Hết hàng: ${invalidNames.join(', ')}`);
           }
           return;
        }

        if (resolvedItems.length === 0) {
          if (mounted) { setIsEstimatingConfig(false); setEstimatedShippingFee(0); }
          return;
        }

        await clearBeCart(token);
        if (!mounted) return;
        
        const cartItemIds: string[] = [];
        for (const item of resolvedItems) {
            if (!mounted) return;
            const cart = await addCartItem(token, {
              variantId: item.variantId,
              quantity: item.quantity,
            });
            const added = cart.cartItems.find((c) => c.variantId === item.variantId);
            if (added) cartItemIds.push(added.cartItemId);
        }

        if (!mounted) return;
        
        if (cartItemIds.length > 0) {
             const p = await previewCheckout(token, {
                cartItemIds,
                provinceId: GHN_DEFAULT.provinceId,
                toDistrictId: GHN_DEFAULT.districtId,
                toWardCode: GHN_DEFAULT.wardCode,
                insuranceValue: Math.min(subtotal, 5_000_000),
              });
              if (!mounted) return;
              
              setEstimatedShippingFee(p.shippingFee);
              setEstimationError(null);
        }
      } catch(e: any) {
         console.log('Estimation error', e);
         if (mounted) {
            setEstimatedShippingFee(0);
            setEstimationError(e.message || 'Lỗi mạng');
         }
      } finally {
         if (mounted) setIsEstimatingConfig(false);
      }
    };
    
    // Quick debounce to avoid spamming the backend
    const timeoutId = setTimeout(estimateFee, 800);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [items, subtotal, token, isFocused]);

  const shippingFeeDisplay = items.length > 0 ? estimatedShippingFee : 0;
  const total = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(0, subtotal - appliedDiscount + estimatedShippingFee);
  }, [items.length, subtotal, appliedDiscount, estimatedShippingFee]);

  const getImageSource = (item: CartItem) => {
    if (typeof item.image === 'object' && item.image?.uri) {
      return item.image;
    }
    return PLACEHOLDER_IMAGE;
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const lineTotal = item.unitPrice * item.quantity;
    return (
      <View style={[styles.cartItem, { backgroundColor: theme.background }]}>
        <View style={styles.cartItemImageWrap}>
          <ExpoImage
            source={getImageSource(item)}
            style={styles.cartItemImage}
            contentFit="cover"
          />
        </View>
        <View style={styles.cartItemBody}>
          <Text numberOfLines={2} style={[styles.cartItemName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={styles.cartItemWeight}>{item.weight || '—'}</Text>
          <Text style={[styles.cartItemPrice, { color: theme.primary }]}>
            {formatPrice(item.unitPrice)}
          </Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateQuantityHandler(item.variantId ?? item.productId, -1)}
              style={[styles.quantityBtn, { borderColor: theme.primary }]}>
              <MaterialIcons name="remove" size={18} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: theme.text }]}>{item.quantity}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => updateQuantityHandler(item.variantId ?? item.productId, 1)}
              style={[styles.quantityBtn, { borderColor: theme.primary, backgroundColor: theme.primary }]}>
              <MaterialIcons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.cartItemTotal, { color: theme.primary }]}>
          {formatPrice(lineTotal)}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <AppHeader title="Giỏ hàng" subtitle="Xem và chỉnh sửa sản phẩm" />

      <FlatList
        data={items}
        keyExtractor={(item) => item.variantId ?? item.productId}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="shopping-cart" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          </View>
        }
        ListFooterComponent={
          <>
            <View style={[styles.voucherRow, { borderColor: '#e5e7eb' }]}>
              {appliedCode ? (
                <>
                  <View style={styles.appliedVoucherWrap}>
                    <Text style={[styles.appliedCode, { color: theme.primary }]}>
                      {appliedCode}
                    </Text>
                    <Text style={styles.appliedDiscount}>
                      -{formatPrice(appliedDiscount)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRemoveVoucher}
                    style={[styles.voucherBtn, { backgroundColor: '#ef4444' }]}>
                    <Text style={styles.voucherBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    value={voucherCode}
                    onChangeText={setVoucherCode}
                    placeholder="Nhập mã giảm giá"
                    placeholderTextColor="#9ca3af"
                    style={[styles.voucherInput, { color: theme.text }]}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleApplyVoucher}
                    style={[styles.voucherBtn, { backgroundColor: theme.primary }]}>
                    <Text style={styles.voucherBtnText}>Áp dụng</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={[styles.summaryBox, { backgroundColor: theme.background, borderColor: '#e5e7eb' }]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {formatPrice(subtotal)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  -{formatPrice(appliedDiscount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí giao hàng (ước tính)</Text>
                {isEstimatingConfig ? (
                  <Text style={[styles.summaryValue, { color: theme.text, fontStyle: 'italic' }]}>
                    Đang tính...
                  </Text>
                ) : estimationError ? (
                  <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                    {estimationError}
                  </Text>
                ) : (
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {formatPrice(shippingFeeDisplay)}
                  </Text>
                )}
              </View>
              <Text style={styles.summaryNote}>Phí ship & mã giảm giá sẽ tính chính xác khi đặt hàng</Text>
              <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                <Text style={styles.summaryLabelTotal}>Tổng cộng</Text>
                <Text style={[styles.summaryValueTotal, { color: theme.primary }]}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </>
        }
      />

      {items.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: theme.background }]}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarLabel}>Tổng thanh toán</Text>
            <Text style={[styles.bottomBarTotal, { color: theme.primary }]}>
              {formatPrice(total)}
            </Text>
            <Text style={styles.bottomBarNote}>Đã bao gồm VAT</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCheckout}
            style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.checkoutBtnText}>Đặt hàng</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cartItemImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  cartItemImage: {
    width: '100%',
    height: '100%',
  },
  cartItemBody: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cartItemWeight: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 12,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  voucherInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  appliedVoucherWrap: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  appliedDiscount: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
  voucherBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  voucherBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryRowTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    marginTop: 6,
    paddingTop: 10,
  },
  summaryNote: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  bottomBarLeft: {},
  bottomBarLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomBarTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomBarNote: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  checkoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
