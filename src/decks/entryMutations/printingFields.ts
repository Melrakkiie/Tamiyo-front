import type { Card } from '../../api/types';

type PrintingKeys =
  | 'name'
  | 'scryfall_id'
  | 'set_code'
  | 'collector_number'
  | 'foil'
  | 'mana_value'
  | 'colors'
  | 'card_type'
  | 'color_identity';

export type PrintingFields = Pick<Card, PrintingKeys>;

export function printingFields(source: PrintingFields): PrintingFields {
  const { name, scryfall_id, set_code, collector_number, foil, mana_value, colors, card_type, color_identity } = source;
  return { name, scryfall_id, set_code, collector_number, foil, mana_value, colors, card_type, color_identity };
}
