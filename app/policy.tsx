import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Điều khoản & Chính sách"
        left={
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Điều khoản sử dụng Nông Xanh
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Khi sử dụng ứng dụng Nông Xanh, bạn đồng ý tuân thủ các điều khoản sau:{'\n\n'}
            1. Tài khoản: Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động
            diễn ra qua tài khoản của mình.{'\n\n'}
            2. Đặt hàng: Đơn hàng sau khi đặt sẽ được xử lý và không thể hủy nếu đã chuyển
            sang trạng thái đang giao.{'\n\n'}
            3. Thanh toán: Nông Xanh hỗ trợ thanh toán khi nhận hàng (COD) và các phương thức
            trực tuyến. Vui lòng thanh toán đầy đủ khi nhận hàng.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Chính sách bảo mật
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Nông Xanh cam kết bảo vệ thông tin cá nhân của bạn:{'\n\n'}
            • Chúng tôi thu thập thông tin cần thiết để phục vụ đặt hàng, giao hàng và hỗ trợ
            khách hàng.{'\n\n'}
            • Thông tin không được chia sẻ cho bên thứ ba vì mục đích thương mại.{'\n\n'}
            • Bạn có quyền yêu cầu xem, sửa hoặc xóa dữ liệu cá nhân của mình.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Chính sách đổi trả
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            • Sản phẩm lỗi, hư hỏng: Đổi/trả trong vòng 24h kèm ảnh chụp.{'\n\n'}
            • Sản phẩm không đúng mô tả: Hoàn tiền hoặc đổi sản phẩm đúng.{'\n\n'}
            • Liên hệ hotline hoặc email hỗ trợ để được xử lý nhanh chóng.
          </Text>
        </View>

        <Text style={[styles.footer, { color: theme.text }]}>
          © Nông Xanh – Ứng dụng mua sắm nông sản tươi sạch
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBtn: { padding: 4 },
  content: { paddingBottom: 24 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, opacity: 0.9 },
  footer: { fontSize: 13, textAlign: 'center', opacity: 0.7 },
});
