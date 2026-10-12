import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'IBMPlexSans-Regular',
  medium: 'IBMPlexSans-Medium',
  semiBold: 'IBMPlexSans-SemiBold',
} as const;

export const typography: Record<string, TextStyle> = {
  wordmark: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  display: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 64,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    fontWeight: '500',
  },
  small: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sos: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 2,
  },
  sosLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 2,
  },
};
