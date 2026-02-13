# Automatic Vercel Deployment via GitHub Actions

The `.github/workflows/vercel-deploy.yml` workflow deploys the **miniapp** to Vercel production on every push to `main`.

## Required: Add GitHub Secrets

Add these secrets in your repository:

**GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel project **Settings** → **General** → scroll to "Project ID" (or run `vercel link` locally and check `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | Same as above – your project's ID |

## How it works

1. Push to `main` triggers the workflow
2. Builds the miniapp (`miniapp/`)
3. Deploys to Vercel production via CLI
4. Live at: https://aiba-arena2-miniapp.vercel.app/

## Manual trigger

You can also run it manually: **Actions** → **Deploy to Vercel** → **Run workflow**.
