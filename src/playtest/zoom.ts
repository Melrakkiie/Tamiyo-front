import { useState } from 'react';

import { usePreferences, useUpdatePreferences } from '../auth/preferences';

const ZOOMS = [50, 60, 70, 80, 90, 100, 115, 130, 150, 175, 200];
const DEFAULT_ZOOM = 100;

function nearestIndex(zoom: number) {
  return ZOOMS.reduce((best, step, index) => (Math.abs(step - zoom) < Math.abs(ZOOMS[best] - zoom) ? index : best), 0);
}

export function usePlaytestZoom(signedIn: boolean) {
  const preferences = usePreferences(signedIn);
  const update = useUpdatePreferences();
  const [localZoom, setLocalZoom] = useState(DEFAULT_ZOOM);
  const index = nearestIndex(signedIn ? (preferences.data?.playtest_zoom ?? DEFAULT_ZOOM) : localZoom);

  function zoomTo(next: number) {
    const zoom = ZOOMS[Math.max(0, Math.min(next, ZOOMS.length - 1))];
    if (signedIn) {
      update.mutate({ playtest_zoom: zoom });
    } else {
      setLocalZoom(zoom);
    }
  }

  return {
    scale: ZOOMS[index] / 100,
    loading: signedIn && preferences.isLoading,
    canZoomIn: index < ZOOMS.length - 1,
    canZoomOut: index > 0,
    zoomIn: () => zoomTo(index + 1),
    zoomOut: () => zoomTo(index - 1),
  };
}

export type PlaytestZoom = ReturnType<typeof usePlaytestZoom>;
