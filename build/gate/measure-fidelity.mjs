#!/usr/bin/env node
/* measure-fidelity.mjs — the checker's rendered-fidelity gate, as a deterministic script.
 *
 * WHY THIS IS A SCRIPT AND NOT A SET OF TOOL CALLS
 * ------------------------------------------------
 * The gate used to be driven through the claude-in-chrome MCP: the checker opened a tab and
 * ran `javascript_tool` against it. That works at a keyboard and CANNOT work anywhere else —
 * a scheduled cloud routine has no Chrome extension, so the gate returned `VISUAL:
 * unverified`, and `unverified` is capped at FAIL. Every unattended run therefore failed
 * every item that renders anything, which is the single reason the nightly loop could not
 * hand over finished code.
 *
 * Driving a browser from Node fixes that: the same command runs at a keyboard, in a routine,
 * and in CI, and it produces the same JSON either way.
 *
 * WHAT IT DOES *NOT* DO — deliberately
 * ------------------------------------
 * It does not judge. It measures what it is told to measure and prints the numbers. Deciding
 * whether a measured value matches the frozen ref is the checker's job, because that call
 * needs the ref, the project's conventions and their `confirmed` status. Keeping mechanism
 * here and judgment there is what stops the gate from quietly grading itself.
 *
 * BROWSER RESOLUTION — no 150MB download on a developer's laptop
 * -------------------------------------------------------------
 * Tries, in order: the full `playwright` package (bundled Chromium — how the cloud image
 * ships), then `playwright-core` driving a browser ALREADY on the machine via channel
 * (`chrome`, then `msedge`). `playwright-core` is ~5MB and downloads no browser, which is why
 * it is the template's devDependency. Override with --channel or PLAYWRIGHT_CHANNEL.
 *
 * USAGE
 *   node measure-fidelity.mjs --probes loop/refs/<id>/probes.json \
 *                             --out    loop/refs/<id>/measurements.json \
 *                             [--url http://127.0.0.1:8088/preview/index.html] \
 *                             [--screenshot loop/refs/<id>/rendered.png] \
 *                             [--channel chrome] [--no-serve] [--timeout 20000]
 *
 * Run it from the PROJECT ROOT — it resolves the project's node_modules and, unless
 * --no-serve is passed, starts `build/preview-server.mjs` itself when the URL is not already
 * answering, then stops it on the way out. A gate that forgets to start the preview reports
 * `unverified` for a build that was fine, so it is not left to the caller to remember.
 *
 * PROBE FILE
 *   {
 *     "url": "http://127.0.0.1:8088/preview/index.html",   // optional; --url wins
 *     "viewport":  { "width": 1280, "height": 900 },        // optional
 *     "viewports": [{ "name": "mobile", "width": 375, "height": 812 }],  // optional; repeats
 *     "waitFor":   ".acme-button",                         // optional selector to await
 *     "probes": [
 *       { "name": "primary / fill", "selector": ".btn.is-primary",
 *         "props": ["background-color", "font-size", "border-radius"] },
 *       { "name": "primary / box",  "selector": ".btn.is-primary", "rect": true },
 *       { "name": "label ::before", "selector": ".btn.is-primary", "pseudo": "::before",
 *         "props": ["content", "font-family"] },
 *       { "name": "icon ink",       "selector": ".btn .icon", "ink": true },
 *       { "name": "anything else",  "js": "getComputedStyle(document.body).zoom" }
 *     ]
 *   }
 *
 * EXIT CODES — the caller must be able to tell "it renders wrong" from "it did not run".
 *   0  every probe resolved and was measured        -> the checker compares values to the ref
 *   3  at least one probe could not be measured     -> VISUAL: unverified (a harness fault)
 *   4  the page/browser/server could not be reached -> VISUAL: unverified (no measurement)
 * A non-zero exit NEVER means "the design does not match" — this script has no opinion on
 * that. Only the checker can say drift, because only the checker has read the ref.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';

const EXIT_OK = 0, EXIT_UNMEASURED = 3, EXIT_NO_PAGE = 4;

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const arg = (name, def = undefined) => {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return argv.includes(`--${name}`) ? true : def;
};
const probesPath = arg('probes');
const outPath = arg('out');
const screenshotPath = arg('screenshot');
const noServe = argv.includes('--no-serve');
const timeout = Number(arg('timeout', 20000));
const channelArg = arg('channel', process.env.PLAYWRIGHT_CHANNEL);

if (!probesPath) {
  console.error('measure-fidelity: --probes <file.json> is required.');
  process.exit(EXIT_NO_PAGE);
}

const root = process.cwd();
const die = (code, msg) => { console.error(`measure-fidelity: ${msg}`); process.exit(code); };

/* ---------- probe file ---------- */
let spec;
try {
  spec = JSON.parse(await readFile(resolve(root, probesPath), 'utf8'));
} catch (e) {
  die(EXIT_NO_PAGE, `could not read probe file ${probesPath} — ${e.message}`);
}
const url = arg('url', spec.url || 'http://127.0.0.1:8088/preview/index.html');
const probes = Array.isArray(spec.probes) ? spec.probes : [];
if (!probes.length) die(EXIT_NO_PAGE, 'the probe file lists no probes — nothing to measure.');

