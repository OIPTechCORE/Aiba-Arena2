# Commit & push — Production auto-fix

Saved commands for the production auto-fix commit (default backend URL, CORS, getBackendUrl, docs).

## Run the script (PowerShell)

From repo root:

```powershell
.\scripts\commit-and-push-production-autofix.ps1
```

## Or run manually

```powershell
cd c:\Users\SOME\Desktop\Aiba-Arena2

git add admin-panel/src/app/page.js backend/.env.example docs/DEPLOYMENT-AND-ENV.md docs/DEEP-ASSESSMENT.md docs/PRODUCTION-ENV-VERCEL.md miniapp/next.config.js miniapp/src/app/HomeContent.js "miniapp/src/app/api/brokers/[[...path]]/route.js" miniapp/src/app/trainer/page.js miniapp/src/lib/api.js

git commit -m "Production auto-fix: default backend URL and CORS for miniapp/admin" -m "- Miniapp: next.config env defaults (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_BACKEND_URL on Vercel); getBackendUrl() in api.js with fallback for aiba-arena2-miniapp.vercel.app; HomeContent, trainer, broker proxy use it." -m "- Admin: getBackendUrl() with fallback for aiba-arena2-admin-panel.vercel.app." -m "- Backend .env.example: CORS_ORIGIN example for miniapp + admin production URLs." -m "- Docs: PRODUCTION-ENV-VERCEL.md (copy-paste env), DEEP-ASSESSMENT.md (404/508 root cause), DEPLOYMENT-AND-ENV link to production env."

git push origin main
```

## One-line commit message (alternative)

```powershell
git commit -m "Production auto-fix: default backend URL and CORS for miniapp/admin (getBackendUrl, next.config env, CORS example, PRODUCTION-ENV-VERCEL, DEEP-ASSESSMENT)"
```
