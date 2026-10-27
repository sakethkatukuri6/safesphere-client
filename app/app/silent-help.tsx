import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { useEmergencyStore } from '../store/emergencyStore';
import { submitQuestionnaire } from '../lib/api';

export default function SilentHelpScreen() {
  const router = useRouter();
  const { incidentId, submitQuestionnaire: saveQuestionnaire } = useEmergencyStore();

  const [situation, setSituation] = useState('Feeling Unsafe');
  const [canSpeak, setCanSpeak] = useState('No');
  const [needMedical, setNeedMedical] = useState('No');
  const [loading, setLoading] = useState(false);

  const situationOptions = [
    'Harassment',
    'Medical Emergency',
    'Accident',
    'Feeling Unsafe',
    'Other',
  ];

  const speakOptions = ['Yes', 'No', 'Prefer not to say'];
  const medicalOptions = ['Yes', 'No', 'Maybe'];

  const handleSelectOption = (
    setter: (val: string) => void,
    val: string
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setter(val);
  };

  const handleSubmit = async () => {
    setLoading(true);
    saveQuestionnaire({
      situation,
      canSpeak,
      needMedical,
    });

    try {
      await submitQuestionnaire(incidentId, {
        situation,
        canSpeak,
        needMedical,
        timestamp: new Date().toISOString(),
      });
    } catch (_e) {}

    setLoading(false);
    router.replace('/live-status');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Silent Help</Text>
          <Text style={styles.headerSubtitle}>Answer quickly (Optional)</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <User size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question 1: What's the situation? */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>What's the situation?</Text>
          <View style={styles.chipRow}>
            {situationOptions.map((opt) => {
              const selected = situation === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelectOption(setSituation, opt)}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Question 2: Can you speak? */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>Can you speak?</Text>
          <View style={styles.chipRow}>
            {speakOptions.map((opt) => {
              const selected = canSpeak === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelectOption(setCanSpeak, opt)}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Question 3: Do you need medical help? */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>Do you need medical help?</Text>
          <View style={styles.chipRow}>
            {medicalOptions.map((opt) => {
              const selected = needMedical === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelectOption(setNeedMedical, opt)}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Helper Note */}
        <View style={styles.helperNotice}>
          <Sparkles size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={styles.helperText}>
            This helps us send the right responders. You can skip this.
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Submit"
            variant="primary"
            loading={loading}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionSection: {
    marginBottom: 24,
  },
  questionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  helperNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 24,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bottomSection: {
    marginTop: 8,
  },
});
