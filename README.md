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

## Production на VPS

Production-конфигурация рассчитана на один Linux VPS с Docker Engine, Docker Compose v2 и Caddy/nginx перед приложением. PostgreSQL доступен только во внутренней Docker-сети, а приложение публикуется на `127.0.0.1:${APP_PORT}`.

### Первый запуск

```bash
git clone git@github.com:Andrii-Skr/lovemailbox.git
cd lovemailbox
make prod-env
```

Заполните `.env.production`:

- `NEXT_PUBLIC_SITE_URL` — публичный HTTPS-адрес без завершающего `/`;
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` — production-ключи Cloudflare Turnstile;
- `POSTGRES_PASSWORD` — URL-safe пароль, например результат `openssl rand -hex 32`;
- `IP_HASH_SECRET` — отдельный секрет, также можно использовать `openssl rand -hex 32`;
- при необходимости измените `APP_PORT`, лимиты памяти и CPU.

Файл создаётся с правами `600`. Production-контейнер намеренно не запускается с тестовыми ключами Cloudflare, паролем `change-me` или placeholder для `IP_HASH_SECRET`.

Проверьте конфигурацию и план деплоя:

```bash
make prod-config
make deploy-dry-run
```

После этого выполните deployment:

```bash
make deploy
```

Deploy-скрипт последовательно:

1. проверяет Compose и чистоту Git worktree;
2. собирает versioned app/migrator images;
3. запускает и дожидается PostgreSQL;
4. сохраняет backup в `backups/`;
5. применяет Prisma migrations;
6. пересоздаёт app и cleanup;
7. ждёт `/api/healthz`, показывает итоговое состояние и сохраняет активный image tag в `.release` для следующих operational-команд.

При осознанном деплое незакоммиченного дерева используйте `make deploy-dirty`. Backup можно отключить прямым вызовом `scripts/deploy-production.sh --skip-backup`, но для обычного production deployment это не рекомендуется.

### Reverse proxy

Направьте Caddy или nginx на `127.0.0.1:3000`. Reverse proxy должен корректно задавать `X-Real-IP`/`X-Forwarded-For`.

Пример Caddy:

```caddy
love.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

PostgreSQL и Next.js image cache хранятся в отдельных Docker volumes. Миграции выполняются одноразовым сервисом `migrate`, а `cleanup` каждый час удаляет просроченные проекты. `make prod-down` не удаляет volumes.

### Обновление и операции

```bash
git pull --ff-only
make release-check
make deploy

make prod-ps
make prod-logs
make prod-restart
make prod-migrate
```

Список всех команд доступен через `make help`.

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

`pnpm e2e` сам собирает и поднимает production-сервер на `127.0.0.1:3107`, поэтому его можно запускать параллельно с обычным `pnpm dev`. Для проверки уже запущенного стенда задайте `E2E_BASE_URL`.
