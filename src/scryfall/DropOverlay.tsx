import { Center, Loader, Overlay, Paper, Stack, Text } from '@mantine/core';

export function DropOverlay({ dragging, resolving }: { dragging: boolean; resolving: boolean }) {
  if (!dragging && !resolving) {
    return null;
  }
  return (
    <Overlay fixed blur={2} zIndex={300} style={{ pointerEvents: 'none' }}>
      <Center h="100%">
        <Paper withBorder shadow="xl" radius="lg" p="xl" style={{ borderStyle: 'dashed', borderWidth: 2 }}>
          <Stack align="center" gap="xs">
            {resolving ? (
              <>
                <Loader />
                <Text fw={500}>Recherche de la carte sur Scryfall…</Text>
              </>
            ) : (
              <>
                <Text fw={600} size="lg">
                  Dépose la carte ici
                </Text>
                <Text size="sm" c="dimmed">
                  Elle sera proposée à l'ajout dans ta collection, dans cette édition.
                </Text>
              </>
            )}
          </Stack>
        </Paper>
      </Center>
    </Overlay>
  );
}
