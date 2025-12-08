# ⚠️ IMPORTANT: Restart Your Backend Server

The `413 Payload Too Large` error is occurring because **your backend server needs to be restarted** to apply the new 50MB payload limit.

## Steps to Fix:

1. **Stop the current server:**
   - Find the terminal/command prompt where your server is running
   - Press `Ctrl + C` to stop it

2. **Start the server again:**
   ```bash
   # If using npm scripts:
   npm run dev
   
   # Or if running directly:
   node server/index.js
   ```

3. **Verify the server started:**
   - You should see: `🚀 Server running on http://localhost:3000`
   - The server will now accept requests up to 50MB

## Why This Is Needed:

The server configuration was updated to allow 50MB payloads (from the default 100KB), but Express.js only reads this configuration when the server starts. The running server is still using the old 100KB limit.

## Additional Optimizations Made:

- ✅ Image compression: Logos are now compressed to max 600x600px at 70% quality
- ✅ Smart logo handling: Only sends logo_url if a new logo was uploaded
- ✅ Size logging: Console will show compressed logo size for debugging

After restarting, try uploading your logo again. The error should be resolved!

