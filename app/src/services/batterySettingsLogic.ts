// INTENTIONAL DEVIATION: SafeSphere.md section 9 hardcodes 50% and 15% thresholds.
// C5 introduces user-configurable sliders and intervals with strict safety guard rails.

export type LowGpsIntervalOption = 30 | 60 | 120;
export type CriticalGpsIntervalOption = 120 | 300 | 600;
export type CriticalEvidenceOption = 'None' | 'Audio only';

export interface BatterySettings {
  version: 1;
  lowBatteryLevel: number; // 30 to 80, step 1, default 50
  criticalBatteryLevel: number; // 5 to 25, step 1, default 15
  gpsIntervalLow: LowGpsIntervalOption; // 30 | 60 | 120, default 30
  gpsIntervalCritical: CriticalGpsIntervalOption; // 120 | 300 | 600, default 300
  evidenceCritical: CriticalEvidenceOption; // 'None' | 'Audio only', default 'None'
  pitchBlackAtCritical: boolean; // default true
}

export const DEFAULT_BATTERY_SETTINGS: BatterySettings = {
  version: 1,
  lowBatteryLevel: 50,
  criticalBatteryLevel: 15,
  gpsIntervalLow: 30,
  gpsIntervalCritical: 300,
  evidenceCritical: 'None',
  pitchBlackAtCritical: true,
};

export const SETTINGS_STORAGE_KEY = 'safesphere_battery_settings_v1';

/**
 * Enforces battery settings guard rails:
 * 1. Low battery level: clamp between 30 and 80.
 * 2. Critical battery level: clamp between 5 and 25.
 * 3. Critical must always be <= Low - 10.
 * 4. GPS interval: low tier must be <= critical tier interval.
 */
export function enforceBatteryGuardRails(settings: BatterySettings): BatterySettings {
  let low = Math.max(30, Math.min(80, Math.round(settings.lowBatteryLevel)));
  let critical = Math.max(5, Math.min(25, Math.round(settings.criticalBatteryLevel)));

  // Critical can never be >= Low - 10
  if (critical > low - 10) {
    critical = Math.max(5, low - 10);
  }

  const validLowGps: LowGpsIntervalOption[] = [30, 60, 120];
  const lowGps = validLowGps.includes(settings.gpsIntervalLow) ? settings.gpsIntervalLow : 30;

  const validCritGps: CriticalGpsIntervalOption[] = [120, 300, 600];
  const critGps = validCritGps.includes(settings.gpsIntervalCritical) ? settings.gpsIntervalCritical : 300;

  const critEv: CriticalEvidenceOption =
    settings.evidenceCritical === 'Audio only' ? 'Audio only' : 'None';

  return {
    version: 1,
    lowBatteryLevel: low,
    criticalBatteryLevel: critical,
    gpsIntervalLow: lowGps,
    gpsIntervalCritical: critGps,
    evidenceCritical: critEv,
    pitchBlackAtCritical: Boolean(settings.pitchBlackAtCritical),
  };
}

export type ComputedTier = 'OPTIMAL' | 'CONSERVE' | 'PITCH_BLACK';

export interface TierEvaluation {
  tier: ComputedTier;
  tierName: string;
  gpsIntervalSeconds: number;
  evidenceCapture: string;
  isPitchBlack: boolean;
}

/**
 * Evaluates current tier for a given battery percentage based on user settings.
 */
export function evaluateTier(
  batteryLevel: number,
  settings: BatterySettings
): TierEvaluation {
  const safe = enforceBatteryGuardRails(settings);

  if (batteryLevel <= safe.criticalBatteryLevel) {
    return {
      tier: 'PITCH_BLACK',
      tierName: 'Critical',
      gpsIntervalSeconds: safe.gpsIntervalCritical,
      evidenceCapture: safe.evidenceCritical === 'Audio only' ? 'Compressed Audio Only' : 'Disabled',
      isPitchBlack: safe.pitchBlackAtCritical,
    };
  }

  if (batteryLevel <= safe.lowBatteryLevel) {
    return {
      tier: 'CONSERVE',
      tierName: 'Low',
      gpsIntervalSeconds: safe.gpsIntervalLow,
      evidenceCapture: 'Compressed Audio Only',
      isPitchBlack: false,
    };
  }

  return {
    tier: 'OPTIMAL',
    tierName: 'Normal',
    gpsIntervalSeconds: 5,
    evidenceCapture: 'High-Res Video + Audio',
    isPitchBlack: false,
  };
}
