import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BatteryCharging, Wifi, Clock } from 'lucide-react-native';
import colors from '../theme/colors';

export interface StatusRowProps {
  batteryPct?: number;
  networkStatus?: string;
  checkInTime?: string;
  style?: ViewStyle;
}

export const StatusRow: React.FC<StatusRowProps> = ({
  batteryPct = 92,
  networkStatus = 'Strong',
  checkInTime = '2:50 PM',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 1. Battery Item */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <BatteryCharging size={18} color={batteryPct <= 20 ? colors.red : colors.green} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Battery</Text>
          <Text style={styles.value}>{batteryPct}%</Text>
        </View>
      </View>

      {/* 2. Network Item */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Wifi size={18} color={colors.green} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Network</Text>
          <Text style={styles.value}>{networkStatus}</Text>
        </View>
      </View>

      {/* 3. Check-in Item */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Clock size={18} color={colors.blueLight} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Check-in</Text>
          <Text style={styles.value}>{checkInTime}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
});

export default StatusRow;
