/* preview-server.mjs — zero-dependency static server for the local component preview.
 *
 * Serves the project root so preview/index.html can reach ../dist/theme.css and the
 * real src/ override CSS + Web Component over http:// (avoids file:// quirks).
 * Run with `npm run preview`. Node only — no Python, no extra installs.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 8088;
const ENTRY = '/preview/index.html';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Redirect the bare root to the entry so the browser's document URL becomes
    // `/preview/index.html`. Serving the entry's content at `/` (without changing the
    // URL) leaves the page's `vendor/*` relative links resolving to `/vendor/*`, which
    // 404s — silently dropping the real OSUI base + provider CSS (breaks the responsive
    // nav drawer, virtual-select, flatpickr, fontawesome). A 302 keeps paths correct.
    if (urlPath === '/') {
      res.writeHead(302, { Location: ENTRY }).end();
      return;
    }

    // Resolve safely inside ROOT (block path traversal).
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(normalize(ROOT))) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', // always serve the latest edit
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}${ENTRY}`;
  console.log(`\n  Preview → ${url}\n  Press Ctrl+C to stop.\n`);
  // Best-effort auto-open (Windows/macOS/Linux); harmless if it fails.
  const cmd = process.platform === 'win32' ? 'start ""'
            : process.platform === 'darwin' ? 'open' : 'xdg-open';
  import('node:child_process')
    .then(({ exec }) => exec(`${cmd} ${url}`))
    .catch(() => {});
});
