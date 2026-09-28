import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectivity } from '../hooks/useConnectivity';

// Mock the offlineCache service
vi.mock('../services/offlineCache', () => ({
  getCacheStats: vi.fn(() => Promise.resolve({ count: 0, sizeMB: 0 })),
  clearTileCache: vi.fn(() => Promise.resolve()),
  downloadAreaTiles: vi.fn(() => Promise.resolve({ requested: 0, downloaded: 0, cached: 0, failed: 0 })),
}));

describe('useConnectivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useConnectivity());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSimulatedOffline).toBe(false);
    expect(result.current.showOfflineModal).toBe(false);
    expect(result.current.offlineStats.cachedTileCount).toBe(0);
  });

  it('should toggle simulated offline mode', () => {
    const { result } = renderHook(() => useConnectivity());
    
    act(() => {
      result.current.setIsSimulatedOffline(true);
    });
    expect(result.current.isSimulatedOffline).toBe(true);
  });

  it('should toggle offline modal', () => {
    const { result } = renderHook(() => useConnectivity());
    
    act(() => {
      result.current.setShowOfflineModal(true);
    });
    expect(result.current.showOfflineModal).toBe(true);
  });

  it('should have refreshCacheStats function', () => {
    const { result } = renderHook(() => useConnectivity());
    expect(typeof result.current.refreshCacheStats).toBe('function');
  });

  it('should have handleClearCache function', () => {
    const { result } = renderHook(() => useConnectivity());
    expect(typeof result.current.handleClearCache).toBe('function');
  });

  it('should have handleDownloadCurrentArea function', () => {
    const { result } = renderHook(() => useConnectivity());
    expect(typeof result.current.handleDownloadCurrentArea).toBe('function');
  });
});