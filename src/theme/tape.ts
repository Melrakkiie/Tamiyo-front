import type { CSSProperties } from 'react';

const tapes = ['lune', 'prune', 'ocelle'] as const;
const tilts = [-1.2, -0.6, 0.4, 0.9, -0.3];

function hash(value: string) {
  let total = 0;
  for (const char of value) {
    total = (total * 31 + char.charCodeAt(0)) % 9973;
  }
  return total;
}

export function tapeProps(key: string) {
  const value = hash(key);
  return {
    className: 'tamiyo-taped',
    'data-tape': tapes[value % tapes.length],
    style: { '--tamiyo-tilt': `${tilts[value % tilts.length]}deg` } as CSSProperties,
  };
}
