# NexoSwap

NexoSwap is a minimalistic proof‑of‑concept platform that allows a private group of users to exchange crypto assets for fiat payment methods.  It is built as a modern single‑page application with a RESTful API backend and supports multiple currencies and manual fiat settlement flows.  The platform includes an admin panel for operational oversight and compliance tooling.

## Architecture

The application is split into two services:

| Service   | Stack | Description |
|-----------|------|-------------|
| **Backend** | Node.js (Express), PostgreSQL, JWT | Exposes REST APIs for authentication, trading, compliance and admin operations. Implements deterministic fee calculation, trade state machine, refresh‑token rotation and role‑based access control. Passwords are hashed with Argon2 as recommended by security experts【559492474780305†L52-L79】. The fee calculator rounds fees to two decimal places using a half‑up strategy according to ISO‑4217 guidelines【632415089052039†L154-L160】. Rate‑limiting middleware is enabled to mitigate abuse【289408064660264†L57-L72】. |
| **Frontend** | React, TailwindCSS, React Router, shadcn/ui | A responsive single‑page interface for users and admins. Implements registration, login, trade creation and file upload flows. The UI leverages shadcn components, which are designed to be accessible and customizable【138378876939271†L16-L19】. |

Infrastructure is containerised with Docker and deployed to [Google Cloud Run](https://cloud.google.com/run). Data is stored in a Cloud SQL for PostgreSQL instance accessed securely via the Cloud SQL connector【997390149165618†L52-L66】.

## Features

- **Multi‑currency trading:** BTC, ETH, USDT and USDC are supported with a pluggable crypto adapter pattern.
- **Fiat settlement methods:** PayPal, Zelle, Venmo and Wise. For manual methods (Zelle, Venmo, Wise) users upload payment proof; admins confirm receipt and complete the trade. Amounts above \$500 require a one‑time passcode (placeholder implementation).
- **Deterministic fees:** A flat 5 % fee applies below \$200; 2.5 % above. Fees are computed server‑side and rounded half‑up to two decimals【632415089052039†L110-L134】.
- **Compliance:** Users accumulate lifetime trading volume; KYC/ID verification is required beyond \$1 000 using a pluggable adapter. A sanction/PEP screening toggle is enabled by default. Each trade transition writes to an immutable audit log.
- **Authentication:** Email/password sign‑up with Argon2id hashing【559492474780305†L52-L79】. JWT access tokens (15 min) and rotating refresh tokens (7 days) provide stateless sessions; refresh tokens are stored hashed and revoked on use.
- **Admin panel:** List users, trades, filter by state, mark fiat received (with 2FA), and export data. Includes health endpoints (`/healthz` and `/readyz`), audit logs and simple observability via structured logging.
- **Security:** Helmet, CORS allowlist, rate‑limiting (100 requests/15 min), input validation, strong password policy, and environment‑based configuration. Sensitive secrets are never committed; sample `.env` files are provided.

## Getting Started (Local)

1. **Clone the repository** and install dependencies.

   ```bash
   git clone <this‑repo>
   cd nexoswap
   
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Provision PostgreSQL.**  You can run Postgres locally via Docker:

   ```bash
   docker run -p 5432:5432 --name nexoswap-db -e POSTGRES_DB=nexoswap -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -d postgres:16
   ```

   Update `backend/.env` to point at your local database (see `.env.example`).

3. **Run migrations and seeds.**

   ```bash
   cd backend
   npm install
   npx knex migrate:latest
   npx knex seed:run
   ```

   This creates the database schema and seeds an admin user and fee rules.

4. **Start the services.**  In separate terminals run:

   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm run dev
   ```

   By default the backend runs on `http://localhost:8000` and the frontend on `http://localhost:3000`.

5. **Login to admin panel.**  Use the credentials specified in `.env` (default `admin@example.com` / `adminPass123!`). The admin interface is available at `/admin` in the frontend app.

## Cloud Run Deployment

The `Makefile` contains a `deploy` target that builds Docker images, pushes them to Google Artifact Registry and deploys to Cloud Run.  Before running it you must:

1. **Create a Cloud SQL (PostgreSQL) instance** and database.  Enable the Cloud SQL Admin API and grant the service account `Cloud SQL Client` and `Cloud SQL Instance User` roles【997390149165618†L52-L66】.  Note the instance connection name (e.g. `project:region:instance`).
2. **Enable Google Cloud Run** in your project and ensure you have billing enabled.  Authenticate with `gcloud init` and set your project with `gcloud config set project <your‑project>`.
3. **Configure environment variables** in the deployment command. Required envs:
   - `DATABASE_URL` (Cloud SQL socket format)
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `SANCTIONS_ENABLED` (e.g., `true`)
   
   Example `DATABASE_URL`:
   `postgresql://appuser:HEXPASS@/nexoswap?host=/cloudsql/PROJECT:REGION:nexoswap-pg`
   
   Use a URL‑safe (hex) DB password, or URL‑encode special characters.

Deploy both services with one command:

```bash
export GOOGLE_CLOUD_PROJECT=<your‑project>
export DATABASE_URL=postgresql://<user>:<password>@/<db>?host=/cloudsql/<instance-connection>
export JWT_SECRET=<very‑strong‑secret>
export ADMIN_EMAIL=<admin-email>
export SANCTIONS_ENABLED=true

make deploy
```

The deploy script builds images, pushes them to `gcr.io/<project>`, and calls `gcloud run deploy` with appropriate parameters. Adjust the region via the `REGION` variable in `Makefile`.

### Frontend build-time API base

The frontend reads `VITE_API_BASE` at build time. When building the image via Cloud Build, pass `_VITE_API_BASE` and forward it as a build arg:

```bash
gcloud builds submit --config frontend/cloudbuild.yaml --substitutions _IMAGE=gcr.io/$GOOGLE_CLOUD_PROJECT/nexoswap-frontend,_VITE_API_BASE=$API_BASE_URL
```

Alternatively, locally:

```bash
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/nexoswap-frontend frontend \
  --build-arg VITE_API_BASE=$API_BASE_URL
```

### Cloud Run Jobs for migrations and seed

Ensure migrations and seeds run non‑interactively and exit non‑zero on failure:

```bash
gcloud run jobs create nexoswap-migrate --image gcr.io/$GOOGLE_CLOUD_PROJECT/nexoswap-backend \
  --region $REGION \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --command "npx",--args "knex,migrate:latest"

gcloud run jobs create nexoswap-seed --image gcr.io/$GOOGLE_CLOUD_PROJECT/nexoswap-backend \
  --region $REGION \
  --set-env-vars DATABASE_URL=$DATABASE_URL,ADMIN_EMAIL=$ADMIN_EMAIL \
  --command "npx",--args "knex,seed:run"

gcloud run jobs execute nexoswap-migrate --region $REGION
gcloud run jobs execute nexoswap-seed --region $REGION
```

### Verifying health

```bash
curl $API_URL/healthz
curl $API_URL/readyz
```

## Decisions & Assumptions

- **Database migrations & seeds:**  Schema and seed data are defined via Knex.  Fee rules are seeded separately from the migration to avoid requiring the `pgcrypto` extension for UUID generation.
- **Refresh token rotation:**  Refresh tokens are random UUIDs stored hashed (Argon2).  Upon refresh the previous token is revoked and a new one issued.  In a production environment you would embed the token’s ID (jti) into the JWT payload for O(1) lookup; for simplicity we iterate over active tokens.
- **2FA for high‑value transactions:**  Amounts over \$500 prompt the admin API to check for an `otp` field.  Integrating a real 2FA provider is deferred to future iterations.
- **FX rates:**  A mock FX adapter returns static USD values.  The architecture allows swapping in a real provider via dependency injection.
- **ID verification & sanctions screening:**  The code defines the tables and hooks but integrates only a `MockIDV` adapter.  Production deployment should implement the `IDVAdapter` and `SanctionsAdapter` interfaces.
- **Frontend scope:**  The frontend implements basic flows (login, register, create trade, upload proof, admin list).  UI polish, advanced state management and full mobile responsiveness are outside the MVP scope (reasoning effort low).

## Testing

Run unit tests with:

```bash
cd backend
npm test
```

Tests cover fee calculation logic with the examples provided and Argon2 password verification.  End‑to‑end tests and database‑dependent unit tests should be added as the project evolves.

---

This project demonstrates how to bootstrap a compliant P2P trading application with an extensible architecture, clear separation of concerns and automated deployment.  The use of Argon2 for password hashing, JWT tokens with refresh rotation and rate‑limiting middleware align with modern security best practices【559492474780305†L52-L79】【289408064660264†L57-L72】.