import {
  Button,
  Chip,
  Group,
  Input,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import { COMMON_FORMATS } from '../decks/api';
import { withSymbols } from '../scryfall/manaSymbols';
import { useStorageOptions, useStorageTypes } from '../storages/api';
import { type AdvancedFilters, COLORLESS, type ColorMode, type ManaValueOp, type TypeFilter } from './advancedFilters';
import { typeLabels } from './grouping';

const colorLetters = ['W', 'U', 'B', 'R', 'G'];

const colorModes: { value: ColorMode; label: string }[] = [
  { value: 'exact', label: 'Exactement' },
  { value: 'include', label: 'Au moins' },
  { value: 'within', label: 'Au plus' },
];

const manaValueOps: { value: ManaValueOp; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
];

const typeOptions: { value: TypeFilter; label: string }[] = (
  ['Creature', 'Planeswalker', 'Battle', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Land'] as TypeFilter[]
).map((type) => ({ value: type, label: typeLabels[type] }));

const formatOptions = COMMON_FORMATS.map((format) => ({
  value: format,
  label: format.charAt(0).toUpperCase() + format.slice(1),
}));

const colorCountOptions = ['0', '1', '2', '3', '4', '5'].map((count) => ({
  value: count,
  label: count === '0' ? 'Incolore (0)' : count,
}));

const foilOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'foil', label: 'Foil' },
  { value: 'nonfoil', label: 'Non foil' },
];

interface AdvancedSearchProps {
  filters: AdvancedFilters;
  showStorage: boolean;
  onChange: (changes: Partial<AdvancedFilters>) => void;
  onReset: () => void;
}

function ColorChips({
  value,
  onChange,
  withColorless,
}: {
  value: string;
  onChange: (value: string) => void;
  withColorless: boolean;
}) {
  const selected = value === COLORLESS ? [COLORLESS] : [...value];

  function change(next: string[]) {
    const added = next.find((letter) => !selected.includes(letter));
    if (added === COLORLESS) {
      onChange(COLORLESS);
      return;
    }
    onChange(colorLetters.filter((letter) => next.includes(letter)).join(''));
  }

  return (
    <Chip.Group multiple value={selected} onChange={change}>
      <Group gap={6}>
        {colorLetters.map((letter) => (
          <Chip key={letter} value={letter} size="sm" variant="outline">
            {withSymbols(`{${letter}}`)}
          </Chip>
        ))}
        {withColorless && (
          <Chip value={COLORLESS} size="sm" variant="outline">
            {withSymbols('{C}')}
          </Chip>
        )}
      </Group>
    </Chip.Group>
  );
}

export function AdvancedSearch({ filters, showStorage, onChange, onReset }: AdvancedSearchProps) {
  const storageOptions = useStorageOptions();
  const storageTypes = useStorageTypes();
  const [subtype, setSubtype] = useState(filters.subtype);
  const [debouncedSubtype] = useDebouncedValue(subtype.trim(), 300);

  useEffect(() => {
    if (debouncedSubtype !== filters.subtype) {
      onChange({ subtype: debouncedSubtype });
    }
  }, [debouncedSubtype]);

  useEffect(() => {
    setSubtype((current) => (current.trim() === filters.subtype ? current : filters.subtype));
  }, [filters.subtype]);

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" verticalSpacing="md">
          <Input.Wrapper label="Couleurs">
            <Stack gap={6} mt={4}>
              <ColorChips value={filters.colors} onChange={(colors) => onChange({ colors })} withColorless />
              {filters.colors !== '' && filters.colors !== COLORLESS && (
                <SegmentedControl
                  size="xs"
                  data={colorModes}
                  value={filters.colorMode}
                  onChange={(value) => onChange({ colorMode: value as ColorMode })}
                />
              )}
            </Stack>
          </Input.Wrapper>

          <Input.Wrapper label="Couleurs du commandant" description="Cartes jouables avec ce commandant">
            <Stack gap={6} mt={4}>
              <ColorChips
                value={filters.identity}
                onChange={(identity) => onChange({ identity })}
                withColorless={false}
              />
            </Stack>
          </Input.Wrapper>

          <Input.Wrapper label="Coût de mana">
            <Group gap="xs" wrap="nowrap" mt={4}>
              <Select
                data={manaValueOps}
                value={filters.manaValueOp}
                onChange={(value) => value && onChange({ manaValueOp: value as ManaValueOp })}
                allowDeselect={false}
                w={80}
                aria-label="Comparaison"
              />
              <NumberInput
                placeholder="Tous"
                min={0}
                max={20}
                allowDecimal={false}
                value={filters.manaValue ?? ''}
                onChange={(value) => onChange({ manaValue: typeof value === 'number' ? value : null })}
                aria-label="Coût de mana"
                style={{ flex: 1 }}
              />
            </Group>
          </Input.Wrapper>

          <Select
            label="Type"
            placeholder="Tous les types"
            data={typeOptions}
            value={filters.type}
            onChange={(value) => onChange({ type: (value as TypeFilter | null) ?? null })}
            clearable
          />

          <TextInput
            label="Sous-type"
            placeholder="Elf, Vehicle, Equipment…"
            value={subtype}
            onChange={(event) => setSubtype(event.currentTarget.value)}
            maxLength={50}
          />

          <Select
            label="Légale en"
            placeholder="Tous les formats"
            data={formatOptions}
            value={filters.legalIn}
            onChange={(value) => onChange({ legalIn: value })}
            clearable
            searchable
          />

          <Select
            label="Nombre de couleurs"
            placeholder="Peu importe"
            data={colorCountOptions}
            value={filters.colorCount === null ? null : String(filters.colorCount)}
            onChange={(value) => onChange({ colorCount: value === null ? null : Number(value) })}
            clearable
          />

          <Input.Wrapper label="Foil">
            <div>
              <SegmentedControl
                mt={4}
                data={foilOptions}
                value={filters.foil === null ? 'all' : filters.foil ? 'foil' : 'nonfoil'}
                onChange={(value) => onChange({ foil: value === 'all' ? null : value === 'foil' })}
              />
            </div>
          </Input.Wrapper>

          {showStorage && (
            <Select
              label="Type de rangement"
              placeholder="Tous les types"
              data={storageTypes}
              value={filters.storageType}
              onChange={(value) => onChange({ storageType: value })}
              clearable
            />
          )}

          {showStorage && (
            <Select
              label="Rangement"
              placeholder="Tous les rangements"
              data={storageOptions}
              value={filters.storageId === null ? null : String(filters.storageId)}
              onChange={(value) => onChange({ storageId: value === null ? null : Number(value) })}
              clearable
              searchable
            />
          )}
        </SimpleGrid>

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Le sous-type se cherche en anglais, comme sur les cartes. Une carte ajoutée il y a moins de quelques minutes
            peut encore manquer aux recherches par type, sous-type ou format.
          </Text>
          <Button variant="subtle" size="xs" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
