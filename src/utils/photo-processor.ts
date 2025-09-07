/**
 * Photo Processing Utility for Family Tree
 *
 * Handles photo upload, validation, and optimization for avatars
 */

import { savePhotoFile } from '../db/storage';

// Photo processing configuration
export const PHOTO_CONFIG = {
  // Target dimensions (square avatars)
  targetWidth: 200,
  targetHeight: 200,

  // File size limits
  maxFileSizeKB: 50,
  maxOriginalSizeMB: 5, // Reject uploads larger than 5MB

  // Quality settings
  webpQuality: 0.85,
  jpegQuality: 0.85,

  // Supported formats
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  preferredFormat: 'image/webp',

  // Simplified file structure - just photos/{id}.webp (no redundant prefixes)
  photoDirectory: 'photos',
};

export interface PhotoProcessingResult {
  success: boolean;
  avatarPath?: string;
  fileSizeKB?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

export interface PhotoRequirements {
  maxSizeText: string;
  dimensionsText: string;
  formatsText: string;
  qualityText: string;
}

export const PHOTO_REQUIREMENTS: PhotoRequirements = {
  maxSizeText: `Maximum file size: ${PHOTO_CONFIG.maxOriginalSizeMB}MB`,
  dimensionsText: `Images will be resized to ${PHOTO_CONFIG.targetWidth}×${PHOTO_CONFIG.targetHeight}px square`,
  formatsText: `Supported formats: JPEG, PNG, WebP`,
  qualityText: `Target output size: ~${PHOTO_CONFIG.maxFileSizeKB}KB per photo`,
};

export class PhotoProcessor {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Process uploaded file: validate, resize, and optimize
   */
  async processUploadedFile(
    file: File,
    personId: string
  ): Promise<PhotoProcessingResult> {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create image from file
      const img = await this.fileToImage(file);

      // Process and resize image
      const processedBlob = await this.resizeAndOptimize(img);

      // Generate filename and save to photos directory
      const filename = `${personId}.webp`;
      const relativePath = await savePhotoFile(processedBlob, filename);

      const fileSizeKB = processedBlob.size / 1024;

      return {
        success: true,
        avatarPath: relativePath,
        fileSizeKB,
        dimensions: {
          width: PHOTO_CONFIG.targetWidth,
          height: PHOTO_CONFIG.targetHeight,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Processing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Resize image to target dimensions and optimize
   */
  private async resizeAndOptimize(img: HTMLImageElement): Promise<Blob> {
    const { targetWidth, targetHeight } = PHOTO_CONFIG;

    // Set canvas dimensions
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Calculate scaling to maintain aspect ratio (crop to square)
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center the image
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    // Clear canvas and draw resized image
    this.ctx.clearRect(0, 0, targetWidth, targetHeight);
    this.ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

    // Convert to optimized blob
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        PHOTO_CONFIG.preferredFormat,
        PHOTO_CONFIG.webpQuality
      );
    });
  }

  /**
   * Convert File to Image object
   */
  private async fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!PHOTO_CONFIG.supportedFormats.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported format: ${file.type}. ${PHOTO_REQUIREMENTS.formatsText}`,
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > PHOTO_CONFIG.maxOriginalSizeMB) {
      return {
        valid: false,
        error: `File too large: ${fileSizeMB.toFixed(1)}MB. ${
          PHOTO_REQUIREMENTS.maxSizeText
        }`,
      };
    }

    return { valid: true };
  }
}
