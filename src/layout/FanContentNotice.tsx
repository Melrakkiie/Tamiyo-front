import { Anchor, Divider, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" inherit>
      {children}
    </Anchor>
  );
}

export function FanContentNotice() {
  const year = new Date().getFullYear();

  return (
    <Stack component="footer" gap="xs" mt="xl" pt="md">
      <Divider />
      <Text size="xs" c="dimmed">
        Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of the Coast LLC in the
        United States and other countries. © 1993-{year} Wizards. All Rights Reserved.
      </Text>
      <Text size="xs" c="dimmed">
        Tamiyo is unofficial Fan Content permitted under the{' '}
        <ExternalLink href="https://company.wizards.com/en/legal/fancontentpolicy">Fan Content Policy</ExternalLink>.
        Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards
        of the Coast LLC. Tamiyo is not affiliated with Wizards of the Coast. For more information about Wizards of the
        Coast or any of Wizards&apos; trademarks or other intellectual property, please visit their website at{' '}
        <ExternalLink href="https://company.wizards.com/">company.wizards.com</ExternalLink>.
      </Text>
      <Text size="xs" c="dimmed">
        Card data, images and prices are provided by <ExternalLink href="https://scryfall.com">Scryfall</ExternalLink>.
        Scryfall makes no guarantee about its price information and recommends you see stores for final prices and
        details.
      </Text>
      <Text size="xs" c="dimmed">
        Euro conversions use the reference exchange rates published by the European Central Bank.
      </Text>
    </Stack>
  );
}
