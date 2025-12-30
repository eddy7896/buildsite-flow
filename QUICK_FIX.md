# ⚡ Quick Fix - Clean Start

## Run This Command (PowerShell):

```powershell
npm run docker:dev:clean
```

This will:
1. Stop all containers
2. Remove volumes (fresh start)
3. Rebuild everything
4. Start services

## Then Wait 60 seconds

Services need time to:
- Install dependencies
- Start databases
- Initialize everything

## Check Status:

```powershell
docker-compose -f docker-compose.dev.yml ps
```

All services should show "healthy" or "running" status.

## Access Your App:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api

## If Still Having Issues:

1. **Check logs:**
   ```powershell
   npm run docker:dev:logs
   ```

2. **Restart specific service:**
   ```powershell
   docker-compose -f docker-compose.dev.yml restart backend
   ```

3. **Full cleanup and restart:**
   ```powershell
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up --build
   ```

---

**Note**: The agency database error is normal if you're logged in with an old session. Just log out and log back in.

