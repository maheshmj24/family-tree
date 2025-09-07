/**
 * Photo Loading Utility for Family Tree
 *
 * Handles loading and caching of photos from the photos directory
 */

import { loadPhotoFile } from '../db/storage';

// Cache for loaded photos to avoid repeated file system calls
const photoCache = new Map<string, string>();

/**
 * Load a photo and return a blob URL for display
 * Caches the result to avoid repeated file system calls
 */
export async function loadPhoto(avatarPath: string): Promise<string> {
  // If it's already a blob URL or data URL, return as-is
  if (avatarPath.startsWith('blob:') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }

  // Check cache first
  if (photoCache.has(avatarPath)) {
    return photoCache.get(avatarPath)!;
  }

  try {
    // Extract filename from path (e.g., "photos/abc123.webp" -> "abc123.webp")
    const filename = avatarPath.split('/').pop();
    if (!filename) {
      throw new Error('Invalid avatar path');
    }

    // Load from file system
    const blobUrl = await loadPhotoFile(filename);

    // Cache the result
    if (blobUrl) {
      photoCache.set(avatarPath, blobUrl);
    }

    return blobUrl;
  } catch (error) {
    return ''; // Return empty string if loading fails
  }
}

/**
 * Preload multiple photos to improve performance
 */
export async function preloadPhotos(avatarPaths: string[]): Promise<void> {
  const loadPromises = avatarPaths
    .filter((path) => path && !photoCache.has(path))
    .map((path) => loadPhoto(path).catch(() => '')); // Ignore errors

  await Promise.all(loadPromises);
}

/**
 * Clear the photo cache (useful when photos are updated)
 */
export function clearPhotoCache(): void {
  // Revoke all blob URLs to free memory
  photoCache.forEach((blobUrl) => {
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  });

  photoCache.clear();
}

/**
 * Force reload a specific photo (clears from cache)
 */
export function forceReloadPhoto(avatarPath: string): void {
  if (photoCache.has(avatarPath)) {
    const blobUrl = photoCache.get(avatarPath)!;
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
    photoCache.delete(avatarPath);
  }
}

/**
 * Preload all photos for people with avatar paths
 * Call this after loading family tree data to ensure all photos are cached
 */
export async function preloadAllPhotos(
  people: Array<{ avatar?: string }>
): Promise<void> {
  const avatarPaths = people
    .map((person) => person.avatar)
    .filter((avatar): avatar is string => Boolean(avatar));

  if (avatarPaths.length === 0) {
    return;
  }

  // Load all photos in parallel
  const loadPromises = avatarPaths.map(async (avatarPath) => {
    try {
      await loadPhoto(avatarPath);
    } catch (error) {
      // Silently handle preload errors
    }
  });

  await Promise.all(loadPromises);
}

/**
 * Delete a photo file and remove it from cache
 */
export async function deletePhoto(avatarPath: string): Promise<void> {
  try {
    // Extract filename from path (e.g., "photos/abc123.webp" -> "abc123.webp")
    const filename = avatarPath.split('/').pop();
    if (!filename) {
      throw new Error('Invalid avatar path');
    }

    // Import deletePhotoFile function dynamically to avoid circular dependencies
    const { deletePhotoFile } = await import('../db/storage');

    // Delete from file system
    await deletePhotoFile(filename);

    // Remove from cache and revoke blob URL
    if (photoCache.has(avatarPath)) {
      const blobUrl = photoCache.get(avatarPath)!;
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
      photoCache.delete(avatarPath);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get cache stats for debugging
 */
export function getPhotoCacheStats(): { size: number; urls: string[] } {
  return {
    size: photoCache.size,
    urls: Array.from(photoCache.keys()),
  };
}
