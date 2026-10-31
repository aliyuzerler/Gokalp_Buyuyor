/**
 * Gökalp Büyüyor — tema token'ları (docs/UI_UX.md).
 * Sıcak, doğal, sakin, premium aile günlüğü paleti.
 */
export const colors = {
  background: '#F7F3EC',
  surface: '#FFFCF7',
  surfaceMuted: '#EEE7DC',
  text: '#3F3932',
  textMuted: '#81776B',
  primary: '#A77C5C',
  primaryDark: '#805A40',
  sage: '#879681',
  sageLight: '#E4EADF',
  clay: '#C58F78',
  border: '#E5DCCF',
  warning: '#B78345',
  danger: '#AD655D',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

export const typography = {
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  small: {
    fontSize: 13,
  },
} as const;

/**
 * Yumuşak yüzey gölgeleri (Android/iOS uyumlu elevation eşdeğeri).
 */
export const elevation = {
  card: {
    shadowColor: '#3F3932',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#3F3932',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
} as const;

export const touchTarget = 48;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  elevation,
  touchTarget,
} as const;
