interface Recent {
  id: number;
  updated: string;
}

export interface Group<T> {
  key: string;
  label: string;
  items: T[];
}

function byMostRecent(a: Recent, b: Recent) {
  return b.updated.localeCompare(a.updated) || b.id - a.id;
}

export function groupByRecent<T extends Recent>(
  items: T[],
  keyOf: (item: T) => string,
  labelOf: (key: string) => string,
): Group<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item).trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([key, groupItems]) => ({ key, label: labelOf(key), items: [...groupItems].sort(byMostRecent) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
