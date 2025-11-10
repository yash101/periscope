/**
 * Represents a section within an indexable entity.
 * 
 * Each section has a type, content, and weight to indicate its importance.
 */
export class Section {
  type: string = '';
  content: string = '';
  weight: number = 1;
  meta: Record<string, string> | undefined; // prefer undefined since jsons will be smaller
}

/**
 * Represents an indexable entity.
 * 
 * Indexable objects contain structured data which should be indexed for search and retrieval.
 */
export class Indexable {
  id?: number;          /// Unique identifier for the indexable entity
  uri?: string;         /// URI of the indexable entity.
  sections: Section[] = []; /// Contains the content to be indexed, structured into a machine-contextual format.
  weight: number = 1;     /// Weight of the entire indexable. Normally 1.
  modified?: number;      /// last modified timestamp, UNIX epoch seconds
  metadata: Record<string, string> = {};  /// Additional metadata as key-value pairs.
}
