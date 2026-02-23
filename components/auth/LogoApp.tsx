import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthColors } from '@/constants/theme';

const SIZE = 72;
const ICON_SIZE = 40;

export function LogoApp() {
  return (
    <View style={styles.circle}>
      <Ionicons name="leaf" size={ICON_SIZE} color={AuthColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: AuthColors.primaryLight + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});
