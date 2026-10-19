# Field Manual

A dependency-free, bilingual (EN-US / PT-BR) interactive rulebook for Sniper Elite. Run `python server.py` and visit `http://127.0.0.1:8765`. The local-only server also opens the supplied manual PDFs through the guide's source links without copying them into the project. You can open `index.html` directly, but PDF references are available only through the local server.

The Sniper Elite guide covers multiplayer rules only. Its map and expansion selections filter the relevant setup steps, components, map rules, turns, and examples. The selected expansions, map, language, team, and setup checklist progress are saved in browser `localStorage`. Changing the map or expansion set clears checklist progress; **Uncheck all** clears only the checklist and keeps the other preferences.

If the PDFs move, update their paths in `server.py` and the direct-file paths in `app.js`. The map previews and icon crops in `assets/maps/` and `assets/icons/` were extracted from the supplied manuals.
