import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { ConfigData } from '../../shared/types';

export class ConfigManager {
  private configPath: string;
  private dataDir: string;
  private config: ConfigData;

  constructor() {
    this.dataDir = join(homedir(), '.periscope');
    this.configPath = join(this.dataDir, 'config.json');
    
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }

    this.config = this.getDefaultConfig();
  }

  async load(): Promise<ConfigData> {
    try {
      if (existsSync(this.configPath)) {
        const configContent = await fs.readFile(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(configContent) as Partial<ConfigData>;
        
        // Merge with defaults to ensure all properties exist
        this.config = {
          ...this.getDefaultConfig(),
          ...loadedConfig,
        };
      }
    } catch (error) {
      console.error('Error loading config, using defaults:', error);
      this.config = this.getDefaultConfig();
    }

    return this.config;
  }

  async save(config: Partial<ConfigData>): Promise<void> {
    this.config = {
      ...this.config,
      ...config,
    };

    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  get(): ConfigData {
    return { ...this.config };
  }

  private getDefaultConfig(): ConfigData {
    return {
      searchPaths: [
        join(homedir(), 'Documents'),
        join(homedir(), 'Desktop'),
      ],
      excludePatterns: [
        'node_modules',
        '.git',
        '.DS_Store',
        'Thumbs.db',
        '*.tmp',
        '*.temp',
        '*.log',
        '.vscode',
        '.idea',
        'dist',
        'build',
        'target',
        '.cache',
        '.npm',
        '.yarn',
      ],
      hotkey: 'CommandOrControl+Shift+Space',
      theme: 'system',
      maxResults: 50,
      indexingEnabled: true,
    };
  }

  getDataDir(): string {
    return this.dataDir;
  }

  getLogDir(): string {
    const logDir = join(this.dataDir, 'log');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    return logDir;
  }
}