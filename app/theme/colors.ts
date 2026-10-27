/**
 * SafeSphere Dark Theme Colors
 * Matches the SafeSphere Prototype Board:
 * Dark theme with red, blue, and green accents.
 */

export const colors = {
  // Base backgrounds
  background: '#0B1015',
  backgroundElevated: '#121820',
  backgroundCard: '#151D26',
  backgroundCardHover: '#1B2531',
  backgroundModal: '#121820',
  surfaceSubtle: '#1C2633',

  // Primary Emergency Red Accents
  red: '#FF3B30',
  redGlow: 'rgba(255, 59, 48, 0.35)',
  redGlowSubtle: 'rgba(255, 59, 48, 0.15)',
  redDark: '#2A1215',
  redCardBorder: '#4A1D22',
  redText: '#FF453A',
  redLight: '#FF6961',

  // Primary Active / Action Blue Accents
  blue: '#0A84FF',
  blueLight: '#38BDF8',
  blueGlow: 'rgba(10, 132, 255, 0.3)',
  blueDark: '#0D2137',
  blueCardBorder: '#1E3A5F',
  blueRoute: '#007AFF',

  // Primary Safe / Connected Green Accents
  green: '#30D158',
  greenBright: '#10B981',
  greenGlow: 'rgba(48, 209, 88, 0.25)',
  greenDark: '#0E291B',
  greenCardBorder: '#1B472E',
  greenText: '#34D399',

  // Warning / Attention Amber
  warning: '#FF9F0A',
  warningDark: '#2C1D05',
  warningBorder: '#53380B',
  warningText: '#FBBF24',

  // Cyan / Live Waveform Accents
  cyan: '#00E5FF',
  cyanDark: '#00363D',

  // Neutral text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',

  // Borders and dividers
  border: '#1F2A37',
  borderLight: '#2D3A4B',
  borderHighlight: '#3B4D63',
  divider: '#16202A',

  // Specific UI components
  bottomBarBackground: '#0D131A',
  bottomBarActive: '#0A84FF',
  bottomBarInactive: '#64748B',
  headerBackground: '#0B1015',

  // Pitch Black / Survival Mode
  survivalBackground: '#000000',
  survivalCard: '#0A0A0A',
  survivalBorder: '#222222',
  survivalAccent: '#FF3B30',
  survivalCyan: '#00E5FF',
};

export type ColorTheme = typeof colors;
export default colors;
