/**
 * Nightwatch Design System Tokens
 * Strictly frozen to specified palette, spacing scale, typography, and motion rules.
 * Exports darkColors and lightColors with identical keys.
 * No hardcoded colors or styles outside this file.
 */

export const darkColors = {
  bg: '#0D1316',
  surface: '#162026',
  border: '#223038',
  borderSubtle: '#1B2830',
  text: '#E8EEF0',
  textMuted: '#8FA0A6',
  accent: '#4CC2B5',
  danger: '#E8553D',
  warning: '#F0A93B',
  onAccent: '#0D1316', // text on accent or danger filled buttons
  sosLabel: '#FFFFFF', // large 34px SOS label contrast exception
  pitchBlack: '#000000', // Survival Mode low-battery theme only
} as const;

export const lightColors = {
  bg: '#F4F7F8',
  surface: '#FFFFFF',
  border: '#D5DDE1',
  borderSubtle: '#E3E9EC',
  text: '#12191D',
  textMuted: '#5B6B72',
  accent: '#17756C',
  danger: '#C8402B',
  warning: '#8A5A00',
  onAccent: '#FFFFFF', // text on accent or danger filled buttons in light theme
  sosLabel: '#FFFFFF', // large 34px SOS label contrast exception
  pitchBlack: '#000000', // Pitch Black override remains #000000
} as const;

export type ThemeColors = {
  [K in keyof typeof darkColors]: string;
};

export type ColorToken = keyof typeof darkColors;

// Default dark fallback for non-component utilities
export const colors: ThemeColors = darkColors;

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  screenHorizontal: 24,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  screenHorizontal: 24,
} as const;

export const radii = {
  card: 16,
  control: 12,
  button: 12,
  chip: 12,
  circle: 9999,
  full: 9999,
} as const;

export const radius = radii;

export const touchTargets = {
  min: 44,
} as const;

export const touch = {
  min: 44,
} as const;

export const hairline = 1;

export const borders = {
  hairline: 1,
  thin: 1,
  sosRing: 1.5,
} as const;

export const layout = {
  maxWidth: 480,
  referenceWidth: 390,
  referenceHeight: 844,
} as const;

export const motion = {
  micro: 150,
  standard: 250,
  entrance: 350,
  pitchBlack: 400,
  breatheLoop: 3200,
  pressFeedback: 100,
} as const;
