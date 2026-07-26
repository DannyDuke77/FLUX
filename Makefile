.PHONY: dev down devup superuser

# Start dev environment
dev:
	docker compose -f docker-compose.dev.yml up --build -d

# Start dev environment in detached mode
devup:
	docker compose -f docker-compose.dev.yml up -d

# Stop both environments
down:
	docker compose -f docker-compose.dev.yml down

# Create superuser in dev environment
superuser:
	docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser