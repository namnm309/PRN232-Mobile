import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebBrowser } from 'expo-web-browser';
import * as Linking from 'expo-linking';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VnPayPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; orderId?: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const paymentUrl = params.url;
  const orderId = params.orderId ?? '';

  const [opening, setOpening] = useState(false);

  const handleOpenPayment = async () => {
    if (!paymentUrl) return;
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(paymentUrl, {
        toolbarColor: theme.primary,
        controlsColor: theme.primary,
      });
    } catch {
      // fallback: open with Linking
      await Linking.openURL(paymentUrl);
    } finally {
      setOpening(false);
    }
  };

  const handleDone = () => {
    router.replace({
      pathname: '/thank-you',
      params: { orderId },
    });
  };

  if (!paymentUrl) {
    return (
      <ScreenContainer>
        <AppHeader title="Thanh toán VNPay" left={<View />} />
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errText}>URL thanh toán không hợp lệ</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        title="Thanh toán VNPay"
        left={
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <MaterialIcons name="payment" size={64} color={theme.primary} style={styles.icon} />
        <Text style={[styles.title, { color: theme.text }]}>Thanh toán qua VNPay</Text>
        <Text style={styles.desc}>
          Nhấn nút bên dưới để mở trang thanh toán VNPay. Sau khi thanh toán xong, quay lại app và nhấn "Tôi đã thanh
          toán xong".
        </Text>

        <TouchableOpacity
          onPress={handleOpenPayment}
          disabled={opening}
          style={[styles.openBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.9}>
          {opening ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.openBtnText}>Mở trang thanh toán VNPay</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDone}
          style={[styles.doneBtn, { borderColor: theme.primary }]}
          activeOpacity={0.8}>
          <MaterialIcons name="check-circle" size={22} color={theme.primary} />
          <Text style={[styles.doneBtnText, { color: theme.primary }]}>Tôi đã thanh toán xong</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  icon: { marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  desc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  openBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  openBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
  },
  doneBtnText: { fontSize: 15, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errText: { fontSize: 16, color: '#ef4444', marginTop: 12 },
});
