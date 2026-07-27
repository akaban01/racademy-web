# Parent Resources: tabs → subpages

Working note for the migration on `claude/parent-resource-page-optimize-obo7y5`.
Delete this file before merging — it is scaffolding, not documentation.

## Status: complete and verified. Remaining work is review, not code.

## Why

The six tabbed sections were six separate errands, not alternate views of one
task. Tabs also gave all six topics a single URL, `<title>` and meta
description, and made every visitor download all six panels to read one.

`parent-resources/index.html` was 103 KB — 4.5× the next largest page on the
site and roughly a quarter of its total HTML. It is now a 12 KB hub.

## What shipped

| URL | Size | Indexed |
| --- | --- | --- |
| `/parent-resources/` | 12 KB | yes |
| `/parent-resources/academic-calendar/` | 14 KB | yes |
| `/parent-resources/supply-lists/` | 30 KB | yes |
| `/parent-resources/uniforms/` | 27 KB | yes |
| `/parent-resources/parentsweb/` | 17 KB | **no** — unlinked, `noindex` |
| `/parent-resources/facts/` | 12 KB | **no** — unlinked, `noindex` |
| `/parent-resources/transcripts/` | 17 KB | **no** — unlinked, `noindex` |

The three unpublished pages carry the state they were put in when their tabs
were hidden. They exist, are reachable by direct URL, but are not linked from
the hub or the section nav and carry `<meta name="robots" content="noindex">`.
**To publish one:** add a card to the hub's `.resource-grid`, add it to
`PUBLISHED` in the section nav of each sibling, and drop its robots meta.

Every page has its own title, meta description, breadcrumb, and the shared
`.section-nav` strip already used elsewhere on the site.

## Old links

Old `#hash` links (bookmarks, past school emails) are redirected by a script in
the hub's `<head>`, running before first paint:

    #calendar → academic-calendar/    #parentsweb → parentsweb/
    #supplies → supply-lists/         #facts      → facts/
    #uniforms → uniforms/             #transcript → transcripts/

`#supply-lists` is also mapped — `progress.html` pointed at that anchor, which
never existed on the old page.

## CSS

`pw-*` components used by two or more of the new pages moved into
`src/subpages.css` (its documented purpose). Anything used by exactly one page
stayed inline on that page: `pw-faq*` and the security callout on parentsweb,
`cal-*` on the calendar, supply/grade/checkbox/print on supply-lists,
`uniform-*` on uniforms, `soon-*` on transcripts, quick-links + lead clamp on
the hub. Variables were renamed to the `--color-*` / `--font-*` convention that
file uses.

`dist/styles.css` is rebuilt via `npm run build`. **Note:** the committed
`dist/styles.css` was already stale against `src/input.css` before this branch —
Netlify rebuilds on deploy, so production was fine, but local previews of the
homepage did not match. The rebuild in this commit also picks up those
previously-unbuilt homepage styles (`.hero-home`, `.quick-link-card`, etc.).
None of that drift touches parent-resources selectors.

## Incidental fixes

Found while moving markup; all would have been dead links:

- footer link to `#supplies` → `../supply-lists/`
- FACTS cross-link to `#parentsweb` → `../parentsweb/`
- `href="#"` placeholder on "North Austin, Texas" in this section's footer →
  the campus map URL every other page uses
- `progress.html` → `/parent-resources/#supply-lists` → `/parent-resources/supply-lists/`
- supply-list print stylesheet no longer needs `.tab-panel { display: none !important }`
  to fight the tabs; the old dead `#tab-supplies::after` rule is gone

## Verification (headless Chromium, 390px and 1280px)

All passing:

- 7/7 pages load; correct titles, descriptions, `noindex` on the three unpublished
- CMS content renders: 11 calendar months, 4 highlights, 9 supply grades, 306 checkboxes
- Supply-list checkbox state survives a reload (localStorage)
- 6/6 old hash redirects land on the right page
- No JS errors, no failed requests, no broken internal links
- Print: header shown, site chrome hidden, grades expanded, 2-column list,
  9 pages, footer contact line present

## Next

1. Open the draft PR and check the Netlify deploy preview.
2. Consider whether the hub should also show calendar highlights inline. Left
   out deliberately — it would pull the calendar fetch and `cal-*` styles back
   onto the hub, re-bloating the page the migration just slimmed.
