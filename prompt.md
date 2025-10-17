# Vibe coding mess lol, tech debt gomma bite me later

Project: Periscope
Goal: A lightweight local search app for code, notes, and documents.

Base stack:
- Electron app (cross-platform, local only)
- SQLite (FTS5)
- Node/TypeScript backend
- Code structure for the background code and the UI
- A way to watch for file changes in a directory

What I'm building: a search engine for things, like code and more.

Some code directories to add:

Use a modular directory structure

src/
  main/ (Electron main process)
  renderer/ (UI)
  loaders/
  preview/
  integrations/
  indexer/
  utils/

1. loaders - each file exports a class which extends ILoader, which transforms a document to indexable text
2. preview - document preview for different types of documents
3. integrations - utility integrations for use: OCR, LLM transformers, Doxygen, etc.
4. indexer - indexes / searches
5. sources/{filesystem, github, gitlab} (only work on filesystem for now)

Database + config:
Store in ~/.periscope/
config.json or config.yaml
Create one SQLite DB: index.db.
Use migrations to handle schema changes.

Use React + Tailwind
The UI should default to hidden; use Electron’s Tray API to show a search bar popup (like Raycast/Spotlight).

Entirely local, no HTTP server, should be ITAR friendly.
Implement a simple IPC bridge for renderer ↔ main using Electron’s contextBridge.
Support a UNIX socket API on systems with support for that in ~/.periscope/api.sock

Build tasks:
Add npm run dev, npm run build, and npm run package.
Include scripts to auto-rebuild preload + main.

Prefer TypeScript interfaces over loose JS objects.
Add a minimal logger (console + rotating file) -> ~/.periscope/log/[date].log

Ensure tray search bar supports a global hotkey (Cmd+G or something else which is easy but less popular).

Loaders: each loader class should export [X]Loader class, extending the ILoader class
ILoader should also have a method to get common file extensions: .getFileExtensions() for easier config.

Go ahead and build some document indexing for:
* markdown (.md | .markdown)
* jupyter (.ipynb)