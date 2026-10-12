import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ColorToken } from '../theme/tokens';
import { typography } from '../theme/typography';

export type TextVariant =
  | 'wordmark'
  | 'display'
  | 'title'
  | 'body'
  | 'label'
  | 'small'
  | 'caption'
  | 'overline'
  | 'sos'
  | 'sosLabel';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorToken;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  style,
  children,
  allowFontScaling = true,
  maxFontSizeMultiplier = 1.3,
  ...props
}) => {
  const { colors } = useTheme();
  const variantStyle = typography[variant] || typography.body;

  const getDefaultColor = (): string => {
    if (variant === 'caption' || variant === 'overline') return colors.textMuted;
    if (variant === 'sos' || variant === 'sosLabel') return colors.sosLabel;
    return colors.text;
  };

  const resolvedColor = color ? colors[color] : getDefaultColor();

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[variantStyle, { color: resolvedColor }, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};
