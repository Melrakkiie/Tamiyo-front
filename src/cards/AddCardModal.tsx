import {
  Alert,
  Autocomplete,
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
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { imageUrl, type ScryfallCard } from '../scryfall/client';
import { useCardNameSuggestions, usePrintings } from '../scryfall/hooks';
import { useStorageOptions } from '../storages/api';
import { PartialCreationError, useCreateCards } from './api';

interface AddCardModalProps {
  opened: boolean;
  onClose: () => void;
  defaultStorageId: number | undefined;
}

export function AddCardModal({ opened, onClose, defaultStorageId }: AddCardModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Ajouter une carte" size="xl">
      {opened && <AddCardForm onClose={onClose} defaultStorageId={defaultStorageId} />}
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

function AddCardForm({ onClose, defaultStorageId }: { onClose: () => void; defaultStorageId: number | undefined }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [printing, setPrinting] = useState<ScryfallCard | null>(null);
  const [foil, setFoil] = useState(false);
  const [storageId, setStorageId] = useState<string | null>(defaultStorageId ? String(defaultStorageId) : null);
  const [quantity, setQuantity] = useState<number | string>(1);

  const suggestions = useCardNameSuggestions(debouncedSearch);
  const printings = usePrintings(selectedName);
  const storageOptions = useStorageOptions();
  const create = useCreateCards();

  function selectName(name: string) {
    setSelectedName(name);
    setPrinting(null);
  }

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
    create.mutate(
      {
        card: {
          name: printing.name,
          scryfall_id: printing.id,
          set_code: printing.set,
          collector_number: printing.collector_number,
          foil,
          mana_value: printing.cmc ?? 0,
          storage_id: storageId ? Number(storageId) : null,
        },
        quantity: copies,
      },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message:
              copies > 1
                ? `${copies} exemplaires de ${printing.name} ajoutés.`
                : `${printing.name} ajoutée à ta collection.`,
          });
          onClose();
        },
        onError: (err) => {
          if (err instanceof PartialCreationError) {
            setQuantity(copies - err.created);
          }
        },
      },
    );
  }

  const createError =
    create.error instanceof PartialCreationError
      ? `Seulement ${create.error.created} exemplaire(s) sur ${create.error.requested} ajouté(s) : ${errorMessage(create.error.reason)} Le nombre d'exemplaires restant est prérempli, clique sur Ajouter pour réessayer.`
      : create.error
        ? errorMessage(create.error)
        : null;

  return (
    <Stack>
      <Autocomplete
        label="Nom de la carte"
        placeholder="Commence à taper, en anglais (ex. Lightning Bolt)"
        value={search}
        onChange={setSearch}
        onOptionSubmit={selectName}
        data={suggestions.data ?? []}
        filter={({ options }) => options}
        rightSection={suggestions.isFetching ? <Loader size="xs" /> : null}
        data-autofocus
      />

      {suggestions.error && <Alert color="red">{errorMessage(suggestions.error)}</Alert>}

      {selectedName && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Choisis l'édition
          </Text>
          {printings.isLoading ? (
            <Center p="lg">
              <Loader />
            </Center>
          ) : printings.error ? (
            <Alert color="red">{errorMessage(printings.error)}</Alert>
          ) : (
            <ScrollArea.Autosize mah={360} type="auto">
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                {(printings.data ?? []).map((candidate) => (
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
      )}

      {printing && (
        <Group align="flex-end" grow>
          <Select
            label="Rangement"
            placeholder="Aucun rangement"
            data={storageOptions}
            value={storageId}
            onChange={setStorageId}
            clearable
            searchable
          />
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
        <Button onClick={submit} disabled={!printing} loading={create.isPending}>
          Ajouter
        </Button>
      </Group>
    </Stack>
  );
}
