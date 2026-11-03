// Downloads the API's shared search cases (doc/search_cases.json, main branch) into src/api/searchCases.json.
import { writeFileSync } from 'node:fs';

const url = 'https://raw.githubusercontent.com/Melrakkiie/tamiyo/main/doc/search_cases.json';

const res = await fetch(url);
if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
writeFileSync('src/api/searchCases.json', await res.text());
