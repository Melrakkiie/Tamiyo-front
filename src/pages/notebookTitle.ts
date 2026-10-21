export function notebookTitle(displayName?: string | null): string {
  const name = displayName ?? '';
  return startsWithVowel(name) ? `Le carnet d'${name}` : `Le carnet de ${name}`;
}

function startsWithVowel(name: string): boolean {
  const first = name.normalize('NFD').charAt(0).toLowerCase();
  return 'aeiouy'.includes(first);
}
