import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthColors } from '@/constants/theme';

type Props = {
  value: boolean;
  onToggle: () => void;
};

export function CheckboxTerms({ value, onToggle }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.wrap}>
      <View style={[styles.box, value && styles.boxChecked]}>
        {value ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : null}
      </View>
      <Text style={styles.text}>
        Tôi đồng ý với{' '}
        <Text style={styles.link}>Điều khoản và Điều kiện</Text> của{' '}
        <Text style={styles.link}>NongXanh</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AuthColors.border,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxChecked: {
    backgroundColor: AuthColors.primary,
    borderColor: AuthColors.primary,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: AuthColors.dividerText,
  },
  link: {
    color: AuthColors.link,
    fontWeight: '600',
  },
});
