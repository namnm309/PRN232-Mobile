import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUri } from '@/lib/avatarStorage';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại.');
    }
  };

  const handleComingSoon = () => {
    Alert.alert('Thông báo', 'Tính năng đang được phát triển.');
  };

  const handleProfileInfo = () => router.push('/profile-info');
  const handleAddresses = () => router.push('/addresses');
  const handleOrders = () => router.push('/my-orders');
  const handleSupport = () => router.push('/support');
  const handlePolicy = () => router.push('/policy');
  const handleNotifications = () => router.push('/notifications');
  const handleVoucherWallet = () => router.push('/voucher-wallet');

  const accountItems = [
    {
      key: 'profile-info',
      label: 'Thông tin cá nhân',
      description: 'Xem và cập nhật hồ sơ của bạn',
      icon: 'person.fill',
    },
    {
      key: 'voucher-wallet',
      label: 'Ví voucher',
      description: 'Voucher của bạn còn hiệu lực',
      icon: 'gift.fill',
    },
    {
      key: 'address',
      label: 'Địa chỉ giao hàng',
      description: 'Quản lý địa chỉ nhận hàng',
      icon: 'mappin.and.ellipse',
    },
    {
      key: 'payment',
      label: 'Phương thức thanh toán',
      description: 'Thêm hoặc chỉnh sửa thẻ, ví',
      icon: 'creditcard.fill',
    },
    {
      key: 'orders',
      label: 'Đơn hàng của tôi',
      description: 'Xem lịch sử mua hàng',
      icon: 'bag.fill',
    },
  ] as const;

  const supportItems = [
    {
      key: 'notification',
      label: 'Thông báo',
      description: 'Thiết lập nhận thông báo',
      icon: 'bell.fill',
    },
    {
      key: 'support',
      label: 'Trung tâm hỗ trợ',
      description: 'Câu hỏi thường gặp, liên hệ',
      icon: 'questionmark.circle.fill',
    },
    {
      key: 'policy',
      label: 'Điều khoản & chính sách',
      description: 'Điều khoản sử dụng, bảo mật',
      icon: 'doc.text.fill',
    },
  ] as const;

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getAvatarUri(user.id).then(setAvatarUri);
      } else {
        setAvatarUri(null);
      }
    }, [user?.id])
  );

  const avatarLetter = user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? 'N';
  const displayName = user?.displayName ?? 'Người dùng Nông Xanh';
  const displayEmail = user?.email ?? 'Chưa có email';

  return (
    <ScreenContainer>
      <AppHeader title="Tài khoản" />

      <View style={styles.headerSection}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colorScheme === 'dark' ? '#111827' : '#f9fafb',
            },
          ]}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            {avatarUri ? (
              <ExpoImage source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text
              style={[
                styles.email,
                { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' },
              ]}
              numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tài khoản</Text>
        {accountItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            activeOpacity={0.7}
            onPress={
              item.key === 'profile-info'
                ? handleProfileInfo
                : item.key === 'voucher-wallet'
                  ? handleVoucherWallet
                  : item.key === 'address'
                    ? handleAddresses
                    : item.key === 'orders'
                      ? handleOrders
                      : handleComingSoon
            }>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.primaryLight }]}>
                <IconSymbol name={item.icon} size={18} color="#052e16" />
              </View>
              <View style={styles.itemTextWrapper}>
                <Text style={[styles.itemLabel, { color: theme.text }]}>{item.label}</Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' },
                  ]}
                  numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colorScheme === 'dark' ? '#6b7280' : '#9ca3af'}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hỗ trợ</Text>
        {supportItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            activeOpacity={0.7}
            onPress={
              item.key === 'notification'
                ? handleNotifications
                : item.key === 'support'
                  ? handleSupport
                  : item.key === 'policy'
                    ? handlePolicy
                    : handleComingSoon
            }>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIconWrapper, { backgroundColor: theme.primaryLight }]}>
                <IconSymbol name={item.icon} size={18} color="#052e16" />
              </View>
              <View style={styles.itemTextWrapper}>
                <Text style={[styles.itemLabel, { color: theme.text }]}>{item.label}</Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' },
                  ]}
                  numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colorScheme === 'dark' ? '#6b7280' : '#9ca3af'}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[styles.logoutButton, { borderColor: theme.primary }]}>
        <Text style={[styles.logoutText, { color: theme.primary }]}>
          {isLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#052e16',
  },
  info: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

