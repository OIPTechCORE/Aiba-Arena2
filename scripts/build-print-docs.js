#!/usr/bin/env node
/**
 * Build printable HTML from docs/*.md.
 * Output: docs/print/*.html and docs/print/index.html
 * Run: node scripts/build-print-docs.js (or npm run build:print-docs)
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const PRINT_DIR = path.join(DOCS_DIR, 'print');
const PRINT_CSS = 'print.css';

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToHtml(md) {
  if (!md || typeof md !== 'string') return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const peek = () => lines[i];
  const next = () => (i < lines.length ? lines[i++] : null);
  const rest = () => lines.slice(i).join('\n');

  function parseInline(text) {
    return escapeHtml(text)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^#+\s/, '');
  }

  function flushParagraph(buf) {
    if (buf.length) {
      const text = buf.join(' ').trim();
      if (text) out.push('<p>' + parseInline(text) + '</p>');
    }
  }

  let paraBuf = [];
  while (i < lines.length) {
    const line = next();
    if (line === null) break;

    const trimmed = line.trim();

    // ATX heading
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const level = hMatch[1].length;
      const title = hMatch[2].trim();
      out.push(`<h${level}>${parseInline(title)}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$|^\*{3,}$|^_{3,}$/.test(trimmed)) {
      flushParagraph(paraBuf);
      paraBuf = [];
      out.push('<hr/>');
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(next());
      }
      if (peek() && peek().trim().startsWith('```')) next();
      const code = codeLines.filter(Boolean).join('\n');
      out.push('<pre><code>' + escapeHtml(code) + '</code></pre>');
      continue;
    }

    // Table (simple: | a | b |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const rows = [];
      rows.push(line);
      while (i < lines.length && peek() && peek().trim().startsWith('|')) {
        rows.push(next());
      }
      const cells = rows.map((r) =>
        r
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );
      if (cells.length >= 1) {
        out.push('<table>');
        const hasSeparator = cells.length > 1 && cells[1].every((c) => /^[-:|\s]+$/.test(c));
        const headerRow = hasSeparator ? 0 : -1;
        const bodyStart = hasSeparator ? 2 : 0;
        if (headerRow >= 0) {
          out.push('<thead><tr>');
          cells[0].forEach((c) => out.push('<th>' + parseInline(c) + '</th>'));
          out.push('</tr></thead>');
        }
        out.push('<tbody>');
        for (let r = bodyStart; r < cells.length; r++) {
          out.push('<tr>');
          cells[r].forEach((c) => out.push('<td>' + parseInline(c) + '</td>'));
          out.push('</tr>');
        }
        out.push('</tbody></table>');
      }
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const tag = /^\d+\.\s+/.test(trimmed) ? 'ol' : 'ul';
      out.push(`<${tag}>`);
      while (peek() && (/^[-*+]\s+/.test(peek().trim()) || /^\d+\.\s+/.test(peek().trim()))) {
        const li = next().replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
        out.push('<li>' + parseInline(li.trim()) + '</li>');
      }
      out.push(`</${tag}>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const quoteLines = [];
      quoteLines.push(trimmed.replace(/^>\s?/, ''));
      while (peek() && peek().trim().startsWith('>')) {
        quoteLines.push(next().trim().replace(/^>\s?/, ''));
      }
      out.push('<blockquote><p>' + parseInline(quoteLines.join(' ')) + '</p></blockquote>');
      continue;
    }

    // Empty line
    if (trimmed === '') {
      flushParagraph(paraBuf);
      paraBuf = [];
      continue;
    }

    paraBuf.push(trimmed);
  }
  flushParagraph(paraBuf);
  return out.join('\n');
}

function buildDoc(filename, title, html) {
  const cssPath = path.relative(path.join(PRINT_DIR, path.dirname(filename)), path.join(DOCS_DIR, PRINT_CSS)).replace(/\\/g, '/');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)} — Aiba Arena Docs</title>
  <link rel="stylesheet" href="${cssPath}"/>
</head>
<body>
  <div class="doc-header">
    <h1>${escapeHtml(title)}</h1>
    <p class="doc-meta no-print"><a href="index.html">← All docs</a></p>
  </div>
  <div class="doc-body">
${html}
  </div>
</body>
</html>`;
}

function buildIndex(entries) {
  const list = entries
    .map(
      (e) =>
        `    <li><a href="${escapeHtml(e.basename)}">${escapeHtml(e.title)}</a></li>`
    )
    .join('\n');
  const cssPath = '../' + PRINT_CSS;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Printable docs — Aiba Arena</title>
  <link rel="stylesheet" href="${cssPath}"/>
</head>
<body>
  <div class="doc-header">
    <h1>Printable docs</h1>
    <p class="doc-meta">Open any document and use File → Print (or Ctrl+P) to print or save as PDF.</p>
  </div>
  <ul>
${list}
  </ul>
</body>
</html>`;
}

if (!fs.existsSync(DOCS_DIR)) {
  console.error('Docs dir not found:', DOCS_DIR);
  process.exit(1);
}

if (!fs.existsSync(PRINT_DIR)) {
  fs.mkdirSync(PRINT_DIR, { recursive: true });
}

function collectMdFiles(dir, prefix = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'print' && item !== 'templates') {
        files.push(...collectMdFiles(full, prefix + item + '/'));
      }
    } else if (item.endsWith('.md')) {
      files.push({ rel: prefix + item, full });
    }
  }
  return files;
}

const mdFiles = collectMdFiles(DOCS_DIR);
const entries = [];

for (const { rel, full } of mdFiles.sort((a, b) => a.rel.localeCompare(b.rel))) {
  const md = fs.readFileSync(full, 'utf8');
  const base = path.basename(rel, '.md');
  const title = base.replace(/-/g, ' ');
  const html = mdToHtml(md);
  const outName = rel.replace(/\.md$/, '.html').replace(/\//g, '-');
  const outPath = path.join(PRINT_DIR, outName);
  const docHtml = buildDoc(outName, title, html);
  fs.writeFileSync(outPath, docHtml, 'utf8');
  entries.push({ basename: outName, title });
  console.log('Written:', outName);
}

const indexPath = path.join(PRINT_DIR, 'index.html');
fs.writeFileSync(indexPath, buildIndex(entries), 'utf8');
console.log('Written: index.html');
console.log('Done. Open docs/print/index.html in a browser and print any doc.');
