/**
 * Copyright (c) Devyash Lodha, 2025. All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @file IOCR.ts
 * @author Devyash Lodha <rud@devya.sh>
 * @abstract OCR integration interface
 * 
 * This file defines an interface for integrating Optical Character Recognition (OCR)
 * capabilities into the application. It provides methods for initializing the OCR
 * engine and extracting text from images.
 * 
 * We'll keep this minimal. The goal is to support multiple OCR engines such as:
 * * Tesseract.js
 * * Apple Intelligence OCR
 * * Google Cloud Vision OCR
 * * AWS Textract
 * * Azure Computer Vision
 * 
 * This interface allows for easy swapping and integration of different OCR engines.
 */
export abstract class IOCR {
  /**
   * Initializes the OCR engine with optional configuration parameters.
   * 
   * @param options Optional configuration parameters for the OCR engine.
   */
  abstract initialize(options?: Record<string, any>): Promise<void>;
  
  /**
   * Extracts text from the provided image data.
   * 
   * @param imageData The image data (e.g., as a Buffer or base64 string) to perform OCR on.
   * @returns The extracted text from the image.
   */
  abstract extractText(imageData: Buffer | string): Promise<string>;
}
