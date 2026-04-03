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
  background: '#EAF1FA',
  backgroundAlt: '#FFFFFF',
  backgroundElevated: '#DCE7F5',
  surface: 'rgba(255, 255, 255, 0.92)',
  card: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(205, 218, 237, 0.9)',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#6B7280',
  accent: '#0F766E',
  accentSoft: 'rgba(15, 118, 110, 0.14)',
  fab: '#0F766E',
  success: '#16A34A',
  warning: '#CA8A04',
  danger: '#DC2626',
  shadow: '#1E293B',
  gradientA: '#DDEBFF',
  gradientB: '#D9F7EE',
  gradientC: '#EEF4FF',
};

export const darkPalette: Palette = {
  background: '#0A1220',
  backgroundAlt: '#122036',
  backgroundElevated: '#162B45',
  surface: 'rgba(18, 32, 54, 0.72)',
  card: 'rgba(20, 35, 58, 0.58)',
  cardBorder: 'rgba(161, 184, 214, 0.28)',
  textPrimary: '#E5ECF6',
  textSecondary: '#B7C3D9',
  textMuted: '#93A3BD',
  accent: '#2DD4BF',
  accentSoft: 'rgba(45, 212, 191, 0.2)',
  fab: '#14B8A6',
  success: '#22C55E',
  warning: '#FACC15',
  danger: '#FB7185',
  shadow: '#000000',
  gradientA: '#19345A',
  gradientB: '#18404A',
  gradientC: '#1A2E4B',
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
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const typography = {
  display: {
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  },
  heading: {
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  },
  body: {
    android: 'sans-serif',
    default: 'sans-serif',
  },
};
