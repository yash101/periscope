import { DocumentSource } from "../../shared/types";
import { FilePayload, IFetcher } from "./IFetcher";

export class LocalFilesystemFetcher extends IFetcher {
  async open(config: DocumentSource): Promise<void> {
  }

  async *crawl(): AsyncGenerator<FilePayload> {
  }

  async close(): Promise<void> {
  }

  onUpdate(callback: (file: FilePayload) => void): void {
  }
}
