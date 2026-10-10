import { Text } from '@mantine/core';

import { withSymbols } from '../scryfall/manaSymbols';

function identitySymbols(identity: string) {
  return identity === '' ? '{C}' : [...identity].map((letter) => `{${letter}}`).join('');
}

export function ColorIdentity({ identity }: { identity: string }) {
  return (
    <Text size="sm" lh={1} title={identity === '' ? 'Incolore' : `Identité ${identity}`}>
      {withSymbols(identitySymbols(identity))}
    </Text>
  );
}
