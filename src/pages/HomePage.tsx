import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import { useAccount } from '../auth/account';

interface Section {
  title: string;
  text: string;
  to?: string;
}

const sections: Section[] = [
  { title: 'Collection', text: 'Tes cartes, avec leurs images, triées et filtrées.', to: '/cards' },
  { title: 'Rangements', text: 'Classeurs, boîtes et deckboxes, et ce qu’ils contiennent.', to: '/storages' },
  { title: 'Decks', text: 'Tes decks, leur légalité par format et leurs statistiques.', to: '/decks' },
];

function SectionContent({ section }: { section: Section }) {
  return (
    <>
      <Group justify="space-between" wrap="nowrap">
        <Text fw={600}>{section.title}</Text>
        {!section.to && (
          <Badge variant="light" color="gray">
            Bientôt
          </Badge>
        )}
      </Group>
      <Text size="sm" c="dimmed">
        {section.text}
      </Text>
    </>
  );
}

export function HomePage() {
  const account = useAccount();
  const displayName = account.data?.display_name;
  return (
    <Stack>
      <Title order={2}>{displayName ? `Bienvenue sur Tamiyo, ${displayName}` : 'Bienvenue sur Tamiyo'}</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {sections.map((section) =>
          section.to ? (
            <Card key={section.title} withBorder component={Link} to={section.to}>
              <SectionContent section={section} />
            </Card>
          ) : (
            <Card key={section.title} withBorder>
              <SectionContent section={section} />
            </Card>
          ),
        )}
      </SimpleGrid>
    </Stack>
  );
}
