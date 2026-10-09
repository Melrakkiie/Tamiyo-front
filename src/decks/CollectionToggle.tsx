import { Input, Switch } from '@mantine/core';

import { useShowCollectionInDecks, useUpdatePreferences } from '../auth/preferences';

export function CollectionToggle({ description }: { description: string }) {
  const show = useShowCollectionInDecks();
  const update = useUpdatePreferences();
  return (
    <Input.Wrapper label="Ma collection" title={description} style={{ display: 'flex', flexDirection: 'column' }}>
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
