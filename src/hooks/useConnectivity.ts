import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import type { MapTileStyle, OfflineCacheStats } from '../types';
import { getCacheStats, clearTileCache, downloadAreaTiles } from '../services/offlineCache';
import { getMapTileSource } from '../services/mapTiles';

interface UseConnectivityReturn {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setIsSimulatedOffline: (value: boolean) => void;
  showOfflineModal: boolean;
  setShowOfflineModal: (value: boolean) => void;
  offlineStats: OfflineCacheStats;
  refreshCacheStats: () => Promise<void>;
  handleDownloadCurrentArea: (mapInstance: L.Map | null) => Promise<void>;
  handleClearCache: () => Promise<void>;
}

export const useConnectivity = (mapStyle: MapTileStyle = 'streets'): UseConnectivityReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineStats, setOfflineStats] = useState<OfflineCacheStats>({
    cachedTileCount: 0,
    cacheSizeMB: 0,
    isDownloading: false,
    downloadProgress: 0,
  });

  const refreshCacheStats = useCallback(async () => {
    const stats = await getCacheStats();
    setOfflineStats((prev) => ({
      ...prev,
      cachedTileCount: stats.count,
      cacheSizeMB: stats.sizeMB,
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshCacheStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCacheStats]);

  const handleDownloadCurrentArea = async (mapInstance: L.Map | null) => {
    if (!mapInstance) return;

    const bounds = mapInstance.getBounds();
    const tileSource = getMapTileSource(mapStyle);
    setOfflineStats((prev) => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
      lastDownload: undefined,
    }));

    try {
      const result = await downloadAreaTiles(
        {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        },
        tileSource,
        12,
        15,
        (processed, total) => {
          const progress = Math.min(100, Math.round((processed / Math.max(1, total)) * 100));
          setOfflineStats((prev) => ({ ...prev, downloadProgress: progress }));
        }
      );

      await refreshCacheStats();
      setOfflineStats((prev) => ({
        ...prev,
        isDownloading: false,
        downloadProgress: 100,
        lastDownload: result,
      }));
    } catch {
      await refreshCacheStats();
      setOfflineStats((prev) => ({ ...prev, isDownloading: false }));
    }
  };

  const handleClearCache = async () => {
    await clearTileCache();
    await refreshCacheStats();
    setOfflineStats((prev) => ({ ...prev, downloadProgress: 0, lastDownload: undefined }));
  };

  return {
    isOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    showOfflineModal,
    setShowOfflineModal,
    offlineStats,
    refreshCacheStats,
    handleDownloadCurrentArea,
    handleClearCache,
  };
};