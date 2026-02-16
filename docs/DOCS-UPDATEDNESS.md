# Docs & code updatedness

**Last refresh:** 2026-02-16  
**Purpose:** Single place to see whether code, .md docs, and .html (print) are up to date.

---

## 1. Summary

| Area | Status | Notes |
|------|--------|--------|
| **Code** | ✅ Current | Miniapp (PageNav, TabBackNav, responsive, tournament guard), backend (MongoDB URI), no known stale code. |
| **Markdown (.md)** | ✅ Source of truth | All docs in `docs/` and `docs/marketing/`. New/updated: GAPS-SCAN-REPORT, APP-SCAN-REPORT, UI-DESIGN-PRINCIPLES, README (deep docs + gaps), GAME-FUNCTIONALITY §12. |
| **HTML (print)** | ✅ Regenerated | `npm run build:print-docs` run; all `.md` → `docs/print/*.html` and `index.html`. **Edit .md only;** re-run after doc changes. |

---

## 2. Doc dates (optional consistency)

Some docs still show **Feb 2025** or **2025** in "Last updated" / "Version"; content has been updated in places. Not critical; for clarity you can set them to **Feb 2026** when you next touch the file.

| Doc | Current date in doc | Content |
|-----|----------------------|--------|
| APP-SCAN-REPORT.md | 2026-02-16 | ✅ |
| GAPS-SCAN-REPORT.md | 2026-02-15 | ✅ |
| UI-DESIGN-PRINCIPLES.md | Feb 2026 | ✅ |
| GAME-FUNCTIONALITY.md | 2025 | §12 API mapping extended 2026 |
| API-CONTRACT.md | Feb 2025 | Canonical API ref |
| GAP-AUDIT.md | Feb 2025 | Gap investigation |
| README.md | — | Index + recent updates 2026 |

---

## 3. Keeping everything up to date

1. **Edit only `.md`** in `docs/` (and `docs/marketing/`). Do not edit `docs/print/*.html` by hand.
2. **After changing docs,** run: `npm run build:print-docs` (from repo root).
3. **Code vs docs:** API and behaviour are documented in API-CONTRACT.md, GAME-FUNCTIONALITY.md, USER-GUIDE.md. When you add endpoints or flows, update those and (if needed) GAPS-SCAN-REPORT or APP-SCAN-REPORT.

---

## 4. References

- [DOCS-STRUCTURE.md](DOCS-STRUCTURE.md) — Why .md vs .html; build process.
- [README.md](README.md) — Doc index and recent updates.
- [GAPS-SCAN-REPORT.md](GAPS-SCAN-REPORT.md) — App & docs gap scan.
