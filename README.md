# Love Mailbox

Интерактивная романтическая открытка: автор наполняет американский roadside mailbox письмами, а получатель открывает их по одному встряхиванием телефона или нажатием на ящик.

## Локальный запуск

Нужны Node.js 20.9+, pnpm и PostgreSQL.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:deploy
pnpm dev
```

Откройте `http://localhost:3000/create`. Для локальной разработки без Turnstile можно установить `DISABLE_PUBLISH_PROTECTION=true`; эта возможность работает только вне production.

Безопасное read-only превью доступно на `/demo?lang=uk|ru|en`. Оно использует только встроенные письма, не обращается к PostgreSQL/API и не сохраняет прогресс. Для локальной витрины запустите приложение на порту 3411:

```bash
pnpm dev --hostname 127.0.0.1 --port 3411
```

## VPS

1. Скопируйте `.env.example` в `.env` и задайте сильные `POSTGRES_PASSWORD` и `IP_HASH_SECRET`.
2. Укажите HTTPS-адрес в `NEXT_PUBLIC_SITE_URL`.
3. Создайте Cloudflare Turnstile widget для своего домена и замените site/secret keys.
4. Запустите `docker compose up -d --build`.
5. Направьте Caddy или nginx на `127.0.0.1:3000`. Reverse proxy должен корректно задавать `X-Real-IP`/`X-Forwarded-For`.

Пример Caddy:

```caddy
love.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

PostgreSQL хранится в Docker volume. Миграции выполняются одноразовым сервисом `migrate`, а `cleanup` каждый час удаляет проекты старше семи дней.

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```
