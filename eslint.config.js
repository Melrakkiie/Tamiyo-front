import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Each rule here enforces a rule from CLAUDE.md. A config object that sets
// no-restricted-syntax replaces the earlier one, hence the selector lists.

const scryfallHost = [
  {
    selector: 'Literal[value=/api\\.scryfall\\.com/], TemplateElement[value.raw=/api\\.scryfall\\.com/]',
    message: 'Call Scryfall through src/scryfall (cache and rate limit).',
  },
];

const rawHex = [
  {
    selector:
      'Literal[value=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?\\b/], TemplateElement[value.raw=/#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?\\b/]',
    message: 'Use a theme color (lune, prune, ocelle, gray, dark), not a raw hex.',
  },
];

// Fixed colors that are not the app's palette: illustrations, mana colors,
// third-party brand colors, and the theme itself.
const hexAllowed = [
  'src/theme/**',
  'src/storages/StorageArt.tsx',
  'src/decks/DeckStatsPanel.tsx',
  'src/cards/CardLinkTiles.tsx',
];

const browserStorage = [
  { name: 'localStorage', message: 'Preferences are saved through the API, never in browser storage.' },
  { name: 'sessionStorage', message: 'Preferences are saved through the API, never in browser storage.' },
];

const pageTitle = {
  meta: { type: 'problem', messages: { missing: 'Every page calls usePageTitle(...).' } },
  create(context) {
    let called = false;
    return {
      'CallExpression[callee.name="usePageTitle"]'() {
        called = true;
      },
      'Program:exit'(node) {
        if (!called) {
          context.report({ node, messageId: 'missing' });
        }
      },
    };
  },
};

export default defineConfig([
  { ignores: ['dist/', 'src/api/schema.d.ts'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { tamiyo: { rules: { 'page-title': pageTitle } } },
    rules: {
      'no-restricted-syntax': ['error', ...scryfallHost, ...rawHex],
      'no-restricted-globals': [
        'error',
        ...browserStorage,
        { name: 'indexedDB', message: 'Only src/scryfall caches in IndexedDB.' },
      ],
      'no-restricted-properties': [
        'error',
        ...browserStorage.map(({ name, message }) => ({ object: 'window', property: name, message })),
      ],
    },
  },
  {
    files: ['src/scryfall/**'],
    rules: {
      'no-restricted-syntax': ['error', ...rawHex],
      'no-restricted-globals': ['error', ...browserStorage],
    },
  },
  {
    files: hexAllowed,
    rules: { 'no-restricted-syntax': ['error', ...scryfallHost] },
  },
  {
    files: ['src/pages/*Page.tsx'],
    rules: { 'tamiyo/page-title': 'error' },
  },
]);
