import { Alert, Button, Center, Group, Loader, Modal, NumberInput, Select, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { DeckBoard } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { deckLineFile } from '../decks/AddCopiesToDeckModal';
import { useAddPendingCard } from '../decks/api';
import { BoardPicker } from '../decks/BoardSection';
import { deckListErrorMessage, deckListSummary } from '../decks/DeckListInput';
import type { ScryfallCard } from '../scryfall/client';
import { usePrintings } from '../scryfall/hooks';
import { canBeFoil, canBeNonFoil, printingDetails } from '../scryfall/printing';
import { PrintingGrid } from '../scryfall/PrintingGrid';
import { useStorageOptions } from '../storages/api';
import { StorageFieldLabel } from '../storages/StorageLabel';
import { PartialCreationError, useCreateCards } from './api';

export interface CardToAdd {
  name: string;
  printing?: ScryfallCard;
}

export type AddTarget =
  | { kind: 'collection' }
  | { kind: 'pending'; deckId: string; board: DeckBoard }
  | { kind: 'deck'; deckId: string; deckName: string };

interface AddCardModalProps {
  card: CardToAdd | null;
  onClose: () => void;
  defaultStorageId: number | undefined;
  target?: AddTarget;
}

function modalTitle(name: string, target: AddTarget) {
  switch (target.kind) {
    case 'pending':
      return `Ajouter ${name} au deck`;
    case 'deck':
      return `Ajouter ${name} à ${target.deckName}`;
    case 'collection':
      return `Ajouter ${name}`;
  }
}

export function AddCardModal({ card, onClose, defaultStorageId, target = { kind: 'collection' } }: AddCardModalProps) {
  return (
    <Modal opened={card !== null} onClose={onClose} title={card ? modalTitle(card.name, target) : undefined} size="xl">
      {card && (
        <AddCardForm
          key={`${card.name}-${card.printing?.id ?? ''}`}
          name={card.name}
          initialPrinting={card.printing}
          onClose={onClose}
          defaultStorageId={defaultStorageId}
          target={target}
        />
      )}
    </Modal>
  );
}

const MAX_QUANTITY = 20;

function clampQuantity(value: number | string) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(value)) || 1));
}

interface AddCardFormProps {
  name: string;
  initialPrinting: ScryfallCard | undefined;
  onClose: () => void;
  defaultStorageId: number | undefined;
  target: AddTarget;
}

