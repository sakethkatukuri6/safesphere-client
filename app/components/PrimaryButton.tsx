import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary' | 'outline' | 'dangerOutline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSubtle;
    switch (variant) {
      case 'primary':
        return colors.blue;
      case 'danger':
        return colors.red;
      case 'secondary':
        return colors.backgroundCardHover;
      case 'outline':
      case 'dangerOutline':
        return 'transparent';
      default:
        return colors.blue;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'outline':
        return colors.borderHighlight;
      case 'dangerOutline':
        return colors.redCardBorder;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textDisabled;
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
        return colors.textPrimary;
      case 'dangerOutline':
        return colors.redText;
      default:
        return colors.textPrimary;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 38;
      case 'lg':
        return 56;
      case 'md':
      default:
        return 48;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant.includes('outline') || variant === 'dangerOutline' ? 1 : 0,
          height: getHeight(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
