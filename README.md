# Garrison Forge

Build-thread project workshop for 501st members.

## Branches

- `main` – stable / production-ready
- `develop` – active development

Use the helper scripts to work locally and push to `develop`:

### Deploy to `develop`

```bash
./deploy-develop.sh "your commit message here"
```

This will:
- `git add .`
- `git commit`
- `git push origin develop`

## Local development

There are two helper scripts in the repo root:

- `start-local.sh` – starts the local dev server
- `stop-local.sh` – stops the dev server that was started via `start-local.sh`

By default, `start-local.sh` assumes:

- You are in the repo root
- There is a `package.json` here with a script named `dev`, e.g.:

```jsonc
{
  "scripts": {
    "dev": "next dev" // or vite, react-scripts, etc.
  }
}
```

If you put the actual app in a subfolder (for example `frontend/`), edit `APP_DIR` at the top of `start-local.sh` to point there.

## Next steps

1. Initialize your app (e.g. Next.js, Vite, or similar) in this repo or a subfolder.
2. Make sure `npm run dev` works from the directory you choose.
3. Use:
   - `./start-local.sh` to boot the dev server
   - `./stop-local.sh` to stop it
   - `./deploy-develop.sh "message"` to push changes to GitHub `develop`.
