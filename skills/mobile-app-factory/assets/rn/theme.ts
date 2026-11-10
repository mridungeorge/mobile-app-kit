/**
 * Rune-derived design tokens for React Native / Expo.
 * Copy to src/theme.ts and import everywhere. Do not fork values per screen.
 */
import { Platform, TextStyle } from 'react-native';

export const palette = {
  neutral: {
    0: '#ffffff',
    50: '#f7f7f9',
    100: '#f0f1f4',
    200: '#e3e4e9',
    300: '#cfd1d8',
    400: '#a2a5aa',
    500: '#7b7e85',
    600: '#606369',
    700: '#43464c',
    800: '#2b2d31',
    850: '#1c1d20',
    900: '#121314',
    950: '#0b0c0d',
  },
  accent: {
    blue: { light: '#3680dd', dark: '#4392f7' },
    purple: { light: '#9065d0', dark: '#a376e9' },
    pink: { light: '#ce4682', dark: '#e05e94' },
    orange: { light: '#df7b0c', dark: '#dc7200' },
    green: { light: '#1da758', dark: '#11ae5b' },
    graphite: { light: '#777a82', dark: '#888c94' },
  },
  success: { light: '#1da758', dark: '#11ae5b' },
  warning: { light: '#df7b0c', dark: '#dc7200' },
  danger: { light: '#c62a2f', dark: '#e5484d' },
} as const;

export type AccentName = keyof typeof palette.accent;

const withAlpha = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const makeColors = (dark: boolean, accentName: AccentName = 'blue') => {
  const n = palette.neutral;
  const accent = palette.accent[accentName][dark ? 'dark' : 'light'];
  return {
    bg: dark ? n[900] : n[100],
    bgDeep: dark ? n[950] : n[50],
    card: dark ? n[850] : n[0],
    cardRaised: dark ? n[800] : n[0],
    border: dark ? withAlpha('#ffffff', 0.05) : withAlpha('#000000', 0.1),
    borderStrong: dark ? withAlpha('#ffffff', 0.12) : withAlpha('#000000', 0.18),
    text: dark ? '#eff0f2' : '#1a1c1f',
    textSecondary: dark ? n[400] : n[600],
    textTertiary: dark ? n[500] : n[500],
    separator: dark ? withAlpha('#ffffff', 0.055) : withAlpha('#000000', 0.13),
    controlTrack: dark ? withAlpha('#ffffff', 0.05) : withAlpha('#333333', 0.13),
    controlOff: dark ? withAlpha('#ffffff', 0.085) : withAlpha('#333333', 0.24),
    hover: dark ? withAlpha('#ffffff', 0.016) : withAlpha('#333333', 0.07),
    press: dark ? withAlpha('#ffffff', 0.03) : withAlpha('#333333', 0.12),
    scrim: dark ? withAlpha('#000000', 0.6) : withAlpha('#000000', 0.4),
    accent,
    onAccent: dark ? '#0b0c0d' : '#ffffff',
    accentSoft: withAlpha(accent, dark ? 0.16 : 0.12),
    success: palette.success[dark ? 'dark' : 'light'],
    warning: palette.warning[dark ? 'dark' : 'light'],
    danger: palette.danger[dark ? 'dark' : 'light'],
    shadow: dark ? withAlpha('#000000', 0.42) : withAlpha('#000000', 0.14),
    shadowSoft: dark ? withAlpha('#000000', 0.28) : withAlpha('#000000', 0.07),
  };
};

export type Colors = ReturnType<typeof makeColors>;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
} as const;

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/** Type roles. Sizes are intentionally small and tight; see design-language.md. */
export const type = {
  display: { fontFamily, fontSize: 32, lineHeight: 35, fontWeight: '700' as const, letterSpacing: -0.32 },
  title: { fontFamily, fontSize: 22, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.2 },
  titleSmall: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  section: { fontFamily, fontSize: 11.5, lineHeight: 15, fontWeight: '600' as const, letterSpacing: 0.4 },
  body: { fontFamily, fontSize: 14, lineHeight: 19, fontWeight: '400' as const },
  bodySmall: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontFamily, fontSize: 12, lineHeight: 15, fontWeight: '500' as const },
  caption: { fontFamily, fontSize: 11.5, lineHeight: 15, fontWeight: '400' as const },
  mono: { fontFamily: monoFamily, fontSize: 12, lineHeight: 17, fontWeight: '500' as const, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

/** Elevation is deliberately shallow. Depth comes from hairlines. */
export const elevation = (c: Colors) => ({
  flat: {
    shadowColor: 'transparent',
    borderWidth: 1,
    borderColor: c.border,
  },
  raised: {
    shadowColor: c.shadow,
    shadowOpacity: 1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 1,
    borderColor: c.border,
  },
  overlay: {
    shadowColor: c.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
});

export const MIN_TARGET = 44;
