// CONTRACT-GAP: G4 - Evidence capture is local-only; no upload route exists in CitizenAppContract.md.
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { BottomSheet } from '../../components/BottomSheet';
import { EvidenceItem, evidenceService } from '../../services/evidenceService';
import { space, radius, touch } from '../../theme/tokens';
import { ShieldCheck, Lock, FileText } from 'lucide-react-native';

export const EvidenceScreen: React.FC = () => {
  const { colors } = useTheme();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvidence = useCallback(async () => {
    const list = await evidenceService.getEvidenceItems();
    setEvidenceList(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} · ${d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text variant="title">Evidence</Text>
          <Text variant="caption" style={{ marginTop: space[1] }}>
            Zero-knowledge encrypted capsules recorded during active alerts.
          </Text>
        </View>

        {/* Evidence List or Empty State */}
        {evidenceList.length === 0 && !loading ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <ShieldCheck size={32} color={colors.textMuted} strokeWidth={1.75} />
            </View>
            <Text variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
              No evidence recorded yet. When Survival Mode triggers or you record an incident, encrypted capsules appear here.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {evidenceList.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`View evidence from ${formatDate(item.createdAt)}`}
              >
                <Card style={styles.itemCard}>
                  <View style={styles.cardRow}>
                    <View style={styles.infoCol}>
                      <Text
                        variant="label"
                        style={{
                          fontWeight: '500',
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {formatDate(item.createdAt)}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Text variant="small" style={{ color: colors.textMuted }}>
                          {item.mode}
                        </Text>
                        <Text variant="small" style={{ color: colors.textMuted }}>
                          {' '}· {item.fileSize}
                        </Text>
                      </View>
                    </View>

                    {/* Encrypted Pill */}
                    <View
                      style={[
                        styles.encryptedPill,
                        {
                          borderColor: colors.accent,
                          backgroundColor: 'transparent',
                        },
                      ]}
                    >
                      <Lock
                        size={12}
                        color={colors.accent}
                        strokeWidth={1.75}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        variant="small"
                        style={{ color: colors.accent, fontWeight: '500' }}
                      >
                        Encrypted
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Read-only Metadata Bottom Sheet */}
      <BottomSheet
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Capsule metadata"
      >
        {selectedItem ? (
          <View style={styles.detailContainer}>
            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                CAPSULE ID
              </Text>
              <Text variant="small" style={{ fontVariant: ['tabular-nums'] }}>
                {selectedItem.id}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                RECORDED AT
              </Text>
              <Text variant="small" style={{ fontVariant: ['tabular-nums'] }}>
                {selectedItem.createdAt}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                RECORDING MODE
              </Text>
              <Text variant="small">{selectedItem.mode}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                FILE SIZE
              </Text>
              <Text variant="small" style={{ fontVariant: ['tabular-nums'] }}>
                {selectedItem.fileSize}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                SHA-256 HASH
              </Text>
              <Text
                variant="caption"
                style={{
                  color: colors.textMuted,
                  fontVariant: ['tabular-nums'],
                  marginTop: 2,
                }}
              >
                {selectedItem.hash}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text variant="caption" style={{ color: colors.textMuted }}>
                STORAGE ENCLAVE
              </Text>
              <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                {selectedItem.storageLocation}
              </Text>
            </View>

            <View
              style={[
                styles.noticeBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Text variant="caption" style={{ color: colors.textMuted }}>
                Encrypted with AES-256-GCM. Unencrypted previews and raw exports are prevented by policy.
              </Text>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
    paddingBottom: space[8],
  },
  header: {
    marginBottom: space[4],
  },
  emptyCard: {
    alignItems: 'center',
    padding: space[6],
    marginBottom: space[4],
  },
  emptyIconContainer: {
    marginBottom: space[3],
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    gap: space[3],
  },
  itemCard: {
    padding: space[3],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  infoCol: {
    flex: 1,
    paddingRight: space[2],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  encryptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  detailContainer: {
    paddingTop: space[1],
    gap: space[3],
    paddingBottom: space[4],
  },
  metaRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: space[2],
  },
  noticeBox: {
    borderWidth: 1,
    borderRadius: radius.control,
    padding: space[3],
    marginTop: space[2],
  },
});
