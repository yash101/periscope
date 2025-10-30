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
  id?: number;
  uri?: string;
  sections: Section[] = [];
  weight: number = 1;
  metadata: Record<string, string> = {};
}
