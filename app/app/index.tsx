import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Screen } from '../src/components/Screen';
import { AppHeader } from '../src/components/AppHeader';
import { SegmentedToggle, AppMode } from '../src/components/SegmentedToggle';
import { BottomTabBar, TabId } from '../src/components/BottomTabBar';
import { NeedHelpScreen } from '../src/features/need-help';
import { HelpNearbyScreen } from '../src/features/help-nearby';
import { CircleScreen } from '../src/features/circle/CircleScreen';
import { EvidenceScreen } from '../src/features/evidence/EvidenceScreen';
import { ProfileScreen } from '../src/features/profile/ProfileScreen';
import { useAppModeStore } from '../src/store/appModeStore';
import { useNeedHelpStore } from '../src/store/needHelpStore';
import { useSurvivalStore } from '../src/store/survivalStore';
import { useTheme } from '../src/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { motion, space } from '../src/theme/tokens';
import { useReduceMotion } from '../src/hooks/useReduceMotion';
import {
  checkLocationPermission,
  requestLocationPermission,
} from '../src/services/locationService';

export default function MainAppScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const currentMode = useAppModeStore((state) => state.currentMode);
  const setMode = useAppModeStore((state) => state.setMode);
  const screenState = useNeedHelpStore((state) => state.screenState);
  const isPitchBlack = useSurvivalStore((state) => state.isPitchBlack);
  const reduceMotion = useReduceMotion();

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    let isMounted = true;
    checkLocationPermission().then((granted) => {
      if (isMounted) setHasLocationPermission(granted);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRequestLocation = async () => {
    const granted = await requestLocationPermission();
    setHasLocationPermission(granted);
  };

  const isPitchBlackActive = currentMode === 'Need Help' && isPitchBlack;
  const isConfirming = currentMode === 'Need Help' && screenState === 'CONFIRMING';

  // 250ms Crossfade animation between screens
  const contentFade = useSharedValue(1);

  const handleSelectTab = (newTab: TabId) => {
    if (newTab === activeTab || isConfirming) return;

    if (reduceMotion) {
      setActiveTab(newTab);
    } else {
      contentFade.value = withTiming(
        0,
        {
          duration: motion.standard / 2,
          easing: Easing.bezier(0.2, 0, 0, 1),
        },
        () => {
          contentFade.value = withTiming(1, {
            duration: motion.standard / 2,
            easing: Easing.bezier(0.2, 0, 0, 1),
          });
        }
      );
      setActiveTab(newTab);
    }
  };

  const handleSelectMode = (newMode: AppMode) => {
    if (newMode === currentMode || isConfirming) return;

    if (reduceMotion) {
      setMode(newMode);
    } else {
      contentFade.value = withTiming(
        0,
        {
          duration: motion.standard / 2,
          easing: Easing.bezier(0.2, 0, 0, 1),
        },
        () => {
          contentFade.value = withTiming(1, {
            duration: motion.standard / 2,
            easing: Easing.bezier(0.2, 0, 0, 1),
          });
        }
      );
      setMode(newMode);
    }
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentFade.value,
  }));

  // Render content according to active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return currentMode === 'Need Help' ? (
          <NeedHelpScreen onNavigateToCircle={() => handleSelectTab('circle')} />
        ) : (
          <HelpNearbyScreen />
        );
      case 'circle':
        return <CircleScreen />;
      case 'evidence':
        return <EvidenceScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  };

  // Hide tab bar during 10-second confirmation or Pitch Black theme
  const showTabBar = !isConfirming && !isPitchBlackActive;

  return (
    <Screen isPitchBlack={isPitchBlackActive}>
      <View style={styles.container}>
        {/* Top Header: shown on Home tab */}
        {activeTab === 'home' && (
          <AppHeader
            hasLocationPermission={hasLocationPermission}
            onRequestLocationPermission={handleRequestLocation}
            isPitchBlack={isPitchBlackActive}
            onPressWordmark={__DEV__ ? () => router.push('/dev/gallery' as any) : undefined}
          />
        )}

        {/* Top SegmentedToggle: shown on Home tab only (hidden in Pitch Black, disabled in Confirming) */}
        {activeTab === 'home' && !isPitchBlackActive && (
          <SegmentedToggle
            currentMode={currentMode}
            onSelectMode={handleSelectMode}
            disabled={isConfirming}
          />
        )}

        {/* Main Tab Screen Content with 250ms crossfade */}
        <Animated.View style={[styles.contentContainer, animatedContentStyle]}>
          {renderTabContent()}
        </Animated.View>

        {/* Bottom Tab Bar (C1): text-only 4 bottom tabs */}
        <BottomTabBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          visible={showTabBar}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
});
