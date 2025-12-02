# Database Connection Fix

## Problem
Data is being stored in localStorage instead of PostgreSQL database. When you add employees, they're saved in browser storage, not in the database.

## Solution
I've created a backend API server that connects to PostgreSQL. You need to:

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 2: Update Environment Variables

Update `.env.local` file with correct database credentials:

```env
VITE_DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db
VITE_API_URL=http://localhost:3000/api
```

### Step 3: Start Backend Server

```bash
cd server
npm start
```

The server will run on http://localhost:3000

### Step 4: Update PostgreSQL Client

The client will automatically use HTTP API calls when the backend is running.

### Step 5: Test Connection

1. Start the backend: `cd server && npm start`
2. Check health: http://localhost:3000/health
3. Start frontend: `npm run dev`
4. Add an employee and check the database

## Quick Fix Commands

```bash
# Install backend dependencies
cd server && npm install && cd ..

# Update .env.local with correct database URL
# DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db

# Start backend server (in one terminal)
cd server && npm start

# Start frontend (in another terminal)
npm run dev
```

## Verification

After starting the backend, you should see:
- ✅ "Connected to PostgreSQL database" message
- Health check returns `{ status: 'ok', database: 'connected' }`

Now when you add employees, they'll be saved to PostgreSQL instead of localStorage!

