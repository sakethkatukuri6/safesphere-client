import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { touch } from '../theme/tokens';

export type TabId = 'home' | 'circle' | 'evidence' | 'profile';

export interface TabItem {
  id: TabId;
  label: string;
}

export const TABS: TabItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'circle', label: 'Circle' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'profile', label: 'Profile' },
];

export interface BottomTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  visible?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  visible = true,
}) => {
  const { colors, isPitchBlack } = useTheme();
  const insets = useSafeAreaInsets();

  // Hidden in Pitch Black or when explicitly hidden (e.g. 10s countdown)
  if (!visible || isPitchBlack) {
    return null;
  }

  const handleTabPress = (tab: TabId) => {
    if (tab !== activeTab) {
      Haptics.selectionAsync().catch(() => {});
      onSelectTab(tab);
    }
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.borderSubtle,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.accent : colors.textMuted,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 72,
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
