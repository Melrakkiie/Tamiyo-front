import type { Card, ComparedCard } from '../api/types';
import { copyIds } from '../cards/copies';

export function comparedStackTotals(stack: Card, comparedById: Map<number, ComparedCard>) {
  const entries = copyIds(stack).flatMap((id) => comparedById.get(id) ?? []);
  return {
    quantity: entries.reduce((total, entry) => total + entry.quantity, 0),
    otherQuantity: entries.reduce((total, entry) => total + entry.other_quantity, 0),
    commander: entries.some((entry) => entry.commander),
    otherCommander: entries.some((entry) => entry.other_commander),
  };
}
