# Docs Structure — Markdown vs HTML

**Why are there `.html` files when I only see some `.md` files?**

---

## Source of truth: Markdown (`.md`)

| Location                              | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `docs/` (all .md)                     | Primary documentation — **edit these**. |
| `docs/marketing/` (all .md)           | Marketing materials.                    |
| `docs/marketing/templates/` (all .md) | Template readme.                        |

All documentation should be written in **Markdown**. That is the source of truth.

---

## Generated: HTML in `docs/print/`

The folder **`docs/print/`** contains **print-friendly HTML** generated from Markdown:

1. Run **`npm run build:print-docs`** (uses `scripts/build-print-docs.js`).
2. The script scans `docs/` for all `.md` files.
3. Each `.md` file is converted to HTML and written to `docs/print/`.
4. Naming: `docs/marketing/README.md` → `docs/print/marketing-README.html`.

**Use:** Open `docs/print/index.html` in a browser and print or save as PDF.

---

## `.md` source files — one-to-one with generated HTML

As of the latest update, **all `.html` files in `docs/print/` have a corresponding `.md` source** in `docs/`. The build script generates exactly one HTML file per `.md` file (excluding `docs/print/`, `docs/templates/`).

| Count               | Location                        |
| ------------------- | ------------------------------- |
| ~58 `.md` files     | `docs/` (and `docs/marketing/`) |
| 58 doc HTML + index | `docs/print/`                   |

---

### Previously orphan HTML — now restored

The following `.md` files were **restored or created** so every HTML has a source:

- **Standalone plans** (full content): `AIBA-ARENA-UNIVERSITY-PLAN.md`, `CHARITY-ECOSYSTEM-PLAN.md`, `MARKETPLACE-AND-PAYMENTS-MASTER-PLAN.md`, `RUN-LOCALHOST.md`, `deployment.md`, `mainnet-readiness.md`, `monitoring.md`, `runbook.md`
- **Redirect stubs** (point to canonical docs): `AUTONOMOUS-RACING-MASTER-PLAN.md`, `ECOSYSTEMS-AUDIT.md`, `GAME-EXPLAINED.md`, `LEADERBOARD-AND-GROUPS-CHECK.md`, `NFT-MULTIVERSE-MASTER-PLAN.md`, `PROJECT-ASSESSMENT.md`, `PROJECT-DESCRIPTION-SYSTEMATIC.md`, `TELEGRAM-MINI-APP-SETUP-GUIDE.md`, `UP-TO-DATE-CHECK.md`, `VERCEL-ENV-GUIDE.md`, `VISION-VS-CODEBASE-CHECK.md`

**Best practice:**

- **Edit `.md`** files — never edit HTML directly.
- Run `npm run build:print-docs` after doc changes.

---

## Summary

| Edit        | Generate                                         |
| ----------- | ------------------------------------------------ |
| `docs/*.md` | `npm run build:print-docs` → `docs/print/*.html` |

**Don't edit the HTML directly.** Edit Markdown and regenerate.
