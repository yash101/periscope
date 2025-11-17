import { DocumentSource } from "../../shared/types";
import { delay } from "../utils/Delay";
import { FilePayload, hashFilePayload, ICrawler } from "./ICrawler";
import fs from 'fs/promises';
import path from 'path';
import watcher, { AsyncSubscription } from '@parcel/watcher';

export class LocalFilesystemCrawler extends ICrawler {
  private config!: LocalFilesystemCrawlerConfig;
  private paths: string[] = [];
  private queue: string[] = [];
  private watchers: AsyncSubscription[] = [];
  private updateCallbacks: Set<(file: FilePayload) => void> = new Set();
  private emptyBuffer = Buffer.from([]);
  private hasFinished: boolean = false;

  async open(config: LocalFilesystemCrawlerConfig, checkpoint: any): Promise<void> {
    this.config = config;

    // Enforce defaults
    this.config.options.maxFileSize = this.config.options.maxFileSize ?? 128 * 1024 * 1024; // 128MB
    this.config.options.delay = this.config.options.delay ?? 50; // 50ms wait before processing next file
    this.config.options.paths = this.config.options.paths ?? [process.cwd()];
    this.config.options.paths = Array.isArray(this.config.options.paths)
      ? this.config.options.paths : [this.config.options.paths];

    this.paths = this.config.options.paths as string[];

    if (checkpoint &&
      (this.paths).sort().join(',') === (checkpoint.paths).sort().join(',')
    ) {
      this.paths = checkpoint.paths;
      this.queue = checkpoint.queue;
    }

    this.watchers = await Promise.all(this.paths.map(async p => {
      return await watcher.subscribe(p, async (err, events) => {
        if (err) {
          console.error("Watcher error:", err);
          return;
        }
        
        for (const ev of events) {
          const stat = await fs.stat(ev.path);
          if (!stat.isFile()) {
            continue; // We only care about files
          }

          const fp = new FilePayload(ev.path, this.emptyBuffer, '', {}, Math.floor(stat.mtimeMs / 1000), null);
          if (stat.size > this.config.options.maxFileSize!) {
            console.warn(`Skipping file ${ev.path} due to size ${stat.size} bytes exceeding maxFileSize ${this.config.options.maxFileSize} bytes`);
            fp.deleted = true; // Mark as deleted since we are skipping it
          } else {
            const fbuf = await fs.readFile(ev.path);
            fp.content = fbuf;
            hashFilePayload(fp);
          }

          if (ev.type === 'delete') {
            fp.deleted = true;
          }

          for (const cb of this.updateCallbacks) {
            try {
              cb(fp);
            } catch (e) {
              console.error('Error in crawl callback: ', e);
            }
          }
        }
      });
    }));
  }

  async *crawl(): AsyncGenerator<FilePayload> {
    while (this.queue.length > 0) {
      await delay(this.config.options.delay! * (this.hasFinished ? 10 : 1)); // Slow down if we've finished a full crawl

      const filePath = this.queue.shift()!;
      // If directory, enqueue its files
      // If file, yield it

      const stats = await fs.stat(filePath);
      if (stats.isSymbolicLink()) {
        continue; // Skip symbolic links (maybe we can add an option later)
      } else if (stats.isFile()) {
        if (stats.size > this.config.options.maxFileSize!) {
          console.warn(`Skipping file ${filePath} due to size ${stats.size} bytes exceeding maxFileSize ${this.config.options.maxFileSize} bytes`);
          continue;
        }

        const content = await fs.readFile(filePath);
        const fp = new FilePayload(filePath, content, '', {
          size: stats.size,
        }, Math.floor(stats.mtimeMs / 1000), null);
        hashFilePayload(fp);
        yield fp;
      } else if (stats.isDirectory()) {
        const entries = await fs.readdir(filePath);
        for (const entry of entries) {
          this.queue.push(path.join(filePath, entry));
        }
      } else {
        continue; // Skip other types (sockets, devices, etc)
      }

      if (this.queue.length === 0) {
        this.hasFinished = true;
        this.queue = [...this.paths]; // Re-enqueue root paths to keep crawling
      }
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.watchers.map(w => w.unsubscribe()));
    this.watchers = [];
  }

  onUpdate(callback: (file: FilePayload) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  async checkpoint(): Promise<any> {
    return {
      paths: this.paths,
      queue: this.queue,
      hasFinished: this.hasFinished, // True if crawl has ever finished. If crawl is finished we can slow down polling etc
    };
  }
}

export interface LocalFilesystemCrawlerConfig extends DocumentSource {
  options: {
    paths: string | string[];
    delay: number | null | undefined;
    maxFileSize: number | null | undefined; // Default 128MB
  }
}
