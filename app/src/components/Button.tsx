import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing, touchTargets, motion } from '../theme/tokens';
import { Text } from './Text';
import { useReduceMotion } from '../hooks/useReduceMotion';

export type ButtonVariant = 'danger' | 'accent' | 'outline' | 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  height?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'accent',
  size = 'large',
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
  leftIcon,
  height,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const resolvedHeight =
    height ?? (size === 'small' ? 44 : size === 'medium' ? 48 : 56);

  const resolvedA11yLabel =
    accessibilityLabel ||
    (typeof title === 'string'
      ? title
      : typeof children === 'string'
      ? children
      : 'Action button');

  const handlePressIn = () => {
    if (disabled) return;
    if (!reduceMotion) {
      scale.value = withTiming(0.97, { duration: motion.pressFeedback });
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (!reduceMotion) {
      scale.value = withTiming(1, { duration: motion.pressFeedback });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'accent':
      case 'primary':
        return {
          backgroundColor: colors.accent,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const getTextColor = (): 'onAccent' | 'danger' | 'accent' | 'text' | 'textMuted' => {
    switch (variant) {
      case 'accent':
      case 'primary':
      case 'danger':
        return 'onAccent';
      case 'outline':
        return 'text';
      case 'secondary':
        return 'text';
      case 'ghost':
        return 'textMuted';
      default:
        return 'text';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={resolvedA11yLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { height: resolvedHeight },
        getVariantContainerStyle(),
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {leftIcon && <>{leftIcon}</>}
      {children ? (
        typeof children === 'string' ? (
          <Text
            variant="body"
            color={getTextColor()}
            style={[styles.text, textStyle]}
          >
            {children}
          </Text>
        ) : (
          children
        )
      ) : title ? (
        <Text
          variant="body"
          color={getTextColor()}
          style={[styles.text, textStyle]}
        >
          {title}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    borderRadius: radii.control,
    paddingHorizontal: spacing[16],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
