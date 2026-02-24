# Vercel Auto-Deploy Setup Guide

**Goal:** Configure automatic deployments so every push to `main` triggers Vercel deployments.

---

## Option 1: Vercel Git Integration (Recommended)

**Best for:** All three projects (backend, miniapp, admin). Simplest setup.

### Setup Steps

#### 1.1 Backend Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **backend** project (or create new)
3. **Settings** → **Git**
4. If not connected:
    - Click **Connect Git Repository**
    - Select **GitHub** → **OIPTechCORE/Aiba-Arena2**
    - Authorize if needed
5. **Production Branch:** Set to `main`
6. **Root Directory:** Set to `backend`
7. **Auto-deploy:** Ensure it's **enabled** (default)

**Result:** Every push to `main` automatically deploys the backend.

#### 1.2 Miniapp Project

1. Select your **miniapp** project (or create new)
2. **Settings** → **Git**
3. If not connected:
    - Click **Connect Git Repository**
    - Select **GitHub** → **OIPTechCORE/Aiba-Arena2**
4. **Production Branch:** Set to `main`
5. **Root Directory:** Set to `miniapp`
6. **Auto-deploy:** Ensure it's **enabled**

**Result:** Every push to `main` automatically deploys the miniapp.

#### 1.3 Admin Panel Project

1. Select your **admin-panel** project (or create new)
2. **Settings** → **Git**
3. If not connected:
    - Click **Connect Git Repository**
    - Select **GitHub** → \*\*OIPTechCORE/Aiba-Arena2`
4. **Production Branch:** Set to `main`
5. **Root Directory:** Set to `admin-panel`
6. **Auto-deploy:** Ensure it's **enabled**

**Result:** Every push to `main` automatically deploys the admin panel.

### Verification

1. **Make a test commit:**

    ```bash
    git commit --allow-empty -m "Test auto-deploy"
    git push origin main
    ```

2. **Check Vercel Dashboard:**
    - Each project should show a new deployment starting automatically
    - Wait 1-2 minutes for build to complete
    - Status should be **Ready** (green)

3. **Check deployment logs:**
    - Click on the deployment → **Build Logs**
    - Should show successful build

### Troubleshooting

| Issue                     | Solution                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **No auto-deploy**        | Check Settings → Git → Production Branch = `main`, Auto-deploy = enabled               |
| **Wrong root directory**  | Settings → General → Root Directory (should be `backend`, `miniapp`, or `admin-panel`) |
| **Build fails**           | Check Build Logs for errors (env vars, dependencies, build script)                     |
| **Not connected to repo** | Settings → Git → Connect Git Repository → Select your repo                             |

---

## Option 2: GitHub Actions (Miniapp Only)

**Best for:** Custom deployment control, CI/CD integration, or if Vercel Git integration isn't working.

### Setup Steps

#### 2.1 Get Vercel Credentials

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name: `GitHub Actions Deploy`
4. Copy the token (you'll need it in step 2.2)

#### 2.2 Get Project IDs

**Method A: From Vercel Dashboard**

1. Go to your **miniapp** project in Vercel
2. **Settings** → **General**
3. Scroll to **Project ID** → Copy it
4. **Team ID** (if in a team) → Copy it

**Method B: From Vercel CLI**

```bash
cd miniapp
npm install -g vercel
vercel link
# Follow prompts, then check .vercel/project.json
```

#### 2.3 Add GitHub Secrets

1. Go to [github.com/OIPTechCORE/Aiba-Arena2/settings/secrets/actions](https://github.com/OIPTechCORE/Aiba-Arena2/settings/secrets/actions)
2. Click **New repository secret**
3. Add these three secrets:

| Secret Name         | Value                   | Where to get                                                         |
| ------------------- | ----------------------- | -------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Your Vercel token       | From step 2.1                                                        |
| `VERCEL_ORG_ID`     | Your team/org ID        | Vercel Dashboard → Team Settings → Team ID (or use your user ID)     |
| `VERCEL_PROJECT_ID` | Your miniapp project ID | Vercel Dashboard → Miniapp project → Settings → General → Project ID |

**Note:** If you're not in a team, `VERCEL_ORG_ID` can be your user ID (found in Vercel account settings).

#### 2.4 Verify Workflow

1. Check `.github/workflows/vercel-deploy.yml` exists (it does)
2. Push to `main`:

    ```bash
    git commit --allow-empty -m "Test GitHub Actions deploy"
    git push origin main
    ```

3. Check GitHub Actions:
    - Go to [github.com/OIPTechCORE/Aiba-Arena2/actions](https://github.com/OIPTechCORE/Aiba-Arena2/actions)
    - Should see "Deploy to Vercel" workflow running
    - Wait for completion (green checkmark)

### Verification

1. **Check GitHub Actions:**
    - Actions tab → "Deploy to Vercel" → Should show ✅ success

2. **Check Vercel Dashboard:**
    - Miniapp project → Deployments → Should show new deployment

3. **Check deployment:**
    - Open your miniapp URL → Should reflect latest changes

### Troubleshooting

| Issue                                       | Solution                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| **Workflow fails: "secrets not found"**     | Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Secrets |
| **Workflow fails: "authentication failed"** | Regenerate `VERCEL_TOKEN` and update secret                                |
| **Workflow fails: "project not found"**     | Check `VERCEL_PROJECT_ID` matches your miniapp project ID                  |
| **Workflow runs but no deploy**             | Check workflow logs for specific error                                     |

---

## Comparison: Which Option to Choose?

| Aspect                | Vercel Git Integration             | GitHub Actions                 |
| --------------------- | ---------------------------------- | ------------------------------ |
| **Setup complexity**  | ⭐ Easy (just connect repo)        | ⚠️ Medium (need secrets)       |
| **Projects covered**  | ✅ All 3 (backend, miniapp, admin) | ⚠️ Only miniapp                |
| **Deployment speed**  | ✅ Fast (direct)                   | ⚠️ Slower (via GitHub Actions) |
| **Customization**     | ⚠️ Limited                         | ✅ Full control                |
| **CI/CD integration** | ⚠️ Basic                           | ✅ Advanced                    |

**Recommendation:** Use **Option 1 (Vercel Git Integration)** for simplicity and coverage of all projects. Use **Option 2 (GitHub Actions)** only if you need custom deployment logic or Vercel Git integration isn't working.

---

## Quick Setup Checklist

### Option 1 (Vercel Git Integration)

```
Backend Project
[ ] Connected to GitHub repo
[ ] Production Branch = main
[ ] Root Directory = backend
[ ] Auto-deploy enabled

