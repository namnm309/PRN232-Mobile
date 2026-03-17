import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile-info" options={{ title: 'Thông tin cá nhân' }} />
          <Stack.Screen name="addresses" options={{ title: 'Địa chỉ giao hàng' }} />
          <Stack.Screen name="address-edit" options={{ title: 'Địa chỉ' }} />
          <Stack.Screen name="my-orders" options={{ title: 'Đơn hàng của tôi' }} />
          <Stack.Screen name="order-detail" options={{ title: 'Chi tiết đơn hàng' }} />
          <Stack.Screen name="checkout" options={{ title: 'Đặt hàng' }} />
          <Stack.Screen name="vnpay-payment" options={{ title: 'Thanh toán VNPay' }} />
          <Stack.Screen name="thank-you" options={{ title: 'Đặt hàng thành công' }} />
          <Stack.Screen name="voucher-wallet" options={{ title: 'Ví voucher' }} />
          <Stack.Screen name="notifications" options={{ title: 'Thông báo' }} />
          <Stack.Screen name="support" options={{ title: 'Trung tâm hỗ trợ' }} />
          <Stack.Screen name="policy" options={{ title: 'Điều khoản & Chính sách' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
