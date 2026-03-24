import {
  StyleSheet,
  Text,
  Pressable,
  View,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type Product, getPrimaryImageUrl } from '@/lib/productsApi';
import { config } from '@/lib/config';

const PLACEHOLDER_IMAGE = require('@/assets/images/splash-icon.png');

type SearchDropdownProps = {
  results: Product[];
  onSelect: () => void;
  visible: boolean;
};

export function SearchDropdown({ results, onSelect, visible }: SearchDropdownProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  if (!visible || results.length === 0) return null;

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = getPrimaryImageUrl(item.productImages);
    const imageSource = imageUrl
      ? {
          uri: imageUrl.startsWith('http')
            ? imageUrl
            : `${config.apiBaseUrl}${imageUrl}`,
        }
      : PLACEHOLDER_IMAGE;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          {
            borderBottomColor: theme.border,
            backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent',
          },
        ]}
        hitSlop={8}
        onPress={() => {
          Keyboard.dismiss();
          router.push(`/product/${item.productId}` as any);
          // Small delay before clearing search to ensure navigation starts
          setTimeout(onSelect, 150);
        }}>
        <Image source={imageSource} style={styles.itemImage} contentFit="cover" />
        <View style={styles.itemInfo}>
          <Text numberOfLines={1} style={[styles.itemName, { color: theme.text }]}>
            {item.productName}
          </Text>
          <Text style={[styles.itemPrice, { color: theme.primary }]}>
            {item.basePrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          shadowColor: '#000',
        },
      ]}>
      <FlatList
        data={results.slice(0, 5)} // Limit to 5 results for clarity
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
      />
      {results.length > 5 && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.tabInactive }]}>
            Xem thêm {results.length - 5} kết quả...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Position directly below the SearchBar
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
