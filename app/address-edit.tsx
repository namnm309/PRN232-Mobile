import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { InputField } from '@/components/auth/InputField';
import { AuthButton } from '@/components/auth/Button';
import { useAuth } from '@/context/AuthContext';
import {
  getAddresses,
  addAddress,
  updateAddress,
  type ShippingAddress,
} from '@/lib/addressStorage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AddressEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const isEdit = !!params.id;

  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const [masterPhone, setMasterPhone] = useState<string | null>(null);

  const loadAddress = useCallback(async () => {
    if (!user?.id) return;
    const list = await getAddresses(user.id);
    const master = user.phoneNumber?.trim() || (list.length > 0 ? list[0].phone : null);
    setMasterPhone(master);
    if (params.id) {
      const addr = list.find((a) => a.id === params.id);
      if (addr) {
        setRecipientName(addr.recipientName);
        setPhone(addr.phone);
        setFullAddress(addr.fullAddress);
        setIsDefault(addr.isDefault ?? false);
      }
    } else if (master) {
      setPhone(master);
    }
  }, [user?.id, user?.phoneNumber, params.id]);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const handleSave = async () => {
    if (!user?.id) return;
    const trimName = recipientName.trim();
    const trimPhone = phone.trim();
    const trimAddr = fullAddress.trim();
    if (!trimName) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên người nhận.');
      return;
    }
    if (!trimPhone) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }
    if (masterPhone && trimPhone !== masterPhone) {
      Alert.alert(
        'Số điện thoại không khớp',
        'Tất cả địa chỉ phải dùng chung một số điện thoại để đặt hàng. Vui lòng dùng SĐT đã đăng ký.'
      );
      return;
    }
    if (!trimAddr) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && params.id) {
        await updateAddress(user.id, params.id, {
          recipientName: trimName,
          phone: trimPhone,
          fullAddress: trimAddr,
          isDefault,
        });
        Alert.alert('Thành công', 'Đã cập nhật địa chỉ.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await addAddress(user.id, {
          recipientName: trimName,
          phone: trimPhone,
          fullAddress: trimAddr,
          isDefault,
        });
        Alert.alert('Thành công', 'Đã thêm địa chỉ.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title={isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.form}>
        <InputField
          label="Họ tên người nhận"
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Nhập họ tên"
          leftIcon="person"
        />
        <InputField
          label="Số điện thoại"
          value={phone}
          onChangeText={masterPhone ? () => {} : setPhone}
          placeholder="Nhập SĐT"
          leftIcon="call"
          keyboardType="phone-pad"
          editable={!masterPhone}
        />
        {masterPhone ? (
          <Text style={styles.phoneHint}>Tất cả địa chỉ phải dùng chung SĐT này để đặt hàng</Text>
        ) : null}
        <InputField
          label="Địa chỉ"
          value={fullAddress}
          onChangeText={setFullAddress}
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
          leftIcon="person"
        />
        <TouchableOpacity
          onPress={() => setIsDefault(!isDefault)}
          style={styles.checkboxRow}
          activeOpacity={0.8}>
          <MaterialIcons
            name={isDefault ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={isDefault ? theme.primary : '#9ca3af'}
          />
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>
            Đặt làm địa chỉ mặc định
          </Text>
        </TouchableOpacity>

        <AuthButton
          title={isEdit ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
          onPress={handleSave}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  form: { paddingTop: 8 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  checkboxLabel: { fontSize: 15 },
  phoneHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 16,
  },
});
