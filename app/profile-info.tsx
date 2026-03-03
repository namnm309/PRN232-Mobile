import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { InputField } from '@/components/auth/InputField';
import { AuthButton } from '@/components/auth/Button';
import { useAuth } from '@/context/AuthContext';
import { getAvatarUri, setAvatarUri } from '@/lib/avatarStorage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { user, token, updateUser, changePassword, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const displayEmail = user?.email ?? '';

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setPhoneNumber(user?.phoneNumber ?? '');
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      getAvatarUri(user.id).then(setAvatarUriState);
    }
  }, [user?.id]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri && user?.id) {
      const uri = result.assets[0].uri;
      await setAvatarUri(user.id, uri);
      setAvatarUriState(uri);
    }
  };

  const handleSave = async () => {
    if (!token) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
      return;
    }

    const trimmedDisplayName = displayName.trim();

    if (!trimmedDisplayName) {
      setError('Họ tên không được để trống');
      return;
    }

    if (trimmedDisplayName.length > 150) {
      setError('Họ tên tối đa 150 ký tự');
      return;
    }

    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone && trimmedPhone.length > 20) {
      setError('Số điện thoại tối đa 20 ký tự');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateUser({
        displayName: trimmedDisplayName || null,
        phoneNumber: trimmedPhone || null,
      });
      Alert.alert('Thành công', 'Đã cập nhật thông tin.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.';
      setError(msg);
      const is401 = msg.includes('401') || msg.includes('hết hạn') || msg.includes('không hợp lệ');
      Alert.alert(
        'Lỗi',
        msg,
        is401
          ? [
              { text: 'Đăng nhập lại', onPress: () => logout() },
              { text: 'Đóng', style: 'cancel' },
            ]
          : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await logout();
      Alert.alert('Thành công', 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setPasswordError(msg);
      Alert.alert('Lỗi', msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarLetter = user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? 'N';

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Thông tin cá nhân"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Ảnh đại diện */}
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={styles.avatarSection}>
            <View style={[styles.avatarWrap, { backgroundColor: theme.primaryLight }]}>
              {avatarUri ? (
                <ExpoImage source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              )}
              <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}>
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              </View>
            </View>
            <Text style={[styles.avatarHint, { color: theme.text }]}>
              Chạm để thay ảnh đại diện
            </Text>
          </TouchableOpacity>

          {/* Họ tên */}
          <View style={styles.fields}>
            <InputField
              label="Họ và tên"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nhập họ và tên"
              leftIcon="person"
              error={error && error.includes('Họ tên') ? error : undefined}
              maxLength={150}
            />
            <InputField
              label="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Nhập số điện thoại"
              leftIcon="call"
              keyboardType="phone-pad"
              maxLength={20}
              error={error && error.includes('điện thoại') ? error : undefined}
            />
            {/* Email - chỉ đọc */}
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.readOnlyInput, { backgroundColor: theme.background }]}>
                <Text style={[styles.readOnlyText, { color: theme.text }]} numberOfLines={1}>
                  {displayEmail || 'Chưa có email'}
                </Text>
                <MaterialIcons name="lock" size={18} color="#9ca3af" />
              </View>
              <Text style={styles.readOnlyHint}>Email không thể thay đổi</Text>
            </View>
          </View>

          <AuthButton
            title="Lưu thay đổi"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />

          {/* Đổi mật khẩu */}
          <View style={styles.passwordSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Đổi mật khẩu</Text>
            <InputField
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              leftIcon="password"
              secureTextEntry
              showPasswordToggle
              error={passwordError && passwordError.includes('hiện tại') ? passwordError : undefined}
            />
            <InputField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              leftIcon="password"
              secureTextEntry
              showPasswordToggle
              error={
                passwordError && (passwordError.includes('mới') || passwordError.includes('khớp'))
                  ? passwordError
                  : undefined
              }
            />
            <InputField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              leftIcon="password"
              secureTextEntry
              showPasswordToggle
            />
            <AuthButton
              title="Đổi mật khẩu"
              onPress={handleChangePassword}
              variant="outline"
              loading={passwordLoading}
              disabled={passwordLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    padding: 4,
  },
  form: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: '700',
    color: '#052e16',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.8,
  },
  fields: {
    marginBottom: 20,
  },
  readOnlyField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  readOnlyText: {
    fontSize: 16,
    flex: 1,
  },
  readOnlyHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  passwordSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
});
