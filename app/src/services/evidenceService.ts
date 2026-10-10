// CONTRACT-GAP: G4 - Evidence capture is local-only; no upload route exists in CitizenAppContract.md.
import * as SecureStore from 'expo-secure-store';

export interface EvidenceItem {
  id: string;
  createdAt: string; // ISO date string
  mode: 'Audio' | 'Photo';
  fileSize: string;
  hash: string;
  storageLocation: string;
  isEncrypted: boolean;
}

const STORAGE_KEY = 'safesphere_evidence_capsules_v1';

const SEED_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev-cap-001',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    mode: 'Audio',
    fileSize: '1.2 MB',
    hash: 'sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    storageLocation: 'SecureStore/vault/audio_001.bin',
    isEncrypted: true,
  },
  {
    id: 'ev-cap-002',
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    mode: 'Photo',
    fileSize: '3.8 MB',
    hash: 'sha256:d41d8cd98f00b204e9800998ecf8427e7b6d132ee5f590b1aa3690d56c71c4c9',
    storageLocation: 'SecureStore/vault/photo_002.bin',
    isEncrypted: true,
  },
];

export const evidenceService = {
  async getEvidenceItems(): Promise<EvidenceItem[]> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!data) {
        // Initialize with seed data for demonstration
        await this.saveEvidenceItems(SEED_EVIDENCE);
        return SEED_EVIDENCE;
      }
      return JSON.parse(data);
    } catch {
      return SEED_EVIDENCE;
    }
  },

  async saveEvidenceItems(items: EvidenceItem[]): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage error ignored
    }
  },

  async addEvidenceItem(item: EvidenceItem): Promise<void> {
    const current = await this.getEvidenceItems();
    const updated = [item, ...current];
    await this.saveEvidenceItems(updated);
  },

  async clearEvidenceItems(): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // Storage error ignored
    }
  },
};
