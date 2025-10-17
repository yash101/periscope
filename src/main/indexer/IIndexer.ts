import { Indexable } from "./Indexable";

export class IIndexer {
  async index(data: Indexable): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async remove(uri: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async search(query: string): Promise<Indexable[]> {
    throw new Error("Method not implemented.");
  }
}