const viewports = spec.viewports?.length
  ? spec.viewports
  : [{ name: 'default', ...(spec.viewport || { width: 1280, height: 900 }) }];

/* ---------- browser: four routes, so this runs everywhere ----------
 * A developer's laptop and a CI runner have different browsers available, and the gate has to
 * work on both or it stops being a gate. In order:
 *
 *   1. --executable-path / PLAYWRIGHT_EXECUTABLE_PATH — an explicit override always wins.
 *   2. `playwright` bundled Chromium — how a cloud image usually ships.
 *   3. `playwright-core` + channel chrome/msedge — an ALREADY-INSTALLED browser, so a laptop
 *      costs a ~5MB package instead of a ~150MB download.
 *   4. `playwright-core` with NO channel — a Chromium put in place by
 *      `npx playwright-core install chromium`. This is the CI route: a Linux runner has no
 *      branded Chrome, so routes 2 and 3 both miss and, without this, the gate reported
 *      "no browser" — a harness fault dressed up as a verdict, on every CI run. */
const require = createRequire(join(root, 'noop.js'));
const execPath = arg('executable-path', process.env.PLAYWRIGHT_EXECUTABLE_PATH);

async function launch() {
  const attempts = [];
  const tryLoad = (pkg) => { try { return require(pkg); } catch { return null; } };
  const full = tryLoad('playwright');
  const core = tryLoad('playwright-core') || full;

  if (execPath) {
    const lib = full || core;
    if (!lib) {
      attempts.push('--executable-path given but no playwright package is installed');
    } else {
      try {
        const b = await lib.chromium.launch({ headless: true, executablePath: execPath });
        return { browser: b, how: `executablePath=${execPath}` };
      } catch (e) { attempts.push(`executablePath ${execPath}: ${e.message.split('\n')[0]}`); }
    }
  }

  if (full) {
    try {
      const b = await full.chromium.launch({ headless: true });
      return { browser: b, how: 'playwright bundled chromium' };
    } catch (e) { attempts.push(`playwright bundled chromium: ${e.message.split('\n')[0]}`); }
  }

  if (core) {
    for (const channel of channelArg ? [channelArg] : ['chrome', 'msedge']) {
      try {
        const b = await core.chromium.launch({ headless: true, channel });
        return { browser: b, how: `playwright-core channel=${channel}` };
      } catch (e) { attempts.push(`channel ${channel}: ${e.message.split('\n')[0]}`); }
    }
    // No channel: the Chromium `npx playwright-core install chromium` downloads.
    if (!channelArg) {
      try {
        const b = await core.chromium.launch({ headless: true });
        return { browser: b, how: 'playwright-core downloaded chromium' };
      } catch (e) { attempts.push(`downloaded chromium: ${e.message.split('\n')[0]}`); }
    }
  }

  if (!full && !core) {
    attempts.push('neither `playwright` nor `playwright-core` is installed — run `npm install`');
  } else {
    attempts.push('on a runner with no branded browser, run: npx playwright-core install --with-deps chromium');
  }
  die(EXIT_NO_PAGE,
    'no usable browser. The rendered-fidelity gate cannot run, so the item is UNVERIFIED, ' +
    'not passing.\n  ' + attempts.join('\n  '));
}

/* ---------- preview server: start it if nothing is answering ---------- */
const reachable = async (u) => {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    const r = await fetch(u, { signal: c.signal });
    clearTimeout(t);
    return r.ok || r.status === 302;
  } catch { return false; }
};

let server = null;
async function ensureServer() {
  if (await reachable(url)) return 'already running';
  if (noServe) die(EXIT_NO_PAGE, `nothing is serving ${url} and --no-serve was passed.`);

  const entry = resolve(root, 'build/preview-server.mjs');
  if (!existsSync(entry)) die(EXIT_NO_PAGE, `no preview server at ${entry} — run from the project root.`);

  const port = new URL(url).port || '8088';
  server = spawn(process.execPath, [entry], {
    cwd: root,
    stdio: 'ignore',
    // PREVIEW_OPEN=0 stops the server popping a real browser window. Unattended that is a
    // stray process nobody closes; on a developer's machine it is a window stealing focus
    // in the middle of a build.
    env: { ...process.env, PORT: port, PREVIEW_OPEN: '0' },
  });
  server.unref?.();

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await reachable(url)) return `started on :${port}`;
    await new Promise((r) => setTimeout(r, 250));
  }
  die(EXIT_NO_PAGE, `started the preview server but ${url} never answered.`);
}

