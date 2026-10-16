import { Anchor, Code, Stack, Table } from '@mantine/core';

import { ApiError } from '../api/errors';
import { InfoHint } from '../theme/InfoHint';

const keys: [string, string][] = [
  ['t:creature', 'type'],
  ['o:"draw a card"', 'texte de règles anglais, ~ pour le nom de la carte'],
  ['c:g, c=wu, c:m', 'couleurs (au moins, exactement, multicolore)'],
  ['id:esper', "identité de couleur comprise dans l'Esper"],
  ['mv<=3, mv:even', 'valeur de mana'],
  ['pow>=4, tou<2', 'force, endurance'],
  ['m:2WW', 'coût de mana'],
  ['r>=rare', 'rareté'],
  ['s:neo, cn:12', 'extension, numéro'],
  ['f:commander', 'légale dans un format'],
  ['kw:flying', 'capacité mot-clé'],
  ['eur<2, usd>=10', 'prix'],
];

const copyKeys: [string, string][] = [['is:foil, not:proxy', 'ton exemplaire']];

export function SearchSyntaxHelp({ scope = 'collection' }: { scope?: 'collection' | 'playtest' }) {
  const shown = scope === 'collection' ? [...keys, ...copyKeys] : keys;
  return (
    <InfoHint label="Aide sur la syntaxe de recherche">
      <Stack gap="xs">
        <div>
          Un nom de carte, ou la{' '}
          <Anchor href="https://scryfall.com/docs/syntax" target="_blank" rel="noreferrer" inherit>
            syntaxe Scryfall
          </Anchor>
          , cherchée dans {scope === 'collection' ? 'ta collection' : 'cette zone'}. Les termes séparés par un espace
          s'additionnent ; <Code>or</Code>, <Code>-</Code> (sauf) et les parenthèses les combinent.
        </div>
        <Table fz="xs" verticalSpacing={2} horizontalSpacing={4}>
          <Table.Tbody>
            {shown.map(([example, meaning]) => (
              <Table.Tr key={example}>
                <Table.Td style={{ whiteSpace: 'nowrap' }}>
                  <Code>{example}</Code>
                </Table.Td>
                <Table.Td>{meaning}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </InfoHint>
  );
}

function searchSyntaxProblem(err: unknown): string | null {
  return err instanceof ApiError && err.status === 400 && err.message.startsWith('q: ') ? err.message.slice(3) : null;
}

export function searchSyntaxError(err: unknown): string | null {
  const problem = searchSyntaxProblem(err);
  return problem === null ? null : `Recherche invalide : ${problem}`;
}

export function isScryfallOnlySearch(err: unknown): boolean {
  const problem = searchSyntaxProblem(err);
  return problem !== null && /^unknown keyword |\bdoes not support |\bis not (a|an|supported by) /.test(problem);
}
