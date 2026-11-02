import { ApiError } from './errors';

// French message for an import the API refused over a quantity outside 1 to 1000, null for any other error.
export function quantityErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.status !== 400) {
    return null;
  }
  const line = /line (\d+): invalid (?:Quantity|Count|quantity) "(.*)"/.exec(err.message);
  if (line) {
    return `La ligne ${line[1]} a une quantité invalide : « ${line[2]} ». Une ligne accepte de 1 à 1000 exemplaires.`;
  }
  const card = /card (\d+) \((.*)\): quantity must be between 1 and 1000/.exec(err.message);
  if (card) {
    return `La carte n° ${card[1]} (${card[2]}) a une quantité invalide. Une carte accepte de 1 à 1000 exemplaires.`;
  }
  return null;
}
