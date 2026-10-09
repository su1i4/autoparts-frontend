# Тетик — фронтенд маркетплейса запчастей

Одно приложение на четыре роли: покупатель, продавец, админка, склад. Работает с бэкендом `autoparts-backend` (NestJS).

**Стек:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query · Zustand (сессия в localStorage) · next-intl (ru / ky / en) · Socket.IO · Axios с обновлением токена

## Запуск

```bash
# 1. бэкенд на :3000 (см. его README): migration:run, seed, start:dev
# 2. фронт
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3001
```

Продакшен: `npm run build && npm start` (сборка `output: 'standalone'` — подходит для Docker).

Вход — по номеру телефона. В dev-режиме бэкенда код показывается прямо на экране входа. Админ из сида бэкенда: `+996 700 000 000`.

### Демо-данные

```bash
npm run e2e:seed       # продавцы (КР и Китай), товары, запросы, офферы, заказы; сессии ролей в e2e/sessions
```

## Разделы

| Роль | Маршруты |
|---|---|
| Все | `/` (VIN-поиск), `/catalog`, `/catalog/[id]`, `/sellers/[id]`, `/track`, `/track/[number]`, `/login` |
| Покупатель | `/garage`, `/requests`, `/requests/new`, `/requests/[id]` (сравнение предложений), `/checkout`, `/orders`, `/orders/[id]` (оплата, трекинг, получение, спор, возврат, отзыв), `/chats`, `/notifications`, `/profile`, `/seller/apply` |
| Продавец | `/seller` (сводка), `/seller/feed` (лента запросов), `/seller/offers`, `/seller/catalog` (+ импорт Excel/CSV), `/seller/orders`, `/seller/chats`, `/seller/balance` (вывод), `/seller/profile` (магазины, реквизиты, документы) |
| Админка | `/admin` (сводка), `users`, `sellers` (верификация), `requests`, `offers`, `orders`, `payments` (платежи и сверка проводок), `payouts`, `disputes`, `returns`, `moderation` (жалобы, заблокированные сообщения, обжалования, чёрный список), `chats`, `commissions`, `logistics` (склады, тарифы), `reference` (категории, марки, курсы, OEM), `templates`, `settings`, `audit` |
| Склад | `/logistics` (отправки, приёмка, статусы), `/logistics/consolidations`, `/logistics/tracking` (массовая загрузка треков) |

Доступ к разделам проверяется по ролям из `/users/me` (`AuthGuard`). Окончательная проверка всё равно на бэкенде.

## Структура (Feature-Sliced)

```
src/
  app/          маршруты Next.js: (client), (seller), (staff)/admin, (staff)/logistics, login
  views/        экраны (слой pages в FSD), по ролям: client, seller, admin, logistics
  widgets/      шапка, нижняя навигация, оболочки кабинетов, guard
  features/     вход по OTP, ввод VIN, добавление авто, загрузка фото, переключатель языка
  entities/     API-хуки и UI сущностей: session, request, order, chat, part, seller, vehicle, dispute, reference
  shared/       http (axios + refresh), типы API, UI-кит, форматтеры, конфиг
  i18n/         конфиг next-intl (язык в cookie, без префикса в URL)
  messages/     ru.json, ky.json, en.json
```

## Ключевые решения

- **Язык** хранится в cookie `locale`. Тексты для покупателя и продавца переведены на ky и en целиком: 557 ключей в каждом языке, `npm run i18n:check` сверяет ключи. Недостающие ключи подставляются из ru. Админка и склад — внутренние инструменты, только на русском. **Кыргызский перевод нужно вычитать носителю.**
- **Сессия:** access + refresh в Zustand (persist → localStorage). На 401 axios один раз обновляет токен и повторяет запрос, параллельные запросы ждут в очереди.
- **Чат:** Socket.IO `/chat` с токеном в handshake. Сообщение с контактами показывается как «не доставлено» с причиной. Перед отправкой текст проверяется через `POST /chats/check`.
- **Цены** в валюте продавца показываются с пересчётом «≈ … сом». Итог заказа фиксируется бэкендом по курсу на момент заказа.
- **Приватность:** продавец не видит телефон и адрес покупателя, только город. Это разделение делает бэкенд.

## Проверки

```bash
npm run typecheck
npm run i18n:check
# при запущенных бэкенде (:3000) и фронте (:3001):
npm run e2e:seed
npm run e2e:flow       # покупатель и продавец: вход → запрос → оффер → заказ → оплата → чат (блок номера) → отправка → кыргызский
npm run e2e:staff      # склад → доставка → получение → отзыв → вывод денег → спор с частичным возвратом → сверка проводок
npm run shots -- /catalog /seller/feed   # скриншоты в e2e/screens (W=390 — мобильная ширина, SESSION=e2e/sessions/<роль>.json)
```

Сценарии используют Chromium из Playwright. Бэкенд ограничивает запрос OTP пятью попытками в минуту с одного IP, поэтому между `e2e:seed` и `e2e:flow` выдержите минуту.

## Что не сделано

- Push-уведомления в браузере (Web Push) и PWA-манифест.
- Вход через Google и Apple: на бэкенде его тоже нет.
- Платёжные страницы реальных провайдеров. Сейчас работает тестовая оплата (`PAYMENT_PROVIDER=mock`) и ручная: перевод с подтверждением админом.
