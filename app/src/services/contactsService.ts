import * as SecureStore from 'expo-secure-store';
import {
  ContactValidationErrors,
  validateContact,
} from './contactValidation';

export * from './contactValidation';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

const CONTACTS_STORAGE_KEY = 'safesphere_emergency_contacts_v1';

export async function loadContacts(): Promise<EmergencyContact[]> {
  try {
    const raw = await SecureStore.getItemAsync(CONTACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Read failed, return empty
  }
  return [];
}

export async function saveContact(
  input: Omit<EmergencyContact, 'id'> & { id?: string }
): Promise<EmergencyContact> {
  const contacts = await loadContacts();
  let contactToReturn: EmergencyContact;

  if (input.id) {
    // Update existing
    const index = contacts.findIndex((c) => c.id === input.id);
    contactToReturn = {
      id: input.id,
      name: input.name.trim(),
      relationship: input.relationship.trim(),
      phone: input.phone.trim(),
    };
    if (index >= 0) {
      contacts[index] = contactToReturn;
    } else {
      contacts.push(contactToReturn);
    }
  } else {
    // Create new
    contactToReturn = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      relationship: input.relationship.trim(),
      phone: input.phone.trim(),
    };
    contacts.push(contactToReturn);
  }

  await SecureStore.setItemAsync(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  return contactToReturn;
}

export async function deleteContact(id: string): Promise<void> {
  const contacts = await loadContacts();
  const filtered = contacts.filter((c) => c.id !== id);
  await SecureStore.setItemAsync(CONTACTS_STORAGE_KEY, JSON.stringify(filtered));
}
