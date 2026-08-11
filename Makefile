SHELL := /bin/bash
.DEFAULT_GOAL := help

ENV_FILE ?= .env.production
COMPOSE_FILE ?= compose.production.yml
RELEASE_FILE ?= .release
IMAGE_TAG ?= $(shell if [[ -s "$(RELEASE_FILE)" ]]; then cat "$(RELEASE_FILE)"; else printf local; fi)
SOURCE_COMMIT ?= $(shell git rev-parse --short=12 HEAD 2>/dev/null || printf unknown)
COMPOSE = IMAGE_TAG=$(IMAGE_TAG) SOURCE_COMMIT=$(SOURCE_COMMIT) docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: help install dev check release-check e2e prod-env prod-config prod-build deploy deploy-dry-run deploy-dirty prod-ps prod-logs prod-restart prod-migrate prod-stop prod-down

help:
	@printf '%s\n' \
	  'Development:' \
	  '  make install          Install dependencies' \
	  '  make dev              Start Next.js development server' \
	  '  make check            Run lint, types, unit tests and production build' \
	  '  make release-check    Run check plus end-to-end tests' \
	  '' \
	  'Production:' \
	  '  make prod-env         Create .env.production without overwriting it' \
	  '  make prod-config      Validate production Compose configuration' \
	  '  make prod-build       Build production app and migrator images' \
	  '  make deploy           Backup, migrate, deploy and health-check' \
	  '  make deploy-dry-run   Print the deployment plan' \
	  '  make prod-ps          Show production containers' \
	  '  make prod-logs        Follow app and cleanup logs' \
	  '  make prod-restart     Recreate app and cleanup without rebuilding' \
	  '  make prod-migrate     Run pending Prisma migrations' \
	  '  make prod-stop        Stop services without removing them' \
	  '  make prod-down        Remove containers and networks (keeps volumes)'

install:
	pnpm install --frozen-lockfile

dev:
	pnpm dev

check:
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build

release-check: check e2e

e2e:
	pnpm e2e

prod-env:
	@if [[ -e "$(ENV_FILE)" ]]; then echo "$(ENV_FILE) already exists"; else cp .env.production.example "$(ENV_FILE)" && chmod 600 "$(ENV_FILE)" && echo "Created $(ENV_FILE)"; fi

prod-config:
	@$(COMPOSE) config --quiet
	@echo "Production Compose configuration is valid"

prod-build: prod-config
	$(COMPOSE) build app migrate

deploy:
	ENV_FILE="$(ENV_FILE)" COMPOSE_FILE="$(COMPOSE_FILE)" scripts/deploy-production.sh

deploy-dry-run:
	ENV_FILE="$(ENV_FILE)" COMPOSE_FILE="$(COMPOSE_FILE)" scripts/deploy-production.sh --dry-run --allow-dirty

deploy-dirty:
	ENV_FILE="$(ENV_FILE)" COMPOSE_FILE="$(COMPOSE_FILE)" scripts/deploy-production.sh --allow-dirty

prod-ps:
	$(COMPOSE) ps

prod-logs:
	$(COMPOSE) logs --tail=200 -f app cleanup

prod-restart:
	$(COMPOSE) restart app cleanup

prod-migrate:
	$(COMPOSE) run --rm migrate

prod-stop:
	$(COMPOSE) stop

prod-down:
	$(COMPOSE) down --remove-orphans
