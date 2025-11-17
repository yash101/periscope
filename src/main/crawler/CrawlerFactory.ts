import { DocumentSource } from "../../shared/types";
import { ICrawler } from "./ICrawler";
import { LocalFilesystemCrawler, LocalFilesystemCrawlerConfig } from "./LocalFilesystemCrawler";

export const getCrawlerFromConfig = (config: DocumentSource): ICrawler | null => {
  const type = config.module;

  const crawlerTypeMap: Record<string, any> = {
    'local-filesystem': () => createLocalFilesystemCrawler(config)
  };

  // Lots of stuff is unimplemented so handle gracefully.
  if (!crawlerTypeMap[type]) {
    console.warn(`Unknown crawler module: ${type}`);
    return null;
  }

  return crawlerTypeMap[type]();
}

const createLocalFilesystemCrawler = (config: DocumentSource): ICrawler => {
  const crawler = new LocalFilesystemCrawler();
  crawler.open(config as LocalFilesystemCrawlerConfig, null);

  return crawler;
}
