import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProductById, Product, formatPrice } from '@/lib/productsApi';
import { getReviewsByProductId, ReviewDto, PagedResult } from '@/lib/reviewsApi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { config } from '@/lib/config';

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const theme = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<PagedResult<ReviewDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const [productRes, reviewsRes] = await Promise.all([
          getProductById(id, token || undefined),
          getReviewsByProductId(id, 1, 5, token || undefined), // fetch first 5 reviews
        ]);

        if (productRes.success && productRes.data) {
          setProduct(productRes.data);
          if (productRes.data.productVariants?.length) {
            setSelectedVariantId(productRes.data.productVariants[0].variantId);
          }
        } else {
          setError(productRes.message || 'Không thể tải thông tin sản phẩm.');
        }

        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, token]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>{error || 'Không tìm thấy sản phẩm'}</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedVariant = product.productVariants?.find((v) => v.variantId === selectedVariantId);
  const displayPrice = selectedVariant?.price ?? product.basePrice;
  const isOutOfStock = product.isDeleted || (selectedVariant?.stockQuantity !== undefined && selectedVariant.stockQuantity <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const primaryImage = product.productImages?.find((img) => img.isPrimary)?.imageUrl || product.productImages?.[0]?.imageUrl;
    const imageSource = primaryImage
      ? { uri: primaryImage.startsWith('http') ? primaryImage : `${config.apiBaseUrl}${primaryImage}` }
      : PLACEHOLDER_IMAGE;

    addItem({
      id: selectedVariantId ?? product.productId,
      productId: product.productId,
      variantId: selectedVariantId || undefined,
      name: product.productName,
      unitPrice: displayPrice,
      image: imageSource,
      weight: product.unit || product.origin || undefined,
    });

    if (Platform.OS === 'android') {
      ToastAndroid.show('Đã thêm sản phẩm vào giỏ hàng', ToastAndroid.SHORT);
    } else {
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng');
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    
    // Prepare image for Buy Now
    const primaryImage = product.productImages?.find((img) => img.isPrimary)?.imageUrl || product.productImages?.[0]?.imageUrl;
    const imageSource = primaryImage
      ? (primaryImage.startsWith('http') ? primaryImage : `${config.apiBaseUrl}${primaryImage}`)
      : '';

    router.push({
      pathname: '/checkout',
      params: {
        buyNowProductId: product.productId,
        buyNowVariantId: selectedVariantId ?? '',
        buyNowQuantity: '1',
        buyNowProductName: product.productName,
        buyNowProductImage: imageSource,
        buyNowUnitPrice: displayPrice.toString(),
        buyNowWeight: product.unit || product.origin || ''
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Absolute Back Button over scrollable content */}
      <View style={[styles.headerActions, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(tabs)/orders')}>
          <MaterialIcons name="shopping-cart" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width, height: width }}>
          {product.productImages?.length > 0 ? (
            product.productImages.map((img) => {
              const uri = img.imageUrl?.startsWith('http') ? img.imageUrl : `${config.apiBaseUrl}${img.imageUrl}`;
              return <Image key={img.imageId} source={{ uri }} style={{ width, height: width }} contentFit="cover" />;
            })
          ) : (
            <Image source={PLACEHOLDER_IMAGE} style={{ width, height: width }} contentFit="cover" />
          )}
        </ScrollView>

        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{product.productName}</Text>
            {product.isOrganic && (
              <View style={styles.organicBadge}>
                <Text style={styles.organicText}>Hữu cơ</Text>
              </View>
            )}
          </View>

          <Text style={[styles.price, { color: theme.primary }]}>{formatPrice(displayPrice)}</Text>

          <View style={styles.infoGrid}>
            {product.origin && (
              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={16} color="#6b7280" />
                <Text style={styles.infoText}>Xuất xứ: {product.origin}</Text>
              </View>
            )}
            {product.unit && (
              <View style={styles.infoItem}>
                <MaterialIcons name="inventory-2" size={16} color="#6b7280" />
                <Text style={styles.infoText}>Đơn vị: {product.unit}</Text>
              </View>
            )}
            {product.categoryName && (
              <View style={styles.infoItem}>
                <MaterialIcons name="category" size={16} color="#6b7280" />
                <Text style={styles.infoText}>DM: {product.categoryName}</Text>
              </View>
            )}
          </View>

          {/* Variants */}
          {product.productVariants && product.productVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Phân loại</Text>
              <View style={styles.variantsRow}>
                {product.productVariants.map((variant) => {
                  const isSelected = variant.variantId === selectedVariantId;
                  const noStock = variant.stockQuantity !== undefined && variant.stockQuantity <= 0;
                  return (
                    <TouchableOpacity
                      key={variant.variantId}
                      style={[
                        styles.variantPill,
                        isSelected && { borderColor: theme.primary, backgroundColor: `${theme.primary}10` },
                        noStock && styles.variantPillDisabled,
                      ]}
                      onPress={() => !noStock && setSelectedVariantId(variant.variantId)}
                      activeOpacity={0.7}
                      disabled={noStock}
                    >
                      <Text style={[styles.variantText, isSelected && { color: theme.primary }, noStock && { color: '#9ca3af' }]}>
                        {variant.variantName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Provider */}
          {product.provider?.providerName && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhà cung cấp</Text>
              <View style={styles.providerBox}>
                <MaterialIcons name="store" size={24} color={theme.primary} />
                <Text style={styles.providerName}>{product.provider?.providerName}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mô tả sản phẩm</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Đánh giá</Text>
              {reviews?.totalCount !== undefined && (
                <Text style={styles.reviewCount}>({reviews.totalCount} đánh giá)</Text>
              )}
            </View>
            
            {reviews?.items && reviews.items.length > 0 ? (
              reviews.items.map((review) => (
                <View key={review.reviewId} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name={star <= review.ratingValue ? "star" : "star-border"}
                          size={16}
                          color="#facc15"
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: isOutOfStock ? '#d1d5db' : theme.primary }]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-shopping-cart" size={20} color={isOutOfStock ? '#9ca3af' : theme.primary} />
          <Text style={[styles.btnOutlineText, { color: isOutOfStock ? '#9ca3af' : theme.primary }]}>
            Thêm vào giỏ
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.btnSolid, { backgroundColor: isOutOfStock ? '#d1d5db' : theme.primary }]}
          onPress={handleBuyNow}
          disabled={isOutOfStock}
          activeOpacity={0.8}
        >
          <Text style={styles.btnSolidText}>
            {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  headerActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 100, // space for bottom bar
  },
  detailsContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  organicBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  organicText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  variantPill: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  variantPillDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
  },
  variantText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  providerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    flexDirection: 'row',
    gap: 12,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  btnOutlineText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSolid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  btnSolidText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
