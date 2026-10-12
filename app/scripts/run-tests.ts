import { darkColors, lightColors } from '../src/theme/tokens.ts';
import {
  evaluateTier,
  enforceBatteryGuardRails,
  DEFAULT_BATTERY_SETTINGS,
} from '../src/services/batterySettingsLogic.ts';
import type { BatterySettings } from '../src/services/batterySettingsLogic.ts';
import { validateContact } from '../src/services/contactValidation.ts';
import type {
  SosTriggerEvent,
  VolunteerIncidentView,
} from '../src/services/contract.types.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${testName} - ${detail || 'Assertion failed'}`);
  }
}

console.log('\n--- 1. CONTRACT VERIFICATION TESTS ---');

// Contract Rule 1: SosTriggerEvent wire payload has strictly 7 fields
const sampleSosEvent: SosTriggerEvent = {
  device_id: 'dev_mock_uuid_123',
  trigger_type: 'MANUAL_SOS',
  battery_level: 84,
  network_quality: 'STRONG',
  cannot_speak: false,
  threat_nearby: false,
  timestamp: '2026-10-10T12:00:00Z',
};

const sosKeys = Object.keys(sampleSosEvent).sort();
const expectedSosKeys = [
  'battery_level',
  'cannot_speak',
  'device_id',
  'network_quality',
  'threat_nearby',
  'timestamp',
  'trigger_type',
].sort();

assert(
  sosKeys.length === 7 && JSON.stringify(sosKeys) === JSON.stringify(expectedSosKeys),
  'SosTriggerEvent contains exactly the 7 fields defined in CitizenAppContract.md',
  `Got keys: ${sosKeys.join(', ')}`
);

// Contract Rule 2: VolunteerIncidentView has strictly 6 fields
const sampleVolunteerIncident: VolunteerIncidentView = {
  capsule_id: 'cap-9912',
  fsm_state: 'EMERGENCY',
  victim_name: 'Sarah Connor',
  victim_age: 29,
  victim_gender: 'Female',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    updated_at: '2026-10-10T12:01:00Z',
  },
};

const volKeys = Object.keys(sampleVolunteerIncident).sort();
const expectedVolKeys = [
  'capsule_id',
  'fsm_state',
  'location',
  'victim_age',
  'victim_gender',
  'victim_name',
].sort();

assert(
  volKeys.length === 6 && JSON.stringify(volKeys) === JSON.stringify(expectedVolKeys),
  'VolunteerIncidentView has strictly the 6 allowed contract fields',
  `Got keys: ${volKeys.join(', ')}`
);

const locKeys = Object.keys(sampleVolunteerIncident.location).sort();
const expectedLocKeys = ['latitude', 'longitude', 'updated_at'].sort();
assert(
  locKeys.length === 3 && JSON.stringify(locKeys) === JSON.stringify(expectedLocKeys),
  'Incident location contains strictly latitude, longitude, updated_at',
  `Got keys: ${locKeys.join(', ')}`
);

// Contract Rule 3: Zero medical data, OTP, hazard notes, or contacts in volunteer view
const forbiddenProperties = ['medical', 'otp', 'hazard', 'contacts', 'recipient', 'notes'];
const hasForbidden = forbiddenProperties.some((prop) => prop in sampleVolunteerIncident);
assert(!hasForbidden, 'Volunteer incident view strictly omits forbidden medical/OTP/hazard/contact fields');

console.log('\n--- 2. SURVIVAL ENGINE LOGIC & GUARD RAILS TESTS ---');

// Default Tier Evaluation
const eval100 = evaluateTier(100, DEFAULT_BATTERY_SETTINGS);
assert(eval100.tier === 'OPTIMAL' && eval100.tierName === 'Normal' && !eval100.isPitchBlack, '100% battery evaluates to Normal/OPTIMAL tier');

const eval50 = evaluateTier(50, DEFAULT_BATTERY_SETTINGS);
assert(eval50.tier === 'CONSERVE' && eval50.tierName === 'Low' && eval50.gpsIntervalSeconds === 30, '50% battery evaluates to Low/CONSERVE tier (30s interval)');

const eval15 = evaluateTier(15, DEFAULT_BATTERY_SETTINGS);
assert(eval15.tier === 'PITCH_BLACK' && eval15.tierName === 'Critical' && eval15.isPitchBlack && eval15.gpsIntervalSeconds === 300, '15% battery evaluates to Critical/PITCH_BLACK tier (Pitch Black on, 300s interval)');

const eval5 = evaluateTier(5, DEFAULT_BATTERY_SETTINGS);
assert(eval5.tier === 'PITCH_BLACK' && eval5.isPitchBlack, '5% battery stays in Critical/PITCH_BLACK tier');

// Custom Threshold Evaluation
const customSettings: BatterySettings = {
  version: 1,
  lowBatteryLevel: 65,
  criticalBatteryLevel: 20,
  gpsIntervalLow: 60,
  gpsIntervalCritical: 600,
  evidenceCritical: 'Audio only',
  pitchBlackAtCritical: true,
};

const evalCust70 = evaluateTier(70, customSettings);
assert(evalCust70.tier === 'OPTIMAL', 'Custom settings: 70% evaluates to Normal');

const evalCust55 = evaluateTier(55, customSettings);
assert(evalCust55.tier === 'CONSERVE' && evalCust55.gpsIntervalSeconds === 60, 'Custom settings: 55% evaluates to Low (60s interval)');

