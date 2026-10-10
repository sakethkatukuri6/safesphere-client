import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseCountdownOptions {
  durationSeconds?: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useCountdown({
  durationSeconds = 10,
  onExpire,
  autoStart = false,
}: UseCountdownOptions = {}) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const start = useCallback(() => {
    setRemainingSeconds(durationSeconds);
    setIsRunning(true);
  }, [durationSeconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return {
    remainingSeconds,
    isRunning,
    start,
    stop,
    reset,
  };
}
