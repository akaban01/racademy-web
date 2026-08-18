#!/usr/bin/env node
/**
 * Renders content/*.json into static HTML and writes it in place between
 * marker comments in the pages that use it - replacing the client-side
 * fetch()+DOM-build scripts those pages used to ship.
 *
 * This follows the same pattern the repo already uses for dist/styles.css:
 * a tracked file that `npm run build` overwrites every run. The committed
 * copy is just "last known good"; the served copy is always freshly built.
 * Do not hand-edit the HTML between BUILD:CONTENT markers - it's
 * regenerated on every build.
 *
 * The view components in content-schema/views/ are the single source of
 * truth for this markup, shared with the Puck editor's live preview
 * (see content-schema/puck.config.jsx). This script renders them directly
 * from plain JSON via react-dom/server and never touches Puck itself.
 */
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
/* Must live under ROOT/node_modules (not the OS temp dir) so Node's module
   resolution finds this project's react/react-dom when the built module
   imports them - they're marked `external` below, not bundled in. */
const CACHE_ROOT = join(ROOT, 'node_modules', '.build-content-cache');

async function loadModule(entryPath) {
  mkdirSync(CACHE_ROOT, { recursive: true });
  const outdir = mkdtempSync(join(CACHE_ROOT, 'run-'));
  const outfile = join(outdir, 'view.mjs');
  try {
    await build({
      entryPoints: [entryPath],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      jsx: 'automatic',
      external: ['react', 'react-dom', 'react-dom/*'],
      logLevel: 'silent',
    });
    return await import(`${pathToFileUrl(outfile)}?t=${Date.now()}`);
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

function pathToFileUrl(p) {
  return `file://${p}`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Replaces everything between `<!-- BUILD:CONTENT:{key}:START -->` and the matching END comment. */
function injectMarker(html, key, fragmentHtml) {
  const start = `<!-- BUILD:CONTENT:${key}:START -->`;
  const end = `<!-- BUILD:CONTENT:${key}:END -->`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (!pattern.test(html)) {
    throw new Error(`build-content: marker "${key}" not found in target page (expected "${start} ... ${end}")`);
  }
  return html.replace(pattern, `${start}\n${fragmentHtml}\n${end}`);
}

function writeMarkers(pagePath, fragmentsByKey) {
  const fullPath = join(ROOT, pagePath);
  let html = readFileSync(fullPath, 'utf8');
  for (const [key, fragmentHtml] of Object.entries(fragmentsByKey)) {
    html = injectMarker(html, key, fragmentHtml);
  }
  writeFileSync(fullPath, html);
  console.log(`build-content: updated ${pagePath}`);
}

async function buildSupplyLists() {
  const { SupplyListsView } = await loadModule(join(ROOT, 'content-schema/views/SupplyListsView.jsx'));
  const data = JSON.parse(readFileSync(join(ROOT, 'content/supply-lists.json'), 'utf8'));
  const html = renderToStaticMarkup(React.createElement(SupplyListsView, data));
  writeMarkers('parent-resources/supply-lists/index.html', { 'supply-lists': html });
}

async function buildAcademicCalendar() {
  const { CalendarHighlights, CalendarYearGrid, CalendarMonths } = await loadModule(
    join(ROOT, 'content-schema/views/AcademicCalendarView.jsx')
  );
  const data = JSON.parse(readFileSync(join(ROOT, 'content/academic-calendar.json'), 'utf8'));
  const highlightsHtml = renderToStaticMarkup(React.createElement(CalendarHighlights, data));
  const yearGridHtml = renderToStaticMarkup(React.createElement(CalendarYearGrid, data));
  const monthsHtml = renderToStaticMarkup(React.createElement(CalendarMonths, data));
  writeMarkers('parent-resources/academic-calendar/index.html', {
    'cal-highlights': highlightsHtml,
    'cal-year': yearGridHtml,
    'cal-months': monthsHtml,
  });
}

async function main() {
  await buildSupplyLists();
  await buildAcademicCalendar();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
