/**
 * SearchEngine class
 * 
 * This class actually implements the search engine and ties back to
 * Periscope app. The search engine is implemented separately to allow
 * decoupling from the main app logic and possible reuse in large scale
 * applications.
 */

import path from "path";
import { IAnnotator } from "../annotator/IAnnotator";
import { FilePayload, ICrawler } from "../crawler/ICrawler";
import { IIndexer } from "../indexer/IIndexer";
import { ILoader } from "../loaders/ILoader";

import AsyncMux, { AsyncMuxOut } from '@yash101/mimo';
import { Indexable } from "../indexer/Indexable";

export class SearchEngine {
  // We need fetchers, indexers, loaders and possibly other components here.
  private fetchers: ICrawler[] = [];
  private indexers: IIndexer[] = [];
  private loaders: ILoader[] = [];
  private annotators: IAnnotator[] = [];
  private fileInputMux: AsyncMux<FilePayload> = new AsyncMux();
  private crawlOutput: AsyncMuxOut<FilePayload> | null = null;

  private loaderMap: Map<string, ILoader> = new Map(); // Map file extension to loader

  constructor() {
  }

  open(config: unknown): void {
  }

  addFetcher(fetcher: ICrawler) {
    this.fetchers.push(fetcher);
    fetcher.onUpdate((file: FilePayload) => {
      this.fileInputMux.push(file);
    });

    const gen = fetcher.crawl();
    this.fileInputMux.in(gen);
  }

  addLoader(loader: ILoader, extensions: string[]) {
    for (const extension of extensions) {
      if (!this.loaderMap.has(extension)) {
        this.loaderMap.set(extension, loader);
      }
    }

    this.loaders.push(loader);
  }

  addIndexer(indexer: IIndexer) {
    this.indexers.push(indexer);
  }

  async run(): Promise<void> {
    this.crawlOutput = this.fileInputMux.out();
    this.indexerLoop(); // don't await, run in background. Maybe store the promise?
  }

  async indexerLoop() {
    if (!this.crawlOutput) {
      throw new Error("Crawl output not initialized");
    }

    for await (const file of this.crawlOutput.generator) {
      // Load the file using appropriate loader
      const ext = path.extname(file.uri).toLowerCase();
      const loader = this.loaderMap.get(ext);
      if (!loader)
        continue;

      const indexable: Indexable = new Indexable();
      indexable.uri = file.uri;
      indexable.metadata = file.metadata;

      loader.extract(file, indexable);

      // Annotate the indexable using all annotators
      for (const annotator of this.annotators) {
        await annotator.annotate(indexable);
      }

      // Index the file using all indexers
      for (const indexer of this.indexers) {
        await indexer.index(indexable);
      }
    };
  }

  stop(): void {
    this.crawlOutput?.stop();
  }
}
