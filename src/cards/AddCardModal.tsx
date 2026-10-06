import {
  Alert,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { useAddPendingCard } from '../decks/api';
import { colorCode, primaryType } from '../scryfall/classify';
import { cardColors, imageUrl, type ScryfallCard } from '../scryfall/client';
import { usePrintings } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';
import { PartialCreationError, useCreateCards } from './api';

export interface CardToAdd {
  name: string;
  printing?: ScryfallCard;
}

export type AddTarget = { kind: 'collection' } | { kind: 'pending'; deckId: number };

interface AddCardModalProps {
  card: CardToAdd | null;
  onClose: () => void;
  defaultStorageId: number | undefined;
  target?: AddTarget;
}

function modalTitle(name: string, target: AddTarget) {
  return target.kind === 'pending' ? `Ajouter ${name} au deck` : `Ajouter ${name}`;
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

function canBeNonFoil(printing: ScryfallCard) {
  return printing.finishes ? printing.finishes.includes('nonfoil') : true;
}

function canBeFoil(printing: ScryfallCard) {
  return printing.finishes ? printing.finishes.some((finish) => finish === 'foil' || finish === 'etched') : true;
}

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

  const printings = usePrintings(name);
  const candidates = initialPrinting
    ? [initialPrinting, ...(printings.data ?? []).filter((candidate) => candidate.id !== initialPrinting.id)]
    : (printings.data ?? []);
  const storageOptions = useStorageOptions();
  const create = useCreateCards();
  const addPending = useAddPendingCard();
  const pending = target.kind === 'pending';

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
    const details = {
      name: printing.name,
      scryfall_id: printing.id,
      set_code: printing.set,
      collector_number: printing.collector_number,
      foil,
      mana_value: printing.cmc ?? 0,
      colors: colorCode(cardColors(printing)),
      card_type: printing.type_line ? primaryType(printing.type_line) : null,
      color_identity: printing.color_identity ? colorCode(printing.color_identity) : null,
    };

    if (target.kind === 'pending') {
      addPending.mutate(
        { deckId: target.deckId, card: { ...details, quantity: copies } },
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

    const card = { ...details, storage_id: storageId ? Number(storageId) : null };
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

  const activeError = pending ? addPending.error : create.error;
  const createError =
    activeError instanceof PartialCreationError
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
          <ScrollArea.Autosize mah={360} type="auto">
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              {candidates.map((candidate) => (
                <UnstyledButton key={candidate.id} onClick={() => selectPrinting(candidate)}>
                  <Paper
                    withBorder
                    p={4}
                    radius="md"
                    style={
                      printing?.id === candidate.id
                        ? { borderColor: 'var(--mantine-primary-color-filled)', borderWidth: 2 }
                        : undefined
                    }
                  >
                    <Image src={imageUrl(candidate, 'small')} alt={candidate.name} radius="sm" loading="lazy" />
                    <Text size="xs" mt={4} lineClamp={1}>
                      {candidate.set_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {candidate.set.toUpperCase()} · #{candidate.collector_number} ·{' '}
                      {candidate.released_at.slice(0, 4)}
                    </Text>
                  </Paper>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </ScrollArea.Autosize>
        )}
      </Stack>

      {printing && (
        <Group align="flex-end" grow>
          {!pending && (
            <Select
              label="Rangement"
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
          <Switch
            label="Foil"
            checked={foil}
            onChange={(event) => setFoil(event.currentTarget.checked)}
            disabled={!canBeFoil(printing) || !canBeNonFoil(printing)}
            mb={8}
          />
        </Group>
      )}

      {createError && <Alert color="red">{createError}</Alert>}

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={submit} disabled={!printing} loading={pending ? addPending.isPending : create.isPending}>
          {pending ? 'Ajouter au deck' : 'Ajouter'}
        </Button>
      </Group>
    </Stack>
  );
}