function AddCardForm({ name, initialPrinting, onClose, defaultStorageId, target }: AddCardFormProps) {
  const [printing, setPrinting] = useState<ScryfallCard | null>(initialPrinting ?? null);
  const [foil, setFoil] = useState(
    initialPrinting ? !canBeNonFoil(initialPrinting) && canBeFoil(initialPrinting) : false,
  );
  const [storageId, setStorageId] = useState<string | null>(defaultStorageId ? String(defaultStorageId) : null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [proxy, setProxy] = useState(false);

  const printings = usePrintings(name);
  const candidates = initialPrinting
    ? [initialPrinting, ...(printings.data ?? []).filter((candidate) => candidate.id !== initialPrinting.id)]
    : (printings.data ?? []);
  const storageOptions = useStorageOptions();
  const create = useCreateCards();
  const addPending = useAddPendingCard();
  const importLine = useImportIntoDeck();
  const [board, setBoard] = useState<DeckBoard>('main');
  const pending = target.kind === 'pending';
  const toDeck = target.kind === 'pending' || target.kind === 'deck';

  function selectPrinting(next: ScryfallCard) {
    setPrinting(next);
    setFoil(!canBeNonFoil(next) && canBeFoil(next));
  }

  function submit() {
    if (!printing) {
      return;
    }
    const copies = clampQuantity(quantity);
    setQuantity(copies);
    const details = { ...printingDetails(printing), foil };

    if (target.kind === 'deck') {
      importLine.mutate(
        { deckId: target.deckId, file: deckLineFile(details, copies, board), commanderFromFirstLine: false },
        {
          onSuccess: (summary) => {
            notifications.show({
              color: (summary.cards_skipped ?? 0) > 0 ? 'yellow' : 'green',
              message: `${printing.name} ajoutée à ${target.deckName} : ${deckListSummary(summary)}.`,
            });
            onClose();
          },
        },
      );
      return;
    }

    if (target.kind === 'pending') {
      addPending.mutate(
        { deckId: target.deckId, card: { ...details, quantity: copies, board: target.board } },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: `${copies > 1 ? `${copies} × ` : ''}${printing.name} ajoutée au deck, en attendant d'être dans ta collection.`,
            });
            onClose();
          },
        },
      );
      return;
    }

    const card = { ...details, proxy, storage_id: storageId ? Number(storageId) : null };
    const onSuccess = () => {
      const what = copies > 1 ? `${copies} exemplaires de ${printing.name} ajoutés` : `${printing.name} ajoutée`;
      notifications.show({ color: 'green', message: `${what} à ta collection.` });
      onClose();
    };
    const onError = (err: unknown) => {
      if (err instanceof PartialCreationError) {
        setQuantity(copies - err.created);
      }
    };
    create.mutate({ card, quantity: copies }, { onSuccess, onError });
  }

  const activeError = target.kind === 'deck' ? null : pending ? addPending.error : create.error;
  const createError =
    target.kind === 'deck' && importLine.error
      ? deckListErrorMessage(importLine.error)
      : activeError instanceof PartialCreationError
        ? `Seulement ${activeError.created} exemplaire(s) sur ${activeError.requested} ajouté(s) : ${errorMessage(activeError.reason)} Le nombre d'exemplaires restant est prérempli, clique sur Ajouter pour réessayer.`
        : activeError
          ? errorMessage(activeError)
          : null;

  return (
    <Stack>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Choisis l'édition
        </Text>
        {printings.isLoading && candidates.length === 0 ? (
          <Center p="lg">
            <Loader />
          </Center>
        ) : printings.error && candidates.length === 0 ? (
          <Alert color="red">{errorMessage(printings.error)}</Alert>
        ) : candidates.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune édition papier trouvée pour cette carte sur Scryfall.
          </Text>
        ) : (
          <PrintingGrid printings={candidates} selectedId={printing?.id} onSelect={selectPrinting} />
        )}
      </Stack>

      {printing && target.kind === 'deck' && (
        <Stack gap={4}>
          <BoardPicker value={board} onChange={setBoard} />
          <Text size="xs" c="dimmed">
            Les exemplaires viennent de ta collection s'il t'en reste de libres dans cette édition, sinon ils sont
            ajoutés en attente.
          </Text>
        </Stack>
      )}

      {printing && (
        <Group align="flex-end" grow>
          {!toDeck && (
            <Select
              label={<StorageFieldLabel>Rangement</StorageFieldLabel>}
              placeholder="Aucun rangement"
              data={storageOptions}
              value={storageId}
              onChange={setStorageId}
              clearable
              searchable
            />
          )}
          <NumberInput
            label="Exemplaires"
            min={1}
            max={MAX_QUANTITY}
            allowDecimal={false}
            value={quantity}
            onChange={setQuantity}
          />
          {canBeFoil(printing) && (
            <Switch
              label="Foil"
              checked={foil}
              onChange={(event) => setFoil(event.currentTarget.checked)}
              disabled={!canBeNonFoil(printing)}
              mb={8}
            />
          )}
          {!toDeck && (
            <Switch label="Proxy" checked={proxy} onChange={(event) => setProxy(event.currentTarget.checked)} mb={8} />
          )}
        </Group>
      )}

      {createError && <Alert color="red">{createError}</Alert>}

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button
          onClick={submit}
          disabled={!printing}
          loading={target.kind === 'deck' ? importLine.isPending : pending ? addPending.isPending : create.isPending}
        >
          {toDeck ? 'Ajouter au deck' : 'Ajouter'}
        </Button>
      </Group>
    </Stack>
  );
}
