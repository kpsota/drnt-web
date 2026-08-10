# Refactor notes

Mechanical split of `drnt-web-ondra-2/index.html` (9672 lines) into `index.html` +
`css/style.css` + `js/*.js`. No content changes — this is a pure extraction.
Source line numbers below refer to the original `drnt-web-ondra-2/index.html`.

## CSS

- `css/style.css` (105 lines) — exact copy of source lines 15-119 (the single
  page-level `<style>` block). Verified byte-identical via diff.

## JS modules

All files are plain classic scripts (no IIFE wrapper, no `type="module"`), loaded
in the order listed below, matching the original execution order exactly. They
all share one global scope, same as the original single `<script>` block —
functions/variables defined in one file are used by later files and by inline
`onclick=` attributes in the markup, exactly as before.

| # | File | Source lines | Line count | Content |
|---|------|--------------|------------|---------|
| 1 | `js/lightbox.js` | 2574-2623 | 50 | Lightbox open/close/prev/next for image galleries |
| 2 | `js/map-projects.js` | 2624-2849 | 226 | "1. PROJECT MAP INTERACTION LOGIC" — map pins, project selection, coordinate helpers |
| 3 | `js/case-studies-tabs.js` | 2850-2868 | 19 | "2. CASE STUDIES TABS LOGIC" — case-study tab switching |
| 4 | `js/gis-demo-engine.js` | 2869-5942 | 3074 | "3. GIS CLIENT PORTAL DEMO LOGIC" — the full GIS demo: tool selection, canvas viewport/pan/zoom, mouse/wheel/dblclick handlers, polygon drawing, area/height/slope/profile measurement, elevation profile chart, flood simulation, calibration marker drawing + the two `window.open()`-based calibration/flood-calibration popup builders (`writePopupContent`, `writeFloodPopupContent`, containing the embedded full-HTML template-literal documents with their own inline `<style>` blocks), export dropdown |
| 5 | `js/mobile-menu.js` | 5943-6006 | 64 | Mobile navigation menu toggle + GIS mobile sidebar |
| 6 | `js/modals.js` | 6007-6062 | 56 | GIS demo modal + case-studies modal open/close |
| 7 | `js/configurator.js` | 6063-6253 | 191 | "4. MULTI-STEP CONFIGURATOR LOGIC" — consultation modal open/close, wizard steps, sliders, submit |
| 8 | `js/compare-sliders.js` | 6254-6509 | 256 | Compare Resolution / Health / Mowing modal image-comparison sliders (drag, pixelation, scenario switching) |
| 9 | `js/villa-timelapse.js` | 6510-6789 | 280 | Villa timelapse player (index switching, autoplay, drag) |
| 10 | `js/model3d-viewer.js` | 6790-7812 | 1023 | Interactive 3D model modal — Three.js procedurally generated house scene (`init3D`, `buildScene`, textures, geometry, organic distortion, terrain height, flight-path spline, resize/cleanup) |
| 11 | `js/hero-canvas.js` | 7813-8053 | 241 | Hero section's small Three.js/canvas flying-drone background animation |
| 12 | `js/header-telemetry.js` | 8054-8093 | 40 | "Live Surveying Telemetry Simulation" — header GPS/RTK ticker (lat/lon/sats/PDOP/accuracy) |
| 13 | `js/i18n.js` | 8094-8914 | 821 | "Multilingual Translation System (i18n)" — `translationDict` (cs/de/en), `initTranslation`, `setLanguage`, language-flag switcher |
| 14 | `js/camera-simulator.js` | 8915-9164 | 250 | "DRONE CAMERA SIMULATOR LOGIC" — ISO/focus/stabilization/filter sliders, viewport crosshair drag |
| 15 | `js/client-zone.js` | 9165-9668 | 504 | "CLIENT ZONE & LOGIN LOGIC" — login modal, client dashboard, dashboard tabs, `openGisFromDashboard`, generic `makeElementDraggable` helper, GIS tool tooltip data (`gisToolHelp`), admin lock toggle, visitor counter, DOMContentLoaded init block that wires up saved flood points and GIS tool button hover binding |

Total JS: 7095 lines across 15 files (matches source script body of 7095 lines
exactly, lines 2574-9668).

## Judgment calls

