/**
 * React Hook for Loading Multiple Photos
 *
 * Provides a hook to load multiple photos efficiently, reusing the existing photo loading logic
 */

import { useEffect, useState } from 'react';
import { type Person } from '../types/models';
import { loadPhoto } from '../utils/photo-loader';
import { usePhotoContext } from './usePhotoContext';

interface UseMultiplePhotosResult {
  photoUrls: Map<string, string>;
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
}

/**
 * Hook to load photos for multiple people, reusing the existing photo loading logic
 */
export function useMultiplePhotos(people: Person[]): UseMultiplePhotosResult {
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const { refreshKey } = usePhotoContext();

  // Get people with avatars
  const peopleWithAvatars = people.filter((person) => person.avatar);
  const totalCount = peopleWithAvatars.length;

  // Load photos for people with avatars
  useEffect(() => {
    if (peopleWithAvatars.length === 0) {
      setPhotoUrls(new Map());
      setLoadedCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadedCount(0);

    const loadAllPhotos = async () => {
      const newPhotoUrls = new Map<string, string>();
      let successCount = 0;

      // Load photos in parallel
      const loadingPromises = peopleWithAvatars.map(async (person) => {
        try {
          const photoUrl = await loadPhoto(person.avatar!);
          if (photoUrl) {
            newPhotoUrls.set(person.id, photoUrl);
            successCount++;
          }
        } catch (error) {
          console.warn(
            `Failed to load photo for ${person.displayName}:`,
            error
          );
        }
      });

      await Promise.allSettled(loadingPromises);

      setPhotoUrls(newPhotoUrls);
      setLoadedCount(successCount);
      setIsLoading(false);
    };

    loadAllPhotos();
  }, [
    peopleWithAvatars.length,
    refreshKey,
    ...peopleWithAvatars.map((p) => p.avatar),
  ]);

  return {
    photoUrls,
    isLoading,
    loadedCount,
    totalCount,
  };
}
