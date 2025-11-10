import { DocumentSource } from "../../shared/types";
const { createHash } = require("crypto");

export class FilePayload {
  uri: string;
  content: Blob | string | Buffer;
  hash: string;
  cHash?: string | null; // optional secondary hash, FEC or content-similarity based
  metadata: Record<string, any>;
  modified: number;
  deleted?: boolean = false;

  constructor(
    uri: string,
    content: Blob | string | Buffer,
    hash: string,
    metadata: Record<string, any> = {},
    modified: number = Date.now(),
    cHash?: string | null,
  ) {
    this.uri = uri;
    this.content = content;
    this.hash = hash;
    this.metadata = metadata;
    this.cHash = cHash;
    this.modified = modified;
  }

  toUtf8String(): string {
    if (typeof this.content === "string") {
      return this.content;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(this.content)) {
      return this.content.toString('utf-8');
    } else {
      throw new Error("Cannot convert content to string");
    }
  }
}

export abstract class IFetcher {
  abstract open(config: DocumentSource, checkpoint: any): Promise<void>;
  abstract crawl(): AsyncGenerator<FilePayload>;
  abstract close(): Promise<void>;

  /**
   * When implemented, this method will be called whenever a file is updated in the source.
   * 
   * @param callback
   */
  abstract onUpdate(callback: (file: FilePayload) => void): void;
  abstract checkpoint(): Promise<any>; /// Returns a checkpoint object representing the current state for resumability
}

export function hashFilePayload(file: FilePayload): string {
  if (!file?.content)
    throw new Error("file.content is missing");

  return createHash("sha256")
    .update(file.content)
    .digest('base64');
}
