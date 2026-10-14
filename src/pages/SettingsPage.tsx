import { SimpleGrid, Stack, Tabs, Title, useMatches } from '@mantine/core';
import { useSearchParams } from 'react-router';

import { AppearanceSection } from '../auth/AppearanceSection';
import { AvatarSection } from '../auth/AvatarSection';
import { ChangeEmailSection } from '../auth/ChangeEmailSection';
import { ChangePasswordSection } from '../auth/ChangePasswordSection';
import { DisplayNameSection } from '../auth/DisplayNameSection';
import { DeleteCollectionSection } from '../cards/DeleteCollectionSection';
import { usePageTitle } from '../layout/usePageTitle';

const sections = ['profil', 'apparence', 'compte', 'danger'] as const;
type Section = (typeof sections)[number];

function parseSection(raw: string | null): Section {
  return sections.find((section) => section === raw) ?? 'profil';
}

export function SettingsPage() {
  usePageTitle('Paramètres');
  const [searchParams, setSearchParams] = useSearchParams();
  const section = parseSection(searchParams.get('section'));
  const vertical = useMatches({ base: false, md: true });

  function changeSection(value: string | null) {
    setSearchParams({ section: parseSection(value) }, { replace: true });
  }

  return (
    <Stack gap="xl" maw={1100}>
      <Title order={2}>Paramètres</Title>

      <Tabs value={section} onChange={changeSection} orientation={vertical ? 'vertical' : 'horizontal'}>
        <Tabs.List miw={vertical ? 180 : undefined}>
          <Tabs.Tab value="profil">Profil</Tabs.Tab>
          <Tabs.Tab value="apparence">Apparence</Tabs.Tab>
          <Tabs.Tab value="compte">Compte</Tabs.Tab>
          <Tabs.Tab value="danger" color="red">
            Zone de danger
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profil" pl={vertical ? 'xl' : 0} pt={vertical ? 0 : 'lg'}>
          <Stack maw={560}>
            <AvatarSection />
            <DisplayNameSection />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="apparence" pl={vertical ? 'xl' : 0} pt={vertical ? 0 : 'lg'}>
          <Stack maw={560}>
            <AppearanceSection />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="compte" pl={vertical ? 'xl' : 0} pt={vertical ? 0 : 'lg'}>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" verticalSpacing="lg">
            <ChangeEmailSection />
            <ChangePasswordSection />
          </SimpleGrid>
        </Tabs.Panel>
        <Tabs.Panel value="danger" pl={vertical ? 'xl' : 0} pt={vertical ? 0 : 'lg'}>
          <DeleteCollectionSection />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
