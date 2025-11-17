import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { ConfigData } from '../../shared/types';

export const defaultConfig: ConfigData = {
  sources: [
    {
      module: 'fs',
      options: {
        paths: [
          homedir(),
        ],
        ignorePatterns: [
          '^\\.', // dotfiles
        ],
        recursive: true,
      }
    }
  ],
  hotkey: 'CommandOrControl+Shift+Space',
  indexDebounceDelay: 300, // 5 minutes before re-indexing
  maxResults: 100,
  indexers: [
    {
      module: 'lmdb',
      options: {
      },
    },
    {
      module: 'sqlite3-fts5',
      options: { }
    }
  ],
  documentLoaders: [
    {
      module: 'md',
      extensions: ['.md', '.markdown', '.txt', '.mdown'],
      options: {
      },
      priority: 10,
    },
    {
      module: 'pdf',
      extensions: ['.pdf'],
      options: {
      },
      priority: 7,
    },
    {
      module: 'msft',
      extensions: ['.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls'],
      options: {
      },
      priority: 9,
    },
    {
      module: 'html',
      extensions: ['.html', '.htm'],
      options: {
      },
      priority: 8,
    },
    {
      module: 'pydoc',
      extensions: ['.py', '.pyw'],
      priority: 10,
      options: {
        extractDocstrings: true,
        includeTypeHints: true,
        includeImports: false,
      },
    },
    {
      module: 'tsdoc',
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
      priority: 9,
      options: {
        parseJSX: true,
        extractComments: true,
        includeExports: true,
      },
    },
    {
      module: 'doxygen', // generic catch-all for many source file types
      extensions: [
        // C / C++
        '.c', '.cc', '.cpp', '.cxx', '.c++', '.h', '.hh', '.hpp', '.hxx', '.ipp',
        // Objective-C
        '.m', '.mm',
        // Java
        '.java',
        // C#
        '.cs',
        // JavaScript / TypeScript (prob won't be used since we have tsdoc above)
        '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
        // Python
        '.py', '.pyw',
        // PHP
        '.php', '.phtml', '.php3', '.php4', '.php5',
        // Go, Rust
        '.go', '.rs',
        // Kotlin, Scala
        '.kt', '.kts', '.scala',
        // Ruby, Perl
        '.rb', '.pl', '.pm',
        // Swift
        '.swift',
        // Shell / scripts
        '.sh', '.bash', '.zsh',
        // XML/HTML/JSON/YAML
        '.xml', '.json', '.yaml', '.yml',
        // Other common source/markup
        '.asm', '.s', '.sql', '.tex', '.md', '.rst',
        // Languages used in data science / math
        '.r', '.R', '.m', // note: '.m' may be Objective-C or MATLAB depending on context
        '.v', '.sv', '.vhd', '.vhdl', // Hardware description languages
      ],
      options: {},
      priority: 1,
    },
  ],
  readOnly: false,
  enableUnixSocket: true,
};

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
    return this.config;
  }

  private getDefaultConfig(): ConfigData {
    return JSON.parse(JSON.stringify(defaultConfig)); // Deep copy
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
