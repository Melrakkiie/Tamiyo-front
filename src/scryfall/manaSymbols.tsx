import { Fragment } from 'react';

const SYMBOL_BASE = 'https://svgs.scryfall.io/card-symbols';

export function withSymbols(text: string) {
  return text.split(/(\{[^}]+\})/g).map((part, index) => {
    const symbol = /^\{([^}]+)\}$/.exec(part);
    if (!symbol) {
      return <Fragment key={index}>{part}</Fragment>;
    }
    const code = symbol[1].replace(/\//g, '').toUpperCase();
    return (
      <img
        key={index}
        src={`${SYMBOL_BASE}/${encodeURIComponent(code)}.svg`}
        alt={part}
        title={part}
        style={{ height: '1em', width: '1em', verticalAlign: '-0.15em', margin: '0 1px' }}
      />
    );
  });
}
