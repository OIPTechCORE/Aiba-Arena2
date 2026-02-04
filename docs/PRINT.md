# Printable docs

All project docs are available as **print-friendly HTML**. Use them to print or save as PDF.

## Quick start

1. **Generate printable pages** (if not already done):
   ```bash
   npm run build:print-docs
   ```
2. Open **`docs/print/index.html`** in a browser.
3. Click a document, then use **File → Print** (or **Ctrl+P** / **Cmd+P**) to print or save as PDF.

## What you get

- **`docs/print/`** — One HTML file per Markdown doc, plus **`index.html`** (list of all docs).
- **`docs/print.css`** — Shared styles: readable on screen and optimized for print (margins, page breaks, visible URLs when printing).

## Regenerating

After editing any `docs/*.md` file, run again:

```bash
npm run build:print-docs
```

Then refresh the browser or re-open the HTML files.

## Tips

- **Print selection:** In the print dialog, you can choose “Save as PDF” instead of a physical printer.
- **All docs:** Open each doc from the index and print one by one, or open multiple tabs and print each.
