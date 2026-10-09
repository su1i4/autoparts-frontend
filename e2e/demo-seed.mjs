// Демо-данные через API бэкенда (OTP_DEV_MODE=true, PAYMENT_PROVIDER=mock).
// node e2e/demo-seed.mjs  → пишет e2e/sessions/*.json для скриншотов
import fs from 'fs';
import zlib from 'zlib';

const API = process.env.API ?? 'http://localhost:3000/api';
fs.mkdirSync('e2e/sessions', { recursive: true });

async function call(method, url, token, body, form) {
  const res = await fetch(API + url, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(form ? {} : { 'content-type': 'application/json' }) },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${text}`);
  return data;
}

async function login(phone, name) {
  const r = await call('POST', '/auth/otp/request', null, { phone });
  const v = await call('POST', '/auth/otp/verify', null, { phone, code: r.devCode });
  if (name) await call('PATCH', '/users/me', v.accessToken, { name, city: 'Бишкек' });
  const user = await call('GET', '/users/me', v.accessToken);
  return { token: v.accessToken, refresh: v.refreshToken, user };
}

const save = (file, s) =>
  fs.writeFileSync(`e2e/sessions/${file}.json`, JSON.stringify({ state: { accessToken: s.token, refreshToken: s.refresh, user: s.user }, version: 0 }));

// крошечный PNG заданного цвета (без зависимостей)
function png(w, h, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const x of buf) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const shade = ((x + y) % 40 < 20 ? 0 : 18);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = Math.max(0, r - shade);
      raw[o + 1] = Math.max(0, g - shade);
      raw[o + 2] = Math.max(0, b - shade);
    }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function upload(token, color) {
  const form = new FormData();
  form.append('file', new Blob([png(320, 240, color)], { type: 'image/png' }), 'photo.png');
  return (await call('POST', '/files/upload', token, null, form)).url;
}

const admin = await login(process.env.ADMIN_PHONE ?? '+996700000000');
const client = await login('+996555100001', 'Айбек');
const kg = await login('+996555100002', 'Нурлан');
const cn = await login('+996555100003', 'Ли Вэй');
const lg = await login('+996555100004', 'Склад Бишкек');
await call('PATCH', `/admin/users/${lg.user.id}/roles`, admin.token, { roles: ['LOGISTICS'] });

const cats = await call('GET', '/reference/categories');
const cat = (slug) => cats.find((c) => c.slug === slug).id;

async function becomeSeller(s, body) {
  if (s.user.seller) return s.user.seller;
  const doc = await upload(s.token, [120, 130, 150]);
  const seller = await call('POST', '/sellers/apply', s.token, { ...body, documents: [{ type: 'PATENT', url: doc }] });
  await call('PATCH', `/admin/sellers/${seller.id}/verification`, admin.token, { status: 'VERIFIED' });
  await call('PATCH', '/sellers/me', s.token, { payoutDetails: { method: 'BANK', bankName: 'Optima Bank', accountNumber: '1091234567890', recipientName: body.displayName } });
  return seller;
}
const sKg = await becomeSeller(kg, { type: 'SHOP', displayName: 'АвтоМир Дордой', store: { name: 'АвтоМир, ряд 14', country: 'KG', city: 'Бишкек', address: 'Дордой, контейнер 14-21' } });
const sCn = await becomeSeller(cn, { type: 'SCRAPYARD', displayName: 'Guangzhou Auto Parts', store: { name: 'GZ Parts', country: 'CN', city: 'Гуанчжоу' } });
const storeKg = (await call('GET', '/sellers/me/stores', kg.token))[0].id;
const storeCn = (await call('GET', '/sellers/me/stores', cn.token))[0].id;

const existingParts = await call('GET', '/seller/parts', kg.token);
if (!existingParts.total) {
  const parts = [
    ['Колодки тормозные передние', 'brakes', ['04465-33450'], 'Toyota', 3500, [210, 90, 60], 'Camry', 2006, 2011, 1.5],
    ['Фильтр масляный', 'filters', ['90915-YZZD3'], 'Toyota', 650, [230, 170, 40], 'Camry', 2002, 2017, 0.3],
    ['Амортизатор передний правый', 'suspension', ['48510-80421'], 'KYB', 5200, [70, 110, 170], 'Camry', 2006, 2011, 3.2],
    ['Фара левая', 'optics', ['81170-33580'], 'Depo', 9800, [150, 170, 190], 'Camry', 2009, 2011, 4],
    ['Свечи зажигания, комплект 4 шт', 'engine', ['90919-01253'], 'Denso', 2400, [90, 140, 90], 'Camry', 2006, 2017, 0.4],
    ['Радиатор охлаждения', 'cooling', ['16400-28390'], 'Koyorad', 11500, [100, 120, 140], 'RAV4', 2006, 2012, 6],
  ];
  for (const [name, c, oem, brand, price, color, model, yf, yt, w] of parts) {
    await call('POST', '/seller/parts', kg.token, {
      storeId: storeKg, name, categoryId: cat(c), oemNumbers: oem, brand, price, stock: 4, weightKg: w,
      photos: [await upload(kg.token, color)], compatibility: [{ make: 'Toyota', model, yearFrom: yf, yearTo: yt }],
    });
  }
  await call('POST', '/seller/parts', cn.token, {
    storeId: storeCn, name: 'Бампер передний (аналог)', categoryId: cat('body'), brand: 'TYG', price: 950, currency: 'CNY', stock: 10, weightKg: 7,
    origin: 'ANALOG', photos: [await upload(cn.token, [60, 60, 70])], compatibility: [{ make: 'Toyota', model: 'Camry', yearFrom: 2009, yearTo: 2011 }],
  });
}

// гараж + запрос с предложениями
let garage = await call('GET', '/garage', client.token);
if (!garage.length) {
  await call('POST', '/garage', client.token, { vin: 'JTNBE46K073012345', model: 'Camry', engine: '2AZ-FE 2.4', nickname: 'Камри' });
  await call('POST', '/garage', client.token, { frameNumber: 'ACA21-0123456', make: 'Toyota', model: 'RAV4', year: 2003 });
  garage = await call('GET', '/garage', client.token);
}
const camry = garage.find((v) => v.model === 'Camry');

const myReq = await call('GET', '/requests/my', client.token);
if (!myReq.total) {
  const r1 = await call('POST', '/requests', client.token, {
    vehicleId: camry.id, title: 'Передние тормозные колодки', categoryId: cat('brakes'), condition: 'ANY',
    description: 'Скрипят при торможении, нужен комплект на обе стороны.', photos: [await upload(client.token, [180, 80, 60])],
  });
  await call('POST', `/requests/${r1.id}/offers`, kg.token, { storeId: storeKg, price: 3500, condition: 'NEW', origin: 'ORIGINAL', brand: 'Toyota', deliveryDays: 1, warrantyDays: 90, comment: 'Оригинал, в наличии на Дордое. Можно забрать сегодня через пункт выдачи.' });
  await call('POST', `/requests/${r1.id}/offers`, cn.token, { storeId: storeCn, price: 180, currency: 'CNY', condition: 'NEW', origin: 'ANALOG', brand: 'Sangsin', deliveryDays: 9, warrantyDays: 30, weightKg: 1.6, comment: 'Корейский аналог, хорошее качество.' });

  const r2 = await call('POST', '/requests', client.token, {
    vehicleId: camry.id, title: 'Бампер передний в цвет 1F7', categoryId: cat('body'), condition: 'USED', originCountry: 'CN',
    photos: [await upload(client.token, [120, 120, 125])],
  });
  const off = await call('POST', `/requests/${r2.id}/offers`, cn.token, { storeId: storeCn, price: 1200, currency: 'CNY', condition: 'USED', origin: 'ORIGINAL', deliveryDays: 12, warrantyDays: 14, weightKg: 7, comment: 'С разборки, без повреждений, фото пришлю в чате.' });
  const chat = await call('POST', '/chats', client.token, { requestId: r2.id, sellerId: sCn.id });
  await call('POST', `/chats/${chat.id}/messages`, client.token, { text: 'Здравствуйте! Крепления целые?' });
  await call('POST', `/chats/${chat.id}/messages`, cn.token, { text: 'Да, все крепления целые, отправим авиа или авто — как удобнее.' });
  const pp = await call('GET', '/logistics/pickup-points');
  const order = await call('POST', '/orders', client.token, { offerId: off.id, deliveryMethod: 'PICKUP_POINT', pickupPointId: pp[0].id, shippingMethod: 'TRUCK' });
  const pay = await call('POST', `/orders/${order.id}/pay`, client.token, { method: 'MBANK' });
  await call('POST', `/payments/${pay.payment.id}/mock-confirm`, client.token);
  await call('POST', `/seller/orders/${order.id}/confirm`, cn.token);
  await call('POST', `/seller/orders/${order.id}/ship`, cn.token, { carrier: 'Cargo GZ-Bishkek' });
  const ships = await call('GET', '/logistics/shipments', lg.token);
  const sh = ships.items.find((s) => s.orderId === order.id);
  const whs = await call('GET', '/logistics/warehouses?type=CONSOLIDATION', lg.token);
  await call('POST', `/logistics/shipments/${sh.id}/receive`, lg.token, { warehouseId: whs.find((w) => w.city === 'Гуанчжоу').id, weightKg: 7.4, complete: true });
  await call('POST', `/logistics/shipments/${sh.id}/status`, lg.token, { status: 'IN_TRANSIT', location: 'Иркештам' });

  // ещё один запрос без ответов — для ленты продавца
  await call('POST', '/requests', client.token, { make: 'Toyota', model: 'Camry', year: 2008, title: 'Фара левая', categoryId: cat('optics'), condition: 'ANY' });
}

const refresh = async (s) => ({ ...s, user: await call('GET', '/users/me', s.token) });
save('client', client);
save('seller', await refresh(kg));
save('sellerCn', await refresh(cn));
save('logistics', lg);
save('admin', admin);
console.log('demo data ready');
