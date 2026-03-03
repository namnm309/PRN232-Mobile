import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppHeader } from '@/components/layout/AppHeader';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ScreenContainer scroll={false}>
      <AppHeader
        title="Trung tâm hỗ trợ"
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
            Chào mừng đến với Trung tâm hỗ trợ Nông Xanh
          </Text>
          <Text style={[styles.body, { color: theme.text }]}>
            Nông Xanh là ứng dụng mua sắm nông sản tươi sạch, kết nối người tiêu dùng với
            nguồn cung uy tín. Chúng tôi cam kết mang đến sản phẩm chất lượng, an toàn và
            giá tốt nhất.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>Câu hỏi thường gặp</Text>
          <Text style={[styles.body, { color: theme.text }]}>
            • Cách đặt hàng: Thêm sản phẩm vào giỏ, chọn địa chỉ giao hàng và thanh toán.{'\n'}
            • Thời gian giao hàng: Thường từ 1–3 ngày tùy khu vực.{'\n'}
            • Đổi trả: Liên hệ hotline trong vòng 24h sau khi nhận hàng.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Text style={[styles.subtitle, { color: theme.text }]}>Liên hệ hỗ trợ</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:19001234')}
            style={styles.contactRow}
            activeOpacity={0.8}>
            <MaterialIcons name="phone" size={22} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>Hotline: 1900 1234</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@nongxanh.vn')}
            style={styles.contactRow}
            activeOpacity={0.8}>
            <MaterialIcons name="email" size={22} color={theme.primary} />
            <Text style={[styles.contactText, { color: theme.primary }]}>
              support@nongxanh.vn
            </Text>
          </TouchableOpacity>
        </View>
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
  subtitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, opacity: 0.9 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  contactText: { fontSize: 15, fontWeight: '500' },
});
