# Periscope

Periscope is a lightweight, local search app for your code, notes, documents and literally anything you can throw at it.
Build with a modular architecture, it leverages Electron for cross-platform desktop support.

## Overview

Currently being built and supported:
* Electron: UI
* SQLite FTS5: Full-text search engine
* React (Vite): Frontend UI
* TypeScript: Codebase
* Supported document types:
  * Markdown (.md)
  * Jupyter Notebooks (.ipynb)
  * Plain text (.txt)
  * HTML (.html, .htm, etc.)
* Supported platforms:
  * macOS
  * Windows
  * Linux
* Supported document discovery / crawling:
  * Local filesystem crawling
    * File watching for automatic re-indexing on changes

## Features

- **Lightning-fast full-text search** powered by SQLite FTS5
- **Local-only** - no cloud dependencies, ITAR-friendly
  * It's possible to add cloud features later:
    * Cloud sync (e.g., Dropbox, Google Drive)
    * Cloud search (e.g., Elasticsearch, Algolia)
    * Cloud crawling (e.g., Google Drive, OneDrive, GitHub, etc.)
- **Cross-platform** - works on macOS, Windows, and Linux
- **Tray-based interface** - quick access via global hotkey (Cmd+Shift+Space)
- **Document loaders**
  * In progress:
    * Plain text (.txt)
    * HTML (.html, .htm, etc.)
    * Markdown (.md)
    * Jupyter Notebooks (.ipynb)
  * Planned:
    * PDF (.pdf)
    * Microsoft Word (.docx)
    * Rich Text Format (.rtf)
    * Code files, via Doxygen (.js, .py, .java, etc.)
    * Emails (.eml, .msg)
    * Images, via OCR or annotation (.png, .jpg, .tiff, etc.)
    * Others as requested
- **File watching** - automatic indexing of file changes

## Architecture
```text
src/
├── config/            # Application and environment configuration
├── extractor/         # Content extraction (text, OCR, metadata)
├── fetcher/           # Document fetchers (local, HTTP, cloud APIs)
├── indexer/           # Indexing (SQLite + FTS5), LMDB (yash's custom search engine teehee), OpenSearch, etc.
├── integration/       # Integrations with external services
├── launch/            # App startup, CLI, and bootstrap code (to be merged with periscope/)
├── loaders/           # Document loaders/parsers for supported formats
├── periscope/         # Core orchestration and domain logic
└── utils/             # Shared utilities, logging, and helpers
```

## Setup (this probably needs to be updated later)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Development:**
   ```bash
   npm run dev
   ```
   This starts the build watchers and Electron in development mode.

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Package the app:**
   ```bash
   npm run package
   ```

## Configuration (this probably needs to be updated later)

Periscope stores its configuration and data in `~/.periscope/`:

- `config.json` - Application settings
- `index.db` - SQLite database with FTS5 search index
- `log/` - Application logs

### Default Configuration (ignore this, check the code. it'll also install the default config on first run)

```json
{
  "searchPaths": ["~/Documents", "~/Desktop"],
  "excludePatterns": ["node_modules", ".git", ".DS_Store"],
  "hotkey": "CommandOrControl+Shift+Space",
  "theme": "system",
  "maxResults": 50,
  "indexingEnabled": true
}
```

## Document Loaders

### Markdown Loader
* Renders markdown to HTML
* Calls the HTML extractor to get clean and structured text for indexing


### Jupyter Loader
* Renders Jupyter Notebooks to markdown and code snippets
* Calls the markdown and code extractors to get clean and structured text for indexing
* Probably will do more things later, I love Jupyter notebooks so this plugin will receive some love

## Global Hotkey

The default hotkey `Cmd+Shift+Space` (or `Ctrl+Shift+Space` on Windows/Linux) opens the search interface. This can be customized in the configuration.

## Building

### Development Scripts

- `npm run dev` - Start development with hot reload
- `npm run build` - Build all components
- `npm run build:watch` - Build with file watching
- `npm run typecheck` - Run TypeScript type checking

### Architecture Notes

- **Main Process**: Handles file system operations, database, and system integration
- **Renderer Process**: React-based UI with Tailwind CSS
- **Preload Script**: Secure IPC bridge between main and renderer
- **Database**: SQLite with FTS5 for full-text search
- **File Watching**: Automatic indexing using chokidar

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Motivation

I can't tell if I have too much code or Alzheimer's. Either way, hopefully this project solves that issue.

## License

AGPLv3 - see LICENSE file for details

