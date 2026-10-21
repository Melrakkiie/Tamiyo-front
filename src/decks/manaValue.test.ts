import { describe, expect, it } from 'vitest';

import { formatTotalManaValue } from './manaValue';

describe('formatTotalManaValue', () => {
  it('shows a whole total without decimal', () => {
    expect(formatTotalManaValue(0)).toBe('0');
    expect(formatTotalManaValue(142)).toBe('142');
  });

  it('shows one decimal when the total is fractional', () => {
    expect(formatTotalManaValue(12.5)).toBe('12.5');
  });

  it('rounds to one decimal before deciding', () => {
    expect(formatTotalManaValue(12.04)).toBe('12');
    expect(formatTotalManaValue(12.26)).toBe('12.3');
    expect(formatTotalManaValue(0.1 + 0.2)).toBe('0.3');
  });
});
