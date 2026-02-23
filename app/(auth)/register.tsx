import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AuthButton,
  AuthFooterLink,
  AuthScreenWrapper,
  CheckboxTerms,
  InputField,
  LogoApp,
} from '@/components/auth';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    const e = email.trim().toLowerCase();
    if (!displayName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!e) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError('Email không hợp lệ');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Nhập lại mật khẩu không khớp');
      return;
    }
    if (!termsAccepted) {
      setError('Vui lòng đồng ý với Điều khoản và Điều kiện');
      return;
    }
    try {
      const { email: sentEmail } = await register({
        email: e,
        displayName: displayName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        password,
        confirmPassword,
      });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: sentEmail, displayName: displayName.trim(), phoneNumber: phoneNumber.trim() },
      });
    } catch (err: any) {
      setError(err?.message ?? 'Đăng ký thất bại');
    }
  };

  return (
    <AuthScreenWrapper showBack>
      <View style={styles.center}>
        <LogoApp />
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>
          Tham gia cộng đồng nông nghiệp xanh ngay hôm nay
        </Text>
      </View>

      <InputField
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        value={displayName}
        onChangeText={setDisplayName}
        leftIcon="person"
      />
      <InputField
        label="Số điện thoại"
        placeholder="0912 345 678"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        leftIcon="call"
      />
      <InputField
        label="Email"
        placeholder="email@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="email"
      />
      <InputField
        label="Mật khẩu"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        showPasswordToggle
        leftIcon="password"
      />
      <InputField
        label="Nhập lại mật khẩu"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        showPasswordToggle
        leftIcon="key"
      />

      <CheckboxTerms value={termsAccepted} onToggle={() => setTermsAccepted((v) => !v)} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthButton
        title="Đăng ký"
        onPress={handleRegister}
        variant="primary"
        loading={isLoading}
        style={styles.btn}
      />

      <AuthFooterLink prompt="Đã có tài khoản?" linkText="Đăng nhập" href="/(auth)/login" />
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    marginTop: 8,
  },
});
