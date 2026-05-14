.PHONY: up down dev prod logs health ps migrate seed backup

COMPOSE_FILE = docker-compose.yml
COMPOSE_DEV_FILE = compose.dev.yml

# ── Production ──────────────────────────────────────
up:
	docker compose -f $(COMPOSE_FILE) up -d

down:
	docker compose -f $(COMPOSE_FILE) down

prod:
	docker compose -f $(COMPOSE_FILE) up -d --build

# ── Development ─────────────────────────────────────
dev:
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE) up -d --build --profile dev

# ── Utilities ───────────────────────────────────────
logs:
	docker compose -f $(COMPOSE_FILE) logs -f

health:
	./scripts/healthcheck.sh

ps:
	docker compose -f $(COMPOSE_FILE) ps

# ── Database ────────────────────────────────────────
migrate:
	docker compose -f $(COMPOSE_FILE) exec api npx prisma migrate deploy

seed:
	docker compose -f $(COMPOSE_FILE) exec api npx prisma db seed

backup:
	./scripts/backup-db.sh
