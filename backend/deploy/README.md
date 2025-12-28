# Deployment Guide

## Architecture

```
Vercel                              Hetzner
├── Frontend (React)                └── Backend (Java)
│   games.zitti.ro                      game-api.zitti.ro
│   or secret-hitler.games.zitti.ro     └── Port 4040 (via Caddy)
```

---

## Backend Deployment (Hetzner)

### 1. Build the JAR

On your local machine:

```bash
cd backend
./gradlew build
```

The JAR will be at: `build/libs/secret-hitler.jar`

### 2. Copy to Hetzner

```bash
scp build/libs/secret-hitler.jar user@YOUR_HETZNER_IP:/opt/secret-hitler/
```

### 3. Set up Caddy

Add to your Caddyfile (usually `/etc/caddy/Caddyfile`):

```caddy
game-api.zitti.ro {
    reverse_proxy localhost:4040
}
```

Then reload Caddy:
```bash
sudo systemctl reload caddy
```

### 4. Set up systemd service

```bash
sudo cp secret-hitler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable secret-hitler
sudo systemctl start secret-hitler
```

### 5. Verify

```bash
# Check service status
sudo systemctl status secret-hitler

# Check logs
sudo journalctl -u secret-hitler -f

# Test endpoint
curl https://game-api.zitti.ro/ping
```

---

## Frontend Deployment (Vercel)

### Option A: Standalone Deploy

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   npx vercel --prod
   ```

3. Set up custom domain in Vercel dashboard:
   - `secret-hitler.games.zitti.ro` or subdirectory of `games.zitti.ro`

### Option B: Integrate with Existing Next.js

Copy the built React app into your Next.js public folder or create a route that serves it.

---

## DNS Setup

| Domain | Points To |
|--------|-----------|
| `games.zitti.ro` | Vercel |
| `secret-hitler.games.zitti.ro` | Vercel (alternative) |
| `game-api.zitti.ro` | Hetzner IP |

---

## Environment Variables

### Frontend (Vercel)

Set in Vercel dashboard or `.env.production`:

```
REACT_APP_SERVER_ADDRESS=game-api.zitti.ro
REACT_APP_SERVER_ADDRESS_HTTP=https://game-api.zitti.ro
REACT_APP_WEBSOCKET_HEADER=wss://
```

### Backend (Hetzner)

Set in systemd service or environment:

```
PORT=4040
# DATABASE_URL=postgres://... (optional, see TODO.md)
```

---

## Troubleshooting

### WebSocket connection fails
- Check Caddy is proxying WebSocket correctly
- Verify CORS allows your frontend domain
- Check browser console for specific errors

### CORS errors
- Update `SecretHitlerServer.java` CORS config
- Rebuild and redeploy JAR

### Backend won't start
- Check Java is installed: `java -version`
- Check port 4040 is free: `sudo lsof -i :4040`
- Check logs: `sudo journalctl -u secret-hitler -f`
