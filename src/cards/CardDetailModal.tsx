import {
  Alert,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRef, useState } from 'react';

import { errorMessage } from '../api/errors';
import type { Card, UpdateCardInput } from '../api/types';
import { CardRulesText } from '../scryfall/CardRulesText';
import { imageUrl as printingImageUrl, type ScryfallCard } from '../scryfall/client';
import { useBackImage, useBackImageOf, usePrintings } from '../scryfall/hooks';
import { canBeFoil, canBeNonFoil, foilFor, printingDetails } from '../scryfall/printing';
import { PrintingGrid } from '../scryfall/PrintingGrid';
import { useStorageOptions } from '../storages/api';
import { copyIds, useUpdateCopies } from './api';
import { CardImage } from './CardImage';
import { CollectionQuantityControl } from './CollectionQuantityControl';

interface CardDetailModalProps {
  card: Card | null;
  imageUrl: string | undefined;
  onClose: () => void;
}

export function CardDetailModal({ card, imageUrl, onClose }: CardDetailModalProps) {
  const lastShown = useRef<{ card: Card; imageUrl: string | undefined } | null>(null);
  if (card) {
    lastShown.current = { card, imageUrl };
  }
  const shown = lastShown.current;

  return (
    <Modal opened={card !== null} onClose={onClose} title={shown?.card.name} size="xl">
      {shown && <CardDetail key={shown.card.id} card={shown.card} imageUrl={shown.imageUrl} onClose={onClose} />}
    </Modal>
  );
}

function printingChanges(printing: ScryfallCard): UpdateCardInput {
  const { card_type, color_identity, ...details } = printingDetails(printing);
  return { ...details, card_type: card_type ?? undefined, color_identity: color_identity ?? undefined };
}

function CardDetail({ card, imageUrl, onClose }: { card: Card; imageUrl: string | undefined; onClose: () => void }) {
  const storageOptions = useStorageOptions();
  const [foil, setFoil] = useState(card.foil);
  const [proxy, setProxy] = useState(card.proxy);
  const [printing, setPrinting] = useState<ScryfallCard | null>(null);
  const backImage = useBackImage(card.scryfall_id);
  const printingBackImage = useBackImageOf(printing);
  const printings = usePrintings(card.name);
  const otherPrintings = (printings.data ?? []).filter((candidate) => candidate.id !== card.scryfall_id);
  const [storageId, setStorageId] = useState<string | null>(card.storage_id ? String(card.storage_id) : null);
  const ids = copyIds(card);
  const [count, setCount] = useState<number | string>(1);
  const selectedCount = Math.min(ids.length, Math.max(1, Math.floor(Number(count)) || 1));
  const selectedIds = ids.slice(ids.length - selectedCount);
  const several = selectedCount > 1;

  const update = useUpdateCopies();

  const storageChanged = storageId !== (card.storage_id ? String(card.storage_id) : null);
  const changed = foil !== card.foil || proxy !== card.proxy || storageChanged || printing !== null;

  function selectPrinting(next: ScryfallCard) {
    if (printing?.id === next.id) {
      setPrinting(null);
      setFoil(card.foil);
      return;
    }
    setPrinting(next);
    setFoil(foilFor(next, card.foil));
  }

  function save() {
    update.mutate(
      {
        ids: selectedIds,
        changes: {
          ...(printing ? printingChanges(printing) : {}),
          ...(foil !== card.foil ? { foil } : {}),
          ...(proxy !== card.proxy ? { proxy } : {}),
          ...(storageChanged ? { storage_id: storageId ? Number(storageId) : null } : {}),
        },
      },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: printing
              ? `${card.name} : ${several ? `${selectedCount} exemplaires sont` : 'ton exemplaire est'} maintenant en édition ${printing.set.toUpperCase()} #${printing.collector_number}.`
              : several
                ? `${selectedCount} exemplaires mis à jour.`
                : 'Carte mise à jour.',
          });
          onClose();
        },
      },
    );
  }

  const error = update.error;

  return (
    <Stack gap="lg">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <CardImage
            key={printing?.id ?? card.scryfall_id}
            name={card.name}
            url={printing ? printingImageUrl(printing, 'normal') : imageUrl}
            backUrl={printing ? printingBackImage : backImage}
            loading={false}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7 }}>
          <Stack>
            <div>
              <Title order={3} size="h4">
                {card.name}
              </Title>
              <Text size="sm" c="dimmed">
                {printing
                  ? `${card.set_code.toUpperCase()} · #${card.collector_number} → ${printing.set.toUpperCase()} · #${printing.collector_number}`
                  : `${card.set_code.toUpperCase()} · #${card.collector_number}`}
              </Text>
            </div>

            <CardRulesText scryfallId={printing?.id ?? card.scryfall_id} />

            {error && <Alert color="red">{errorMessage(error)}</Alert>}

            {ids.length > 1 && (
              <NumberInput
                label={`Exemplaires concernés, sur ${ids.length}`}
                description="Les changements enregistrés ne portent que sur ce nombre d'exemplaires."
                min={1}
                max={ids.length}
                allowDecimal={false}
                value={count}
                onChange={setCount}
                w={260}
              />
            )}

            <Switch
              label="Foil"
              checked={foil}
              onChange={(event) => setFoil(event.currentTarget.checked)}
              disabled={printing !== null && (!canBeFoil(printing) || !canBeNonFoil(printing))}
            />
            <Switch
              label="Proxy"
              description="Une impression de remplacement, pas une vraie carte."
              checked={proxy}
              onChange={(event) => setProxy(event.currentTarget.checked)}
            />

            <Select
              label="Rangement"
              placeholder="Aucun rangement"
              data={storageOptions}
              value={storageId}
              onChange={setStorageId}
              clearable
              searchable
            />

            <Group justify="flex-end" mt="sm">
              <Button onClick={save} disabled={!changed} loading={update.isPending}>
                Enregistrer
              </Button>
            </Group>

            <Divider />
            <CollectionQuantityControl card={card} onChanged={onClose} />
          </Stack>
        </Grid.Col>
      </Grid>
      <Divider />
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Changer d'édition
        </Text>
        {printings.isLoading ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : printings.error ? (
          <Alert color="red">{errorMessage(printings.error)}</Alert>
        ) : otherPrintings.length === 0 ? (
          <Text size="sm" c="dimmed">
            Aucune autre édition papier de cette carte sur Scryfall.
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              Choisis l'édition de ton exemplaire puis enregistre : la carte garde son rangement et reste dans ses
              decks.
            </Text>
            <PrintingGrid printings={otherPrintings} selectedId={printing?.id} onSelect={selectPrinting} />
          </>
        )}
      </Stack>
    </Stack>
  );
}
