import { ActionIcon, Group, Popover, Select, Slider, Stack, Switch, Text } from '@mantine/core';
import { type ReactNode, useState } from 'react';

import { usePreferences, useUpdatePreferences } from '../auth/preferences';
import { useSession } from '../auth/useSession';
import { GearIcon } from '../layout/SettingsMenu';

export type CardDisplayMode = 'text' | 'images';

export interface DisplaySettings {
  mode: CardDisplayMode;
  columns: number;
  showManaCost: boolean;
  showDetails: boolean;
}

export const DEFAULT_DISPLAY: DisplaySettings = { mode: 'images', columns: 6, showManaCost: true, showDetails: true };
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 12;

const modeOptions: { value: CardDisplayMode; label: string }[] = [
  { value: 'text', label: 'Texte' },
  { value: 'images', label: 'Images' },
];

export function placement(inside: boolean, width: number) {
  return inside ? { comboboxProps: { withinPortal: false } } : { w: width };
}

function clampColumns(columns: number) {
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(columns)));
}

interface StoredDisplay {
  card_display?: CardDisplayMode;
  card_columns?: number;
  show_mana_cost?: boolean;
  show_card_details?: boolean;
}

export function displayFromStored(stored: StoredDisplay | undefined): DisplaySettings {
  return {
    mode: stored?.card_display ?? DEFAULT_DISPLAY.mode,
    columns: clampColumns(stored?.card_columns ?? DEFAULT_DISPLAY.columns),
    showManaCost: stored?.show_mana_cost ?? DEFAULT_DISPLAY.showManaCost,
    showDetails: stored?.show_card_details ?? DEFAULT_DISPLAY.showDetails,
  };
}

export function displayToStored(settings: Partial<DisplaySettings>): StoredDisplay {
  return {
    card_display: settings.mode,
    card_columns: settings.columns,
    show_mana_cost: settings.showManaCost,
    show_card_details: settings.showDetails,
  };
}

export function cardDisplay(settings: DisplaySettings, change: (next: Partial<DisplaySettings>) => void) {
  const textOnly = settings.mode === 'text';
  const columns = settings.columns;
  const dense = columns >= 9;
  return {
    ...settings,
    change,
    textOnly,
    compact: !textOnly && columns >= 7,
    gridProps: textOnly
      ? { cols: { base: 1, sm: 2, lg: 3 }, spacing: 'xs', verticalSpacing: 'xs' }
      : {
          cols: {
            base: Math.min(columns, 2),
            xs: Math.min(columns, 3),
            sm: Math.min(columns, 6),
            md: columns,
          },
          spacing: dense ? 'xs' : 'md',
          verticalSpacing: dense ? 'sm' : 'lg',
        },
  };
}

export function useCardDisplay() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const preferences = usePreferences(signedIn);
  const update = useUpdatePreferences();
  const [local, setLocal] = useState(DEFAULT_DISPLAY);
  const settings = signedIn && preferences.data ? displayFromStored(preferences.data) : local;

  return cardDisplay(settings, (next) => {
    if (signedIn) {
      update.mutate(displayToStored(next));
    } else {
      setLocal((current) => ({ ...current, ...next }));
    }
  });
}

export type CardDisplay = ReturnType<typeof cardDisplay>;

function ColumnsSlider({ value, onChange }: { value: number; onChange: (columns: number) => void }) {
  const [dragged, setDragged] = useState<number | null>(null);
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        Cartes par ligne : {dragged ?? value}
      </Text>
      <Slider
        min={MIN_COLUMNS}
        max={MAX_COLUMNS}
        step={1}
        value={dragged ?? value}
        onChange={setDragged}
        onChangeEnd={(next) => {
          setDragged(null);
          onChange(next);
        }}
        marks={[2, 4, 6, 8, 10, 12].map((mark) => ({ value: mark, label: String(mark) }))}
        label={null}
        mb="md"
      />
      <Text size="xs" c="dimmed">
        Sur un petit écran, il y en a moins pour que les cartes restent lisibles.
      </Text>
    </Stack>
  );
}

function ModeSelect({ display, inside = false }: { display: CardDisplay; inside?: boolean }) {
  return (
    <Select
      label="Affichage"
      data={modeOptions}
      value={display.mode}
      onChange={(value) => value && display.change({ mode: value as CardDisplayMode })}
      allowDeselect={false}
      {...placement(inside, 130)}
    />
  );
}

interface CardDisplayControlsProps {
  display: CardDisplay;
  options?: (inside: boolean) => ReactNode;
}

export function CardDisplayControls({ display, options }: CardDisplayControlsProps) {
  return (
    <Group gap="xs" align="flex-end">
      {options?.(false)}
      <ModeSelect display={display} />
      <Popover position="bottom-end" width={300} shadow="md" withArrow trapFocus>
        <Popover.Target>
          <ActionIcon variant="default" size={36} aria-label="Options d'affichage" title="Options d'affichage">
            <GearIcon />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="md">
            <Text size="sm" fw={600}>
              Options d'affichage
            </Text>
            <ModeSelect display={display} inside />
            {options?.(true)}
            {display.textOnly ? (
              <Switch
                label="Afficher le coût de mana"
                checked={display.showManaCost}
                onChange={(event) => display.change({ showManaCost: event.currentTarget.checked })}
              />
            ) : (
              <>
                <Switch
                  label="Afficher les infos sous les cartes"
                  description="Nom, édition et rangement"
                  checked={display.showDetails}
                  onChange={(event) => display.change({ showDetails: event.currentTarget.checked })}
                />
                <ColumnsSlider value={display.columns} onChange={(columns) => display.change({ columns })} />
              </>
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
