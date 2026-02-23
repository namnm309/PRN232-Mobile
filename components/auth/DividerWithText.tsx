import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthColors } from '@/constants/theme';

type Props = { text?: string };

export function DividerWithText({ text = 'Hoặc tiếp tục với' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.border,
  },
  text: {
    marginHorizontal: 12,
    fontSize: 14,
    color: AuthColors.dividerText,
  },
});
