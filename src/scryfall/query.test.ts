import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from './client';
import {
  alrundGodOfTheCosmos,
  commitMemory,
  delverOfSecrets,
  esperSentinel,
  forest,
  grizzlyBears,
  serraAngel,
  solRing,
  sproutingThrinax,
  starredPromo,
  tarmogoyf,
  westvaleAbbey,
} from './fixtures';
import { allOf, matchesScryfallQuery, parseScryfallQuery, subtypeTerm } from './query';
import { cases, matches, parsedQuery } from './queryTestHelpers';

function failsToParse(rows: [string, RegExp][]) {
  it.each(rows)('%s fails with an error message', (search, message) => {
    const parsed = parseScryfallQuery(search);
    expect(parsed.node).toBeNull();
    expect(parsed.error).toMatch(message);
  });
}

const abbeyTypedOnFacesOnly: ScryfallCard = {
  ...westvaleAbbey,
  name: 'Westvale Abbey (faces only)',
  type_line: undefined,
};

describe('type', () => {
  it.each(
    cases([
      ['t:creature', grizzlyBears, true],
      ['t:creature', esperSentinel, true],
      ['t:creature', solRing, false],
      ['t:creature', forest, false],
      ['t:artifact', esperSentinel, true],
      ['t:artifact', solRing, true],
      ['t:artifact', grizzlyBears, false],
      ['type:creature', grizzlyBears, true],
      ['t=creature', grizzlyBears, true],
      ['t:CREATURE', grizzlyBears, true],
      ['t:bear', grizzlyBears, true],
      ['t:crea', grizzlyBears, true],
      ['t:land', forest, true],
      ['t:forest', forest, true],
      ['t:basic', forest, true],
      ['t:"basic land"', forest, true],
      ['t:"basic land"', westvaleAbbey, false],
      ['t:creature', alrundGodOfTheCosmos, true],
      ['t:bird', alrundGodOfTheCosmos, true],
      ['t:land', westvaleAbbey, true],
      ['t:creature', westvaleAbbey, true],
      ['t:demon', westvaleAbbey, true],
      ['t:legendary', westvaleAbbey, true],
      ['t:land', abbeyTypedOnFacesOnly, true],
      ['t:demon', abbeyTypedOnFacesOnly, true],
      ['t:artifact', abbeyTypedOnFacesOnly, false],
      ['t:insect', delverOfSecrets, true],
      ['t:instant', commitMemory, true],
      ['t:sorcery', commitMemory, true],
      ['t:creature', commitMemory, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('colors', () => {
  it.each(
    cases([
      ['c=g', grizzlyBears, true],
      ['c=g', sproutingThrinax, false],
      ['c=g', solRing, false],
      ['c=brg', sproutingThrinax, true],
      ['c=gbr', sproutingThrinax, true],
      ['c=jund', sproutingThrinax, true],
      ['c=br', sproutingThrinax, false],
      ['c>=g', grizzlyBears, true],
      ['c>=g', sproutingThrinax, true],
      ['c>=g', solRing, false],
      ['c>=br', sproutingThrinax, true],
      ['c>=br', grizzlyBears, false],
      ['c:g', sproutingThrinax, true],
      ['color:green', grizzlyBears, true],
      ['c<=g', grizzlyBears, true],
      ['c<=g', solRing, true],
      ['c<=g', sproutingThrinax, false],
      ['c<=brg', sproutingThrinax, true],
      ['c<=brg', grizzlyBears, true],
      ['c<=brg', esperSentinel, false],
      ['c=u', delverOfSecrets, true],
      ['c=u', alrundGodOfTheCosmos, true],
      ['c=b', westvaleAbbey, true],
      ['c=u', commitMemory, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('colorless', () => {
  it.each(
    cases([
      ['c=c', solRing, true],
      ['c=c', forest, true],
      ['c:c', solRing, true],
      ['c:colorless', solRing, true],
      ['c=c', grizzlyBears, false],
      ['c:c', esperSentinel, false],
      ['c=c', westvaleAbbey, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('mana value', () => {
  it.each(
    cases([
      ['mv=2', grizzlyBears, true],
      ['mv=2', sproutingThrinax, false],
      ['mv:2', grizzlyBears, true],
      ['cmc=2', grizzlyBears, true],
      ['mv<2', esperSentinel, true],
      ['mv<2', grizzlyBears, false],
      ['mv<=2', grizzlyBears, true],
      ['mv<=2', sproutingThrinax, false],
      ['mv>2', sproutingThrinax, true],
      ['mv>2', grizzlyBears, false],
      ['mv>=3', sproutingThrinax, true],
      ['mv>=3', grizzlyBears, false],
      ['mv=0', forest, true],
      ['mv=0', westvaleAbbey, true],
      ['mv=4', alrundGodOfTheCosmos, true],
      ['mv=10', commitMemory, true],
      ['mv=1', delverOfSecrets, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('power', () => {
  it.each(
    cases([
      ['pow=2', grizzlyBears, true],
      ['pow:2', grizzlyBears, true],
      ['power=2', grizzlyBears, true],
      ['pow=2', sproutingThrinax, false],
      ['pow<2', esperSentinel, true],
      ['pow<2', grizzlyBears, false],
      ['pow<=2', grizzlyBears, true],
      ['pow<=2', sproutingThrinax, false],
      ['pow>2', sproutingThrinax, true],
      ['pow>2', grizzlyBears, false],
      ['pow>=3', sproutingThrinax, true],
      ['pow>=3', grizzlyBears, false],
      ['pow=9', westvaleAbbey, true],
      ['pow=1', alrundGodOfTheCosmos, true],
      ['pow=2', alrundGodOfTheCosmos, true],
      ['pow>=3', delverOfSecrets, true],
      ['pow>=0', solRing, false],
      ['pow>=0', forest, false],
      ['pow>=0', tarmogoyf, false],
      ['pow<=100', tarmogoyf, false],
      ['pow=0', tarmogoyf, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('toughness', () => {
  it.each(
    cases([
      ['tou=2', grizzlyBears, true],
      ['tou:2', grizzlyBears, true],
      ['toughness=2', grizzlyBears, true],
      ['tou=2', sproutingThrinax, false],
      ['tou<2', esperSentinel, true],
      ['tou<2', grizzlyBears, false],
      ['tou<=2', grizzlyBears, true],
      ['tou<=2', sproutingThrinax, false],
      ['tou>2', sproutingThrinax, true],
      ['tou>2', grizzlyBears, false],
      ['tou>=3', sproutingThrinax, true],
      ['tou>=3', grizzlyBears, false],
      ['tou=7', westvaleAbbey, true],
      ['tou=3', alrundGodOfTheCosmos, true],
      ['tou=2', delverOfSecrets, true],
      ['tou>=0', solRing, false],
      ['tou>=0', tarmogoyf, false],
      ['tou<=100', tarmogoyf, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('and, or, not', () => {
  it.each(
    cases([
      ['t:creature c=g', grizzlyBears, true],
      ['t:creature c=g', esperSentinel, false],
      ['t:creature c=g', forest, false],
      ['t:artifact or t:land', solRing, true],
      ['t:artifact or t:land', forest, true],
      ['t:artifact or t:land', grizzlyBears, false],
      ['t:artifact OR t:land', forest, true],
      ['-t:creature', forest, true],
      ['-t:creature', grizzlyBears, false],
      ['t!=creature', forest, true],
      ['t!=creature', grizzlyBears, false],
      ['-(t:artifact or t:land)', grizzlyBears, true],
      ['-(t:artifact or t:land)', solRing, false],
      ['(t:artifact or t:land) c=c', solRing, true],
      ['(t:artifact or t:land) c=c', forest, true],
      ['(t:artifact or t:land) c=c', esperSentinel, false],
      ['t:creature mv<=2 or t:land', grizzlyBears, true],
      ['t:creature mv<=2 or t:land', forest, true],
      ['t:creature mv<=2 or t:land', sproutingThrinax, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('quoting', () => {
  it.each(
    cases([
      ['"grizzly bears"', grizzlyBears, true],
      ['"grizzly bears"', tarmogoyf, false],
      ['grizzly bears', grizzlyBears, true],
      ['"bears grizzly"', grizzlyBears, false],
      ['!"Grizzly Bears"', grizzlyBears, true],
      ['!"Grizzly"', grizzlyBears, false],
      ['t:"legendary creature"', westvaleAbbey, true],
      ['t:"legendary creature"', grizzlyBears, false],
      ['t:"creature — bear"', grizzlyBears, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });
});

describe('parse errors', () => {
  failsToParse([
    ['t:creature)', /\)/],
    ['(t:creature', /parenthèse fermante manquante/],
    ['()', /parenthèses vides/],
    ['t:"legendary creature', /guillemet fermant manquant/],
    ['mv>two', /« two » n'est pas un nombre/],
    ['pow>=x', /« x » n'est pas un nombre/],
    ['c=purple', /« purple » n'est pas une couleur/],
    ['foo:bar', /mot-clé inconnu « foo »/],
    ['t>creature', /« t » n'accepte pas « > »/],
    ['t:', /attend une valeur/],
    ['or t:land', /« or » doit être entre deux termes/],
    ['is:commander', /ne s'applique qu'à ta collection/],
  ]);

  it('treats a blank search as no search', () => {
    const parsed = parseScryfallQuery('   ');
    expect(parsed.error).toBeNull();
    expect(matchesScryfallQuery(parsed.node, grizzlyBears, grizzlyBears.name)).toBe(true);
  });
});

describe('name', () => {
  it.each(
    cases([
      ['bears', grizzlyBears, true],
      ['BEARS', grizzlyBears, true],
      ['"grizzly bears"', grizzlyBears, true],
      ['"grizzly  bears"', grizzlyBears, false],
      ['bears', esperSentinel, false],
      ['name:sentinel', esperSentinel, true],
      ['name=sentinel', esperSentinel, true],
      ['name:sentinel', grizzlyBears, false],
      ['name!=bears', grizzlyBears, false],
      ['name!=bears', forest, true],
      ['name:hakka', alrundGodOfTheCosmos, true],
      ['name:alrund', alrundGodOfTheCosmos, true],
      ['name:memory', commitMemory, true],
      ['name:abbey', westvaleAbbey, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  it('matches either the instance name or the card name', () => {
    expect(matches('name:token', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('name:grizzly', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('name:forest', grizzlyBears, 'Bear Token')).toBe(false);
  });

  it('matches by instance name when the card is unknown', () => {
    const parsed = parseScryfallQuery('name:token');
    expect(matchesScryfallQuery(parsed.node, undefined, 'Bear Token')).toBe(true);
    expect(matchesScryfallQuery(parsed.node, undefined, 'Forest')).toBe(false);
  });

  failsToParse([
    ['name>bears', /« name » n'accepte pas « > »/],
    ['name<=bears', /« name » n'accepte pas « <= »/],
    ['name:', /attend une valeur/],
  ]);
});

describe('exact name', () => {
  it.each(
    cases([
      ['!forest', forest, true],
      ['!Forest', forest, true],
      ['!"Grizzly Bears"', grizzlyBears, true],
      ['!"grizzly bears"', grizzlyBears, true],
      ['!grizzly', grizzlyBears, false],
      ['!"Grizzly"', grizzlyBears, false],
      ['!"Grizzly Bears"', forest, false],
      ['!"Commit // Memory"', commitMemory, true],
      ['!Commit', commitMemory, false],
      ['!"Alrund, God of the Cosmos // Hakka, Whispering Raven"', alrundGodOfTheCosmos, true],
      ['!Alrund', alrundGodOfTheCosmos, false],
      ['-!forest', forest, false],
      ['-!forest', grizzlyBears, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  it('matches the instance name when it equals the search', () => {
    expect(matches('!"bear token"', grizzlyBears, 'Bear Token')).toBe(true);
    expect(matches('!"bear"', grizzlyBears, 'Bear Token')).toBe(false);
  });

  failsToParse([['!""', /« ! » attend un nom de carte/]]);
});

describe('oracle text', () => {
  it.each(
    cases([
      ['o:draw', esperSentinel, true],
      ['oracle:draw', esperSentinel, true],
      ['o=draw', esperSentinel, true],
      ['o:DRAW', esperSentinel, true],
      ['o:draw', grizzlyBears, false],
      ['o:"draw a card"', esperSentinel, true],
      ['o:"draw two cards"', esperSentinel, false],
      ['o:"{T}: Add"', solRing, true],
      ['o:"add {c}{c}"', solRing, true],
      ['o:"add {g}"', solRing, false],
      ['o:"~\'s power"', esperSentinel, true],
      ['o:"~ dies"', sproutingThrinax, true],
      ['o:"~ dies"', esperSentinel, false],
      ['o:saproling', sproutingThrinax, true],
      ['-o:saproling', grizzlyBears, true],
      ['o:flying', alrundGodOfTheCosmos, true],
      ['o:foretold', alrundGodOfTheCosmos, true],
      ['o:lifelink', westvaleAbbey, true],
      ['o:"add {c}"', westvaleAbbey, true],
      ['o:flying', delverOfSecrets, true],
      ['o:transform', delverOfSecrets, true],
      ['o:aftermath', commitMemory, true],
      ['o:"second from the top"', commitMemory, true],
      ['o:flying', commitMemory, false],
      ['o:flying', tarmogoyf, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['o>flying', /« o » n'accepte pas « > »/],
    ['oracle<=flying', /« oracle » n'accepte pas « <= »/],
    ['o:', /attend une valeur/],
  ]);
});

describe('keyword', () => {
  it.each(
    cases([
      ['kw:flying', serraAngel, true],
      ['keyword:flying', serraAngel, true],
      ['kw=flying', serraAngel, true],
      ['kw:FLYING', serraAngel, true],
      ['kw:vigilance', serraAngel, true],
      ['kw:fly', serraAngel, false],
      ['kw:haste', serraAngel, false],
      ['kw:flying', grizzlyBears, false],
      ['kw!=flying', serraAngel, false],
      ['-kw:flying', grizzlyBears, true],
      ['kw:flying kw:vigilance', serraAngel, true],
      ['kw:flying kw:haste', serraAngel, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['kw>flying', /« kw » n'accepte pas « > »/],
    ['keyword<=flying', /« keyword » n'accepte pas « <= »/],
    ['kw:', /attend une valeur/],
  ]);
});

describe('format', () => {
  it.each(
    cases([
      ['f:modern', serraAngel, true],
      ['format:modern', serraAngel, true],
      ['legal:modern', serraAngel, true],
      ['f=modern', serraAngel, true],
      ['f:MODERN', serraAngel, true],
      ['f:vintage', serraAngel, true],
      ['f:standard', serraAngel, false],
      ['f:commander', serraAngel, false],
      ['f:legacy', serraAngel, false],
      ['f:modern', grizzlyBears, false],
      ['f!=modern', serraAngel, false],
      ['-f:standard', serraAngel, true],
      ['f:modern f:vintage', serraAngel, true],
      ['f:modern f:standard', serraAngel, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['f>modern', /« f » n'accepte pas « > »/],
    ['format>=modern', /« format » n'accepte pas « >= »/],
    ['legal<modern', /« legal » n'accepte pas « < »/],
    ['f:bogus', /« bogus » n'est pas un format/],
    ['f:', /attend une valeur/],
  ]);
});

describe('mana cost', () => {
  it.each(
    cases([
      ['m:{1}{G}', grizzlyBears, true],
      ['m:1g', grizzlyBears, true],
      ['mana:1G', grizzlyBears, true],
      ['m:3u', alrundGodOfTheCosmos, true],
      ['m=u', delverOfSecrets, true],
      ['m:g', grizzlyBears, true],
      ['m:1', grizzlyBears, true],
      ['m:gg', grizzlyBears, false],
      ['m:2', grizzlyBears, false],
      ['m:{G}{G}', grizzlyBears, false],
      ['m=1g', grizzlyBears, true],
      ['m=g', grizzlyBears, false],
      ['m>=1g', grizzlyBears, true],
      ['m>1g', grizzlyBears, false],
      ['m>g', grizzlyBears, true],
      ['m!=1g', grizzlyBears, false],
      ['m!=g', grizzlyBears, true],
      ['m:brg', sproutingThrinax, true],
      ['m:rrr', sproutingThrinax, false],
      ['m:3ww', serraAngel, true],
      ['m:www', serraAngel, false],
      ['m:uu', commitMemory, true],
      ['m:uuu', commitMemory, true],
      ['m:uuuuu', commitMemory, false],
      ['m=3u', commitMemory, false],
      ['m:u', delverOfSecrets, true],
      ['m=u', delverOfSecrets, true],
      ['m=3u', alrundGodOfTheCosmos, true],
      ['m:w', westvaleAbbey, false],
      ['m:g', forest, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['m<1g', /« m » n'accepte pas « < »/],
    ['mana<=1g', /« mana » n'accepte pas « <= »/],
    ['m:q', /« q » n'est pas un coût de mana/],
    ['m:{}', /« \{\} » n'est pas un coût de mana/],
    ['m:', /attend une valeur/],
  ]);
});

describe('rarity', () => {
  it.each(
    cases([
      ['r:common', grizzlyBears, true],
      ['rarity:common', grizzlyBears, true],
      ['r:c', grizzlyBears, true],
      ['r:COMMON', grizzlyBears, true],
      ['r=common', grizzlyBears, true],
      ['r:common', esperSentinel, false],
      ['r:uncommon', sproutingThrinax, true],
      ['r:u', sproutingThrinax, true],
      ['r:rare', esperSentinel, true],
      ['r:mythic', tarmogoyf, true],
      ['r:m', tarmogoyf, true],
      ['r>=rare', esperSentinel, true],
      ['r>=rare', tarmogoyf, true],
      ['r>=rare', sproutingThrinax, false],
      ['r>uncommon', esperSentinel, true],
      ['r>uncommon', sproutingThrinax, false],
      ['r<rare', sproutingThrinax, true],
      ['r<rare', grizzlyBears, true],
      ['r<rare', esperSentinel, false],
      ['r<=common', grizzlyBears, true],
      ['r<=common', sproutingThrinax, false],
      ['r!=common', grizzlyBears, false],
      ['r!=common', esperSentinel, true],
      ['r:rare', starredPromo, false],
      ['r>=common', starredPromo, false],
      ['r<mythic', starredPromo, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['r:special', /« special » n'est pas une rareté/],
    ['r>epic', /« epic » n'est pas une rareté/],
    ['r:', /attend une valeur/],
  ]);
});

describe('set', () => {
  it.each(
    cases([
      ['s:m10', grizzlyBears, true],
      ['set:m10', grizzlyBears, true],
      ['e:m10', grizzlyBears, true],
      ['edition:m10', grizzlyBears, true],
      ['s=m10', grizzlyBears, true],
      ['s:M10', grizzlyBears, true],
      ['s:mh2', grizzlyBears, false],
      ['s:mh2', esperSentinel, true],
      ['s:mh2', tarmogoyf, true],
      ['s:mh', esperSentinel, false],
      ['s:mh22', esperSentinel, false],
      ['s!=mh2', esperSentinel, false],
      ['s!=mh2', grizzlyBears, true],
      ['-s:mh2', grizzlyBears, true],
      ['s:khm', alrundGodOfTheCosmos, true],
      ['s:mh2 or s:m10', grizzlyBears, true],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['s>m10', /« s » n'accepte pas « > »/],
    ['set<=m10', /« set » n'accepte pas « <= »/],
    ['e<m10', /« e » n'accepte pas « < »/],
    ['s:', /attend une valeur/],
  ]);
});

describe('collector number', () => {
  it.each(
    cases([
      ['cn:186', grizzlyBears, true],
      ['number:186', grizzlyBears, true],
      ['cn=186', grizzlyBears, true],
      ['cn:18', grizzlyBears, false],
      ['cn:1860', grizzlyBears, false],
      ['cn:0186', grizzlyBears, false],
      ['cn!=186', grizzlyBears, false],
      ['cn!=186', esperSentinel, true],
      ['cn>100', grizzlyBears, true],
      ['cn>100', esperSentinel, false],
      ['cn<100', esperSentinel, true],
      ['cn<100', grizzlyBears, false],
      ['cn>=186', grizzlyBears, true],
      ['cn>186', grizzlyBears, false],
      ['cn<=12', esperSentinel, true],
      ['cn<12', esperSentinel, false],
      ['cn>=100 cn<=200', grizzlyBears, true],
      ['cn:12★', starredPromo, true],
      ['cn:12', starredPromo, false],
      ['cn>10', starredPromo, false],
      ['cn<100', starredPromo, false],
      ['cn>=0', starredPromo, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['cn>x', /« x » n'est pas un nombre/],
    ['cn<=abc', /« abc » n'est pas un nombre/],
    ['cn:', /attend une valeur/],
  ]);
});

describe('color identity', () => {
  it.each(
    cases([
      ['id:g', grizzlyBears, true],
      ['id:g', forest, true],
      ['id:g', solRing, true],
      ['id:g', esperSentinel, false],
      ['id:g', sproutingThrinax, false],
      ['identity:g', grizzlyBears, true],
      ['ci:g', grizzlyBears, true],
      ['id:brg', sproutingThrinax, true],
      ['id:brg', grizzlyBears, true],
      ['id:wu', alrundGodOfTheCosmos, true],
      ['id:wu', esperSentinel, true],
      ['id:wu', grizzlyBears, false],
      ['id:azorius', esperSentinel, true],
      ['id:jund', sproutingThrinax, true],
      ['id:b', westvaleAbbey, true],
      ['id:u', westvaleAbbey, false],
      ['id=g', grizzlyBears, true],
      ['id=g', sproutingThrinax, false],
      ['id=g', solRing, false],
      ['id>=g', grizzlyBears, true],
      ['id>=g', sproutingThrinax, true],
      ['id>=g', esperSentinel, false],
      ['id>g', sproutingThrinax, true],
      ['id>g', grizzlyBears, false],
      ['id<brg', grizzlyBears, true],
      ['id<brg', sproutingThrinax, false],
      ['id<=brg', sproutingThrinax, true],
      ['id!=g', grizzlyBears, false],
      ['id!=g', esperSentinel, true],
      ['id:c', solRing, true],
      ['id:c', forest, false],
      ['id=colorless', solRing, true],
      ['id=c', grizzlyBears, false],
      ['id:m', sproutingThrinax, true],
      ['id:multicolor', sproutingThrinax, true],
      ['id:m', grizzlyBears, false],
      ['id:2', sproutingThrinax, false],
      ['id=3', sproutingThrinax, true],
      ['id:1', grizzlyBears, true],
      ['id:0', solRing, true],
      ['id>=1', solRing, false],
      ['id<2', grizzlyBears, true],
      ['id<2', sproutingThrinax, false],
    ]),
  )('$search on $card.name: $matches', ({ search, card, matches: expected }) => {
    expect(matches(search, card)).toBe(expected);
  });

  failsToParse([
    ['id:purple', /« purple » n'est pas une couleur/],
    ['ci:xyz', /« xyz » n'est pas une couleur/],
    ['id:6', /« 6 » n'est pas une couleur/],
    ['id<m', /« id » n'accepte pas « < »/],
    ['id>=multicolor', /« id » n'accepte pas « >= »/],
    ['id:', /attend une valeur/],
  ]);
});

describe('is', () => {
  failsToParse([
    ['is:foil', /ne s'applique qu'à ta collection/],
    ['is:commander', /« is: » ne s'applique qu'à ta collection/],
    ['not:foil', /« not: » ne s'applique qu'à ta collection/],
    ['-is:foil', /ne s'applique qu'à ta collection/],
    ['t:creature is:foil', /ne s'applique qu'à ta collection/],
    ['(t:creature or is:foil)', /ne s'applique qu'à ta collection/],
    ['is:', /attend une valeur/],
  ]);
});

describe('allOf', () => {
  it('gives nothing for no nodes', () => {
    expect(allOf([])).toBeNull();
  });

  it('drops missing nodes', () => {
    expect(allOf([null, null])).toBeNull();
  });

  it('gives the node itself for a single one', () => {
    const node = parsedQuery('t:creature');
    expect(allOf([node])).toBe(node);
  });

  it('requires every node to match', () => {
    const node = allOf([parsedQuery('t:creature'), null, parsedQuery('c:g')]);
    expect(matchesScryfallQuery(node, grizzlyBears, grizzlyBears.name)).toBe(true);
    expect(matchesScryfallQuery(node, westvaleAbbey, westvaleAbbey.name)).toBe(false);
  });
});

describe('subtype term', () => {
  const cases: [string, ScryfallCard, boolean][] = [
    ['bear', grizzlyBears, true],
    ['BEAR', grizzlyBears, true],
    ['creature', grizzlyBears, false],
    ['bird', alrundGodOfTheCosmos, true],
    ['god', alrundGodOfTheCosmos, true],
    ['demon', westvaleAbbey, true],
    ['land', westvaleAbbey, false],
    ['forest', forest, true],
    ['basic', forest, false],
  ];
  it.each(cases)('subtype %s on %s gives %s', (text, card, expected) => {
    expect(matchesScryfallQuery(subtypeTerm(text), card, card.name)).toBe(expected);
  });
});
