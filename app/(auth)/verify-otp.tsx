import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton, AuthScreenWrapper, InputField } from '@/components/auth';
import { useAuth } from '@/context/AuthContext';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    displayName?: string;
    phoneNumber?: string;
  }>();
  const { verifyOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const email = params.email ?? '';

  const handleVerify = async () => {
    setError('');
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    const trimmed = otp.trim();
    if (trimmed.length < 4 || trimmed.length > 10) {
      setError('Mã OTP từ 4 đến 10 ký tự');
      return;
    }
    try {
      await verifyOtp({
        email,
        otp: trimmed,
        displayName: params.displayName || undefined,
        phoneNumber: params.phoneNumber || undefined,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Xác thực OTP thất bại');
    }
  };

  if (!email) {
    return (
      <AuthScreenWrapper showBack>
        <Text style={styles.error}>Thiếu thông tin. Vui lòng đăng ký lại.</Text>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper showBack>
      <Text style={styles.title}>Xác thực OTP</Text>
      <Text style={styles.subtitle}>
        Mã OTP đã được gửi đến {email}. Vui lòng nhập mã để hoàn tất đăng ký.
      </Text>

      <InputField
        placeholder="Nhập mã OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={10}
        autoFocus
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthButton
        title="Xác thực"
        onPress={handleVerify}
        variant="primary"
        loading={isLoading}
        style={styles.btn}
      />
    </AuthScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
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
