
/*
Architecture:
Fetcher -> [We create an Indexable object] -> Loader -> Indexer
*/

import { FilePayload, IFetcher } from "../fetcher/IFetcher";
import { Indexable } from '../indexer/Indexable';
import { ILoader } from "../loaders/ILoader";

export class Periscope {
  private fetchers: IFetcher[] = [];
  private loaders: ILoader[] = [];
  private loaderMap: Map<string, ILoader> = new Map(); // Map file extension to loader

  addFetcher(fetcher: IFetcher) {
    this.fetchers.push(fetcher);
    fetcher.onUpdate((file) => {
    });
  }

  addLoader(loader: ILoader, extensions: string[]) {
    // TODO: add loaders
  }

  async indexFile(file: FilePayload) {
    const indexable: Indexable = new Indexable();
    indexable.uri = file.uri;

    // Determine appropriate loader based on file extension
    const fileExtension = file.uri.split('.').pop() || '';
    if (!this.loaderMap.has(`.${fileExtension}`)) {
      console.warn(`No loader found for file extension: .${fileExtension}`);
      return;
    }
    const loader: ILoader = this.loaderMap.get(`.${fileExtension}`)!;

    await loader.extract(file, indexable);
  }
}
