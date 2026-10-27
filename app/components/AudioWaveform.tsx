import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import colors from '../theme/colors';

export interface AudioWaveformProps {
  initialSeconds?: number;
  isLive?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  initialSeconds = 24,
  isLive = true,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const barHeights = useRef(
    Array.from({ length: 28 }, () => new Animated.Value(Math.random() * 24 + 6))
  ).current;

  // Live timer tick
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  // Waveform animation
  useEffect(() => {
    if (!isLive) return;
    const intervals = barHeights.map((anim) => {
      return setInterval(() => {
        Animated.timing(anim, {
          toValue: Math.random() * 28 + 6,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }, Math.random() * 300 + 200);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [isLive]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {barHeights.map((heightAnim, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.bar,
              {
                height: heightAnim,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 36,
  },
  bar: {
    width: 3,
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },
  timerText: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginLeft: 12,
  },
});

export default AudioWaveform;
