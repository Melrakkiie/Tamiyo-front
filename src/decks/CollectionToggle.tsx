import { type BoxProps, Input, Switch } from '@mantine/core';

import { useShowCollectionInDecks, useUpdatePreferences } from '../auth/preferences';

type CollectionToggleProps = Pick<BoxProps, 'hiddenFrom' | 'visibleFrom'> & { description: string };

export function CollectionToggle({ description, ...responsive }: CollectionToggleProps) {
  const show = useShowCollectionInDecks();
  const update = useUpdatePreferences();
  return (
    <Input.Wrapper
      label="Ma collection"
      title={description}
      style={{ display: 'flex', flexDirection: 'column' }}
      {...responsive}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Switch
          label="Afficher"
          checked={show}
          onChange={(event) => update.mutate({ show_collection_in_decks: event.currentTarget.checked })}
        />
      </div>
    </Input.Wrapper>
  );
}
