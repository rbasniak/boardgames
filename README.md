# Boardgames · Field Manuals

Static, bilingual board-game references. The first entry is **Sniper Elite: The Board Game**, including **Eagle’s Nest**, **Escalation**, and **Operation Kraken**.

## Run

```sh
npm start
# http://localhost:8000
```

No build step, runtime dependencies, API keys or remote assets. Serve over HTTP; ES modules do not reliably work via `file://`.

## Included

- General game index and dedicated Sniper Elite index.
- Six maps; independent Eagle’s Nest loadout/allied-sniper modules.
- Escalation ranks, public mission/advantage choices and loadout/elite counts, with budget and map/dependency validation.
- Versioned localStorage settings, role, language and setup checklist; settings are synchronised across tabs. Configuration changes clear stale setup checks. Secrets such as objectives, loadout cards and Ghost identity are never requested.
- Iconography extracted from the supplied manuals; side-specific quick reference, detailed actions, equipment reference, victory conditions and configuration-aware setup.
- Centralised illustrated examples and source links to exact manual pages.
- All four original PDFs and all 52 page images, with an in-app page browser.
- Instant PT-BR / EN-US switching, mobile layouts, keyboard focus, print styles and rule search.

## Scope and source limitations

The interactive guide covers **multiplayer (2–4 players)**. The supplied PDFs include expansion solo variants, but not the base solo rulebook. Solo pages are preserved in the original-manual reader and intentionally excluded from multiplayer instructions.

The supplied core PDF does not reproduce all six base specialist cards in full. Escalation describes upgrade differences rather than every card’s complete numeric/trigger text. Relevant sections identify when the physical card is needed instead of inventing those details. Original artwork and printed pages remain English; the interface and adapted explanations are bilingual.

The selection of a box enables its relevant modules; map-specific rules do not leak to other maps. Selecting Escalation enables Special Ops and requires assigning the selected rank’s edges to both sides. An incomplete edge selection is visibly marked. Choosing specific upgraded loadout/elite cards still happens at the normal physical setup step.

## Validate

```sh
npm test
```

Tests cover configuration normalization, expansion/map dependencies, edge budgets, turn timers, loadout availability, source/page existence, bilingual rendering, all manual routes, UI event handlers, role deep links, search and persistence. Render tests use a minimal DOM harness and **are not browser layout tests**. Visual browser QA was not possible in the authoring environment: the browser download failed. Extracted diagrams/icons were visually inspected separately.

## Files

- `index.html` — general collection entry.
- `sniper-elite/index.html` — game entry, hash-based sections and deep links.
- `sniper-elite/rules.js` — bilingual rules, sources, filtering and configuration model.
- `sniper-elite/app.js` — views and interaction.
- `sniper-elite/style.css` — shared visual style and responsive layout.
- `sniper-elite/manuals/` — the four provided original PDFs.
- `sniper-elite/assets/` — extracted WebP pages, covers, map previews, icons and examples.
- `scripts/extract-assets.py` — deterministic extraction (requires PyMuPDF and Pillow).

To rebuild assets, pass a directory containing the original filenames:

```sh
python scripts/extract-assets.py /path/to/uploads
```

## GitHub Pages

The source can be served directly from the root of this branch. No deployment is automatically enabled by this commit. In the repository’s Pages settings, select the desired branch and `/ (root)` when ready to publish. All links are relative to the module URL, so a `/boardgames/` project-site prefix works.

## Adding another game

Create a sibling game directory with its own rule data and storage key, then add its card to the general index in `app.js`. Sniper Elite content and mission settings remain namespaced separately.

## Credits and provenance

Game design: Roger Tankersley and David Thompson. Published by Rebellion Unplugged. Sniper Elite names, logos and artwork © Rebellion, as credited in each supplied PDF. This is an unofficial reference, not an official translation or rules revision. PDFs and extracted images retain their original rights; no licence is granted over them by this repository.

Source PDFs provided for this task:

| Local file | Supplied source |
|---|---|
| `core.pdf` | `SE Core _Rulebook1_webquality3.pdf` |
| `eagle.pdf` | `SE Expansion _Rulebook_webquality2.pdf` |
| `escalation.pdf` | `Sniper_Elite_Escalation_Rulebook.pdf` |
| `kraken.pdf` | `Sniper_Elite_Operation_Kraken_Rulebook.pdf` |