const stopServer = () => { if (server && !server.killed) { try { server.kill(); } catch {} } };
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

/* ---------- the in-page measurement ---------- *
 * Runs in the browser. Returns a plain object per probe; never throws across the boundary,
 * because a thrown probe would lose every other probe's result in the same batch. */
const IN_PAGE = ({ probes }) => {
  const out = [];
  for (const p of probes) {
    const row = { name: p.name || p.selector || p.js || '(unnamed)', selector: p.selector || null };
    try {
      if (p.js) {
        row.value = String(eval(p.js));            // escape hatch: caller-authored expression
        row.kind = 'js';
        out.push(row);
        continue;
      }
      const el = document.querySelector(p.selector);
      if (!el) {
        row.error = `no element matches ${p.selector} — it is not rendered on this page`;
        out.push(row);
        continue;
      }
      if (p.props?.length) {
        const cs = getComputedStyle(el, p.pseudo || undefined);
        row.values = {};
        for (const prop of p.props) row.values[prop] = cs.getPropertyValue(prop).trim();
        row.kind = p.pseudo ? `computed${p.pseudo}` : 'computed';
      }
      if (p.rect) {
        const r = el.getBoundingClientRect();
        row.rect = {
          width: +r.width.toFixed(2), height: +r.height.toFixed(2),
          top: +r.top.toFixed(2), left: +r.left.toFixed(2),
        };
        row.kind = row.kind ? `${row.kind}+rect` : 'rect';
      }
      if (p.ink) {
        /* Rendered INK, not font-size. Design tools inset a glyph inside its em box — an
         * icon glyph's ink is typically ~62.5% of its em — so font-size alone proves
         * nothing about what the eye sees. Paint the glyph large, read the alpha bbox. */
        const cs = getComputedStyle(el, p.pseudo || '::before');
        const text = p.text || (cs.content || '').replace(/^["']|["']$/g, '');
        const family = cs.fontFamily, weight = cs.fontWeight;
        const S = 200;
        const cv = document.createElement('canvas');
        cv.width = cv.height = S * 2;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.font = `${weight} ${S}px ${family}`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(text, S / 2, S);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let minX = cv.width, minY = cv.height, maxX = -1, maxY = -1;
        for (let y = 0; y < cv.height; y++) {
          for (let x = 0; x < cv.width; x++) {
            if (d[(y * cv.width + x) * 4 + 3] > 10) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
        const fs = parseFloat(cs.fontSize) || 0;
        row.ink = maxX < 0 ? { error: 'glyph painted nothing — font not loaded?' } : {
          fontSize: fs,
          inkWidthPx: +(((maxX - minX + 1) / S) * fs).toFixed(2),
          inkHeightPx: +(((maxY - minY + 1) / S) * fs).toFixed(2),
          inkRatio: +(((maxY - minY + 1) / S)).toFixed(4),
          codepoint: text ? text.codePointAt(0).toString(16) : null,
        };
        row.kind = 'ink';
      }
      if (!row.values && !row.rect && !row.ink && !p.js) {
        row.error = 'probe asked for nothing — give it props, rect, ink or js';
      }
    } catch (e) {
      row.error = String(e && e.message ? e.message : e);
    }
    out.push(row);
  }
  return out;
};

/* ---------- run ---------- */
const serverNote = await ensureServer();
const { browser, how } = await launch();

const report = {
  url,
  browser: how,
  preview: serverNote,
  startedAt: new Date().toISOString(),
  viewports: [],
};

try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width || 1280, height: vp.height || 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',   // kill transitions so a measurement is not taken mid-animation
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e.message)));
    /* A stylesheet or font that 404s is INVISIBLE in computed style — the cascade just falls
     * back and every value still reads as a plausible number. "Failed to load resource" with
     * no URL is useless to a reviewer, so record what actually failed: a missing block CSS
     * means the preview proved nothing, and a missing font file means the type measurements
     * describe the fallback face, not the design. */
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
    });
    page.on('requestfailed', (r) => {
      failedRequests.push(`${r.failure()?.errorText || 'failed'} ${r.url()}`);
    });

    try {
      await page.goto(url, { waitUntil: 'load', timeout });
    } catch (e) {
      await browser.close();
      die(EXIT_NO_PAGE, `could not load ${url} — ${e.message.split('\n')[0]}`);
    }

    // Fonts decide type metrics; measuring before they settle reports the fallback face.
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    if (spec.waitFor) {
      await page.waitForSelector(spec.waitFor, { timeout }).catch(() => {
        consoleErrors.push(`waitFor selector never appeared: ${spec.waitFor}`);
      });
    }
    await page.waitForTimeout(150);   // let custom elements upgrade + layout settle

    const results = await page.evaluate(IN_PAGE, { probes });

    if (screenshotPath) {
      const shot = viewports.length > 1
        ? screenshotPath.replace(/(\.png)?$/i, `.${vp.name || vp.width}.png`)
        : screenshotPath;
      mkdirSync(dirname(resolve(root, shot)), { recursive: true });
      await page.screenshot({ path: resolve(root, shot), fullPage: true });
      report.screenshot = shot;
    }

    report.viewports.push({
      name: vp.name || 'default',
      width: vp.width || 1280,
      height: vp.height || 900,
      consoleErrors,
      failedRequests,
      results,
    });
    await context.close();
  }
} finally {
  await browser.close().catch(() => {});
  stopServer();
}

