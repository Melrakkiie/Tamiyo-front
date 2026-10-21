# Coding standards

Review rules for this repo, on top of the rules in `CLAUDE.md`. Tooling already enforces formatting (Prettier), types, and the mechanical rules in `eslint.config.js` (Scryfall calls, browser storage, raw hex, page titles); skip those.

- **Identity:** a collector's notebook in the luna moth's colors. Theme colors (`lune`, `prune`, `ocelle`, `gray`, `dark`) and the `src/theme` components; illustrations (moth, storage drawings) keep fixed day colors in both themes. Fonts: Fraunces (headings), Karla (UI), Patrick Hand (`tamiyo-hand` class, short notes only), self-hosted in `public/fonts`. Whimsy (tilts, tape, stickers, scribbles) stays on tiles, titles and empty states; long card lists and forms stay plain.
- **Day and night:** every visual change reads well in both. Filled components get dark text at night (the theme's `variantColorResolver`).
- **Preferences** (display mode, columns, grouping, sort, day/night) go through the API (`useUpdatePreferences`, per-deck `useSaveDeckView`); anonymous visitors keep them in component state.
- **Scryfall images** are hotlinked, never stored.
- **Comments:** names carry the meaning; a comment only states a constraint the code can't show.
- **Dead code:** a change removes the code it leaves unused.
