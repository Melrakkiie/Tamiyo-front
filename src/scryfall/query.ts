import { cardColors, cardManaValue, type ScryfallCard } from './client';
import { frontManaCost } from './faces';

export type Op = '=' | '<' | '<=' | '>' | '>=';

type Field =
  | 'name'
  | 'exact'
  | 'type'
  | 'subtype'
  | 'oracle'
  | 'color'
  | 'colorCount'
  | 'identity'
  | 'identityCount'
  | 'manaValue'
  | 'manaParity'
  | 'power'
  | 'toughness'
  | 'manaCost'
  | 'rarity'
  | 'set'
  | 'number'
  | 'format'
  | 'keyword'
  | 'usd'
  | 'eur';

export type QueryNode =
  | { kind: 'and' | 'or'; children: QueryNode[] }
  | { kind: 'not'; child: QueryNode }
  | { kind: 'term'; field: Field; op: Op; text: string; number: number };

export type ParsedQuery = { node: QueryNode | null; error: null } | { node: null; error: string };

class QuerySyntaxError extends Error {}

const keys: Record<string, Field | 'is'> = {
  name: 'name',
  t: 'type',
  type: 'type',
  o: 'oracle',
  oracle: 'oracle',
  c: 'color',
  color: 'color',
  id: 'identity',
  identity: 'identity',
  ci: 'identity',
  mv: 'manaValue',
  cmc: 'manaValue',
  manavalue: 'manaValue',
  pow: 'power',
  power: 'power',
  tou: 'toughness',
  toughness: 'toughness',
  m: 'manaCost',
  mana: 'manaCost',
  r: 'rarity',
  rarity: 'rarity',
  s: 'set',
  set: 'set',
  e: 'set',
  edition: 'set',
  cn: 'number',
  number: 'number',
  f: 'format',
  format: 'format',
  legal: 'format',
  kw: 'keyword',
  keyword: 'keyword',
  is: 'is',
  not: 'is',
  usd: 'usd',
  eur: 'eur',
};

const colorNames: Record<string, string> = {
  white: 'W',
  blue: 'U',
  black: 'B',
  red: 'R',
  green: 'G',
  azorius: 'WU',
  dimir: 'UB',
  rakdos: 'BR',
  gruul: 'RG',
  selesnya: 'GW',
  orzhov: 'WB',
  izzet: 'UR',
  golgari: 'BG',
  boros: 'RW',
  simic: 'GU',
  bant: 'GWU',
  esper: 'WUB',
  grixis: 'UBR',
  jund: 'BRG',
  naya: 'RGW',
  abzan: 'WBG',
  jeskai: 'URW',
  sultai: 'BGU',
  mardu: 'RWB',
  temur: 'GUR',
};

const rarityRanks: Record<string, number> = {
  c: 1,
  common: 1,
  u: 2,
  uncommon: 2,
  r: 3,
  rare: 3,
  m: 4,
  mythic: 4,
};

const legalFormats = new Set([
  'standard',
  'future',
  'historic',
  'timeless',
  'gladiator',
  'pioneer',
  'explorer',
  'modern',
  'legacy',
  'pauper',
  'vintage',
  'penny',
  'commander',
  'oathbreaker',
  'standardbrawl',
  'brawl',
  'alchemy',
  'paupercommander',
  'duel',
  'oldschool',
  'premodern',
  'predh',
]);

type Token =
  | { kind: 'term'; key: string; op: string; value: string }
  | { kind: 'exact'; value: string }
  | { kind: 'or' | 'not' | 'open' | 'close' };

const space = /\s/;
const letter = /\p{L}/u;

function fail(message: string): never {
  throw new QuerySyntaxError(message);
}

function startsTerm(chars: string[], i: number) {
  return i < chars.length && !space.test(chars[i]) && chars[i] !== ')';
}

