import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Users, Plus, Phone, MapPin, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Contacts from 'expo-contacts';
import colors from '../../theme/colors';
import { fetchEmergencyContacts, ContactItem } from '../../lib/api';

export default function CircleScreen() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [shareLiveLocation, setShareLiveLocation] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    fetchEmergencyContacts().then((data) => setContacts(data));
  }, []);

  const handleCall = (phoneNumber: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Phone Call', `Calling ${phoneNumber}`);
    });
  };

  const handleAddFromDevice = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const picked = data[0];
          const phone = picked.phoneNumbers?.[0]?.number || '+91 98765 43210';
          const newContact: ContactItem = {
            id: `c-${Date.now()}`,
            name: picked.name || 'New Contact',
            relationship: 'Contact',
            phone,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
          };
          setContacts([...contacts, newContact]);
          setAddModalVisible(false);
          return;
        }
      }
    } catch (_e) {}

    // Fallback if permission not granted
    setAddModalVisible(true);
  };

  const handleSaveManualContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please fill both Name and Phone number');
      return;
    }
    const newContact: ContactItem = {
      id: `c-${Date.now()}`,
      name: newName.trim(),
      relationship: 'Trusted Contact',
      phone: newPhone.trim(),
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    };
    setContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setAddModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Users size={22} color={colors.green} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>My Circle</Text>
        </View>

        <TouchableOpacity
          onPress={() => setAddModalVisible(true)}
          style={styles.addButton}
        >
          <Plus size={16} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trusted Contacts Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Trusted Contacts ({contacts.length}/5)
          </Text>
        </View>

        {/* Contacts List */}
        <View style={styles.contactsList}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <Image
                source={{
                  uri:
                    contact.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                }}
                style={styles.contactAvatar}
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleCall(contact.phone)}
                style={styles.callButton}
              >
                <Phone size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Share Live Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconCircle}>
            <MapPin size={20} color={colors.blue} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Share Live Location</Text>
            <Text style={styles.locationSubtitle}>
              Share your real-time location with circle members
            </Text>
          </View>
          <Switch
            value={shareLiveLocation}
            onValueChange={setShareLiveLocation}
            trackColor={{ false: colors.border, true: colors.greenDark }}
            thumbColor={shareLiveLocation ? colors.green : colors.textMuted}
          />
        </View>

        {/* Emergency Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Services</Text>
        </View>

        <View style={styles.emergencyCard}>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>112</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle}>112</Text>
            <Text style={styles.serviceSubtitle}>India Emergency Services</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleCall('112')}
            style={styles.callButton}
          >
            <Phone size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Trusted Contact</Text>
            <Text style={styles.modalSubtitle}>
              Trusted contacts receive instant SMS & live tracking when SOS is triggered.
            </Text>

            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Full Name (e.g., Sister, Partner)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <TextInput
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Phone Number (+91 ...)"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveManualContact}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>Add Contact</Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  contactsList: {
    gap: 10,
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  contactPhone: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
  },
  locationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blueDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
    paddingRight: 8,
  },
  locationTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  locationSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  serviceBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  serviceSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundModal,
    borderRadius: 20,
    padding: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
