# ChunkLoadError: Loading chunk ... providers_js failed

If you see this error in the browser:

- **Cause:** Stale or corrupted Next.js build cache (`.next`), or the app running from an unexpected path (e.g. Cursor Simple Browser).

**Fix:**

1. Stop the dev server (Ctrl+C).
2. From the **miniapp** folder, delete the cache and restart:

    ```bash
    cd miniapp
    rm -rf .next      # macOS/Linux
    # or on Windows:  rmdir /s /q .next
    npm run dev
    ```

3. Open the app at **http://localhost:3000** (not via a path that includes `/browser/` or similar).

If it still fails, close any in-editor “Simple Browser” or preview and open http://localhost:3000 in a normal browser tab.