function operatorAt(chars: string[], i: number) {
  const next = chars[i + 1];
  switch (chars[i]) {
    case ':':
    case '=':
      return chars[i];
    case '!':
      return next === '=' ? '!=' : '';
    case '<':
    case '>':
      return next === '=' ? `${chars[i]}=` : chars[i];
    default:
      return '';
  }
}

function readValue(chars: string[], start: number): [string, number] {
  if (chars[start] === '"') {
    const end = chars.indexOf('"', start + 1);
    if (end < 0) {
      fail('guillemet fermant manquant');
    }
    return [chars.slice(start + 1, end).join(''), end + 1];
  }
  let end = start;
  while (end < chars.length && !space.test(chars[end]) && chars[end] !== ')') {
    end++;
  }
  return [chars.slice(start, end).join(''), end];
}

function readTerm(chars: string[], start: number): [Token, number] {
  if (chars[start] === '"') {
    const [value, next] = readValue(chars, start);
    return [{ kind: 'term', key: '', op: '', value }, next];
  }
  let end = start;
  while (end < chars.length && letter.test(chars[end])) {
    end++;
  }
  const op = end > start ? operatorAt(chars, end) : '';
  if (op) {
    const key = chars.slice(start, end).join('').toLowerCase();
    const [value, next] = readValue(chars, end + op.length);
    if (value === '') {
      fail(`« ${key}${op} » attend une valeur`);
    }
    return [{ kind: 'term', key, op, value }, next];
  }
  while (end < chars.length && !space.test(chars[end]) && chars[end] !== '(' && chars[end] !== ')') {
    end++;
  }
  const word = chars.slice(start, end).join('');
  return [word.toLowerCase() === 'or' ? { kind: 'or' } : { kind: 'term', key: '', op: '', value: word }, end];
}

function lex(chars: string[]): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < chars.length) {
    const char = chars[i];
    if (space.test(char)) {
      i++;
    } else if (char === '(' || char === ')') {
      tokens.push({ kind: char === '(' ? 'open' : 'close' });
      i++;
    } else if (char === '-' && startsTerm(chars, i + 1)) {
      tokens.push({ kind: 'not' });
      i++;
    } else if (char === '!' && startsTerm(chars, i + 1)) {
      const [value, next] = readValue(chars, i + 1);
      tokens.push({ kind: 'exact', value });
      i = next;
    } else {
      const [token, next] = readTerm(chars, i);
      tokens.push(token);
      i = next;
    }
  }
  return tokens;
}

function term(field: Field, op: Op, text: string, number = 0): QueryNode {
  return { kind: 'term', field, op, text, number };
}

export function colorTerm(op: Op, letters: string): QueryNode {
  return term('color', op, colorCode(letters));
}

export function colorlessTerm(): QueryNode {
  return term('color', '=', '');
}

export function statTerm(field: 'manaValue' | 'power' | 'toughness', op: Op, number: number): QueryNode {
  return term(field, op, '', number);
}

export function typeTerm(text: string): QueryNode {
  return term('type', '=', text);
}

export function subtypeTerm(text: string): QueryNode {
  return term('subtype', '=', text);
}

function comparison(op: string): Op {
  return op === ':' ? '=' : (op as Op);
}

function parseNumber(value: string, op: string, field: Field): QueryNode {
  const number = Number(value);
  if (value.trim() === '' || !Number.isFinite(number)) {
    fail(`« ${value} » n'est pas un nombre`);
  }
  return term(field, comparison(op), '', number);
}

function colorCode(letters: string) {
  return [...'WUBRG'].filter((color) => letters.toUpperCase().includes(color)).join('');
}

