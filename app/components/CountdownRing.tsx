import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../theme/colors';

export interface CountdownRingProps {
  progress: number; // 0 to 1
  secondsRemaining: number;
  size?: number;
  strokeWidth?: number;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  progress,
  secondsRemaining,
  size = 220,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer ambient glow circles */}
      <View
        style={[
          styles.glowOuter,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
          },
        ]}
      />
      <View
        style={[
          styles.glowInner,
          {
            width: size - 20,
            height: size - 20,
            borderRadius: (size - 20) / 2,
          },
        ]}
      />

      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.redDark}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active animated countdown ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.red}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Central Content */}
      <View style={styles.centerContent}>
        <Text style={styles.countdownNumber}>
          {secondsRemaining > 0 ? secondsRemaining : 1}
        </Text>
        <Text style={styles.subtext}>Hold to send SOS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 24,
  },
  svg: {
    position: 'absolute',
  },
  glowOuter: {
    position: 'absolute',
    backgroundColor: colors.redGlowSubtle,
  },
  glowInner: {
    position: 'absolute',
    backgroundColor: colors.redDark,
    borderColor: colors.redCardBorder,
    borderWidth: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default CountdownRing;
