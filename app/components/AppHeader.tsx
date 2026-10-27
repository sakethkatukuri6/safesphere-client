import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Shield, Bell } from 'lucide-react-native';
import colors from '../theme/colors';

export interface AppHeaderProps {
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onPressNotifications,
  onPressProfile,
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      {/* Left side: Brand Logo or Title */}
      <View style={styles.left}>
        {title ? (
          <View>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
          </View>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.logoIcon}>
              <Shield size={20} color={colors.cyan} />
            </View>
            <Text style={styles.brandText}>SafeSphere</Text>
          </View>
        )}
      </View>

      {/* Right side: Actions or Notification Bell + Avatar */}
      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.avatarRow}>
            <TouchableOpacity
              onPress={onPressNotifications}
              style={styles.iconButton}
            >
              <Bell size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPressProfile} style={styles.avatarButton}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.blue,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

export default AppHeader;