function colorCriterion(field: 'color' | 'identity', op: string, value: string, unsupported: () => never) {
  const countField = field === 'color' ? 'colorCount' : 'identityCount';
  const lower = value.toLowerCase();
  if (/^\d+$/.test(lower)) {
    const count = Number(lower);
    if (count > 5) {
      fail(`« ${value} » n'est pas une couleur`);
    }
    return term(countField, comparison(op), '', count);
  }
  if (lower === 'm' || lower === 'multicolor') {
    if (op !== ':' && op !== '=') {
      unsupported();
    }
    return term(countField, '>=', '', 2);
  }
  let code: string;
  if (lower === 'c' || lower === 'colorless') {
    code = '';
  } else if (colorNames[lower]) {
    code = colorCode(colorNames[lower]);
  } else if (/^[wubrg]+$/.test(lower)) {
    code = colorCode(lower);
  } else {
    fail(`« ${value} » n'est pas une couleur`);
  }
  let resolved = comparison(op);
  if (op === ':') {
    resolved = field === 'identity' ? '<=' : code === '' ? '=' : '>=';
  }
  return term(field, resolved, code);
}

function normalizeManaCost(value: string) {
  const chars = [...value.toUpperCase()];
  let cost = '';
  let i = 0;
  while (i < chars.length) {
    const char = chars[i];
    if (char === '{') {
      const end = chars.indexOf('}', i + 1);
      if (end < 0 || end === i + 1) {
        return null;
      }
      cost += chars.slice(i, end + 1).join('');
      i = end + 1;
    } else if (/\d/.test(char)) {
      let end = i;
      while (end < chars.length && /\d/.test(chars[end])) {
        end++;
      }
      cost += `{${chars.slice(i, end).join('')}}`;
      i = end;
    } else if ('WUBRGCXYZS'.includes(char)) {
      cost += `{${char}}`;
      i++;
    } else {
      return null;
    }
  }
  return cost || null;
}

function criterion(field: Field, op: string, value: string, unsupported: () => never): QueryNode {
  const equality = op === ':' || op === '=';
  switch (field) {
    case 'name':
    case 'type':
    case 'oracle':
    case 'keyword':
      if (!equality) {
        unsupported();
      }
      return term(field, '=', value);
    case 'color':
    case 'identity':
      return colorCriterion(field, op, value, unsupported);
    case 'manaValue': {
      const parity = value.toLowerCase();
      if (parity === 'even' || parity === 'odd') {
        if (!equality) {
          unsupported();
        }
        return term('manaParity', '=', parity);
      }
      return parseNumber(value, op, field);
    }
    case 'manaCost': {
      if (op === '<' || op === '<=') {
        unsupported();
      }
      const cost = normalizeManaCost(value);
      if (!cost) {
        fail(`« ${value} » n'est pas un coût de mana`);
      }
      return term(field, op === ':' ? '>=' : (op as Op), cost);
    }
    case 'rarity': {
      const rank = rarityRanks[value.toLowerCase()];
      if (!rank) {
        fail(`« ${value} » n'est pas une rareté (common, uncommon, rare, mythic)`);
      }
      return term(field, comparison(op), '', rank);
    }
    case 'set':
      if (!equality) {
        unsupported();
      }
      return term(field, '=', value.toLowerCase());
    case 'number':
      return equality ? term(field, '=', value) : parseNumber(value, op, field);
    case 'format': {
      if (!equality) {
        unsupported();
      }
      const format = value.toLowerCase();
      if (!legalFormats.has(format)) {
        fail(`« ${value} » n'est pas un format`);
      }
      return term(field, '=', format);
    }
    default:
      return parseNumber(value, op, field);
  }
}

function buildTerm(token: Token): QueryNode {
  if (token.kind === 'exact') {
    if (token.value === '') {
      fail('« ! » attend un nom de carte');
    }
    return term('exact', '=', token.value);
  }
  if (token.kind !== 'term') {
    fail('terme attendu');
  }
  if (token.key === '') {
    return term('name', '=', token.value);
  }
  const field = keys[token.key];
  if (!field) {
    fail(`mot-clé inconnu « ${token.key} »`);
  }
  if (field === 'is') {
    fail(`« ${token.key}: » ne s'applique qu'à ta collection`);
  }
  const unsupported = () => fail(`« ${token.key} » n'accepte pas « ${token.op} »`);
  if (token.op === '!=') {
    return { kind: 'not', child: criterion(field, '=', token.value, unsupported) };
  }
  return criterion(field, token.op, token.value, unsupported);
}