const evalCust18 = evaluateTier(18, customSettings);
assert(evalCust18.tier === 'PITCH_BLACK' && evalCust18.gpsIntervalSeconds === 600 && evalCust18.evidenceCapture === 'Compressed Audio Only', 'Custom settings: 18% evaluates to Critical (600s, Audio only)');

// Guard Rails Clamping
const clamped1 = enforceBatteryGuardRails({
  version: 1,
  lowBatteryLevel: 20, // below 30
  criticalBatteryLevel: 2, // below 5
  gpsIntervalLow: 30,
  gpsIntervalCritical: 300,
  evidenceCritical: 'None',
  pitchBlackAtCritical: true,
});
assert(clamped1.lowBatteryLevel === 30 && clamped1.criticalBatteryLevel === 5, 'Guard rails: Low clamped to min 30, Critical clamped to min 5');

const clamped2 = enforceBatteryGuardRails({
  version: 1,
  lowBatteryLevel: 95, // above 80
  criticalBatteryLevel: 35, // above 25
  gpsIntervalLow: 30,
  gpsIntervalCritical: 300,
  evidenceCritical: 'None',
  pitchBlackAtCritical: true,
});
assert(clamped2.lowBatteryLevel === 80 && clamped2.criticalBatteryLevel === 25, 'Guard rails: Low clamped to max 80, Critical clamped to max 25');

const clamped3 = enforceBatteryGuardRails({
  version: 1,
  lowBatteryLevel: 30,
  criticalBatteryLevel: 25, // 25 > 30 - 10 (20)
  gpsIntervalLow: 30,
  gpsIntervalCritical: 300,
  evidenceCritical: 'None',
  pitchBlackAtCritical: true,
});
assert(clamped3.criticalBatteryLevel === 20, 'Guard rails: Critical clamped to Low - 10 (30 - 10 = 20)');

console.log('\n--- 3. CONTACT VALIDATION TESTS ---');

const validContact = validateContact('Elena Vance', 'Colleague', '+1 555 123 4567');
assert(Object.keys(validContact).length === 0, 'validateContact accepts valid contact');

const emptyContact = validateContact('', '', '');
assert(Boolean(emptyContact.name && emptyContact.relationship && emptyContact.phone), 'validateContact rejects empty fields');

const longName = 'A'.repeat(61);
const nameTooLong = validateContact(longName, 'Parent', '1234567890');
assert(Boolean(nameTooLong.name), 'validateContact rejects name > 60 chars');

const longRel = 'R'.repeat(31);
const relTooLong = validateContact('Valid Name', longRel, '1234567890');
assert(Boolean(relTooLong.relationship), 'validateContact rejects relationship > 30 chars');

const longPhone = '1'.repeat(21);
const phoneTooLong = validateContact('Valid Name', 'Parent', longPhone);
assert(Boolean(phoneTooLong.phone), 'validateContact rejects phone > 20 chars');

const invalidPhone = validateContact('Valid Name', 'Parent', 'abc-def-ghij');
assert(Boolean(invalidPhone.phone), 'validateContact rejects invalid non-numeric phone characters');

console.log('\n--- 4. DUAL THEME TOKENS & CONTRAST RATIO TESTS ---');

const darkKeys = Object.keys(darkColors).sort();
const lightKeys = Object.keys(lightColors).sort();

assert(
  JSON.stringify(darkKeys) === JSON.stringify(lightKeys),
  'Dark and Light theme token palettes have 100% identical token keys'
);

// Luminance calculation
function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Dark theme body text contrast
const darkTextContrast = getContrastRatio(darkColors.text, darkColors.bg);
assert(darkTextContrast >= 4.5, `Dark theme body text contrast >= 4.5:1 (actual: ${darkTextContrast.toFixed(2)}:1)`);

// Light theme body text contrast
const lightTextContrast = getContrastRatio(lightColors.text, lightColors.bg);
assert(lightTextContrast >= 4.5, `Light theme body text contrast >= 4.5:1 (actual: ${lightTextContrast.toFixed(2)}:1)`);

// Dark onAccent on Accent fill
const darkAccentContrast = getContrastRatio(darkColors.onAccent, darkColors.accent);
assert(darkAccentContrast >= 4.5, `Dark theme onAccent text on Accent fill >= 4.5:1 (actual: ${darkAccentContrast.toFixed(2)}:1)`);

// Light onAccent on Accent fill
const lightAccentContrast = getContrastRatio(lightColors.onAccent, lightColors.accent);
assert(lightAccentContrast >= 4.5, `Light theme onAccent text on Accent fill >= 4.5:1 (actual: ${lightAccentContrast.toFixed(2)}:1)`);

// Dark onAccent on Danger fill
const darkDangerContrast = getContrastRatio(darkColors.onAccent, darkColors.danger);
assert(darkDangerContrast >= 4.5, `Dark theme onAccent text on Danger fill >= 4.5:1 (actual: ${darkDangerContrast.toFixed(2)}:1)`);

// SOS button label (34px bold display text) on Danger fill
const darkSosContrast = getContrastRatio(darkColors.sosLabel, darkColors.danger);
assert(darkSosContrast >= 3.0, `Dark theme SOS label contrast >= 3.0:1 (actual: ${darkSosContrast.toFixed(2)}:1)`);

console.log('\n=======================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('=======================================\n');

if (failedTests > 0) {
  process.exit(1);
}
