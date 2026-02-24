import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SectionHeaderProps = {
  title: string;
  onPressSeeAll?: () => void;
  seeAllLabel?: string;
};

export function SectionHeader({
  title,
  onPressSeeAll,
  seeAllLabel = 'Xem tất cả',
}: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onPressSeeAll ? (
        <TouchableOpacity onPress={onPressSeeAll} activeOpacity={0.7} style={styles.seeAllRow}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>{seeAllLabel}</Text>
          <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
  },
});

