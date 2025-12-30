# 🚀 Quick Start - Development Mode

## One Command to Start Everything

```bash
npm run docker:dev
```

That's it! Your app is now running with **hot-reloading enabled**.

## What This Does

✅ Starts all services (PostgreSQL, Redis, Backend, Frontend)  
✅ Mounts your source code as volumes  
✅ Enables hot-reloading - **changes appear instantly!**  
✅ No rebuild needed when you edit files  

## Access Your App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## Workflow

1. Run `npm run docker:dev`
2. Edit your code in `src/` or `src/server/`
3. Save the file
4. **See changes immediately** - no rebuild needed!

## Stop Everything

```bash
npm run docker:dev:down
```

## View Logs

```bash
npm run docker:dev:logs
```

## Need More Help?

See `DEV_SETUP.md` for detailed documentation.

---

**Before**: Stop → Build → Start → Wait → See changes 😫  
**Now**: Save → See changes instantly! 🎉

