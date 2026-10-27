import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { AlertCircle, ChevronRight } from 'lucide-react-native';
import colors from '../theme/colors';
import { IncidentItem } from '../lib/api';

export interface IncidentCardProps {
  incident: IncidentItem;
  onView: (incident: IncidentItem) => void;
  style?: ViewStyle;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onView,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.left}>
        <View style={styles.badgeRow}>
          <View style={styles.redBadge}>
            <AlertCircle size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.codeText}>{incident.code}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {incident.distanceText} • {incident.type}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onView(incident)}
        style={styles.viewButton}
      >
        <Text style={styles.viewText}>View</Text>
        <ChevronRight size={14} color={colors.blue} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  left: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  redBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blueDark,
    borderColor: colors.blueCardBorder,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
});

export default IncidentCard;
