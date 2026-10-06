import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';

const upcoming = [
  { title: 'Collection', text: 'Tes cartes, avec leurs images, triées et filtrées.' },
  { title: 'Rangements', text: 'Classeurs, boîtes et deckboxes, et ce qu’ils contiennent.' },
  { title: 'Decks', text: 'Tes decks, leur légalité par format et leurs statistiques.' },
  { title: 'Import / export', text: 'Depuis et vers ManaBox et Moxfield.' },
];

export function HomePage() {
  return (
    <Stack>
      <Title order={2}>Bienvenue sur Tamiyo</Title>
      <Text c="dimmed">Les sections suivantes arrivent bientôt.</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {upcoming.map((section) => (
          <Card key={section.title} withBorder>
            <Text fw={600}>{section.title}</Text>
            <Text size="sm" c="dimmed">
              {section.text}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
