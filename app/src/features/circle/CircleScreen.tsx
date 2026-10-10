// CONTRACT-GAP: G9 - Emergency contacts are client-local only; CitizenAppContract.md defines no contact schema or recipient endpoints.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/BottomSheet';
import {
  EmergencyContact,
  loadContacts,
  saveContact,
  deleteContact,
  validateContact,
} from '../../services/contactsService';
import { space, radius, touch } from '../../theme/tokens';
import { Trash2, Plus, Users } from 'lucide-react-native';

export const CircleScreen: React.FC = () => {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    const list = await loadContacts();
    setContacts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleOpenSheet = () => {
    setName('');
    setRelationship('');
    setPhone('');
    setSheetVisible(true);
  };

  const validationErrors = validateContact(name, relationship, phone);
  const isValid =
    Object.keys(validationErrors).length === 0 &&
    name.trim().length > 0 &&
    relationship.trim().length > 0 &&
    phone.trim().length > 0;

  const handleSaveContact = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    await saveContact({ name, relationship, phone });
    setSaving(false);
    setSheetVisible(false);
    fetchContacts();
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      `Remove ${contact.name}?`,
      'They will no longer be notified if an SOS is dispatched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteContact(contact.id);
            fetchContacts();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text variant="title">Emergency contacts</Text>
          <Text variant="caption" style={{ marginTop: space[1] }}>
            Stored securely on this device. Never transmitted without your action.
          </Text>
        </View>

        {/* Contacts List or Empty State */}
        {contacts.length === 0 && !loading ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Users size={32} color={colors.textMuted} strokeWidth={1.75} />
            </View>
            <Text variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
              No contacts added yet. SafeSphere works without contacts, but notifying loved ones requires at least one.
            </Text>
          </Card>
        ) : (
          <Card style={styles.contactsCard}>
            {contacts.map((contact, index) => {
              const isLast = index === contacts.length - 1;
              return (
                <View key={contact.id}>
                  <View style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text variant="label" style={{ fontWeight: '500' }}>
                        {contact.name}
                      </Text>
                      <Text
                        variant="small"
                        style={{ color: colors.textMuted, marginTop: 2 }}
                      >
                        {contact.relationship} · {contact.phone}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(contact)}
                      style={styles.deleteButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${contact.name}`}
                    >
                      <Trash2 size={18} color={colors.danger} strokeWidth={1.75} />
                    </Pressable>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.borderSubtle },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* Add Contact Button */}
        <Pressable
          onPress={handleOpenSheet}
          style={[
            styles.addContactButton,
            {
              borderColor: colors.accent,
              backgroundColor: 'transparent',
            },
          ]}
          accessibilityRole="button"
        >
          <Plus size={18} color={colors.accent} strokeWidth={1.75} style={{ marginRight: space[2] }} />
          <Text variant="body" style={{ color: colors.accent, fontWeight: '500' }}>
            Add contact
          </Text>
        </Pressable>
      </ScrollView>

      {/* Add Contact Bottom Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Add contact"
      >
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text variant="label" style={{ color: colors.textMuted, marginBottom: space[1] }}>
              Full name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={60}
              placeholder="e.g. Alex Morgan"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: validationErrors.name && name.length > 0 ? colors.danger : colors.border,
                },
              ]}
            />
            {validationErrors.name && name.length > 0 && (
              <Text variant="caption" style={{ color: colors.danger, marginTop: 2 }}>
                {validationErrors.name}
              </Text>
            )}
          </View>

          {/* Relationship */}
          <View style={styles.inputGroup}>
            <Text variant="label" style={{ color: colors.textMuted, marginBottom: space[1] }}>
              Relationship
            </Text>
            <TextInput
              value={relationship}
              onChangeText={setRelationship}
              maxLength={30}
              placeholder="e.g. Spouse, Parent, Roommate"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: validationErrors.relationship && relationship.length > 0 ? colors.danger : colors.border,
                },
              ]}
            />
            {validationErrors.relationship && relationship.length > 0 && (
              <Text variant="caption" style={{ color: colors.danger, marginTop: 2 }}>
                {validationErrors.relationship}
              </Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text variant="label" style={{ color: colors.textMuted, marginBottom: space[1] }}>
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={20}
              placeholder="e.g. +1 555 019 2834"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: validationErrors.phone && phone.length > 0 ? colors.danger : colors.border,
                },
              ]}
            />
            {validationErrors.phone && phone.length > 0 && (
              <Text variant="caption" style={{ color: colors.danger, marginTop: 2 }}>
                {validationErrors.phone}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            <Button
              variant="primary"
              size="large"
              disabled={!isValid || saving}
              onPress={handleSaveContact}
              style={{ flex: 1 }}
            >
              Save contact
            </Button>
            <Button
              variant="outline"
              size="large"
              onPress={() => setSheetVisible(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </View>
        </View>
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
  contactsCard: {
    padding: 0,
    marginBottom: space[4],
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 56,
  },
  rowInfo: {
    flex: 1,
    paddingRight: space[2],
  },
  deleteButton: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
  },
  addContactButton: {
    height: 56,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingTop: space[1],
  },
  inputGroup: {
    marginBottom: space[3],
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space[3],
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[3],
    marginBottom: space[2],
  },
});
