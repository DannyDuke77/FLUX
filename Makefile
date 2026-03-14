.PHONY: dev prod down devup superuser

# Start dev environment
dev:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up --build -d

# Start dev environment in detached mode
devup:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

# Start prod environment
prod:
	docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d

# Stop both environments
down:
	docker compose --env-file .env.dev -f docker-compose.dev.yml down
	docker compose --env-file .env.prod -f docker-compose.prod.yml down

# Create a superuser (choose ENV=dev or ENV=prod, defaults to dev)
superuser:
ifndef ENV
	$(error ENV is not set. Usage: make superuser ENV=dev|prod)
endif
ifeq ($(ENV),dev)
	docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend python manage.py createsuperuser
endif
ifeq ($(ENV),prod)
	docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python manage.py createsuperuser
endif