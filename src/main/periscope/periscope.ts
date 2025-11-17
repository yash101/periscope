/**
 * Architecture:
 * Fetcher -> [We create an Indexable object] -> Loader -> Indexer
 */

import { ConfigManager } from "../config/ConfigManager";
import { getCrawlerFromConfig } from "../crawler/CrawlerFactory";
import { SearchEngine } from "./engine";

export class Periscope {
  configManager: ConfigManager | null = null;
  searchEngine: SearchEngine | null = null;

  constructor() {
  }

  // Start all components
  run(): void {
    // Will load config internally
    this.configManager = new ConfigManager();

    // Start components
    this.searchEngine = new SearchEngine();
    this.searchEngine.open(this.configManager.get());

    // Load crawlers
    this.loadCrawlers();

    // Load document loaders
    this.loadDocumentLoaders();

    // Load annotators

    // Load indexers
  }

  loadCrawlers(): void {
    const config = this.configManager?.get();

    if (!config) {
      throw new Error("ConfigManager not initialized");
    }

    // Load crawlers from config
    for (const crawlerCfg of (config.sources || [])) {
      const crawler = getCrawlerFromConfig(crawlerCfg);
      if (crawler) {
        this.searchEngine?.addFetcher(crawler);
      }
    }
  }

  loadDocumentLoaders(): void {

  }
}
