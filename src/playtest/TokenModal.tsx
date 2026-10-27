import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';

import { CardImage } from '../cards/CardImage';
import { DebouncedTextInput } from '../layout/DebouncedTextInput';
import { type RelatedToken, useCardImages, useRelatedTokens, useTokenSearch } from '../scryfall/hooks';
import { useTable } from './table';

const THUMB_WIDTH = 145;
const MAX_TOKENS = 20;

function TokenGrid({ tokens, onPick }: { tokens: RelatedToken[]; onPick: (token: RelatedToken) => void }) {
  const images = useCardImages(tokens.map((token) => token.id));
  return (
    <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
      {tokens.map((token) => (
        <UnstyledButton key={token.id} onClick={() => onPick(token)} aria-label={`Créer ${token.name}`}>
          <Box w={THUMB_WIDTH}>
            <CardImage name={token.name} frontUrl={images.data?.[token.id]} loading={images.isLoading} />
          </Box>
        </UnstyledButton>
      ))}
    </SimpleGrid>
  );
}

export function TokenModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { state, act } = useTable();
  const [count, setCount] = useState(1);
  const [query, setQuery] = useState('');
  const related = useRelatedTokens(opened ? state.deck.map((entry) => entry.scryfallId) : []);
  const search = useTokenSearch(query);

  function create(token: RelatedToken) {
    act({ type: 'createToken', scryfallId: token.id, name: token.name, count });
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Créer un jeton" size="xl">
      <Stack>
        <Group align="flex-end">
          <NumberInput
            label="Combien ?"
            min={1}
            max={MAX_TOKENS}
            value={count}
            onChange={(value) => setCount(Math.max(1, Math.min(MAX_TOKENS, Number(value) || 1)))}
            w={110}
          />
          <DebouncedTextInput
            label="Chercher un jeton"
            placeholder="Trésor, Soldat, 1/1 Esprit…"
            value={query}
            onChange={setQuery}
            style={{ flex: 1 }}
          />
        </Group>

        {query.length >= 2 ? (
          search.isLoading ? (
            <Group justify="center" py="md">
              <Loader />
            </Group>
          ) : search.error ? (
            <Alert color="red">Scryfall ne répond pas, réessaie dans un instant.</Alert>
          ) : search.data && search.data.length > 0 ? (
            <TokenGrid tokens={search.data} onPick={create} />
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Aucun jeton ne correspond.
            </Text>
          )
        ) : (
          <Stack gap="xs">
            <Title order={5}>Jetons des cartes du deck</Title>
            {related.isLoading ? (
              <Group justify="center" py="md">
                <Loader />
              </Group>
            ) : related.data && related.data.length > 0 ? (
              <TokenGrid tokens={related.data} onPick={create} />
            ) : (
              <Text c="dimmed" size="sm">
                Les cartes de ce deck ne créent aucun jeton connu de Scryfall. Cherche-en un ci-dessus.
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}

export function CountModal({
  prompt,
  max,
  onClose,
}: {
  prompt: { title: string; run: (count: number) => void } | null;
  max: number;
  onClose: () => void;
}) {
  const [count, setCount] = useState(1);
  const [lastPrompt, setLastPrompt] = useState(prompt);
  if (prompt !== lastPrompt) {
    setLastPrompt(prompt);
    setCount(1);
  }

  function confirm() {
    prompt?.run(Math.max(1, Math.min(count, max)));
    onClose();
  }

  return (
    <Modal opened={prompt !== null} onClose={onClose} title={prompt?.title} size="xs">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
      >
        <Stack>
          <NumberInput
            label="Nombre de cartes"
            min={1}
            max={Math.max(1, max)}
            value={count}
            onChange={(value) => setCount(Number(value) || 1)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button type="submit" disabled={max === 0}>
              Valider
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
