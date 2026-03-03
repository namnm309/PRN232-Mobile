import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = [
  { id: 'vegetable', label: 'Rau củ', icon: 'spa' as const },
  { id: 'fruit', label: 'Trái cây', icon: 'apple' as const },
  { id: 'meat_egg', label: 'Thịt & Trứng', icon: 'set-meal' as const },
  { id: 'seafood', label: 'Hải sản', icon: 'water' as const },
  { id: 'dry', label: 'Đồ khô', icon: 'inventory-2' as const },
] as const;

type CategoryGridProps = {
  onCategoryPress?: (categoryId: string) => void;
};

export function CategoryGrid({ onCategoryPress }: CategoryGridProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.row}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => onCategoryPress?.(cat.id)}>
          <View style={[styles.iconCircle, { backgroundColor: '#ecfdf3' }]}>
            <MaterialIcons name={cat.icon} size={24} color={theme.primary} />
          </View>
          <Text style={styles.label}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
});

