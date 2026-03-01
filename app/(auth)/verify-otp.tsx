import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton, AuthScreenWrapper, InputField } from '@/components/auth';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

const RESEND_COOLDOWN_SECONDS = 60;

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
  const [successMessage, setSuccessMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  const email = params.email ?? '';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendOtp = async () => {
    setError('');
    setSuccessMessage('');
    if (!email) {
      setError('Thiếu email. Vui lòng đăng ký lại.');
      return;
    }
    setIsResending(true);
    try {
      await authApi.requestOtp(email);
      setSuccessMessage('Mã mới đã được gửi đến email của bạn');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Không thể gửi lại mã. Thử lại sau.');
    } finally {
      setIsResending(false);
    }
  };

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
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <AuthButton
        title="Xác thực"
        onPress={handleVerify}
        variant="primary"
        loading={isLoading}
        style={styles.btn}
      />

      <AuthButton
        title={countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
        onPress={handleResendOtp}
        variant="outline"
        loading={isResending}
        disabled={countdown > 0 || isResending}
        style={styles.resendBtn}
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
  success: {
    fontSize: 14,
    color: '#10b981',
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    marginTop: 8,
  },
  resendBtn: {
    width: '100%',
    marginTop: 12,
  },
});
