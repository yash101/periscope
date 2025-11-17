/**
 * @file IAnnotator.ts
 * @description Interface for Annotator components in the Periscope architecture.
 * 
 * Annotators generate metadata or annotations for indexable objects and other things
 * in the Periscope system. They can be used to enrich data before indexing.
 */

import { Indexable } from "../indexer/Indexable";

export abstract class IAnnotator {
  abstract open(config: unknown): Promise<void>; // TODO: We need to define a base config type later
  abstract annotate(data: Indexable): Promise<void>;
}
