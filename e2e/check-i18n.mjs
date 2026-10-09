// Проверка: все t('...') в коде есть в ru.json; ky/en содержат те же ключи, что ru
import fs from 'fs';
import path from 'path';

const load = (l) => JSON.parse(fs.readFileSync(`src/messages/${l}.json`, 'utf8'));
const ru = load('ru');
const get = (obj, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));

const files = [];
const walk = (d) => fs.readdirSync(d).forEach((f) => (fs.statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : f.endsWith('.tsx') || f.endsWith('.ts') ? files.push(path.join(d, f)) : 0));
walk('src');

let missing = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  // компоненты идут подряд: пространство имён переменной действует до её следующего объявления
  const decls = [...src.matchAll(/const (\w+) = useTranslations\('([\w.]+)'\)/g)].map((m) => ({ v: m[1], ns: m[2], at: m.index }));
  for (const d of decls) if (get(ru, d.ns) === undefined) (missing++, console.log(`✗ ${f}: namespace ${d.ns}`));
  const nsAt = (v, pos) => decls.filter((d) => d.v === v && d.at < pos).at(-1)?.ns;
  for (const v of new Set(decls.map((d) => d.v))) {
    for (const m of src.matchAll(new RegExp(`\\b${v}\\((['\`])([^'\`]+)\\1`, 'g'))) {
      const ns = nsAt(v, m.index);
      if (!ns) continue;
      const key = m[2];
      if (key.includes('${')) {
        const prefix = key.split('${')[0].replace(/\.$/, '');
        if (prefix && typeof get(ru, `${ns}.${prefix}`) !== 'object') (missing++, console.log(`✗ ${f}: ${ns}.${prefix}.*`));
        continue;
      }
      if (get(ru, `${ns}.${key}`) === undefined) (missing++, console.log(`✗ ${f}: ${ns}.${key}`));
    }
  }
}
const ruKeys = new Set(flat(ru));
for (const l of ['ky', 'en']) {
  const keys = new Set(flat(load(l)));
  const lack = [...ruKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !ruKeys.has(k));
  console.log(`${l}: ${keys.size}/${ruKeys.size} ключей${lack.length ? ', нет: ' + lack.join(', ') : ''}${extra.length ? ', лишние: ' + extra.join(', ') : ''}`);
}
console.log(missing ? `Отсутствует ключей: ${missing}` : 'Все ключи из кода есть в ru.json');
process.exit(missing ? 1 : 0);
