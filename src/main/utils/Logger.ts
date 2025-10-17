import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
}

export class Logger {
  private logDir: string;
  private currentLogFile: string;
  private minLevel: LogLevel;

  constructor(logDir: string, minLevel: LogLevel = LogLevel.INFO) {
    this.logDir = logDir;
    this.minLevel = minLevel;
    this.currentLogFile = this.getCurrentLogFile();
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return join(this.logDir, `${date}.log`);
  }

  async log(level: LogLevel, message: string, data?: any): Promise<void> {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    // Log to console
    this.logToConsole(entry);

    // Log to file
    await this.logToFile(entry);
  }

  async debug(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, message, data);
  }

  async info(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, message, data);
  }

  async error(message: string, error?: any): Promise<void> {
    await this.log(LogLevel.ERROR, message, error);
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level].padEnd(5);
    const logMessage = `[${timestamp}] ${levelStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data || '');
        break;
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      // Check if we need to rotate to a new file
      const currentFile = this.getCurrentLogFile();
      if (currentFile !== this.currentLogFile) {
        this.currentLogFile = currentFile;
      }

      const timestamp = entry.timestamp.toISOString();
      const levelStr = LogLevel[entry.level].padEnd(5);
      let logLine = `[${timestamp}] ${levelStr} ${entry.message}`;

      if (entry.data) {
        if (entry.data instanceof Error) {
          logLine += `\\n${entry.data.stack}`;
        } else if (typeof entry.data === 'object') {
          logLine += `\\n${JSON.stringify(entry.data, null, 2)}`;
        } else {
          logLine += ` ${entry.data}`;
        }
      }

      logLine += '\\n';

      await fs.appendFile(this.currentLogFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async rotateOldLogs(maxDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDays);

      for (const file of logFiles) {
        const filePath = join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }
}