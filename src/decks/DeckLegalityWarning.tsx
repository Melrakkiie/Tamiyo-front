import { Alert, Anchor, List, Modal, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { useDeckLegality } from './api';

const REASONS: [RegExp, (...groups: string[]) => string][] = [
  [
    /^deck size: (\d+) cards, (.+) requires exactly (\d+)$/,
    (count, format, size) =>
      `le deck compte ${count} cartes, alors que le format ${format} en demande exactement ${size}`,
  ],
  [
    /^deck size: (\d+) cards, (.+) requires at least (\d+)$/,
    (count, format, size) =>
      `le deck compte ${count} cartes, alors que le format ${format} en demande au moins ${size}`,
  ],
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

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function translateReason(reason: string): string {
  for (const [pattern, translate] of REASONS) {
    const match = pattern.exec(reason);
    if (match) {
      return translate(...match.slice(1));
    }
  }
  return reason;
}

export function DeckLegalityWarning({ deck }: { deck: Deck }) {
  const legality = useDeckLegality(deck.id, true);
  const [opened, setOpened] = useState(false);

  if (legality.error) {
    return (
      <Alert color="orange" variant="light">
        {errorMessage(legality.error, {
          400: "Le format de ce deck n'est pas reconnu par Scryfall : modifie-le pour que sa légalité soit vérifiée.",
          502: "Scryfall est momentanément indisponible : la légalité du deck n'a pas pu être vérifiée.",
        })}
      </Alert>
    );
  }

  const report = legality.data;
  if (!report || report.legal) {
    return null;
  }
  const issues = report.issues ?? [];

  return (
    <>
      <Alert color="orange" variant="light" title={`Deck non légal en ${report.format}`}>
        {issues.length} problème{issues.length > 1 ? 's' : ''}.{' '}
        <Anchor component="button" size="sm" onClick={() => setOpened(true)}>
          Voir le détail
        </Anchor>
      </Alert>
      <Modal opened={opened} onClose={() => setOpened(false)} title={`Légalité en ${report.format}`} size="lg">
        <Stack>
          <List spacing="xs">
            {issues.map((issue, index) => (
              <List.Item key={`${issue.card_id ?? 'deck'}-${index}`}>
                {issue.card_name ? (
                  <>
                    <Text span fw={500}>
                      {issue.card_name}
                    </Text>{' '}
                    <Text span c="dimmed">
                      : {translateReason(issue.reason)}
                    </Text>
                  </>
                ) : (
                  <Text span fw={500}>
                    {capitalize(translateReason(issue.reason))}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
          <Text size="xs" c="dimmed">
            Calculé à partir des données Scryfall au moment de l'affichage.
          </Text>
        </Stack>
      </Modal>
    </>
  );
}
