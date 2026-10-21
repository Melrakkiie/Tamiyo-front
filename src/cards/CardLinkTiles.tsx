import { Box, type BoxProps, Group, Tooltip, UnstyledButton } from '@mantine/core';

import commanderSpellbookLogo from '../assets/logos/commander-spellbook.svg';
import edhrecLogo from '../assets/logos/edhrec.svg';
import scryfallLogo from '../assets/logos/scryfall.svg';
import { type CardPrinting, cardLinks } from './cardLinks';

const TILE_SIZE = 32;
const TILE_RADIUS = 6;

// Brand colors stay fixed in both themes, like the illustrations.
const sites = [
  { key: 'scryfall', label: 'Voir sur Scryfall', logo: scryfallLogo, color: '#2B253A' },
  { key: 'edhrec', label: 'Voir sur EDHREC', logo: edhrecLogo, color: '#353B41' },
  {
    key: 'commanderSpellbook',
    label: 'Voir les combos sur Commander Spellbook',
    logo: commanderSpellbookLogo,
    color: '#9161F3',
  },
] as const;

interface CardLinkTilesProps extends BoxProps {
  printing: CardPrinting;
}

export function CardLinkTiles({ printing, ...boxProps }: CardLinkTilesProps) {
  const links = cardLinks(printing);

  return (
    <Box {...boxProps}>
      <Group gap={0} wrap="nowrap" justify="inherit">
        {sites.map(({ key, label, logo, color }, index) => (
          <Tooltip key={key} label={label}>
            <UnstyledButton
              component="a"
              href={links[key]}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              w={TILE_SIZE}
              h={TILE_SIZE}
              p={5}
              style={{
                backgroundColor: color,
                display: 'grid',
                placeItems: 'center',
                borderStartStartRadius: index === 0 ? TILE_RADIUS : 0,
                borderEndStartRadius: index === 0 ? TILE_RADIUS : 0,
                borderStartEndRadius: index === sites.length - 1 ? TILE_RADIUS : 0,
                borderEndEndRadius: index === sites.length - 1 ? TILE_RADIUS : 0,
              }}
            >
              <img src={logo} alt="" width="100%" height="100%" />
            </UnstyledButton>
          </Tooltip>
        ))}
      </Group>
    </Box>
  );
}
