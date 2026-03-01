/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/** Nông Xanh primary green (Figma) */
export const AuthColors = {
  primary: '#22c55e',
  primaryLight: '#4ade80',
  primaryDark: '#16a34a',
  border: '#e5e7eb',
  borderFocus: '#22c55e',
  placeholder: '#9ca3af',
  link: '#22c55e',
  cardBg: '#ffffff',
  dividerText: '#6b7280',
};

const tintColorLight = AuthColors.primary;
const tintColorDark = '#ffffff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    /** Auth / Nông Xanh primary */
    primary: AuthColors.primary,
    primaryLight: '#e8f5e9',
    accent: '#15803d',
    tabInactive: '#9ca3af',
    border: '#e0e0e0',
    textSecondary: '#9e9e9e',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: AuthColors.primaryDark,
    primaryLight: '#1f3a29',
    accent: '#16a34a',
    tabInactive: '#4b5563',
    border: '#374151',
    textSecondary: '#6b7280',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
