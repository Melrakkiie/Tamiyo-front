/** Accessible name of a card tile or text row: name, finish, then stack size. */
export function cardTileLabel({
  name,
  quantity = 1,
  foil = false,
}: {
  name: string;
  quantity?: number;
  foil?: boolean;
}): string {
  const parts = [name];
  if (foil) parts.push('foil');
  if (quantity > 1) parts.push(`${quantity} exemplaires`);
  return parts.join(', ');
}
