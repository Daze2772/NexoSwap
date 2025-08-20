## Makefile for building, testing and deploying NexoSwap

PROJECT_NAME=nexoswap
REGION=us-central1

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  backend/dev      - Start backend in dev mode (requires local Postgres)"
	@echo "  backend/migrate  - Run database migrations"
	@echo "  backend/seed     - Seed the database"
	@echo "  backend/test     - Run backend unit tests"
	@echo "  backend/build    - Build backend Docker image"
	@echo "  frontend/dev     - Start frontend dev server"
	@echo "  frontend/build   - Build frontend for production"
	@echo "  deploy           - Deploy both services to Cloud Run"
	@echo "  migrate-cloud    - Run migrations on Cloud SQL instance"

## Backend targets
backend/dev:
	cd backend && npm install && npm run dev

backend/migrate:
	cd backend && npm install && npx knex migrate:latest

backend/seed:
	cd backend && npm install && npx knex seed:run

backend/test:
	cd backend && npm install && npm test

backend/build:
	docker build -t $$USER/$(PROJECT_NAME)-backend ./backend

## Frontend targets
frontend/dev:
	cd frontend && npm install && npm run dev

frontend/build:
	cd frontend && npm install && npm run build

## Deploy to Google Cloud Run (requires gcloud CLI configured)
deploy:
	# Build and push backend
	docker build -t gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-backend ./backend
	docker push gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-backend
	# Build and push frontend
	docker build -t gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-frontend ./frontend
	docker push gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-frontend
	# Deploy backend
	gcloud run deploy $(PROJECT_NAME)-backend \
	  --region $(REGION) \
	  --image gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-backend \
	  --platform managed \
	  --allow-unauthenticated \
	  --set-env-vars DATABASE_URL=$$DATABASE_URL,JWT_SECRET=$$JWT_SECRET,ADMIN_EMAIL=$$ADMIN_EMAIL,PROVIDER_KEYS_*=$$PROVIDER_KEYS_*,FX_SOURCE=$$FX_SOURCE,SANCTIONS_ENABLED=$$SANCTIONS_ENABLED \
	  --min-instances=0 --max-instances=2 --memory=512Mi --cpu=1 --port=8080 \
	  --add-cloudsql-instances=$$CLOUD_SQL_INSTANCE
	# Deploy frontend
	gcloud run deploy $(PROJECT_NAME)-frontend \
	  --region $(REGION) \
	  --image gcr.io/$$GOOGLE_CLOUD_PROJECT/$(PROJECT_NAME)-frontend \
	  --platform managed \
	  --allow-unauthenticated \
	  --min-instances=0 --max-instances=2 --memory=512Mi --cpu=1 --port=8080

## Run migrations on Cloud SQL instance
migrate-cloud:
	@echo "Running migrations on Cloud SQL instance..."
	@echo "Make sure you have the Cloud SQL Auth proxy running or are connected via gcloud"
	cd backend && npm install && DATABASE_URL=$$DATABASE_URL npx knex migrate:latest

## Seed Cloud SQL instance
seed-cloud:
	@echo "Seeding Cloud SQL instance..."
	@echo "Make sure you have the Cloud SQL Auth proxy running or are connected via gcloud"
	cd backend && npm install && DATABASE_URL=$$DATABASE_URL npx knex seed:run