- **GIS popup templates were NOT split into their own file.** The task
  suggested a `gis-popup-templates.js` for the two `window.open()` +
  `document.write()` calibration/flood-calibration popup builders. In the
  source they are two separate function declarations
  (`writePopupContent()` around line 4446 and `writeFloodPopupContent()`
  around line 5386) that sit deep inside the GIS demo engine, interleaved
  with other calibration/flood functions that read/write the same closure
  state (`calibrationData`, `floodCalibPoints`, `savedFloodPoints`, etc. are
  block-scoped `let`s declared in the same section, not attached to
  `window`). Pulling the two functions into a separate file would require
  either (a) reordering code — which would break the mandated
  "concatenation of all js files must equal the original inline script,
  seam-only whitespace diffs" check — or (b) splicing a third file in the
  middle of the GIS engine at two disconnected extraction points, which adds
  file-boundary churn without a real coherence win, since the two popup
  builders are not adjacent to each other. Given "correctness matters more
  than speed" and the explicit fallback allowance to deviate from the
  suggested module list when the actual code boundaries suggest a cleaner
  split, I kept the whole GIS demo (including both popup builders and their
  embedded HTML-document template literals) in one file,
  `js/gis-demo-engine.js`. This is the largest resulting file (3074 lines)
  but it is fully self-consistent and passes `node --check`.
- Several sections lack a `// ===` divider comment in the source and use a
  plain `// Some Title` single-line comment instead (Compare Resolution/
  Health/Mowing Modal Logic, Villa Timelapse Player Logic, Interactive 3D
  Model Modal Logic, Hero Canvas Drone Animation, Live Surveying Telemetry
  Simulation, Multilingual Translation System). All of these were used as
  the split points; each corresponds to a clean top-level statement boundary
  (verified by inspecting the lines immediately before/after each candidate
  split — all fall on blank lines or closing braces of a preceding top-level
  function/IIFE, never mid-statement).
- `compare-sliders.js` bundles three visually distinct but structurally
  identical features (Resolution / Health / Mowing comparison sliders) into
  one file since they are contiguous and small (256 lines total); splitting
  three ways seemed to add files without adding clarity.
- The GIS tool tooltip data object (`gisToolHelp`) and the generic
  `makeElementDraggable()` helper physically live inside the
  "CLIENT ZONE & LOGIN LOGIC" source section (after line 9165), even though
  `gisToolHelp` is logically about the GIS demo and `makeElementDraggable`
  is a generic utility used elsewhere. They were left in `client-zone.js`
  rather than moved, to preserve the strict line-order-preserving
  concatenation guarantee (moving them would have required non-contiguous
  splicing across files).

## Verification performed

1. **Concatenation diff**: `cat` of all 15 `js/*.js` files in the exact order
   referenced in `index.html`, diffed against source lines 2574-9668
   (the inline script body, excluding the `<script>`/`</script>` tags).
   Result: **identical, zero-line diff** (no whitespace differences at all,
   not even at seams — every split point fell exactly on a line boundary).
2. **Per-file syntax check**: `node --check` on each of the 15 `js/*.js`
   files individually. Result: **all 15 pass**.
3. **CSS diff**: `css/style.css` diffed against source lines 15-119 (the
   `<style>` block content, tags excluded). Result: **identical**.
4. **Markup diff**: source lines 121-2572 (everything from `</head>` through
   the two Three.js CDN `<script>` tags, i.e. the entire `<body>` and its
   modals/markup) diffed against the corresponding span of the new
   `index.html`. Result: **identical**. The head prelude (lines 1-13,
   Tailwind/Bootstrap Icons/fonts CDN tags) was also diffed and is
   identical; only the `<style>` block was replaced by
   `<link rel="stylesheet" href="css/style.css">` and the closing
   `<script>...</script>` was replaced by 15 `<script src="js/...">` tags,
   as required.
5. **Local serve check**: `python3 -m http.server 8099` from the new
   directory; confirmed `index.html`, `css/style.css`,
   `js/gis-demo-engine.js`, `js/client-zone.js`, `images/flags/cz.svg`,
   `images/hero_bg.png`, and `CNAME` all return HTTP 200. All other local
   asset references in the markup (`images/photos/*.jpg|png`,
   `images/flags/*.svg`) were grepped out and confirmed to exist under the
   copied `images/` directory.

## Not verified (known limitation)

No browser was available in this environment, so actual JS *runtime*
behavior was not exercised — only syntax validity (`node --check`) and static
serving were checked. In particular, the following were not runtime-tested:
Three.js 3D model viewer rendering, canvas-based GIS demo interactions
(measure/height/area/profile/slope/flood tools, calibration popups via
`window.open()`), camera simulator sliders, compare-slider drag interactions,
villa timelapse autoplay, hero canvas animation, and the i18n language
switcher's live DOM re-translation. Given that the concatenation diff proved
byte-for-byte equivalence to the original working script (just split across
files that all share global scope, loaded in the original order), runtime
behavior should be unaffected — but this has not been visually confirmed in
a browser.
