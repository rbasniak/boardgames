# Field Manual

A dependency-free, bilingual (EN-US / PT-BR) interactive rulebook for Sniper Elite. Run `python server.py` and visit `http://127.0.0.1:8765`. The local-only server also opens the supplied manual PDFs through the guide's source links without copying them into the project. You can open `index.html` directly, but PDF references are available only through the local server.

The Sniper Elite guide covers multiplayer rules only. Its map, expansion, Sniper, and optional-rule selections filter the relevant setup steps, components, map rules, turns, examples, and glossary. Optional Special Ops lets players select a rank and allocate exactly that many edges per side; repeated edge types are supported. Match settings and setup checklist progress are saved in browser `localStorage`. Changing the map, expansions, Sniper choice, rank, or optional rules clears checklist progress; **Uncheck all** clears only the checklist and keeps the match configuration, language, and team.

If the PDFs move, update their paths in `server.py` and the direct-file paths in `app.js`. The map previews and icon crops in `assets/maps/` and `assets/icons/` were extracted from the supplied manuals.