class Parser {
  private pos = 0;
  private depth = 0;

  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): QueryNode {
    const node = this.parseOr();
    if (this.pos < this.tokens.length) {
      fail('« ) » inattendue');
    }
    return node;
  }

  private at(kind: Token['kind']) {
    return this.tokens[this.pos]?.kind === kind;
  }

  private parseOr(): QueryNode {
    const children = [this.parseAnd()];
    while (this.at('or')) {
      this.pos++;
      children.push(this.parseAnd());
    }
    return children.length === 1 ? children[0] : { kind: 'or', children };
  }

  private parseAnd(): QueryNode {
    const children: QueryNode[] = [];
    while (this.pos < this.tokens.length && !this.at('or') && !this.at('close')) {
      children.push(this.parseUnary());
    }
    if (children.length === 1) {
      return children[0];
    }
    if (children.length > 1) {
      return { kind: 'and', children };
    }
    if (this.at('or') || this.tokens[this.pos - 1]?.kind === 'or') {
      fail('« or » doit être entre deux termes');
    }
    if (this.at('close') && this.depth > 0) {
      fail('parenthèses vides');
    }
    fail('« ) » inattendue');
  }

  private parseUnary(): QueryNode {
    const token = this.tokens[this.pos++];
    if (token.kind === 'not') {
      if (this.pos >= this.tokens.length || this.at('or') || this.at('close')) {
        fail('« - » doit précéder un terme');
      }
      return { kind: 'not', child: this.parseUnary() };
    }
    if (token.kind === 'open') {
      this.depth++;
      const node = this.parseOr();
      if (!this.at('close')) {
        fail('parenthèse fermante manquante');
      }
      this.pos++;
      this.depth--;
      return node;
    }
    return buildTerm(token);
  }
}

export function parseScryfallQuery(raw: string): ParsedQuery {
  const chars = [...raw.trim()];
  if (chars.length === 0) {
    return { node: null, error: null };
  }
  try {
    return { node: new Parser(lex(chars)).parse(), error: null };
  } catch (err) {
    if (err instanceof QuerySyntaxError) {
      return { node: null, error: err.message };
    }
    throw err;
  }
}

export function normalized(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function compare(value: number, op: Op, target: number) {
  switch (op) {
    case '<':
      return value < target;
    case '<=':
      return value <= target;
    case '>':
      return value > target;
    case '>=':
      return value >= target;
    default:
      return value === target;
  }
}

function compareSets(actual: string[], op: Op, wanted: string) {
  const has = new Set(actual);
  const superset = [...wanted].every((color) => has.has(color));
  const subset = actual.every((color) => wanted.includes(color));
  const equal = superset && subset;
  switch (op) {
    case '>=':
      return superset;
    case '<=':
      return subset;
    case '>':
      return superset && !equal;
    case '<':
      return subset && !equal;
    default:
      return equal;
  }
}

const NUMERIC_STAT = /^-?[0-9]*\.?[0-9]+$/;

function faceTexts(card: ScryfallCard, top: string | undefined, face: (index: number) => string | undefined) {
  if (top) {
    return [top];
  }
  return (card.card_faces ?? []).map((_, index) => face(index)).filter((text): text is string => !!text);
}

function typeLines(card: ScryfallCard) {
  return faceTexts(card, card.type_line, (i) => card.card_faces?.[i].type_line);
}

function symbolCount(cost: string, symbol: string) {
  return cost.split(symbol).length - 1;
}

function manaCostMatches(card: ScryfallCard, op: Op, wanted: string) {
  const cost = frontManaCost(card);
  if (op === '=') {
    return cost === wanted;
  }
  const symbols = wanted.match(/\{[^}]+\}/g) ?? [];
  const atLeast = symbols.every(
    (symbol) => symbolCount(cost, symbol) >= symbols.filter((other) => other === symbol).length,
  );
  return op === '>' ? atLeast && cost !== wanted : atLeast;
}

