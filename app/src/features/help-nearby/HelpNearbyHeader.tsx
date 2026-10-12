import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { space } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components';
import { WsConnectionState } from '../../services/wsClient';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { copy } from '../../copy';

export interface HelpNearbyHeaderProps {
  connectionState: WsConnectionState;
  updatedAtText?: string;
}

export const HelpNearbyHeader: React.FC<HelpNearbyHeaderProps> = ({
  connectionState,
  updatedAtText = copy.helpNearby.updatedJustNow,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulseOpacity = useSharedValue(1);

  const isPending = connectionState === 'Connecting' || connectionState === 'Reconnecting';

  useEffect(() => {
    if (isPending && !reduceMotion) {
      // Pulses opacity 0.4 to 1.0 in 1000ms infinite
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 1;
    }

    return () => {
      cancelAnimation(pulseOpacity);
    };
  }, [isPending, reduceMotion]);

  const dotAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
    };
  });

  const getDotColor = (): string => {
    switch (connectionState) {
      case 'Connected':
        return colors.accent;
      case 'Connecting':
      case 'Reconnecting':
        return colors.warning;
      case 'Disconnected':
        return colors.textMuted;
    }
  };

  const getStatusLabel = (): string => {
    switch (connectionState) {
      case 'Connected':
        return copy.helpNearby.connectedToDispatch;
      case 'Reconnecting':
        return copy.helpNearby.reconnectingToDispatch;
      case 'Connecting':
        return copy.helpNearby.connectingToDispatch;
      case 'Disconnected':
        return copy.helpNearby.disconnectedFromDispatch;
    }
  };

  return (
    <View
      style={styles.statusBar}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Dispatch queue connection: ${getStatusLabel()}. ${updatedAtText}`}
    >
      {/* Left: 8px circle + 13/500 text */}
      <View style={styles.leftGroup}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: getDotColor() },
            isPending && dotAnimatedStyle,
          ]}
        />
        <Text variant="small" color="text" style={styles.statusLabel}>
          {getStatusLabel()}
        </Text>
      </View>

      {/* Right: tabular numeral caption textMuted */}
      <Text variant="caption" color="textMuted" style={styles.updatedText}>
        {updatedAtText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    height: 28,
    marginTop: space[4],
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  updatedText: {
    fontVariant: ['tabular-nums'],
  },
});
