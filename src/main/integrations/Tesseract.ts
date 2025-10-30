/**
 * Copyright (c) Devyash Lodha, 2025. All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @file Tesseract.ts
 * @author Devyash Lodha <rud@devya.sh>
 * @abstract Tesseract integration interface
 * 
 * This file defines an interface for integrating Tesseract.
 * 
 * Tesseract is an open-source OCR engine that can recognize text in images.
 */

export class TesseractIntegration {
  private language: string;
  constructor(config: Record<string, any>) {
    this.language = config.language || 'eng';
  }
}
