// Сквозной сценарий №2 через UI: склад → доставка → получение → отзыв → вывод денег → спор.
// Запускать после e2e/flow.mjs (берёт последний заказ покупателя, переданный продавцом в доставку).
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE ?? 'http://localhost:3001';
const API = process.env.API ?? 'http://localhost:3000/api';
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const shot = (page, name) => page.screenshot({ path: `e2e/screens/staff_${name}.png`, fullPage: true });
const step = (s) => console.log('→', s);
const errors = [];
const token = (who) => JSON.parse(fs.readFileSync(`e2e/sessions/${who}.json`, 'utf8')).state.accessToken;
const api = (who, url) => fetch(API + url, { headers: { Authorization: `Bearer ${token(who)}` } }).then((r) => r.json());

async function ctx(who, width = 1280) {
  const c = await browser.newContext({ viewport: { width, height: 900 } });
  await c.addInitScript((s) => localStorage.setItem('tetik-session', s), fs.readFileSync(`e2e/sessions/${who}.json`, 'utf8'));
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  p.on('dialog', async (d) => (d.type() === 'prompt' ? d.accept('ПП-2026-001') : d.accept()));
  return p;
}

try {
  const orders = await api('client', '/orders/my?limit=50');
  const order = orders.items.find((o) => ['SHIPPED', 'IN_TRANSIT'].includes(o.status) && o.shipFromCountry === 'KG');
  if (!order) throw new Error('Нет заказа в статусе SHIPPED — сначала запустите e2e/flow.mjs');
  const [shipment] = await api('client', `/orders/${order.id}/tracking`);

  // A. склад: приёмка в Бишкеке → курьер → доставлено
  step('склад принимает посылку в Бишкеке');
  const wh = await ctx('logistics');
  await wh.goto(`${BASE}/logistics/shipments/${shipment.id}`);
  if (shipment.status === 'HANDED_BY_SELLER') {
    await wh.getByRole('combobox', { name: 'Склад' }).selectOption({ label: 'Склад Бишкек' });
    await wh.getByLabel('Вес, кг').fill('4.2');
    await wh.getByRole('button', { name: 'Принять на склад' }).click();
  }
  await wh.getByText('На складе КР').first().waitFor();
  for (const status of ['Передано курьеру', 'Доставлено']) {
    step(`статус: ${status}`);
    await wh.getByLabel('Новый статус').selectOption({ label: status });
    await wh.getByRole('button', { name: 'Сохранить статус' }).click();
    await wh.getByRole('listitem').filter({ hasText: status }).first().waitFor();
  }
  if (await wh.getByRole('button', { name: 'Принять на склад' }).count()) throw new Error('Форма приёмки видна после доставки');
  await shot(wh, '1_shipment');

  // B. покупатель подтверждает получение и пишет отзыв
  step('покупатель подтверждает получение');
  const client = await ctx('client', 390);
  await client.goto(`${BASE}/orders/${order.id}`);
  await client.getByRole('button', { name: 'Получил, всё в порядке' }).click();
  const confirmDialog = client.getByRole('dialog');
  if (await confirmDialog.isVisible().catch(() => false)) await confirmDialog.getByRole('button', { name: 'Получил, всё в порядке' }).click();
  await client.getByText('Завершён').first().waitFor();
  step('отзыв продавцу');
  await client.getByRole('button', { name: 'Оставить отзыв' }).click();
  await client.getByRole('dialog').getByLabel('Комментарий').fill('Быстро и аккуратно');
  await client.getByRole('button', { name: 'Опубликовать отзыв' }).click();
  await client.getByText('Спасибо за отзыв').waitFor();
  await client.reload();
  await client.getByText('Завершён').first().waitFor();
  if (await client.getByRole('button', { name: 'Оставить отзыв' }).count()) throw new Error('Кнопка отзыва осталась после отзыва');
  await shot(client, '2_order_completed_mobile');

  // C. продавец выводит деньги, админ отмечает выплату
  step('продавец выводит деньги');
  const seller = await ctx('seller');
  await seller.goto(`${BASE}/seller/balance`);
  await seller.getByRole('button', { name: 'Вывести' }).first().click();
  await seller.getByRole('dialog').getByLabel('Сумма').fill('1000');
  await seller.getByRole('dialog').getByRole('button', { name: 'Вывести' }).click();
  await seller.getByText('Заявка на вывод отправлена').waitFor();

  step('админ проводит выплату');
  const admin = await ctx('admin');
  await admin.goto(`${BASE}/admin/payouts`);
  await admin.getByRole('button', { name: 'Выплачено' }).first().click();
  await admin.getByText(/Выплачено|PAID/).first().waitFor();
  await seller.reload();
  await seller.getByText('Выплачено').first().waitFor();
  await shot(seller, '3_seller_balance');

  // D. спор по заказу из Китая → частичный возврат
  const cn = (await api('client', '/orders/my?limit=50')).items.find((o) => o.shipFromCountry === 'CN' && ['PAID', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DISPUTE'].includes(o.status));
  if (cn) {
    if (cn.status !== 'DISPUTE') {
      step('покупатель открывает спор');
      await client.goto(`${BASE}/orders/${cn.id}`);
      await client.getByRole('button', { name: 'Открыть спор' }).click();
      const dlg = client.getByRole('dialog');
      await dlg.getByLabel('Причина').selectOption('NOT_AS_DESCRIBED');
      await dlg.getByLabel('Что случилось').fill('Цвет бампера не совпадает с кодом 1F7');
      await dlg.getByRole('button', { name: 'Открыть спор' }).click();
      await client.getByText('Спор открыт').first().waitFor();
    }

    step('поддержка решает спор частичным возвратом');
    await admin.goto(`${BASE}/admin/disputes`);
    await admin.getByText('Цвет бампера не совпадает').first().click();
    await admin.waitForURL('**/admin/disputes/*');
    const take = admin.getByRole('button', { name: 'Взять в работу' });
    if (await take.isVisible().catch(() => false)) await take.click();
    await admin.getByRole('radio', { name: 'Частичный' }).click();
    await admin.getByLabel('Сумма возврата, сом').fill('3000');
    await admin.getByLabel('Комментарий (увидят обе стороны)').fill('Компенсация за перекрас');
    await admin.getByRole('button', { name: 'Вынести решение' }).click();
    await admin.getByText('Частичный возврат покупателю', { exact: true }).waitFor();
    await admin.getByText(/Решение спора: частичный возврат покупателю 3000 сом/).waitFor();
    step('покупатель видит чат спора из заказа');
    await client.goto(`${BASE}/orders/${cn.id}`);
    await client.getByRole('link', { name: 'Чат спора' }).click();
    await client.getByText(/Решение спора: частичный возврат/).waitFor();
    await shot(admin, '4_dispute_resolved');
  }

  // E. сверка проводок
  step('сверка журнала проводок');
  await admin.goto(`${BASE}/admin/payments`);
  const rec = await api('admin', '/admin/ledger/reconcile');
  if (!rec.ok) throw new Error('Сверка не сошлась: ' + JSON.stringify(rec).slice(0, 300));
  await shot(admin, '5_payments');

  console.log('✓ сценарий персонала пройден', errors.length ? `, ошибки страницы: ${errors.join(' | ')}` : ', ошибок на страницах нет');
} catch (e) {
  console.error('✗', e.message.split('\n').slice(0, 8).join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