Miniapp Project
[ ] Connected to GitHub repo
[ ] Production Branch = main
[ ] Root Directory = miniapp
[ ] Auto-deploy enabled

Admin Panel Project
[ ] Connected to GitHub repo
[ ] Production Branch = main
[ ] Root Directory = admin-panel
[ ] Auto-deploy enabled

Test
[ ] Push test commit to main
[ ] Verify all 3 projects deploy automatically
```

### Option 2 (GitHub Actions)

```
GitHub Secrets
[ ] VERCEL_TOKEN added
[ ] VERCEL_ORG_ID added
[ ] VERCEL_PROJECT_ID added

Workflow
[ ] .github/workflows/vercel-deploy.yml exists (✅ it does)
[ ] Push test commit to main
[ ] Verify GitHub Actions workflow runs successfully
[ ] Verify miniapp deploys to Vercel
```

---

## After Setup

Once auto-deploy is configured:

1. **Every push to `main`** → Automatic deployment
2. **Preview deployments** → Created for pull requests (if enabled)
3. **Deployment notifications** → Configure in Vercel Settings → Notifications

**Note:** Environment variables are set per-project in Vercel Settings → Environment Variables. They persist across deployments.

---

## References

- [Vercel Git Integration Docs](https://vercel.com/docs/concepts/git)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [DEPLOYMENT-AND-ENV.md](DEPLOYMENT-AND-ENV.md) — Full deployment guide
- [LAUNCH-GUIDE.md](LAUNCH-GUIDE.md) — Launch checklist