function price(card: ScryfallCard, currency: 'usd' | 'eur') {
  const prices = card.prices ?? {};
  const raw =
    currency === 'usd' ? (prices.usd ?? prices.usd_foil ?? prices.usd_etched) : (prices.eur ?? prices.eur_foil);
  return raw ? Number(raw) : null;
}

function termMatches(node: Extract<QueryNode, { kind: 'term' }>, card: ScryfallCard | undefined, name: string) {
  const { field, op, text, number } = node;
  if (field === 'name') {
    const wanted = normalized(text);
    return normalized(name).includes(wanted) || (!!card && normalized(card.name).includes(wanted));
  }
  if (field === 'exact') {
    const wanted = normalized(text);
    return normalized(name) === wanted || (!!card && normalized(card.name) === wanted);
  }
  if (!card) {
    return false;
  }
  const faces = card.card_faces ?? [];
  switch (field) {
    case 'type':
      return typeLines(card).some((line) => line.toLowerCase().includes(text.toLowerCase()));
    case 'subtype': {
      const wanted = normalized(text);
      return typeLines(card)
        .flatMap((line) => line.split('//'))
        .some((line) => normalized(line.split('—').slice(1).join('—')).includes(wanted));
    }
    case 'oracle': {
      const wanted = text.toLowerCase().replaceAll('~', card.name.toLowerCase());
      return faceTexts(card, card.oracle_text, (i) => faces[i].oracle_text)
        .join('\n//\n')
        .toLowerCase()
        .includes(wanted);
    }
    case 'color':
      return compareSets(cardColors(card), op, text);
    case 'identity':
      return compareSets(card.color_identity ?? [], op, text);
    case 'colorCount':
      return compare(cardColors(card).length, op, number);
    case 'identityCount':
      return compare((card.color_identity ?? []).length, op, number);
    case 'manaValue':
      return compare(cardManaValue(card), op, number);
    case 'manaParity': {
      const value = cardManaValue(card);
      return Number.isInteger(value) && value % 2 === (text === 'odd' ? 1 : 0);
    }
    case 'power':
    case 'toughness':
      return [card[field], ...faces.map((face) => face[field])].some(
        (stat) => stat !== undefined && NUMERIC_STAT.test(stat) && compare(Number(stat), op, number),
      );
    case 'manaCost':
      return manaCostMatches(card, op, text);
    case 'rarity': {
      const rank = card.rarity ? rarityRanks[card.rarity] : undefined;
      return rank !== undefined && compare(rank, op, number);
    }
    case 'set':
      return card.set.toLowerCase() === text;
    case 'number':
      if (text !== '') {
        return card.collector_number === text;
      }
      return /^\d+$/.test(card.collector_number) && compare(Number(card.collector_number), op, number);
    case 'format': {
      const status = card.legalities?.[text];
      return status === 'legal' || status === 'restricted';
    }
    case 'keyword':
      return (card.keywords ?? []).some((keyword) => keyword.toLowerCase() === text.toLowerCase());
    default: {
      const value = price(card, field);
      return value !== null && compare(value, op, number);
    }
  }
}

export function allOf(nodes: (QueryNode | null)[]): QueryNode | null {
  const present = nodes.filter((node) => node !== null);
  return present.length <= 1 ? (present[0] ?? null) : { kind: 'and', children: present };
}

export function matchesScryfallQuery(node: QueryNode | null, card: ScryfallCard | undefined, name: string): boolean {
  if (!node) {
    return true;
  }
  switch (node.kind) {
    case 'and':
      return node.children.every((child) => matchesScryfallQuery(child, card, name));
    case 'or':
      return node.children.some((child) => matchesScryfallQuery(child, card, name));
    case 'not':
      return !matchesScryfallQuery(node.child, card, name);
    default:
      return termMatches(node, card, name);
  }
}
