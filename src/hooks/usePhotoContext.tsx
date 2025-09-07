/**
 * Photo Context for Cache Management
 *
 * Provides a context to notify all photo consumers when photos are updated
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface PhotoContextType {
  refreshKey: number;
  invalidatePhoto: (avatarPath: string) => void;
  invalidateAllPhotos: () => void;
}

const PhotoContext = createContext<PhotoContextType | null>(null);

interface PhotoProviderProps {
  children: ReactNode;
}

export const PhotoProvider: React.FC<PhotoProviderProps> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const invalidatePhoto = useCallback((avatarPath: string) => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const invalidateAllPhotos = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      refreshKey,
      invalidatePhoto,
      invalidateAllPhotos,
    }),
    [refreshKey, invalidatePhoto, invalidateAllPhotos]
  );

  return (
    <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
  );
};

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotoContext must be used within a PhotoProvider');
  }
  return context;
};
