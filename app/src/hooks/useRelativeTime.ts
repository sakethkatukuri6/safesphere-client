import { useState, useEffect } from 'react';

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Updated recently';
    const diffSeconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    );
    if (diffSeconds < 60) return `Updated ${diffSeconds} s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Updated ${diffMinutes} m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `Updated ${diffHours} h ago`;
  } catch {
    return 'Updated recently';
  }
}

export function useRelativeTime(isoString: string): string {
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(isoString));

  useEffect(() => {
    setRelativeTime(formatRelativeTime(isoString));
    const intervalId = setInterval(() => {
      setRelativeTime(formatRelativeTime(isoString));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isoString]);

  return relativeTime;
}
