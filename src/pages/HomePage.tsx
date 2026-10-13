import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

import { useAccount } from '../auth/account';
import { LunaMoth } from '../theme/LunaMoth';
import { tapeProps } from '../theme/tape';
import { usePageTitle } from '../layout/usePageTitle';

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
        <Text ff="heading" fw={600} size="xl">
          {section.title}
        </Text>
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
  usePageTitle('Accueil');
  const account = useAccount();
  const displayName = account.data?.display_name;
  return (
    <Stack>
      <Group gap="md" wrap="nowrap" align="center">
        <LunaMoth size={56} />
        <div>
          <Title order={2}>{displayName ? `Bienvenue sur Tamiyo, ${displayName}` : 'Bienvenue sur Tamiyo'}</Title>
          <Text className="tamiyo-hand" size="xl" c="prune" style={{ transform: 'rotate(-1deg)' }}>
            par quelle page du carnet on commence ?
          </Text>
        </div>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" verticalSpacing="xl" pt="sm">
        {sections.map((section) => (
          <div key={section.title} {...tapeProps(section.title)}>
            {section.to ? (
              <Card withBorder shadow="sm" h="100%" component={Link} to={section.to}>
                <SectionContent section={section} />
              </Card>
            ) : (
              <Card withBorder shadow="sm" h="100%">
                <SectionContent section={section} />
              </Card>
            )}
          </div>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
