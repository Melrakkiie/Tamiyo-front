import { Alert, Center, List, Loader, Stack, Text } from '@mantine/core';

import { errorMessage } from '../api/errors';
import { useDeckLegality } from './api';

const REASONS: [RegExp, (...groups: string[]) => string][] = [
  [/^could not verify legality/, () => 'légalité invérifiable : carte introuvable sur Scryfall'],
  [/^not legal in (.+)$/, (format) => `non légale en ${format}`],
  [/^restricted in (.+)$/, (format) => `restreinte en ${format}`],
  [/^banned in (.+)$/, (format) => `bannie en ${format}`],
  [
    /^singleton violation: (\d+) copies/,
    (count) => `${count} exemplaires, alors que le commander n'en autorise qu'un (terrains de base exceptés)`,
  ],
  [
    /^outside commander's color identity \(card: (.+), commander: (.+)\)$/,
    (card, commander) => `hors de l'identité couleur du commandant (carte : ${card}, commandant : ${commander})`,
  ],
];

function translateReason(reason: string): string {
  for (const [pattern, translate] of REASONS) {
    const match = pattern.exec(reason);
    if (match) {
      return translate(...match.slice(1));
    }
  }
  return reason;
}

export function DeckLegalityPanel({ deckId }: { deckId: number }) {
  const legality = useDeckLegality(deckId, true);

  if (legality.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!legality.data) {
    return (
      <Alert color="red">
        {errorMessage(legality.error, {
          400: "Le format de ce deck n'est pas reconnu par Scryfall : modifie-le pour vérifier sa légalité.",
          502: 'Scryfall est momentanément indisponible. Réessaie dans un instant.',
        })}
      </Alert>
    );
  }

  const report = legality.data;
  const issues = report.issues ?? [];

  return (
    <Stack>
      {report.legal ? (
        <Alert color="green" title="Deck légal">
          Toutes les cartes sont légales en {report.format}.
        </Alert>
      ) : (
        <Alert color="red" title="Deck non légal">
          {issues.length} problème{issues.length > 1 ? 's' : ''} en {report.format}.
        </Alert>
      )}
      {issues.length > 0 && (
        <List spacing="xs">
          {issues.map((issue, index) => (
            <List.Item key={`${issue.card_id ?? 'deck'}-${index}`}>
              <Text span fw={500}>
                {issue.card_name}
              </Text>{' '}
              <Text span c="dimmed">
                : {translateReason(issue.reason)}
              </Text>
            </List.Item>
          ))}
        </List>
      )}
      <Text size="xs" c="dimmed">
        Calculé à partir des données Scryfall au moment de l'affichage.
      </Text>
    </Stack>
  );
}
