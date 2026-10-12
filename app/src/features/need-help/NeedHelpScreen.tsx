import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { space } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components';
import { useNeedHelpStore } from '../../store/needHelpStore';
import { useSurvivalStore } from '../../store/survivalStore';
import { NeedHelpIdle } from './NeedHelpIdle';
import { NeedHelpConfirming } from './NeedHelpConfirming';
import { NeedHelpSent } from './NeedHelpSent';
import { NeedHelpError } from './NeedHelpError';
import { PitchBlackView } from '../survival/PitchBlackView';

export interface NeedHelpScreenProps {
  onNavigateToCircle?: () => void;
}

export const NeedHelpScreen: React.FC<NeedHelpScreenProps> = ({ onNavigateToCircle }) => {
  const { colors } = useTheme();
  const screenState = useNeedHelpStore((state) => state.screenState);
  const isPitchBlack = useSurvivalStore((state) => state.isPitchBlack);

  switch (screenState) {
    case 'IDLE':
      // Critical battery: switches to Pitch Black state with reduced content and no decorative animations
      if (isPitchBlack) {
        return <PitchBlackView />;
      }
      return <NeedHelpIdle onNavigateToCircle={onNavigateToCircle} />;
    case 'CONFIRMING':
      return <NeedHelpConfirming />;
    case 'SENDING':
      return (
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text variant="body" color="textMuted" style={styles.sendingText}>
            Transmitting emergency signal to dispatch orchestrator...
          </Text>
        </View>
      );
    case 'SENT':
      return <NeedHelpSent />;
    case 'ERROR':
      return <NeedHelpError />;
  }
};

const styles = StyleSheet.create({
  sendingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[6],
    gap: space[4],
  },
  sendingText: {
    textAlign: 'center',
  },
});
