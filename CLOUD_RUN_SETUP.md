# Cloud Run Deployment Guide

This guide explains how to deploy the NexoSwap application to Google Cloud Run with Cloud SQL PostgreSQL.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Cloud SQL Admin API** enabled
4. **Cloud Run API** enabled
5. **Artifact Registry API** enabled

## Setup Steps

### 1. Create Cloud SQL Instance

```bash
# Create a PostgreSQL instance
gcloud sql instances create nexoswap-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=your-root-password \
  --storage-type=SSD \
  --storage-size=10GB

# Create a database
gcloud sql databases create nexoswap --instance=nexoswap-db

# Create a user
gcloud sql users create nexoswap-user \
  --instance=nexoswap-db \
  --password=your-user-password
```

### 2. Get Instance Connection Name

```bash
# Get the instance connection name
gcloud sql instances describe nexoswap-db --format="value(connectionName)"
```

This will return something like: `your-project:us-central1:nexoswap-db`

### 3. Set Environment Variables

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export DATABASE_URL="postgresql://nexoswap-user:your-user-password@/nexoswap?host=/cloudsql/your-project:us-central1:nexoswap-db"
export JWT_SECRET="your-very-strong-secret-key-here"
export ADMIN_EMAIL="admin@yourdomain.com"
export FX_SOURCE="mock"
export SANCTIONS_ENABLED="true"
```

### 4. Deploy the Application

```bash
# Use the deployment script
./deploy.sh

# Or manually run make deploy
make deploy
```

### 5. Run Database Migrations

```bash
# Run migrations on Cloud SQL
make migrate-cloud

# Seed the database
make seed-cloud
```

### 6. Test the Deployment

```bash
# Get your service URLs
gcloud run services list --region=us-central1

# Test health endpoints
curl https://nexoswap-backend-xxxxx-uc.a.run.app/healthz
curl https://nexoswap-backend-xxxxx-uc.a.run.app/readyz
```

## Troubleshooting

### Common Issues

1. **Database Connection Refused (ECONNREFUSED 127.0.0.1:5432)**
   - Ensure `DATABASE_URL` uses the Cloud SQL Unix socket format
   - Check that the Cloud SQL instance is running
   - Verify the service account has `Cloud SQL Client` role

2. **Trust Proxy Errors**
   - The application now uses `app.set("trust proxy", true)` for Cloud Run
   - This should resolve X-Forwarded-* header issues

3. **Port Issues**
   - Backend now listens on port 8080 (Cloud Run standard)
   - Frontend listens on port 80

4. **Migration Issues**
   - Ensure you run migrations after deployment
   - Check that the database user has proper permissions

### Debugging Commands

```bash
# Check Cloud Run logs
gcloud logs read --service=nexoswap-backend --limit=50

# Check Cloud SQL logs
gcloud sql logs tail --instance=nexoswap-db

# Test database connection locally (requires Cloud SQL Auth proxy)
cloud_sql_proxy -instances=your-project:us-central1:nexoswap-db=tcp:5432
```

## Security Considerations

1. **Service Account Permissions**
   - Ensure the Cloud Run service account has minimal required permissions
   - Grant `Cloud SQL Client` role specifically

2. **Database Security**
   - Use strong passwords for database users
   - Enable SSL connections
   - Restrict network access to Cloud SQL

3. **Environment Variables**
   - Never commit secrets to version control
   - Use Google Secret Manager for production secrets
   - Rotate JWT secrets regularly

## Monitoring

The application includes health endpoints for monitoring:

- `/healthz` - Basic health check
- `/readyz` - Readiness check (includes database connectivity and migration status)

## Cost Optimization

- Use `db-f1-micro` tier for development
- Set `min-instances=0` to scale to zero
- Monitor usage with Cloud Console
- Consider using Cloud SQL Proxy for local development