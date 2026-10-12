import { Accelerometer, Gyroscope } from 'expo-sensors';
import { TriggerType } from './contract.types';

export type SensorTriggerCallback = (trigger: TriggerType) => void;

class SensorService {
  private isListening = false;
  private accelSubscription: any = null;
  private gyroSubscription: any = null;
  private onTriggerCallback: SensorTriggerCallback | null = null;

  // Thresholds for crash detection: high G impact followed by rotational spike
  private readonly ACCEL_CRASH_THRESHOLD = 3.5; // ~3.5G
  private readonly GYRO_CRASH_THRESHOLD = 5.0; // rad/s

  private lastAccelMagnitude = 0;

  startListening(callback: SensorTriggerCallback): void {
    this.onTriggerCallback = callback;
    if (this.isListening) return;
    this.isListening = true;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || !this.isListening) return;
        Accelerometer.setUpdateInterval(100);
        this.accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
          const magX = typeof x === 'number' ? x : 0;
          const magY = typeof y === 'number' ? y : 0;
          const magZ = typeof z === 'number' ? z : 0;
          const magnitude = Math.sqrt(magX * magX + magY * magY + magZ * magZ);
          this.lastAccelMagnitude = magnitude;

          if (magnitude > this.ACCEL_CRASH_THRESHOLD) {
            this.triggerCrash();
          }
        });
      })
      .catch(() => {
        // sensors unavailable
      });

    Gyroscope.isAvailableAsync()
      .then((available) => {
        if (!available || !this.isListening) return;
        Gyroscope.setUpdateInterval(100);
        this.gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
          const rotX = typeof x === 'number' ? x : 0;
          const rotY = typeof y === 'number' ? y : 0;
          const rotZ = typeof z === 'number' ? z : 0;
          const rotationalMagnitude = Math.sqrt(rotX * rotX + rotY * rotY + rotZ * rotZ);
          if (rotationalMagnitude > this.GYRO_CRASH_THRESHOLD && this.lastAccelMagnitude > 2.0) {
            this.triggerCrash();
          }
        });
      })
      .catch(() => {
        // sensors unavailable
      });
  }

  stopListening(): void {
    this.isListening = false;
    if (this.accelSubscription) {
      try {
        this.accelSubscription.remove();
      } catch {}
      this.accelSubscription = null;
    }
    if (this.gyroSubscription) {
      try {
        this.gyroSubscription.remove();
      } catch {}
      this.gyroSubscription = null;
    }
    this.onTriggerCallback = null;
  }

  private triggerCrash(): void {
    if (this.onTriggerCallback) {
      try {
        this.onTriggerCallback('CRASH_DETECTED');
      } catch {}
    }
  }

  /**
   * CONTRACT-GAP: G6 - No definition of how ROUTE_DEVIATION is detected
   * (what counts as a deviation, what route is monitored).
   * Stub provided behind typed interface.
   */
  simulateRouteDeviation(): void {
    if (this.onTriggerCallback) {
      this.onTriggerCallback('ROUTE_DEVIATION');
    }
  }

  /**
   * Debug-only crash trigger for indoor demos (SafeSphere.md section 16).
   * Excluded from release builds if __DEV__ is false.
   */
  debugTriggerCrash(): void {
    if (__DEV__) {
      this.triggerCrash();
    }
  }
}

export const sensorService = new SensorService();
