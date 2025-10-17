import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, shell } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { DatabaseManager } from './database/DatabaseManager';
import { ConfigManager } from './config/ConfigManager';
import { LoaderRegistry } from './loaders';
import { Indexer } from './indexer/Indexer';
import { Logger, LogLevel } from './utils/Logger';
import { UnixSocketServer, UnixSocketAPI } from './utils/UnixSocketServer';
import { SearchQuery, SearchResult, Document, IndexStats, ConfigData, IpcEvents } from '../shared/types';

class PeriscopeApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private db: DatabaseManager;
  private config: ConfigManager;
  private indexer: Indexer;
  private logger: Logger;
  private loaderRegistry: LoaderRegistry;
  private unixSocketServer: UnixSocketServer | null = null;

  constructor() {
    this.config = new ConfigManager();
    this.logger = new Logger(this.config.getLogDir(), LogLevel.INFO);
    this.db = new DatabaseManager();
    this.loaderRegistry = new LoaderRegistry();
    
    // Initialize indexer with config
    this.indexer = new Indexer(
      {
        searchPaths: [],
        excludePatterns: [],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        batchSize: 10,
      },
      this.db,
      this.loaderRegistry
    );

    this.setupApp();
  }

  private setupApp(): void {
    // Handle app ready
    app.whenReady().then(() => {
      this.initialize();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      // On macOS, keep app running even when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle app quit
    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  private async initialize(): Promise<void> {
    try {
      await this.logger.info('Periscope starting...');
      
      // Load configuration
      const configData = await this.config.load();
      
      // Update indexer options
      this.indexer = new Indexer(
        {
          searchPaths: configData.searchPaths,
          excludePatterns: configData.excludePatterns,
          maxFileSize: 10 * 1024 * 1024,
          batchSize: 10,
        },
        this.db,
        this.loaderRegistry
      );

      // Create tray
      this.createTray();
      
      // Create window (hidden initially)
      this.createWindow();
      
      // Register global shortcut
      this.registerGlobalShortcut(configData.hotkey);
      
      // Setup IPC handlers
      this.setupIpcHandlers();
      
      // Start indexing if enabled
      if (configData.indexingEnabled) {
        await this.indexer.start();
      }

      // Start Unix socket server (only on Unix-like systems)
      if (process.platform !== 'win32') {
        await this.startUnixSocketServer();
      }

      await this.logger.info('Periscope started successfully');
    } catch (error) {
      await this.logger.error('Failed to initialize Periscope', error);
      app.quit();
    }
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // Start hidden
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
      },
    });

    // Load the renderer
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Hide window when it loses focus
    this.mainWindow.on('blur', () => {
      if (this.mainWindow && this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray(): void {
    // Create tray icon
    const icon = nativeImage.createFromPath(join(__dirname, '../../assets/tray-icon.png'));
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Search',
        click: () => this.showWindow(),
      },
      {
        label: 'Start Indexing',
        click: () => this.indexer.start(),
        enabled: !this.indexer.getStatus().running,
      },
      {
        label: 'Stop Indexing',
        click: () => this.indexer.stop(),
        enabled: this.indexer.getStatus().running,
      },
      { type: 'separator' },
      {
        label: 'Preferences...',
        click: () => {
          // TODO: Open preferences window
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Periscope - Local Search');
    
    // Show window on tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private registerGlobalShortcut(accelerator: string): void {
    globalShortcut.unregisterAll();
    
    const success = globalShortcut.register(accelerator, () => {
      this.toggleWindow();
    });

    if (!success) {
      this.logger.warn(`Failed to register global shortcut: ${accelerator}`);
    }
  }

  private setupIpcHandlers(): void {
    // Search
    ipcMain.handle('search:query', async (_, query: SearchQuery): Promise<SearchResult[]> => {
      try {
        const results = this.db.search(query.query, query.limit, query.offset);
        
        return results.map(row => ({
          document: {
            id: row.id,
            path: row.path,
            title: row.title,
            content: row.content,
            contentType: row.content_type,
            size: row.size,
            modifiedAt: new Date(row.modified_at),
            createdAt: new Date(row.created_at),
            metadata: JSON.parse(row.metadata),
          },
          score: row.score,
          snippet: row.snippet,
          highlights: [], // TODO: Calculate highlights from snippet
        }));
      } catch (error) {
        await this.logger.error('Search error', error);
        return [];
      }
    });

    ipcMain.handle('search:index-stats', async (): Promise<IndexStats> => {
      const stats = this.db.getStats();
      return {
        totalDocuments: stats.totalDocuments,
        totalSize: stats.totalSize,
        lastIndexed: stats.lastIndexed,
        indexedPaths: this.db.getAllPaths(),
      };
    });

    // Config
    ipcMain.handle('config:get', async (): Promise<ConfigData> => {
      return this.config.get();
    });

    ipcMain.handle('config:set', async (_, configData: Partial<ConfigData>): Promise<void> => {
      await this.config.save(configData);
      
      // Update hotkey if changed
      if (configData.hotkey) {
        this.registerGlobalShortcut(configData.hotkey);
      }
    });

    // Indexer
    ipcMain.handle('indexer:start', async (): Promise<void> => {
      await this.indexer.start();
    });

    ipcMain.handle('indexer:stop', async (): Promise<void> => {
      this.indexer.stop();
    });

    ipcMain.handle('indexer:status', async () => {
      return this.indexer.getStatus();
    });

    // Files
    ipcMain.handle('files:open', async (_, path: string): Promise<void> => {
      await shell.openPath(path);
    });

    ipcMain.handle('files:reveal', async (_, path: string): Promise<void> => {
      shell.showItemInFolder(path);
    });

    // Window
    ipcMain.on('window:hide', () => {
      this.hideWindow();
    });

    ipcMain.on('window:show', () => {
      this.showWindow();
    });

    ipcMain.on('window:toggle', () => {
      this.toggleWindow();
    });
  }

  private showWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private hideWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  private toggleWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.hideWindow();
      } else {
        this.showWindow();
      }
    }
  }

  private async startUnixSocketServer(): Promise<void> {
    try {
      const socketPath = join(this.config.getDataDir(), 'api.sock');
      
      const api: UnixSocketAPI = {
        search: async (query: string) => {
          const results = this.db.search(query, 50, 0);
          return results.map(row => ({
            id: row.id,
            path: row.path,
            title: row.title,
            contentType: row.content_type,
            size: row.size,
            modifiedAt: new Date(row.modified_at),
            snippet: row.snippet,
            score: row.score,
          }));
        },
        
        getStats: async () => {
          return this.db.getStats();
        },
        
        ping: async () => {
          return 'pong';
        },
      };

      this.unixSocketServer = new UnixSocketServer(socketPath, api, this.logger);
      await this.unixSocketServer.start();
    } catch (error) {
      await this.logger.error('Failed to start Unix socket server', error);
    }
  }

  private async cleanup(): Promise<void> {
    globalShortcut.unregisterAll();
    
    if (this.unixSocketServer) {
      await this.unixSocketServer.stop();
    }
    
    if (this.indexer) {
      this.indexer.stop();
    }
    
    if (this.db) {
      this.db.close();
    }
  }
}

// Create app instance
new PeriscopeApp();