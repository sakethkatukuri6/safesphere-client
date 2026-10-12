import { useEffect } from 'react';
import { useSurvivalStore } from '../store/survivalStore';

export function useBattery() {
  const batteryLevel = useSurvivalStore((state) => state.batteryLevel);
  const simulatedBatteryLevel = useSurvivalStore((state) => state.simulatedBatteryLevel);
  const tier = useSurvivalStore((state) => state.tier);
  const gpsIntervalSeconds = useSurvivalStore((state) => state.gpsIntervalSeconds);
  const uiTheme = useSurvivalStore((state) => state.uiTheme);
  const evidenceCapture = useSurvivalStore((state) => state.evidenceCapture);
  const isPitchBlack = useSurvivalStore((state) => state.isPitchBlack);
  const initializeSurvivalEngine = useSurvivalStore((state) => state.initializeSurvivalEngine);
  const updateBattery = useSurvivalStore((state) => state.updateBattery);
  const simulateBatteryLevel = useSurvivalStore((state) => state.simulateBatteryLevel);

  useEffect(() => {
    initializeSurvivalEngine();
  }, [initializeSurvivalEngine]);

  const activeLevel = simulatedBatteryLevel !== null ? simulatedBatteryLevel : batteryLevel;

  return {
    batteryLevel: activeLevel,
    realBatteryLevel: batteryLevel,
    simulatedBatteryLevel,
    tier,
    gpsIntervalSeconds,
    uiTheme,
    evidenceCapture,
    isPitchBlack,
    updateBattery,
    simulateBatteryLevel,
  };
}
