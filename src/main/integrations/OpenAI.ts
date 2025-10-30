/**
 * Copyright (c) Devyash Lodha, 2025. All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @file OpenAI.ts
 * @author Devyash Lodha <rud@devya.sh>
 * @abstract OpenAI integration interface
 * 
 * This file defines an interface for integrating OpenAI.
 * 
 * OpenAI is a fairly powerful model which can be used
 * for various NLP and image tasks such as:
 * * Summarizing and text generation
 * * Annotation
 * * Keypoints generation
 * * Keyword extraction
 * * Image captioning
 * * OCR (Optical Character Recognition)
 * 
 * This file defines the features we want to support.
 * Note that this will require macOS Catalina or later, and an Apple Silicon chip.
 * The OpenAI integration will rely on a sidecar macOS application
 * written in Swift which will expose these functionalities via UNIX sockets.
 */

export class OpenAIIntegration {
  private apiKey: string;
  constructor(config: Record<string, any>) {
    this.apiKey = config.apiKey;
  }
}
