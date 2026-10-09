// Скриншоты страниц: node e2e/shot.mjs /path [/path2 ...]  (env W=390 для мобилки, TOKEN_FILE для сессии)
import { chromium } from '@playwright/test';
import fs from 'fs';
const width = Number(process.env.W ?? 1280);
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
if (process.env.SESSION) {
  await ctx.addInitScript((s) => localStorage.setItem('tetik-session', s), fs.readFileSync(process.env.SESSION, 'utf8'));
}
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text().slice(0, 200)));
page.on('response', (r) => r.status() >= 400 && console.log('http', r.status(), r.request().method(), r.url()));
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)));
for (const p of process.argv.slice(2)) {
  await page.goto('http://localhost:3001' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const name = (p.replace(/[^a-z0-9]+/gi, '_') || 'home') + `_${width}.png`;
  await page.screenshot({ path: `e2e/screens/${name}`, fullPage: true });
  console.log('saved', name);
}
await browser.close();
