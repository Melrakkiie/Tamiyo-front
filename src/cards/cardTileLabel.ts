export function cardTileLabel({ name, quantity, foil }: { name: string; quantity: number; foil: boolean }): string {
  const parts = [name];
  if (foil) parts.push('foil');
  if (quantity > 1) parts.push(`${quantity} exemplaires`);
  return parts.join(', ');
}
