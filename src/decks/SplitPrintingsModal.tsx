import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  HoverCard,
  Image,
  Loader,
  Modal,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, ImportSummary } from '../api/types';
import { copyIds } from '../cards/api';
import { PrintingPrice } from '../cards/price';
import { imageUrl, type ScryfallCard } from '../scryfall/client';
import { usePrintings } from '../scryfall/hooks';
import { canBeFoil, canBeNonFoil, foilFor } from '../scryfall/printing';
import { SetIcon } from '../scryfall/SetIcon';
import { useSplitPrintings } from './api';
import { isPendingCard, pendingIdOf } from './pendingCards';

export function summaryDetails(summary: ImportSummary) {
  const linked = summary.cards_linked ?? 0;
  const pending = summary.cards_pending ?? 0;
  const details = [
    linked > 0 ? `${linked} exemplaire${linked > 1 ? 's' : ''} de ta collection` : null,
    pending > 0 ? `${pending} en attente` : null,
  ].filter(Boolean);
  return details.length > 0 ? ` : ${details.join(', ')}` : '';
}

interface SplitPrintingsModalProps {
  deckId: string;
  card: Card | null;
  onClose: () => void;
}

export function SplitPrintingsModal({ deckId, card, onClose }: SplitPrintingsModalProps) {
  return (
    <Modal opened={card !== null} onClose={onClose} title="Séparer les éditions" size="lg">
      {card && <SplitPrintingsForm deckId={deckId} card={card} onClose={onClose} />}
    </Modal>
  );
}

interface Row {
  scryfallId: string;
  foil: boolean;
}

function SplitPrintingsForm({ deckId, card, onClose }: { deckId: string; card: Card; onClose: () => void }) {
  const printings = usePrintings(card.name);
  const split = useSplitPrintings();
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: card.quantity ?? 1 }, () => ({ scryfallId: card.scryfall_id, foil: card.foil })),
  );
  const byId = new Map((printings.data ?? []).map((printing) => [printing.id, printing]));
  const options = (printings.data ?? []).map((printing) => ({
    value: printing.id,
    label: `${printing.set_name} · ${printing.set.toUpperCase()} #${printing.collector_number}`,
  }));
  const changed = rows.some((row) => row.scryfallId !== card.scryfall_id || row.foil !== card.foil);

  function update(index: number, row: Row) {
    setRows((current) => current.map((other, i) => (i === index ? row : other)));
  }

  function choosePrinting(index: number, scryfallId: string | null) {
    const printing = scryfallId ? byId.get(scryfallId) : undefined;
    if (printing) {
      update(index, { scryfallId: printing.id, foil: foilFor(printing, rows[index].foil) });
    }
  }

  function submit() {
    const printingsOfRows = rows.map((row) => {
      const printing = byId.get(row.scryfallId);
      return {
        scryfall_id: row.scryfallId,
        set_code: printing?.set ?? card.set_code,
        collector_number: printing?.collector_number ?? card.collector_number,
        foil: row.foil,
      };
    });
    const sources = isPendingCard(card) ? { pendingIds: [pendingIdOf(card)] } : { cardIds: copyIds(card) };
    split.mutate(
      { deckId, ...sources, printings: printingsOfRows },
      {
        onSuccess: (summary) => {
          notifications.show({
            color: 'green',
            message: `Les exemplaires de ${card.name} ont leur édition${summaryDetails(summary)}. Ta collection n'a pas changé.`,
          });
          onClose();
        },
      },
    );
  }

  if (printings.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  if (printings.error) {
    return <Alert color="red">{errorMessage(printings.error)}</Alert>;
  }

  return (
    <Stack>
      <Text size="sm">
        Choisis l'édition de chaque exemplaire de <b>{card.name}</b> :
      </Text>
      <Stack gap="xs">
        {rows.map((row, index) => {
          const printing = byId.get(row.scryfallId);
          return (
            <Group key={index} gap="sm" wrap="nowrap">
              <Text size="sm" c="dimmed" w={24} ta="right">
                {index + 1}
              </Text>
              <Select
                aria-label={`Édition de l'exemplaire ${index + 1}`}
                data={options}
                value={row.scryfallId}
                onChange={(value) => choosePrinting(index, value)}
                searchable
                allowDeselect={false}
                nothingFoundMessage="Aucune édition"
                renderOption={({ option }) => {
                  const choice = byId.get(option.value);
                  return (
                    <Group gap="xs" wrap="nowrap" w="100%">
                      <SetIcon setCode={choice?.set ?? ''} />
                      <Text size="sm">{option.label}</Text>
                      {choice && (
                        <PrintingPrice printing={choice} foil={foilFor(choice, row.foil)} size="sm" ml="auto" />
                      )}
                    </Group>
                  );
                }}
                style={{ flex: 1 }}
              />
              <Switch
                label="Foil"
                checked={row.foil}
                disabled={!printing || !canBeFoil(printing) || !canBeNonFoil(printing)}
                onChange={(event) => update(index, { ...row, foil: event.currentTarget.checked })}
              />
              <PrintingPreview printing={printing} />
            </Group>
          );
        })}
      </Stack>
      {split.error && <Alert color="red">{errorMessage(split.error)}</Alert>}
      <Group justify="flex-end" gap="xs">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={submit} loading={split.isPending} disabled={!changed}>
          Enregistrer
        </Button>
      </Group>
    </Stack>
  );
}

function PrintingPreview({ printing }: { printing: ScryfallCard | undefined }) {
  const src = printing ? imageUrl(printing, 'normal') : undefined;
  if (!src) {
    return (
      <Text size="sm" c="dimmed">
        Aperçu
      </Text>
    );
  }
  return (
    <HoverCard position="left" shadow="md" openDelay={100}>
      <HoverCard.Target>
        <Anchor component="button" type="button" size="sm">
          Aperçu
        </Anchor>
      </HoverCard.Target>
      <HoverCard.Dropdown p={4}>
        <Image src={src} alt={printing?.name} w={244} radius="md" />
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
