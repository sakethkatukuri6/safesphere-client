import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { space } from '../../theme/tokens';
import { IncidentCard } from '../../components/IncidentCard';
import { useHelpNearbyStore } from '../../store/helpNearbyStore';
import { requestNotificationPermissions } from '../../services/notificationService';
import { HelpNearbyHeader } from './HelpNearbyHeader';
import { HelpNearbyMap } from './HelpNearbyMap';
import { HelpNearbyEmpty } from './HelpNearbyEmpty';

export const HelpNearbyScreen: React.FC = () => {
  const connectionState = useHelpNearbyStore((state) => state.connectionState);
  const activeIncident = useHelpNearbyStore((state) => state.activeIncident);
  const initHelpNearby = useHelpNearbyStore((state) => state.initHelpNearby);
  const cleanupHelpNearby = useHelpNearbyStore((state) => state.cleanupHelpNearby);
  const acceptIncident = useHelpNearbyStore((state) => state.acceptIncident);
  const declineIncident = useHelpNearbyStore((state) => state.declineIncident);
  const markArrived = useHelpNearbyStore((state) => state.markArrived);

  useEffect(() => {
    // Request notification permission for background wake-on-message alerts
    requestNotificationPermissions();

    // Initialize WebSocket connection
    initHelpNearby();

    return () => {
      cleanupHelpNearby();
    };
  }, [initHelpNearby, cleanupHelpNearby]);

  return (
    <View style={styles.container}>
      {/* Incident queue status bar (margin-top 16, height 28) */}
      <HelpNearbyHeader connectionState={connectionState} />

      {activeIncident ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Native Map: height 240, radius 16, 1px border, margin-top 16 */}
          <HelpNearbyMap
            latitude={activeIncident.location.latitude}
            longitude={activeIncident.location.longitude}
            victimName={activeIncident.victim_name}
          />

          {/* Strictly 6 fields IncidentCard with Accept/Decline/Mark Arrived */}
          <IncidentCard
            incident={activeIncident}
            onAccept={acceptIncident}
            onDecline={declineIncident}
            onMarkArrived={markArrived}
          />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <HelpNearbyEmpty />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: space[4],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
