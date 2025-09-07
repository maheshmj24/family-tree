/**
 * React Hook for Loading Photos
 *
 * Provides a hook to load and display photos with loading states
 */

import { useEffect, useState } from 'react';
import { loadPhoto } from '../utils/photo-loader';
import { usePhotoContext } from './usePhotoContext';

interface UsePhotoResult {
  photoUrl: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to load a photo from the file system
 */
export function usePhoto(avatarPath?: string): UsePhotoResult {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = usePhotoContext();

  useEffect(() => {
    if (!avatarPath) {
      setPhotoUrl('');
      setIsLoading(false);
      setError(null);
      return;
    }

    // If it's already a usable URL, use it directly
    if (
      avatarPath.startsWith('blob:') ||
      avatarPath.startsWith('data:') ||
      avatarPath.startsWith('http')
    ) {
      setPhotoUrl(avatarPath);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Load from file system
    setIsLoading(true);
    setError(null);

    loadPhoto(avatarPath)
      .then((url: string) => {
        setPhotoUrl(url);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to load photo');
        setPhotoUrl('');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [avatarPath, refreshKey]); // Add refreshKey as dependency

  return { photoUrl, isLoading, error };
}
