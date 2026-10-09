// Сквозной сценарий через UI (Playwright). Нужны запущенные бэкенд (:3000), фронт (:3001) и demo-seed.
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE ?? 'http://localhost:3001';
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const shot = (page, name) => page.screenshot({ path: `e2e/screens/flow_${name}.png`, fullPage: true });
const step = (s) => console.log('→', s);
const errors = [];

async function ctx(session, width = 1280) {
  const c = await browser.newContext({ viewport: { width, height: 900 } });
  if (session) await c.addInitScript((s) => localStorage.setItem('tetik-session', s), fs.readFileSync(session, 'utf8'));
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  return p;
}

try {
  // A. вход покупателя по OTP через UI
  const client = await ctx(null, 390);
  step('покупатель входит по OTP');
  await client.goto(`${BASE}/login?next=/requests/new`);
  await client.getByLabel('Номер телефона').fill('+996 555 100 001');
  await client.getByRole('button', { name: 'Получить код' }).click();
  const note = await client.getByText(/Тестовый режим: код/).textContent();
  const code = note.match(/\d{4}/)[0];
  await client.getByLabel('Код из SMS').fill(code);
  await client.waitForURL('**/requests/new');

  // B. запрос
  step('создаёт запрос из гаража');
  await client.getByLabel('Название детали').fill('Генератор');
  await shot(client, '1_new_request_mobile');
  await client.getByRole('button', { name: 'Отправить продавцам' }).click();
  await client.waitForURL(/\/requests\/[0-9a-f-]{36}$/);
  const requestId = client.url().split('/').pop();
  await client.getByText('Ждём предложений').first().waitFor();

  // C. продавец отвечает
  step('продавец отправляет предложение');
  const seller = await ctx('e2e/sessions/seller.json');
  await seller.goto(`${BASE}/seller/feed/${requestId}`);
  await seller.getByLabel('Цена').fill('4200');
  await seller.getByLabel('Комментарий').fill('Оригинал Denso, б/у с гарантией');
  await seller.getByRole('button', { name: 'Отправить предложение' }).click();
  await seller.getByText('Предложение отправлено').waitFor();

  // D. выбор, оформление, оплата
  step('покупатель выбирает предложение и оформляет заказ');
  await client.reload();
  await client.getByText('4 200 сом').first().waitFor();
  await shot(client, '2_offers_mobile');
  await client.getByRole('link', { name: 'Выбрать' }).first().click();
  await client.waitForURL('**/checkout?offerId=*');
  await client.getByText('Итого').waitFor();
  await client.getByRole('button', { name: 'Оформить заказ' }).click();
  await client.waitForURL(/\/orders\/[0-9a-f-]{36}\?pay=1/);
  const orderId = client.url().split('/').pop().split('?')[0];
  step('оплата (тестовый провайдер)');
  await client.getByRole('button', { name: /^Оплатить/ }).click();
  await client.getByRole('button', { name: 'Подтвердить тестовую оплату' }).click();
  await client.getByText('Оплачен').first().waitFor();
  await shot(client, '3_order_paid_mobile');

  // E. чат: контакт блокируется, обычное сообщение уходит
  step('чат блокирует номер телефона');
  await client.getByRole('link', { name: 'Чат с продавцом' }).click();
  await client.waitForURL('**/chats/*');
  const box = client.getByLabel('Сообщение', { exact: true });
  await box.fill('позвони мне 0555 123 456');
  await box.press('Enter');
  await client.getByText(/Сообщение не отправлено/).waitFor();
  await box.fill('Когда сможете отправить?');
  await box.press('Enter');
  await client.getByText('Когда сможете отправить?').waitFor();
  await shot(client, '4_chat_mobile');

  // F. продавец подтверждает и отправляет
  step('продавец подтверждает и передаёт в доставку');
  await seller.goto(`${BASE}/seller/orders/${orderId}`);
  await seller.getByRole('button', { name: 'Подтвердить заказ' }).click();
  await seller.getByText('Заказ подтверждён').waitFor();
  await seller.getByRole('button', { name: 'Передал в доставку' }).click();
  await seller.getByRole('dialog').getByRole('button', { name: 'Передал в доставку' }).click();
  await seller.getByText('Отмечено: передано в доставку').waitFor();
  await shot(seller, '5_seller_order');

  // G. покупатель видит статус
  await client.goto(`${BASE}/orders/${orderId}`);
  await client.getByText('Передан в доставку').first().waitFor();

  // H. язык
  step('переключение на кыргызский');
  const desk = await ctx('e2e/sessions/client.json');
  await desk.goto(`${BASE}/`);
  await desk.getByRole('button', { name: 'Кыр' }).click();
  await desk.getByRole('heading', { name: 'VIN боюнча тетик буйрутмага' }).waitFor();
  await shot(desk, '6_home_ky');
  await desk.getByRole('button', { name: 'Рус' }).click();

  console.log('✓ сценарий пройден', errors.length ? `, ошибки страницы: ${errors.join(' | ')}` : ', ошибок на страницах нет');
} catch (e) {
  console.error('✗', e.message.split('\n').slice(0, 6).join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
