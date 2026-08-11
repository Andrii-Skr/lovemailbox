#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_ROOT/compose.production.yml}"
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DRY_RUN=0
CHECK_ONLY=0
SKIP_BACKUP=0
ALLOW_DIRTY=0
IMAGE_TAG_OVERRIDE=""

usage() {
  cat <<'EOF'
Usage: scripts/deploy-production.sh [options]

Options:
  --env-file PATH   Production environment file (default: .env.production)
  --tag TAG         Docker image tag (default: timestamp-gitsha)
  --check           Validate requirements and Compose configuration only
  --dry-run         Print deployment commands without changing containers
  --skip-backup     Do not create a PostgreSQL backup before migrations
  --allow-dirty     Allow deploying an uncommitted working tree
  -h, --help        Show this help
EOF
}

fail() {
  printf '[deploy] error: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '[deploy] %s\n' "$*"
}

print_command() {
  printf '+'
  printf ' %q' "$@"
  printf '\n'
}

run() {
  print_command "$@"
  if (( DRY_RUN == 0 )); then "$@"; fi
}

while (( $# > 0 )); do
  case "$1" in
    --env-file)
      (( $# >= 2 )) || fail "--env-file requires a path"
      ENV_FILE="$2"
      shift 2
      ;;
    --tag)
      (( $# >= 2 )) || fail "--tag requires a value"
      IMAGE_TAG_OVERRIDE="$2"
      shift 2
      ;;
    --check) CHECK_ONLY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --skip-backup) SKIP_BACKUP=1; shift ;;
    --allow-dirty) ALLOW_DIRTY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "unknown option: $1" ;;
  esac
done

if [[ "$ENV_FILE" != /* ]]; then ENV_FILE="$PROJECT_ROOT/$ENV_FILE"; fi
if [[ "$COMPOSE_FILE" != /* ]]; then COMPOSE_FILE="$PROJECT_ROOT/$COMPOSE_FILE"; fi

command -v docker >/dev/null 2>&1 || fail "docker is not installed"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is unavailable"
[[ -f "$ENV_FILE" ]] || fail "environment file not found: $ENV_FILE (copy .env.production.example first)"
[[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found: $COMPOSE_FILE"

SOURCE_COMMIT="$(git -C "$PROJECT_ROOT" rev-parse --short=12 HEAD 2>/dev/null || printf 'unknown')"
if [[ -n "$IMAGE_TAG_OVERRIDE" ]]; then
  IMAGE_TAG="$IMAGE_TAG_OVERRIDE"
else
  IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$SOURCE_COMMIT"
fi
[[ "$IMAGE_TAG" =~ ^[A-Za-z0-9_.-]+$ ]] || fail "image tag contains unsupported characters: $IMAGE_TAG"
export IMAGE_TAG SOURCE_COMMIT

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

log "validating Compose configuration"
"${COMPOSE[@]}" config --quiet

if (( CHECK_ONLY == 1 )); then
  log "configuration is valid"
  exit 0
fi

if (( ALLOW_DIRTY == 0 )) && [[ -n "$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null)" ]]; then
  fail "working tree is not clean; commit the release or pass --allow-dirty"
fi

if (( DRY_RUN == 1 )); then
  log "dry run for image tag $IMAGE_TAG"
else
  LOCK_DIR="$PROJECT_ROOT/.deploy.lock"
  mkdir "$LOCK_DIR" 2>/dev/null || fail "another deployment may be running ($LOCK_DIR exists)"
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
  log "deploying image tag $IMAGE_TAG"
fi

cd "$PROJECT_ROOT"
run "${COMPOSE[@]}" build --pull app migrate
run "${COMPOSE[@]}" up -d --wait --wait-timeout 120 db

if (( SKIP_BACKUP == 0 )); then
  BACKUP_FILE="$BACKUP_DIR/lovemailbox-$(date -u +%Y%m%d%H%M%S)-pre-$IMAGE_TAG.dump"
  if (( DRY_RUN == 1 )); then
    print_command mkdir -p "$BACKUP_DIR"
    printf '+ docker compose exec db pg_dump > %q\n' "$BACKUP_FILE"
  else
    mkdir -p "$BACKUP_DIR"
    log "creating database backup: $BACKUP_FILE"
    "${COMPOSE[@]}" exec -T db sh -ec 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$BACKUP_FILE"
    [[ -s "$BACKUP_FILE" ]] || fail "database backup is empty"
  fi
fi

run "${COMPOSE[@]}" run --rm migrate
run "${COMPOSE[@]}" up -d --no-deps app cleanup

if (( DRY_RUN == 1 )); then
  printf '+ wait for app health at http://127.0.0.1:3000/api/healthz\n'
else
  log "waiting for application health"
  healthy=0
  for _attempt in {1..40}; do
    if "${COMPOSE[@]}" exec -T app wget -q -O /dev/null http://127.0.0.1:3000/api/healthz 2>/dev/null; then
      healthy=1
      break
    fi
    sleep 3
  done
  if (( healthy == 0 )); then
    "${COMPOSE[@]}" logs --no-color --tail=120 app >&2 || true
    fail "application did not become healthy within 120 seconds"
  fi
fi

run "${COMPOSE[@]}" ps
if (( DRY_RUN == 0 )); then printf '%s\n' "$IMAGE_TAG" > "$PROJECT_ROOT/.release"; fi
log "deployment completed: $IMAGE_TAG"
