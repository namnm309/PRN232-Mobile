import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
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

  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const getQueryParam = (url: string, param: string) => {
    param = param.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    if (isProcessing) return;

    // The backend redirect URL typically includes 'vnp_ResponseCode'
    if (url.includes('vnp_ResponseCode=')) {
      setIsProcessing(true);
      
      // Stop WebView from loading the frontend redirect page visually
      webViewRef.current?.stopLoading();
      
      const responseCode = getQueryParam(url, 'vnp_ResponseCode');
      
      if (responseCode === '00') {
        // Success
        Alert.alert(
          'Thanh toán thành công',
          'Đơn hàng của bạn đã được thanh toán qua VNPay thành công.',
          [{ text: 'Tiếp tục', onPress: () => {
             router.replace({
               pathname: '/thank-you',
               params: { orderId },
             });
          }}]
        );
      } else {
        // Failed
        Alert.alert(
          'Thanh toán thất bại',
          'Giao dịch thanh toán bị hủy hoặc đã xảy ra lỗi. Đơn hàng của bạn đã được ghi nhận nhưng chưa thanh toán.',
          [{ text: 'Đóng', onPress: () => {
             router.replace('/(tabs)'); 
          }}]
        );
      }
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Thanh toán VNPay"
        left={
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        {loading && !isProcessing && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Đang tải trang thanh toán VNPay...</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  content: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errText: { fontSize: 16, color: '#ef4444', marginTop: 12 },
  loadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
});
