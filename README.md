# Periscope

A lightweight local search app for code, notes, and documents built with Electron, SQLite FTS5, and React.

## Features

- **Lightning-fast full-text search** powered by SQLite FTS5
- **Local-only** - no cloud dependencies, ITAR-friendly
- **Cross-platform** - works on macOS, Windows, and Linux
- **Tray-based interface** - quick access via global hotkey (Cmd+Shift+Space)
- **Document loaders** for Markdown (.md) and Jupyter notebooks (.ipynb)
- **File watching** - automatic indexing of file changes
- **Extensible architecture** - easy to add new document types

## Architecture

```
src/
├── main/              # Electron main process
│   ├── database/      # SQLite database management
│   ├── indexer/       # File indexing and watching
│   ├── loaders/       # Document type loaders
│   ├── config/        # Configuration management
│   └── utils/         # Logging and utilities
├── preload/           # Electron preload scripts
├── renderer/          # React UI components
└── shared/            # Shared TypeScript types
```

## Setup

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

## Configuration

Periscope stores its configuration and data in `~/.periscope/`:

- `config.json` - Application settings
- `index.db` - SQLite database with FTS5 search index
- `log/` - Application logs

### Default Configuration

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
- Supports `.md` and `.markdown` files
- Extracts titles from H1 headers or frontmatter
- Indexes clean text content
- Extracts metadata: headings, links, word count

### Jupyter Loader
- Supports `.ipynb` files
- Indexes both markdown and code cells
- Includes output text from executed cells
- Extracts metadata: cell counts, kernel info

### Adding New Loaders

1. Create a new loader class extending `ILoader`
2. Implement required methods: `getFileExtensions()`, `canLoad()`, `load()`
3. Register it in `LoaderRegistry`

```typescript
export class MyLoader extends ILoader {
  getFileExtensions(): string[] {
    return ['.ext'];
  }

  canLoad(filePath: string): boolean {
    return filePath.endsWith('.ext');
  }

  async load(filePath: string): Promise<LoaderResult> {
    // Implementation
  }
}
```

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

## License

MIT License - see LICENSE file for details
I can't tell if I have too much code or Alzheimer's. Either way, hopefully this project solves that issue.
