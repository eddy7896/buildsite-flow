# Quick Fix - Connect to PostgreSQL Database

## The Problem
Your employee data is being saved to browser localStorage instead of PostgreSQL database.

## Quick Solution (3 steps)

### 1. Install Backend Dependencies
```bash
cd server
npm install express cors pg
```

### 2. Start Backend Server
```bash
cd server
npm start
```
Keep this terminal open.

### 3. Update Environment File
Create/update `.env.local` in project root:
```env
VITE_DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db
VITE_API_URL=http://localhost:3000/api
```

### 4. Restart Frontend
```bash
npm run dev
```

That's it! Now when you add employees, they'll be saved to PostgreSQL instead of localStorage.

## Verify It's Working

1. Check backend terminal - should show "Connected to PostgreSQL database"
2. Add an employee in the UI
3. Check database:
   ```sql
   psql -U postgres -d buildflow_db
   SELECT COUNT(*) FROM profiles;
   ```

If you see data, it's working! 🎉

