# 🚀 Clean Start Guide - Development Environment

## Quick Clean Start (Recommended)

### For Windows (PowerShell):
```powershell
npm run docker:dev:clean
```

### For Linux/Mac:
```bash
npm run docker:dev:clean
```

This will:
1. ✅ Stop and remove all containers
2. ✅ Remove volumes (fresh database)
3. ✅ Rebuild images
4. ✅ Start everything fresh

## Manual Clean Start

If you want more control:

### Step 1: Stop Everything
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Step 2: Remove Containers (if they exist)
```bash
docker rm -f buildflow-backend-dev buildflow-frontend-dev buildflow-postgres-dev buildflow-redis-dev
```

### Step 3: Start Fresh
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## What Was Fixed

### 1. **Health Checks**
   - ✅ Changed from `wget` (not available) to Node.js HTTP check
   - ✅ More lenient timing for development
   - ✅ Frontend no longer waits for backend health check

### 2. **Dependencies**
   - ✅ Only installs npm packages if `node_modules` doesn't exist
   - ✅ Faster startup on subsequent runs

### 3. **Service Dependencies**
   - ✅ Frontend starts after backend starts (not waits for health)
   - ✅ Better startup sequence

## After Clean Start

1. **Wait for services to be ready** (about 30-60 seconds)
2. **Check status:**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

3. **View logs:**
   ```bash
   npm run docker:dev:logs
   ```

4. **Access your app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

## Troubleshooting

### If services won't start:

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check for port conflicts:**
   - Port 5173 (frontend)
   - Port 3000 (backend)
   - Port 5432 (PostgreSQL)
   - Port 6379 (Redis)

3. **View specific service logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs backend
   docker-compose -f docker-compose.dev.yml logs frontend
   ```

4. **Restart a specific service:**
   ```bash
   docker-compose -f docker-compose.dev.yml restart backend
   ```

### If database issues persist:

The agency database error is a **data issue**, not a code issue. You need to:
1. Log out of the application
2. Log back in (or create a new agency account)

## Development Workflow

Once everything is running:

1. **Make changes** to your code
2. **Save files**
3. **See changes instantly** - no rebuild needed!

- Frontend: Hot Module Replacement (instant)
- Backend: Nodemon auto-restart (2-3 seconds)

## Commands Reference

```bash
# Start development
npm run docker:dev

# Clean start (recommended first time)
npm run docker:dev:clean

# Stop everything
npm run docker:dev:down

# View logs
npm run docker:dev:logs

# Restart services
npm run docker:dev:restart
```

## Next Steps

After clean start:
1. ✅ Services should all be running
2. ✅ Access frontend at http://localhost:5173
3. ✅ Make code changes and see them instantly
4. ✅ No more rebuild needed!

---

**Note**: The agency database error you're seeing is because your session references an agency that doesn't exist. Just log out and log back in to fix it.

