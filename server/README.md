# BuildFlow API Server

Backend API server that connects the frontend to PostgreSQL database.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Set environment variables:

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/buildflow_db
PORT=3000
```

Or create a `.env` file in the server directory.

### 3. Start Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Database Query
```
POST /api/database/query
Content-Type: application/json

{
  "sql": "SELECT * FROM users WHERE id = $1",
  "params": ["user-id-123"]
}
```

Returns:
```json
{
  "rows": [...],
  "rowCount": 1
}
```

## Database Connection

The server connects to PostgreSQL using the connection string from:
1. `DATABASE_URL` environment variable
2. `VITE_DATABASE_URL` environment variable  
3. Default: `postgresql://postgres:admin@localhost:5432/buildflow_db`

Make sure your PostgreSQL database is running and accessible!

