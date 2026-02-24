import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = [
  { id: 'vegetable', label: 'Rau củ', icon: 'spa' as const },
  { id: 'fruit', label: 'Trái cây', icon: 'apple' as const },
  { id: 'meat', label: 'Thịt tươi', icon: 'set-meal' as const },
  { id: 'egg', label: 'Trứng', icon: 'egg-alt' as const },
] as const;

export function CategoryGrid() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.row}>
      {CATEGORIES.map((cat) => (
        <View key={cat.id} style={styles.item}>
          <View style={[styles.iconCircle, { backgroundColor: '#ecfdf3' }]}>
            <MaterialIcons name={cat.icon} size={24} color={theme.primary} />
          </View>
          <Text style={styles.label}>{cat.label}</Text>
        </View>
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

