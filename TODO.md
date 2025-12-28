# TODO

## Database Backup Feature

The backend has PostgreSQL backup functionality that persists game lobbies across server restarts. This is currently disabled.

**To enable:**

1. Set up PostgreSQL on Hetzner:
   ```bash
   sudo apt install postgresql
   sudo -u postgres createdb secrethitler
   sudo -u postgres createuser secrethitler_user -P
   ```

2. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL=postgres://secrethitler_user:PASSWORD@localhost:5432/secrethitler
   ```

3. Update the systemd service file to include the DATABASE_URL

**Files involved:**
- `backend/src/main/java/server/SecretHitlerServer.java` - Database connection logic (lines 207-354)
- `backend/src/main/java/server/ApplicationConfig.java` - DATABASE_URI config

---

## Future Features

- [ ] Theming system (see docs/plans/2025-12-27-secret-hitler-adaptation-design.md Phase 4)
- [ ] Timer option for discussion round
- [ ] Spectator mode
- [ ] Game history/replay
