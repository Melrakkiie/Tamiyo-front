import { useState } from 'react';

// The last non-null value, so a closing modal keeps its content during the transition.
// Pass a stable value (state, or memoized): a new object each render re-renders once more.
export function useLastShown<T>(value: T | null) {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) {
    setLast(value);
  }
  return value ?? last;
}
