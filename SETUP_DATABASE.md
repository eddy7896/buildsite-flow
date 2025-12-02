# Setup PostgreSQL Database Connection

## Problem
Data is being saved to localStorage instead of PostgreSQL database. When you add employees, they're not appearing in the database.

## Solution
I've created a backend API server that connects to PostgreSQL. Follow these steps:

### Step 1: Install Backend Server Dependencies

```bash
cd server
npm install express cors pg
cd ..
```

### Step 2: Update Database Connection

The server will use the database URL from environment variables. Update your `.env.local` file:

```env
VITE_DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db
VITE_API_URL=http://localhost:3000/api
```

**Note:** Change `postgres:admin` to your actual PostgreSQL username and password if different.

### Step 3: Start Backend Server

In a terminal, start the backend server:

```bash
cd server
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
✅ Connected to PostgreSQL database
```

### Step 4: Start Frontend

In another terminal, start the frontend:

```bash
npm run dev
```

### Step 5: Test Connection

1. Open your browser console
2. Check the network tab - you should see API calls to `http://localhost:3000/api/database/query`
3. Add an employee
4. Check the database:
   ```bash
   psql -U postgres -d buildflow_db -c "SELECT COUNT(*) FROM profiles;"
   ```

## Quick Start Commands

```bash
# Terminal 1: Start backend
cd server && npm install && npm start

# Terminal 2: Start frontend  
npm run dev
```

## Verify Database Connection

Test the backend API:
```bash
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

### Backend won't start
- Check if PostgreSQL is running
- Verify database credentials in `.env.local`
- Check if port 3000 is available

### "Cannot connect to database"
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Check database exists: `psql -U postgres -c "\l" | grep buildflow_db`
- Verify username/password in connection string

### Data still going to localStorage
- Make sure backend server is running
- Check browser console for API errors
- Verify `VITE_API_URL` is set correctly

