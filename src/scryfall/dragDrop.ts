export type ScryfallRef = { id: string } | { set: string; number: string };

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const imagePattern = new RegExp(`scryfall\\.(?:io|com)/[^\\s"'<>]*?(${UUID})\\.(?:jpg|jpeg|png)`, 'i');
const apiPattern = new RegExp(`api\\.scryfall\\.com/cards/(${UUID})`, 'i');
const pagePattern = /scryfall\.com\/card\/([a-z0-9]+)\/([^/\s"'<>?#]+)/i;

function decode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function scryfallRefFromText(text: string): ScryfallRef | null {
  const image = imagePattern.exec(text);
  if (image) {
    return { id: image[1].toLowerCase() };
  }
  const api = apiPattern.exec(text);
  if (api) {
    return { id: api[1].toLowerCase() };
  }
  const page = pagePattern.exec(text);
  if (page) {
    return { set: page[1].toLowerCase(), number: decode(page[2]) };
  }
  return null;
}

const anyUuidNearScryfall = new RegExp(`scryfall[\\s\\S]*?(${UUID})|(${UUID})[\\s\\S]*?scryfall`, 'i');
const fileNamePattern = new RegExp(`^(${UUID})\\.(?:jpg|jpeg|png|webp)$`, 'i');

function texts(data: DataTransfer): string[] {
  const types = Array.from(data.types).filter((type) => type !== 'Files');
  const preferred = ['text/uri-list', 'text/x-moz-url', 'text/plain', 'text/html'];
  const ordered = [...preferred.filter((type) => types.includes(type)), ...types.filter((t) => !preferred.includes(t))];
  return ordered.map((type) => {
    try {
      return data.getData(type);
    } catch {
      return '';
    }
  });
}

export function scryfallRefFromDrop(data: DataTransfer): ScryfallRef | null {
  const contents = texts(data);
  for (const text of contents) {
    const ref = scryfallRefFromText(text);
    if (ref) {
      return ref;
    }
  }
  for (const file of Array.from(data.files)) {
    const match = fileNamePattern.exec(file.name);
    if (match) {
      return { id: match[1].toLowerCase() };
    }
  }
  for (const text of contents) {
    const match = anyUuidNearScryfall.exec(text);
    if (match) {
      return { id: (match[1] ?? match[2]).toLowerCase() };
    }
  }
  return null;
}
