/**
 * Copyright (c) Devyash Lodha, 2025. All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * 
 * @file HTMLExtractor.ts
 * @author Devyash Lodha <rud@devya.sh>
 * @abstract LLM integration interface
 * 
 * This file defines an interface for integrating Large Language Models (LLMs)
 * into the application. It provides methods for initializing the LLM, generating
 * text completions, and handling interactions with the model.
 */

/**
 * Abstract class representing a Large Language Model (LLM) integration.
 * 
 * TODO: add methods for text generation, chat interactions, etc. We aren't
 * using this yet, so keeping it minimal for now.
 * 
 * Defining this facade allows for later integration and easy swapping of LLMs.
 */
export abstract class ILLM {
  abstract initialize(options?: Record<string, any>): Promise<void>;
}