/* ---------- output ---------- */
/* A probe that found no element is unmeasured. So is EVERY probe in a viewport where a
 * stylesheet, font or script failed to load — that is mechanism, not judgment: computed
 * style with layer 1 of the cascade missing is a number describing a page nobody will ever
 * see, and it reads as perfectly plausible. This template's preview stacks the real
 * OutSystems UI base UNDER the theme; when that 404s, every colour and metric measured
 * against it is fiction. Treating the whole viewport as unmeasured is the only honest call. */
const BLOCKING_ASSET = /\.(css|woff2?|ttf|otf|js|mjs)(\?|$)/i;
const unmeasured = report.viewports.flatMap((v) => {
  const rows = v.results.filter((r) => r.error).map((r) => `${v.name}: ${r.name} — ${r.error}`);
  const blocking = [...new Set(v.failedRequests)].filter((f) => BLOCKING_ASSET.test(f));
  if (blocking.length) {
    rows.push(
      `${v.name}: the cascade is INCOMPLETE — ${blocking.length} stylesheet/font/script ` +
      `request(s) failed, so every computed value in this viewport describes a fallback, ` +
      `not the design: ${blocking.join(', ')}`
    );
  }
  return rows;
});
report.unmeasured = unmeasured;
report.status = unmeasured.length ? 'partial' : 'measured';

if (outPath) {
  mkdirSync(dirname(resolve(root, outPath)), { recursive: true });
  writeFileSync(resolve(root, outPath), JSON.stringify(report, null, 2) + '\n');
}

/* A human/agent-readable echo. The checker turns this into the MEASUREMENTS table by
 * pairing each row with the ref value — this script never sees the ref. */
for (const v of report.viewports) {
  console.log(`\n── ${v.name} (${v.width}×${v.height}) ──`);
  for (const r of v.results) {
    if (r.error) { console.log(`  ✗ ${r.name}: UNMEASURED — ${r.error}`); continue; }
    const bits = [];
    if (r.values) bits.push(Object.entries(r.values).map(([k, val]) => `${k}: ${val}`).join('; '));
    if (r.rect) bits.push(`box ${r.rect.width}×${r.rect.height}`);
    if (r.ink) bits.push(r.ink.error ? `ink: ${r.ink.error}`
      : `ink ${r.ink.inkWidthPx}×${r.ink.inkHeightPx}px (ratio ${r.ink.inkRatio}) at font-size ${r.ink.fontSize}px`);
    if (r.value !== undefined) bits.push(String(r.value));
    console.log(`  • ${r.name}: ${bits.join(' | ')}`);
  }
  if (v.failedRequests.length) {
    console.log(`  ! ${v.failedRequests.length} request(s) FAILED — anything they styled was measured against a fallback:`);
    for (const e of [...new Set(v.failedRequests)].slice(0, 10)) console.log(`      ${e}`);
  }
  if (v.consoleErrors.length) {
    console.log(`  ! console errors (${v.consoleErrors.length}):`);
    for (const e of v.consoleErrors.slice(0, 5)) console.log(`      ${e}`);
  }
}
console.log(`\nbrowser: ${how}   preview: ${serverNote}`);
if (outPath) console.log(`written: ${outPath}`);

if (unmeasured.length) {
  console.log(`\n${unmeasured.length} probe(s) UNMEASURED — the item is VISUAL: unverified, not PASS.`);
  process.exit(EXIT_UNMEASURED);
}
console.log(`\nAll ${probes.length * viewports.length} probe(s) measured. Compare against the ref to decide PASS/DRIFT.`);
process.exit(EXIT_OK);
