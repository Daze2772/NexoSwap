#!/bin/bash

# NexoSwap Cloud Run Deployment Script
# This script helps deploy the application to Google Cloud Run with proper Cloud SQL configuration

set -e

echo "🚀 NexoSwap Cloud Run Deployment Script"
echo "========================================"

# Check if required environment variables are set
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "❌ Error: GOOGLE_CLOUD_PROJECT environment variable is required"
    echo "   Set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    echo "   Set it with: export DATABASE_URL=postgresql://user:password@/dbname?host=/cloudsql/instance-connection-name"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is required"
    echo "   Set it with: export JWT_SECRET=your-very-strong-secret"
    exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
    echo "❌ Error: ADMIN_EMAIL environment variable is required"
    echo "   Set it with: export ADMIN_EMAIL=admin@example.com"
    exit 1
fi

# Extract Cloud SQL instance from DATABASE_URL
CLOUD_SQL_INSTANCE=$(echo "$DATABASE_URL" | grep -o '/cloudsql/[^?]*' | sed 's|/cloudsql/||')
if [ -z "$CLOUD_SQL_INSTANCE" ]; then
    echo "❌ Error: Could not extract Cloud SQL instance from DATABASE_URL"
    echo "   DATABASE_URL should be in format: postgresql://user:password@/dbname?host=/cloudsql/instance-connection-name"
    exit 1
fi

echo "✅ Environment variables validated"
echo "   Project: $GOOGLE_CLOUD_PROJECT"
echo "   Cloud SQL Instance: $CLOUD_SQL_INSTANCE"
echo "   Admin Email: $ADMIN_EMAIL"

# Set default values for optional variables
export FX_SOURCE=${FX_SOURCE:-"mock"}
export SANCTIONS_ENABLED=${SANCTIONS_ENABLED:-"true"}

echo ""
echo "📋 Deployment Configuration:"
echo "   Backend Port: 8080"
echo "   Frontend Port: 80"
echo "   Region: us-central1"
echo "   Min Instances: 0"
echo "   Max Instances: 2"
echo "   Memory: 512Mi"
echo "   CPU: 1"

echo ""
echo "🔧 Starting deployment..."

# Run the deployment
make deploy

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Run database migrations:"
echo "      make migrate-cloud"
echo ""
echo "   2. Seed the database:"
echo "      make seed-cloud"
echo ""
echo "   3. Test the health endpoints:"
echo "      curl https://nexoswap-backend-xxxxx-uc.a.run.app/healthz"
echo "      curl https://nexoswap-backend-xxxxx-uc.a.run.app/readyz"
echo ""
echo "   4. Check the frontend:"
echo "      https://nexoswap-frontend-xxxxx-uc.a.run.app"