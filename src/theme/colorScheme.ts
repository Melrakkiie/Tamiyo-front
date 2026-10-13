import { useEffect, useState } from 'react';

import { usePreferences } from '../auth/preferences';
import { useSession } from '../auth/useSession';

export const DEFAULT_NIGHT_STARTS_AT = 22;
export const DEFAULT_NIGHT_ENDS_AT = 6;

export function isNightHour(hour: number, startsAt: number, endsAt: number) {
  return startsAt < endsAt ? hour >= startsAt && hour < endsAt : hour >= startsAt || hour < endsAt;
}

function useCurrentHour(enabled: boolean) {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setHour(new Date().getHours());
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return hour;
}

export function useTamiyoColorScheme(): 'light' | 'dark' {
  const { status } = useSession();
  const preferences = usePreferences(status === 'authenticated').data;
  const theme = status === 'authenticated' ? (preferences?.theme ?? 'auto') : 'auto';
  const hour = useCurrentHour(theme === 'auto');

  if (theme === 'day') {
    return 'light';
  }
  if (theme === 'night') {
    return 'dark';
  }
  const startsAt = preferences?.night_starts_at ?? DEFAULT_NIGHT_STARTS_AT;
  const endsAt = preferences?.night_ends_at ?? DEFAULT_NIGHT_ENDS_AT;
  return isNightHour(hour, startsAt, endsAt) ? 'dark' : 'light';
}
