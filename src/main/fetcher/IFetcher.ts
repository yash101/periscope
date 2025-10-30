import { DocumentSource } from "../../shared/types";
const { createHash } = require("crypto");

export interface FilePayload {
  uri: string;
  content: Buffer;
  hash: string;
  cHash?: string | null; // optional secondary hash, FEC or content-similarity based
  metadata: Record<string, any>;
}

export abstract class IFetcher {
  abstract open(config: DocumentSource): Promise<void>;
  abstract crawl(): AsyncGenerator<FilePayload>;
  abstract close(): Promise<void>;

  /**
   * When implemented, this method will be called whenever a file is updated in the source.
   * 
   * @param callback
   */
  abstract onUpdate(callback: (file: FilePayload) => void): void;
}

export function hashFilePayload(file: FilePayload): string {
  if (!file?.content)
    throw new Error("file.content is missing");

  return createHash("sha256")
    .update(file.content)
    .digest('base64');
}
