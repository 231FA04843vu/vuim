export type Palette = {
  background: string;
  backgroundAlt: string;
  backgroundElevated: string;
  surface: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  fab: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
  gradientA: string;
  gradientB: string;
  gradientC: string;
};

export const lightPalette: Palette = {
  background: '#F3F6FA',
  backgroundAlt: '#FFFFFF',
  backgroundElevated: '#E9F0F7',
  surface: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.96)',
  cardBorder: 'rgba(100, 116, 139, 0.2)',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#6B7280',
  accent: '#0F766E',
  accentSoft: 'rgba(15, 118, 110, 0.12)',
  fab: '#0F766E',
  success: '#16A34A',
  warning: '#CA8A04',
  danger: '#DC2626',
  shadow: '#0F172A',
  gradientA: '#EAF2FF',
  gradientB: '#EAFBF6',
  gradientC: '#F4F7FC',
};

export const darkPalette: Palette = {
  background: '#0B1220',
  backgroundAlt: '#111B2D',
  backgroundElevated: '#162235',
  surface: '#132037',
  card: 'rgba(19, 32, 55, 0.94)',
  cardBorder: 'rgba(148, 163, 184, 0.16)',
  textPrimary: '#E5ECF6',
  textSecondary: '#B7C3D9',
  textMuted: '#93A3BD',
  accent: '#2DD4BF',
  accentSoft: 'rgba(45, 212, 191, 0.16)',
  fab: '#14B8A6',
  success: '#22C55E',
  warning: '#FACC15',
  danger: '#FB7185',
  shadow: '#000000',
  gradientA: '#132741',
  gradientB: '#10323A',
  gradientC: '#15263D',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: {
    ios: 'AvenirNext-Bold',
    android: 'serif',
  },
  heading: {
    ios: 'AvenirNext-DemiBold',
    android: 'sans-serif-medium',
  },
  body: {
    ios: 'AvenirNext-Regular',
    android: 'sans-serif',
  },
};
