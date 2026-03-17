import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { AuthColors } from '@/constants/theme';

type InputFieldProps = TextInputProps & {
  label?: string;
  leftIcon?: 'email' | 'password' | 'person' | 'call' | 'key' | 'location';
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  error?: string;
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  email: 'mail-outline',
  password: 'lock-closed-outline',
  person: 'person-outline',
  call: 'call-outline',
  key: 'key-outline',
  location: 'location-outline',
};

export function InputField({
  label,
  leftIcon,
  secureTextEntry = false,
  showPasswordToggle = false,
  error,
  placeholderTextColor = AuthColors.placeholder,
  style,
  ...rest
}: InputFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry && showPasswordToggle;
  const secure = secureTextEntry && !visible;
  const iconName = leftIcon ?? (rest.keyboardType === 'email-address' ? 'email' : undefined);
  const ionIcon = iconName ? iconMap[iconName] ?? 'text-outline' : undefined;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        {ionIcon ? (
          <Ionicons
            name={ionIcon}
            size={20}
            color={AuthColors.placeholder}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, ionIcon && styles.inputWithIcon]}
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.eye}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={AuthColors.placeholder}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: AuthColors.dividerText,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuthColors.cardBg,
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderRadius: 12,
    minHeight: 48,
  },
  inputWrapError: {
    borderColor: '#ef4444',
  },
  leftIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  eye: {
    paddingRight: 14,
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
