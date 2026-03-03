import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
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
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  type ShippingAddress,
} from '@/lib/addressStorage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';

export default function AddressesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const loadAddresses = useCallback(async () => {
    if (user?.id) {
      const list = await getAddresses(user.id);
      setAddresses(list);
    } else {
      setAddresses([]);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => void loadAddresses(), [loadAddresses]));

  const handleAdd = () => {
    router.push('/address-edit');
  };

  const handleEdit = (id: string) => {
    router.push({ pathname: '/address-edit', params: { id } });
  };

  const handleDelete = (addr: ShippingAddress) => {
    Alert.alert(
      'Xóa địa chỉ',
      `Bạn có chắc muốn xóa địa chỉ "${addr.recipientName} - ${addr.fullAddress}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (user?.id) {
              await deleteAddress(user.id, addr.id);
              loadAddresses();
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addr: ShippingAddress) => {
    if (!user?.id) return;
    await updateAddress(user.id, addr.id, { isDefault: true });
    loadAddresses();
  };

  const renderItem = ({ item }: { item: ShippingAddress }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.background }]}
      onPress={() => !item.isDefault && handleSetDefault(item)}
      activeOpacity={item.isDefault ? 1 : 0.7}>
      <View style={styles.cardHeader}>
        <Text style={[styles.recipient, { color: theme.text }]} numberOfLines={1}>
          {item.recipientName}
        </Text>
        {item.isDefault && (
          <View style={[styles.defaultBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.defaultBadgeText}>Mặc định</Text>
          </View>
        )}
      </View>
      <Text style={[styles.phone, { color: theme.text }]}>{item.phone}</Text>
      <Text style={[styles.address, { color: theme.text }]} numberOfLines={2}>
        {item.fullAddress}
      </Text>
      <View style={styles.actions}>
        {!item.isDefault && (
          <TouchableOpacity
            onPress={() => handleSetDefault(item)}
            style={[styles.actionBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>
              Đặt mặc định
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleEdit(item.id)}
          style={[styles.actionBtn, { borderColor: theme.primary }]}>
          <MaterialIcons name="edit" size={16} color={theme.primary} />
          <Text style={[styles.actionBtnText, { color: theme.primary }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={[styles.actionBtn, { borderColor: '#ef4444' }]}>
          <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Địa chỉ giao hàng"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
        right={
          <TouchableOpacity onPress={handleAdd} activeOpacity={0.8} style={styles.headerBtn}>
            <MaterialIcons name="add" size={24} color={theme.primary} />
          </TouchableOpacity>
        }
      />

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="location-on" size={64} color="#9ca3af" />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Chưa có địa chỉ giao hàng
          </Text>
          <Text style={styles.emptyHint}>Thêm địa chỉ để nhận hàng nhanh hơn</Text>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addFirstBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.addFirstBtnText}>Thêm địa chỉ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recipient: { fontSize: 16, fontWeight: '600' },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  phone: { fontSize: 14, marginBottom: 4 },
  address: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  addFirstBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addFirstBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
