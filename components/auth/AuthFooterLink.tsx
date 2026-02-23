import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AuthColors } from '@/constants/theme';

type Props = {
  prompt: string;
  linkText: string;
  href: string;
};

export function AuthFooterLink({ prompt, linkText, href }: Props) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>{prompt}</Text>
      <TouchableOpacity
        onPress={() => router.push(href as any)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  prompt: {
    fontSize: 14,
    color: '#374151',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: AuthColors.link,
  },
});
