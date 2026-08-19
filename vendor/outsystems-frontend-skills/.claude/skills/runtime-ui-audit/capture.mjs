// Capture a runtime URL for the UI Quality Assessment audit.
//
// Produces static screenshots (desktop + mobile), a shallow crawl of in-app
// surfaces, interaction-state captures (focus ring, hover before/after), a
// mechanical probe (tap-target sizes, motion/transition signals, reduced-motion
// support, focus outlines), and a session recording — enough to score the
// static, layout, content, accessibility, behaviour, and interaction criteria.
//
// Usage (run from a dir where `playwright` is installed — see SKILL.md):
//   node capture.mjs <url> <out-dir> [--max-screens=4] [--viewports=desktop,mobile] [--no-crawl]
//
// Uses the system Google Chrome (channel: 'chrome') — no Chromium download.
// Assumes the URL is publicly reachable (no auth). Writes into <out-dir>:
//   desktop.png, mobile.png            landing, full-page, per viewport
//   screen-NN-<slug>.png               crawled in-app surfaces (desktop)
//   focus.png                          first focused element (C6 focus ring)
//   hover-before.png / hover-after.png primary control resting vs hover (C12)
//   session.webm                       desktop session recording (C11 — human review)
//   probe.json                         mechanical signals (see keys below)
// and prints one JSON line per capture + a final {probe:...} summary line.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, renameSync, readdirSync } from 'node:fs';

