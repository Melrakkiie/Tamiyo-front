import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";

import { errorMessage } from "../api/errors";
import { useCardNameSuggestions } from "../scryfall/hooks";
import { CardHoverPreview } from "./CardHoverPreview";

const MAX_RESULTS = 15;

interface ScryfallFallbackProps {
  search: string;
  identity: string | undefined;
  excludeNames?: Set<string>;
  onPick: (name: string) => void;
}

export function hiddenCardsHint(count: number) {
  return count === 1
    ? "1 autre carte : affine la recherche pour la voir."
    : `${count} autres cartes : affine la recherche pour les voir.`;
}

function scryfallQuery(search: string, identity: string | undefined) {
  if (identity === undefined) {
    return search;
  }
  return `${search} ${identity === "" ? "id:c" : `id<=${identity}`}`;
}

export function ScryfallFallback({
  search,
  identity,
  excludeNames,
  onPick,
}: ScryfallFallbackProps) {
  const suggestions = useCardNameSuggestions(scryfallQuery(search, identity));
  const found = suggestions.data?.suggestions ?? [];
  const filtered = found.filter((result) => !excludeNames?.has(result.name));
  const results = filtered.slice(0, MAX_RESULTS);
  const hidden =
    (suggestions.data?.total ?? 0) -
    found.length +
    (filtered.length - results.length);
  const emptyMessage =
    found.length > 0
      ? "Les cartes trouvées sur Scryfall sont déjà dans ta collection."
      : excludeNames && excludeNames.size > 0
        ? "Aucune autre carte ne correspond sur Scryfall."
        : "Aucune carte ne correspond sur Scryfall non plus.";

  return (
    <Paper withBorder p="sm">
      <Stack gap="xs">
        <Group gap="xs" align="baseline" wrap="wrap">
          <Text size="sm" fw={600} c="orange">
            Sur Scryfall
          </Text>
          {hidden > 0 && results.length > 0 && (
            <Text size="xs" c="orange">
              {hiddenCardsHint(hidden)}
            </Text>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          La carte apparaîtra dans le deck entourée en orange, en attendant que
          tu l'ajoutes à ta collection.
        </Text>
        {suggestions.isLoading ? (
          <Center p="md">
            <Loader size="sm" />
          </Center>
        ) : suggestions.error ? (
          <Alert color="red">
            {errorMessage(suggestions.error, {
              400: "Scryfall ne comprend pas cette recherche : vérifie la syntaxe.",
            })}
          </Alert>
        ) : results.length === 0 ? (
          <Text size="sm" c="dimmed">
            {emptyMessage}
          </Text>
        ) : (
          <ScrollArea.Autosize mah={320} type="auto">
            <Stack gap="xs">
              {results.map((result) => (
                <Group key={result.name} justify="space-between" wrap="nowrap">
                  <div style={{ minWidth: 0 }}>
                    <CardHoverPreview name={result.name}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {result.name}
                      </Text>
                    </CardHoverPreview>
                    {result.typeLine && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {result.typeLine}
                      </Text>
                    )}
                  </div>
                  <Button
                    size="xs"
                    variant="light"
                    color="orange"
                    onClick={() => onPick(result.name)}
                  >
                    Ajouter au deck
                  </Button>
                </Group>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Stack>
    </Paper>
  );
}
