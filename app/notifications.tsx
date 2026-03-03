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
import {
  getNotifications,
  markNotificationAsRead,
  type NotificationDto,
} from '@/lib/notificationsApi';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const formatDate = (s: string) => {
  try {
    const d = new Date(s);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return s;
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const loadNotifications = useCallback(async () => {
    if (!token || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications(token, user.id, 1, 50);
      if (res.success && res.data) {
        setNotifications(res.data.items ?? []);
      } else {
        setError(res.message ?? 'Không thể tải thông báo');
      }
    } catch (e) {
      setError('Có lỗi xảy ra khi tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handlePressItem = async (item: NotificationDto) => {
    if (!item.isRead && token) {
      try {
        await markNotificationAsRead(item.notificationId, token);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === item.notificationId ? { ...n, isRead: true } : n
          )
        );
      } catch {
        // ignore
      }
    }
  };

  const renderItem = ({ item }: { item: NotificationDto }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handlePressItem(item)}
      style={[
        styles.card,
        {
          backgroundColor: item.isRead ? theme.background : theme.background,
          opacity: item.isRead ? 0.85 : 1,
        },
      ]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: item.isRead ? '#e5e7eb' : theme.primaryLight,
          },
        ]}>
        <MaterialIcons
          name="notifications"
          size={22}
          color={item.isRead ? '#9ca3af' : theme.primary}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              fontWeight: item.isRead ? '500' : '600',
            },
          ]}
          numberOfLines={1}>
          {item.title ?? 'Thông báo'}
        </Text>
        {item.content ? (
          <Text
            style={[styles.body, { color: theme.text }]}
            numberOfLines={2}>
            {item.content}
          </Text>
        ) : null}
        <Text style={[styles.date, { color: theme.text }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Thông báo"
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
            Đang tải thông báo...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadNotifications}
            style={[styles.retryBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.retryBtnText, { color: theme.primary }]}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="notifications-none" size={64} color="#9ca3af" />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Chưa có thông báo nào
          </Text>
          <Text style={styles.emptyHint}>
            Thông báo về đơn hàng và khuyến mãi sẽ hiển thị tại đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 15, marginBottom: 4 },
  body: { fontSize: 14, opacity: 0.85, marginBottom: 4 },
  date: { fontSize: 12, opacity: 0.7 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
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