const [, , url, outDirRaw = '.', ...rest] = process.argv;
if (!url) {
  console.error('usage: node capture.mjs <url> <out-dir> [--max-screens=N] [--viewports=desktop,mobile] [--no-crawl]');
  process.exit(2);
}
const outDir = outDirRaw.replace(/\/$/, '');
const opt = (k, d) => {
  const a = rest.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const wantedViewports = opt('viewports', 'desktop,mobile').split(',').map((s) => s.trim());
const maxScreens = parseInt(opt('max-screens', '4'), 10);
const noCrawl = rest.includes('--no-crawl');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

mkdirSync(outDir, { recursive: true });

// Selector for "interactive" elements used for tap-target sizing + inventory.
const INTERACTIVE =
  'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [role=menuitem], [tabindex]:not([tabindex="-1"])';

async function loadPage(page, target) {
  try {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    await page.goto(target, { waitUntil: 'load', timeout: 30000 });
  }
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch({ channel: 'chrome' });
const probe = { url, viewports: {}, tapTargets: null, motion: null, focus: null, hover: null, crawled: [] };

try {
  // ---- Desktop context (records video, does crawl + probes + interaction states) ----
  if (wantedViewports.includes('desktop')) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      recordVideo: { dir: outDir, size: { width: 1440, height: 900 } },
    });
    const page = await context.newPage();
    await loadPage(page, url);

    await page.screenshot({ path: `${outDir}/desktop.png`, fullPage: true });
    const meta = { title: await page.title(), url: page.url() };
    probe.viewports.desktop = meta;
    console.log(JSON.stringify({ viewport: 'desktop', path: `${outDir}/desktop.png`, ...meta }));

    // --- Tap-target inventory (C5) + interactive count (C2/C13 context) ---
    try {
      probe.tapTargets = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        const items = [];
        for (const el of els) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          items.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || null,
            text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
        const total = items.length;
        const under44 = items.filter((i) => i.w < 44 || i.h < 44).length;
        const under32 = items.filter((i) => i.w < 32 || i.h < 32).length;
        return { total, under44, under32, pctGte44: total ? Math.round(((total - under44) / total) * 100) : null, sample: items.slice(0, 40) };
      }, INTERACTIVE);
    } catch (e) { probe.tapTargets = { error: e.message }; }

    // --- Motion / transition signals (C11, C12) ---
    try {
      probe.motion = await page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)].slice(0, 60);
        const durations = new Set();
        let withTransition = 0, withAnimation = 0;
        for (const el of els) {
          const cs = getComputedStyle(el);
          if (cs.transitionDuration && cs.transitionDuration !== '0s') { withTransition++; cs.transitionDuration.split(',').forEach((d) => durations.add(d.trim())); }
          if (cs.animationName && cs.animationName !== 'none') withAnimation++;
        }
        let reducedMotion = false;
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule.cssText && rule.cssText.includes('prefers-reduced-motion')) { reducedMotion = true; break; }
            }
          } catch { /* cross-origin sheet */ }
          if (reducedMotion) break;
        }
        return { sampled: els.length, withTransition, withAnimation, durations: [...durations].slice(0, 8), prefersReducedMotionHandled: reducedMotion };
      }, INTERACTIVE);
    } catch (e) { probe.motion = { error: e.message }; }

    // --- Focus ring (C6) ---
    try {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(150);
      probe.focus = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { focused: null };
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow && cs.boxShadow !== 'none' ? 'present' : 'none',
        };
      });
      await page.screenshot({ path: `${outDir}/focus.png` }); // viewport only, shows the ring in context
      console.log(JSON.stringify({ capture: 'focus', path: `${outDir}/focus.png`, ...probe.focus }));
    } catch (e) { probe.focus = { error: e.message }; }

    // --- Hover before/after on the first prominent control (C12) ---
    try {
      const btn = page.locator('button, [role=button], a[href]').filter({ hasText: /\S/ }).first();
      if (await btn.count()) {
        await btn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await btn.screenshot({ path: `${outDir}/hover-before.png` });
        const before = await btn.evaluate((el) => { const c = getComputedStyle(el); return { bg: c.backgroundColor, boxShadow: c.boxShadow, transform: c.transform, transition: c.transitionProperty }; });
        await btn.hover();
        await page.waitForTimeout(350);
        await btn.screenshot({ path: `${outDir}/hover-after.png` });
        const after = await btn.evaluate((el) => { const c = getComputedStyle(el); return { bg: c.backgroundColor, boxShadow: c.boxShadow, transform: c.transform }; });
        probe.hover = { label: (await btn.innerText().catch(() => '')).trim().slice(0, 40), before, after, changed: JSON.stringify(before) !== JSON.stringify({ ...after, transition: before.transition }) };
        console.log(JSON.stringify({ capture: 'hover', before: `${outDir}/hover-before.png`, after: `${outDir}/hover-after.png`, label: probe.hover.label }));
      }
    } catch (e) { probe.hover = { error: e.message }; }

    // --- Shallow crawl of in-app surfaces (C9, C10) ---
    if (!noCrawl && maxScreens > 0) {
      try {
        const origin = new URL(url);
        const base = '/' + origin.pathname.split('/').filter(Boolean)[0]; // e.g. /Smith_Enterprise
        const links = await page.evaluate((baseArg) => {
          const seen = new Set();
          const out = [];
          for (const a of document.querySelectorAll('a[href]')) {
            let u;
            try { u = new URL(a.href, location.href); } catch { continue; }
            if (u.origin !== location.origin) continue;
            if (!u.pathname.startsWith(baseArg)) continue;
            if (u.pathname === location.pathname) continue;
            if (seen.has(u.pathname)) continue;
            seen.add(u.pathname);
            out.push({ href: u.href, label: (a.innerText || '').trim().slice(0, 30), path: u.pathname });
          }
          return out;
        }, base);
        let n = 0;
        for (const link of links.slice(0, maxScreens)) {
          n++;
          const slug = (link.path.split('/').filter(Boolean).pop() || `screen${n}`).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
          const path = `${outDir}/screen-${String(n).padStart(2, '0')}-${slug}.png`;
          try {
            await loadPage(page, link.href);
            await page.screenshot({ path, fullPage: true });
            const info = { path, label: link.label, url: page.url(), title: await page.title() };
            probe.crawled.push(info);
            console.log(JSON.stringify({ capture: 'crawl', ...info }));
          } catch (e) {
            probe.crawled.push({ path, href: link.href, error: e.message });
          }
        }
      } catch (e) { probe.crawlError = e.message; }
    }

    await page.close();
    await context.close();
    // Rename the auto-named video to session.webm
    try {
      const vids = readdirSync(outDir).filter((f) => f.endsWith('.webm'));
      if (vids.length) renameSync(`${outDir}/${vids[0]}`, `${outDir}/session.webm`);
    } catch { /* ignore */ }
  }

  // ---- Mobile context (landing only) ----
  if (wantedViewports.includes('mobile')) {
    const vp = VIEWPORTS.mobile;
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const page = await context.newPage();
    await loadPage(page, url);
    await page.screenshot({ path: `${outDir}/mobile.png`, fullPage: true });
    const meta = { title: await page.title(), url: page.url() };
    probe.viewports.mobile = meta;
    console.log(JSON.stringify({ viewport: 'mobile', path: `${outDir}/mobile.png`, ...meta }));
    await context.close();
  }

  writeFileSync(`${outDir}/probe.json`, JSON.stringify(probe, null, 2));
  console.log(JSON.stringify({ probe: `${outDir}/probe.json`, tapTargets: probe.tapTargets && { total: probe.tapTargets.total, pctGte44: probe.tapTargets.pctGte44 }, motion: probe.motion, focus: probe.focus, crawled: probe.crawled.length }));
} finally {
  await browser.close();
}
