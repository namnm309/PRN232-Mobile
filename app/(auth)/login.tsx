import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AuthButton,
  AuthCard,
  AuthFooterLink,
  DividerWithText,
  InputField,
} from '@/components/auth';
import { AuthColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_RATIO = 4 / 10;
const HEADER_HEIGHT = SCREEN_HEIGHT * HEADER_RATIO;

export default function LoginScreen() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const e = email.trim().toLowerCase();
    if (!e) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError('Email không hợp lệ');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    try {
      await login({ email: e, password });
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập thất bại');
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Đăng nhập Google thất bại');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <ImageBackground
          source={require('@/assets/images/login-hero.png')}
          style={styles.hero}
          resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.95)']}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </View>
      <AuthCard>
        <KeyboardAvoidingView
          style={styles.formWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Chào mừng tới</Text>
            <Text style={styles.brand}>NongXanh</Text>
            <Text style={styles.subtitle}>Thực phẩm sạch từ nông trại</Text>

            <InputField
              placeholder="Email hoặc số điện thoại"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="email"
              error={error}
            />
            <InputField
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              leftIcon="password"
            />

            <TouchableOpacity
              onPress={() => {}}
              style={styles.forgot}
              activeOpacity={0.7}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <AuthButton
              title="Đăng nhập"
              onPress={handleLogin}
              variant="primary"
              loading={isLoading}
              style={styles.btn}
            />

            <DividerWithText />
            <AuthButton
              title="Đăng nhập bằng Google"
              onPress={handleGoogle}
              variant="outline"
              loading={false}
              style={styles.btn}
            />

            <AuthFooterLink
              prompt="Chưa có tài khoản?"
              linkText="Đăng ký ngay"
              href="/(auth)/register"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </AuthCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: AuthColors.dividerText,
    textAlign: 'center',
    marginBottom: 28,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 14,
    color: AuthColors.link,
    fontWeight: '500',
  },
  btn: {
    width: '100%',
    marginBottom: 8,
  },
});
