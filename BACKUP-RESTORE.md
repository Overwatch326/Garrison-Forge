# Garrison Forge – Backup & Restore Guide

This app has a built-in **backup** and a guarded **restore** path.

Backups are safe to use from the UI. Restores are intentionally *not* in the UI to avoid overwriting member data by accident.

---

## 1. Creating a Backup

**From the web app:**

1. Login to the app.
2. Go to **Settings → Data Backup / Export**.
3. Click **Download Backup**.
4. Save the JSON file somewhere safe, e.g.:

   ```text
garrison-forge-backup-2026-05-25T04-12-33Z.json
   ```

The file contains:

- `users`
- `garrisons`
- `memberships`
- `projects`, `phases`, `components`, `tasks`, `vendorResources`, `taskImages`
- `events`, `eventSignups`
- `userCostumes`
- `version`, `generatedAt`

You can make backups before doing large role/membership/event updates.

---

## 2. Restoring from a Backup

**Restore is backend-only and guarded.** You must:

- Explicitly enable it via an environment variable.
- Restore into an **empty** database.
- Call the endpoint manually (curl/Postman).

### 2.1. Point the backend at the target database

In Railway:

1. Open the **backend service** (the one with `Root Directory: backend`).
2. Ensure `DATABASE_URL` is set to the Postgres you want to restore into, e.g.:

   ```env
   DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
   ```

Recommended: use a **new Postgres** service for restores so the DB starts empty.

### 2.2. Temporarily enable restore

Still on the backend service in Railway:

1. Go to **Variables**.
2. Add:

   ```env
   ALLOW_RESTORE=true
   ```

3. Save and **redeploy** the backend.

Without this, `POST /admin/restore` will respond with `Restore is disabled`.

### 2.3. Ensure the database is empty

The restore route **refuses to run** if there is existing data.

It checks counts for these tables:

- `User`, `Garrison`, `Membership`
- `Project`, `Phase`, `Component`, `Task`, `VendorResource`, `TaskImage`
- `Event`, `EventSignup`, `UserCostume`

If any count is non-zero, it returns:

```json
{"statusCode":400,"message":"Database is not empty; refusing to restore."}
```

For a new Postgres DB, this is fine. For an existing DB, you must explicitly drop/truncate tables first if you really want to overwrite it.

### 2.4. Call the restore endpoint with your backup file

Assuming you have a backup file like:

```text
garrison-forge-backup-2026-05-25T04-12-33Z.json
```

Run from your local machine:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data-binary @garrison-forge-backup-2026-05-25T04-12-33Z.json \
  https://<your-backend-domain>/admin/restore
```

Example:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data-binary @garrison-forge-backup-2026-05-25T04-12-33Z.json \
  https://backend-production-11c9.up.railway.app/admin/restore
```

If restore succeeds, the response will be:

```json
{"restored": true}
```

If not, you might see:

- `Restore is disabled` → `ALLOW_RESTORE` is not `true` or backend not redeployed.
- `Database is not empty; refusing to restore.` → target DB has existing data.
- A Prisma error → backup/schema mismatch (check backend logs for details).

### 2.5. Disable restore again

To avoid accidents, **turn restore off** as soon as you’re done:

1. Backend service → **Variables**.
2. Remove `ALLOW_RESTORE` or set:

   ```env
   ALLOW_RESTORE=false
   ```

3. Redeploy the backend.

After this, `POST /admin/restore` will reject all attempts again.

---

## 3. Safety Model

- **Backups**:
  - Triggered from the Settings UI.
  - Only ever *read* data.
  - Do not modify the database.

- **Restores**:
  - Only possible via `/admin/restore` on the backend.
  - Require `ALLOW_RESTORE=true`.
  - Refuse to run unless the DB is empty.
  - Not exposed in the web UI.

This design lets you:

- Take backups easily before doing big changes.
- Restore from a backup into a clean database if something catastrophic happens.
- Avoid accidentally overwriting member data from the Settings screen.
