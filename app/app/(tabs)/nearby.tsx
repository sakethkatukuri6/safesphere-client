import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Crosshair, AlertCircle } from 'lucide-react-native';
import colors from '../../theme/colors';
import { IncidentCard } from '../../components/IncidentCard';
import { fetchNearbyIncidents, IncidentItem } from '../../lib/api';

export default function NearbyScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyIncidents().then((data) => {
      setIncidents(data);
      if (data.length > 0) setSelectedIncident(data[0].id);
    });
  }, []);

  const handleViewIncident = (incident: IncidentItem) => {
    router.push({
      pathname: '/incident-details',
      params: { incidentId: incident.id, code: incident.code },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Nearby</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Crosshair size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Connected Volunteers Status Pill */}
      <View style={styles.statusPillContainer}>
        <View style={styles.statusPill}>
          <View style={styles.greenPulseDot} />
          <Text style={styles.statusPillText}>
            Connected • 5 nearby volunteers
          </Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <View style={styles.mapBackground}>
          {/* Roads */}
          <View style={[styles.mapRoad, { top: 35, left: 0, right: 0 }]} />
          <View style={[styles.mapRoad, { top: 85, left: 0, right: 0 }]} />
          <View style={[styles.mapRoad, { top: 140, left: 0, right: 0 }]} />
          <View style={[styles.mapRoadV, { left: 50, top: 0, bottom: 0 }]} />
          <View style={[styles.mapRoadV, { left: 140, top: 0, bottom: 0 }]} />
          <View style={[styles.mapRoadV, { right: 70, top: 0, bottom: 0 }]} />

          {/* User Location (Blue Dot) */}
          <View style={styles.userDotWrapper}>
            <View style={styles.userPulseRing} />
            <View style={styles.userDot} />
          </View>

          {/* Incident Pin 1 */}
          <TouchableOpacity
            style={styles.incidentPin1}
            onPress={() => incidents[0] && handleViewIncident(incidents[0])}
          >
            <AlertCircle size={14} color="#FFF" />
          </TouchableOpacity>

          {/* Incident Pin 2 */}
          <TouchableOpacity
            style={styles.incidentPin2}
            onPress={() => incidents[1] && handleViewIncident(incidents[1])}
          >
            <AlertCircle size={14} color="#FFF" />
          </TouchableOpacity>

          {/* Incident Pin 3 */}
          <TouchableOpacity
            style={styles.incidentPin3}
            onPress={() => incidents[2] && handleViewIncident(incidents[2])}
          >
            <AlertCircle size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby Incidents Sheet */}
      <View style={styles.sheetContainer}>
        <Text style={styles.sheetTitle}>Nearby Incidents</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {incidents.map((item) => (
            <IncidentCard
              key={item.id}
              incident={item}
              onView={handleViewIncident}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPillContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 8,
  },
  statusPillText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 12,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#0E151E',
    position: 'relative',
  },
  mapRoad: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#1E2A3A',
  },
  mapRoadV: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#1E2A3A',
  },
  userDotWrapper: {
    position: 'absolute',
    top: 95,
    left: '46%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPulseRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blueGlow,
    position: 'absolute',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  incidentPin1: {
    position: 'absolute',
    top: 35,
    left: 80,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  incidentPin2: {
    position: 'absolute',
    top: 60,
    right: 50,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  incidentPin3: {
    position: 'absolute',
    bottom: 25,
    right: 120,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
});
