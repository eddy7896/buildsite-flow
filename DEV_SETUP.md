# Development Setup Guide

## Quick Start (Recommended - Fastest Hot Reload)

This setup runs frontend and backend locally with instant hot reload, while using Docker only for database and Redis.

### Step 1: Start Database & Redis Services
```bash
npm run dev:services
```
This starts only PostgreSQL and Redis in Docker containers.

### Step 2: Start Backend (in a new terminal)
```bash
npm run dev:backend
```
This runs the backend with nodemon hot reload - changes are detected instantly!

### Step 3: Start Frontend (in another terminal)
```bash
npm run dev
```
This runs Vite dev server with instant hot module replacement!

### Stop Services
```bash
npm run dev:services:down
```

---

## Alternative: Full Docker Setup

If you prefer everything in Docker (slower hot reload):

```bash
npm run docker:dev
```

This runs frontend, backend, database, and Redis all in Docker containers.

---

## Benefits of Local Development

✅ **Instant hot reload** - No waiting for Docker rebuilds
✅ **Faster development** - Changes reflect immediately
✅ **Better debugging** - Direct access to logs and breakpoints
✅ **Lower resource usage** - Only database/Redis in Docker

## Requirements

- Node.js 20+ installed locally
- Docker installed (for database/Redis)

## First Time Setup

Install dependencies (one-time setup):

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd src/server
npm install
cd ../..
```

The startup script will automatically check and install dependencies if missing.

## Environment Variables

Make sure you have a `.env` file with:
```
POSTGRES_PASSWORD=admin
BACKEND_PORT=3000
FRONTEND_PORT=5173
```

The backend will automatically connect to `localhost:5432` for PostgreSQL and `localhost:6379` for Redis when running locally.
