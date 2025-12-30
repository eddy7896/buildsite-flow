# Development Setup with Hot Reloading

This guide explains how to run the application in development mode with automatic hot-reloading, so you don't need to rebuild Docker containers every time you make changes.

## Quick Start

### Development Mode (Hot Reloading)

```bash
# Start all services in development mode
npm run docker:dev

# Or with build (first time or after dependency changes)
npm run docker:dev:build
```

This will:
- ✅ Start PostgreSQL and Redis
- ✅ Start backend with nodemon (auto-restarts on file changes)
- ✅ Start frontend with Vite dev server (hot module replacement)
- ✅ Mount your source code as volumes (changes reflect immediately)

### Access the Application

- **Frontend**: http://localhost:5173 (Vite dev server with HMR)
- **Backend API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## How It Works

### Frontend Hot Reloading
- Vite dev server runs inside Docker container
- Your `src/` folder is mounted as a volume
- Changes to React/TypeScript files trigger instant HMR (Hot Module Replacement)
- No rebuild needed - changes appear in browser immediately

### Backend Hot Reloading
- Nodemon watches for file changes in `src/server/`
- Automatically restarts the Node.js server when you save changes
- Changes to routes, services, middleware, etc. are picked up automatically

## Development Workflow

1. **Start development environment:**
   ```bash
   npm run docker:dev
   ```

2. **Make changes to your code:**
   - Edit files in `src/` (frontend)
   - Edit files in `src/server/` (backend)
   - Save the file

3. **See changes automatically:**
   - Frontend: Browser refreshes automatically (Vite HMR)
   - Backend: Server restarts automatically (nodemon)

4. **No need to:**
   - ❌ Stop containers
   - ❌ Rebuild images
   - ❌ Restart services
   - ✅ Just save and see changes!

## Useful Commands

```bash
# Start development environment
npm run docker:dev

# Start with rebuild (if dependencies changed)
npm run docker:dev:build

# Stop development environment
npm run docker:dev:down

# View logs (all services)
npm run docker:dev:logs

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend

# Restart a specific service
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart backend
```

## Production Mode

For production deployments, use the regular docker-compose.yml:

```bash
# Production mode (builds and serves static files)
npm run docker:prod:build
```

## Troubleshooting

### Changes not reflecting?

1. **Check volume mounts:**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

2. **Check if services are running:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs frontend
   docker-compose -f docker-compose.dev.yml logs backend
   ```

3. **Restart a service:**
   ```bash
   docker-compose -f docker-compose.dev.yml restart frontend
   ```

### Port already in use?

If ports 5173, 3000, 5432, or 6379 are already in use:

1. Stop the conflicting service, or
2. Change ports in `docker-compose.dev.yml`:
   ```yaml
   ports:
     - "5174:5173"  # Change host port
   ```

### Node modules issues?

If you get module errors, rebuild:

```bash
npm run docker:dev:down
npm run docker:dev:build
```

## File Structure

```
.
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration (hot reload)
├── src/
│   ├── server/                 # Backend (mounted in dev mode)
│   └── ...                     # Frontend (mounted in dev mode)
└── package.json                # Scripts for easy commands
```

## Environment Variables

Development environment variables are set in `docker-compose.dev.yml`. You can override them by creating a `.env` file:

```env
POSTGRES_PASSWORD=admin
BACKEND_PORT=3000
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000/api
```

## Performance Tips

1. **Use Docker Desktop's file sharing settings** for better performance on Windows/Mac
2. **Exclude node_modules from volume mounts** (already configured with anonymous volumes)
3. **Use `.dockerignore`** to exclude unnecessary files from context

## Next Steps

- Make changes to your code
- Save files
- See changes instantly! 🎉

No more rebuilding containers! 🚀

