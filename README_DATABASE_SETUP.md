# Database Setup Guide

## Quick Start

### 1. Create Database

Make sure PostgreSQL is running and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE buildflow_db;

# Exit psql
\q
```

### 2. Run Migrations

Run the core schema migrations:

```bash
# Run core auth schema
psql -U postgres -d buildflow_db -f supabase/migrations/00_core_auth_schema.sql

# Run business tables
psql -U postgres -d buildflow_db -f supabase/migrations/01_phase2_business_tables.sql
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db
VITE_API_URL=http://localhost:3000/api
```

**Note:** Update the username and password if your PostgreSQL setup is different.

### 4. Seed Database

Run the seed script to populate initial data:

```bash
npm run seed:db
```

Or manually:

```bash
psql -U postgres -d buildflow_db -f seed_initial_data.sql
```

### 5. Start Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3000`

### 6. Start Frontend

```bash
npm install
npm run dev
```

## Database Credentials

- **Database Name:** `buildflow_db`
- **Username:** `postgres` (default)
- **Password:** `admin`
- **Host:** `localhost`
- **Port:** `5432`

## Verification

Test the database connection:

```bash
# Test backend API
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

## Troubleshooting

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Check database exists:
   ```bash
   psql -U postgres -l | grep buildflow_db
   ```

3. Verify credentials in `.env` file

### Seed Script Fails

1. Make sure migrations have been run first
2. Check that `seed_initial_data.sql` exists
3. Verify database connection string is correct

### Backend Won't Start

1. Check if port 3000 is available
2. Verify database connection string
3. Check server logs for errors

## Important Notes

- **No Local Storage:** All data is stored in PostgreSQL database
- **No Supabase:** All Supabase dependencies have been removed
- **HTTP API:** Frontend communicates with backend via HTTP API calls
- **Environment Variables:** Always use `.env` file for configuration

