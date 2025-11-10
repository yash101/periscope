/*
 */
import { ILoader, LoaderResult } from './ILoader';
import { DocumentLoader } from '../../shared/types';
import { FilePayload } from '../fetcher/IFetcher';
import { Indexable } from '../indexer/Indexable';
import { MarkdownExtractor } from '../extractor/MarkdownExtractor';


export class MarkdownLoader extends ILoader {
  extractor: MarkdownExtractor;

  constructor() {
    super();
    this.extractor = new MarkdownExtractor();
  }

  async open(config: DocumentLoader): Promise<void> {
    return; // No specific initialization needed for MarkdownLoader
  }

  async extract(file: FilePayload, indexable: Indexable): Promise<LoaderResult> {
    // Normalize file content to a string. If content is a Buffer, decode with utf-8; otherwise convert to string.
    const content = typeof file.content === 'string'
      ? file.content
      : (typeof Buffer !== 'undefined' && Buffer.isBuffer(file.content)
        ? file.content.toString('utf-8')
        : String(file.content));

    // Use the markdown extractor to process the content
    const result = await this.extractor.extract(content);
    indexable.sections.push(...result);
    indexable.uri = file.uri;

    return {
      status: 'success',
    };
  }
}
