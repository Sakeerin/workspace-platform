.PHONY: help build up down restart logs clean install dev prod

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Commands
build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v --rmi all

# Development
dev: ## Start development environment (infrastructure only)
	docker-compose -f docker-compose.dev.yml up -d

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

# Production
prod-build: ## Build production images
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

# Database
db-migrate: ## Run database migrations
	docker-compose exec backend npx prisma migrate deploy

db-studio: ## Open Prisma Studio
	docker-compose exec backend npx prisma studio

db-backup: ## Backup database
	docker-compose exec postgres pg_dump -U user workspace_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Setup
install: ## Install dependencies locally
	cd backend && npm install
	cd frontend && npm install

setup: ## Initial setup (copy .env, install deps)
	cp .env.example .env
	$(MAKE) install

# Testing
test-backend: ## Run backend tests
	docker-compose exec backend npm test

test-frontend: ## Run frontend tests
	docker-compose exec frontend npm test

# Utilities
ps: ## Show running containers
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-postgres: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U user -d workspace_db

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

