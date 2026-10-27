import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import {
  ShieldAlert,
  Radio,
  Plus,
  Play,
  Pause,
  FileText,
  Lock,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import colors from '../../theme/colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchEvidenceItems, EvidenceItem } from '../../lib/api';

export default function EvidenceScreen() {
  const [filter, setFilter] = useState<'All' | 'Photos' | 'Audio' | 'Notes'>('All');
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [addNoteModalVisible, setAddNoteModalVisible] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    fetchEvidenceItems().then((data) => setItems(data));
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newItem: EvidenceItem = {
          id: `ev-${Date.now()}`,
          type: 'photo',
          title: 'Citizen Photo',
          uri: result.assets[0].uri,
          timestamp: new Date().toLocaleTimeString(),
          size: '1.5 MB',
        };
        setItems([newItem, ...items]);
      }
    } catch (_e) {
      Alert.alert('Image Picker', 'Unable to pick image.');
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newItem: EvidenceItem = {
      id: `ev-${Date.now()}`,
      type: 'note',
      title: newNoteText.trim(),
      timestamp: new Date().toLocaleTimeString(),
      size: '150 B',
    };
    setItems([newItem, ...items]);
    setNewNoteText('');
    setAddNoteModalVisible(false);
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Photos') return item.type === 'photo';
    if (filter === 'Audio') return item.type === 'audio';
    if (filter === 'Notes') return item.type === 'note';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <ShieldAlert size={22} color={colors.cyan} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Evidence</Text>
        </View>

        {/* Pulsing Recording Badge */}
        <View style={styles.recordingBadge}>
          <View style={styles.redPulseDot} />
          <Text style={styles.recordingText}>Recording</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Photos', 'Audio', 'Notes'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (_e) {}
                setFilter(tab);
              }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Media Grid */}
      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {filteredItems.map((item) => {
            if (item.type === 'photo') {
              return (
                <View key={item.id} style={styles.photoCard}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemTime}>{item.timestamp}</Text>
                  </View>
                </View>
              );
            }

            if (item.type === 'audio') {
              return (
                <View key={item.id} style={styles.audioCard}>
                  <View style={styles.audioHeader}>
                    <Radio size={16} color={colors.cyan} />
                    <Text style={styles.audioDuration}>{item.duration || '00:24'}</Text>
                  </View>

                  {/* Waveform graphic */}
                  <View style={styles.miniWaveform}>
                    {[12, 22, 16, 28, 14, 26, 18, 30, 10, 24, 16, 20].map(
                      (h, i) => (
                        <View
                          key={i}
                          style={[styles.waveBar, { height: h }]}
                        />
                      )
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                    style={styles.audioPlayButton}
                  >
                    {isPlayingAudio ? (
                      <Pause size={16} color="#FFF" />
                    ) : (
                      <Play size={16} color="#FFF" style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }

            if (item.type === 'note') {
              return (
                <View key={item.id} style={styles.noteCard}>
                  <FileText size={20} color={colors.textSecondary} style={{ marginBottom: 6 }} />
                  <Text style={styles.noteText} numberOfLines={4}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemTime}>{item.timestamp}</Text>
                </View>
              );
            }

            return null;
          })}

          {/* "+ Add Note" Action Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAddNoteModalVisible(true)}
            style={styles.addCard}
          >
            <Plus size={24} color={colors.blue} style={{ marginBottom: 6 }} />
            <Text style={styles.addCardText}>+ Add Note</Text>
          </TouchableOpacity>

          {/* "+ Capture Photo" Action Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickImage}
            style={styles.addCard}
          >
            <Camera size={24} color={colors.cyan} style={{ marginBottom: 6 }} />
            <Text style={styles.addCardText}>+ Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Security Footer Notice */}
        <View style={styles.securityBanner}>
          <Lock size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.securityText}>
            All evidence is encrypted and shared only with authorized responders.
          </Text>
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        visible={addNoteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.noteModalContent}>
            <Text style={styles.noteModalTitle}>Add Incident Note</Text>
            <TextInput
              value={newNoteText}
              onChangeText={setNewNoteText}
              placeholder="Enter observations, descriptions, license plates..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={styles.noteInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddNoteModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNote}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redDark,
    borderColor: colors.redCardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginRight: 6,
  },
  recordingText: {
    color: colors.redText,
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: colors.backgroundCard,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 16, 21, 0.75)',
    padding: 8,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  itemTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  audioCard: {
    width: '48%',
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioDuration: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  miniWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 36,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },
  audioPlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  noteCard: {
    width: '48%',
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  noteText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  addCard: {
    width: '48%',
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderHighlight,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  securityText: {
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noteModalContent: {
    backgroundColor: colors.backgroundModal,
    borderRadius: 20,
    padding: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  noteModalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
