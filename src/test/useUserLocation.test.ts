import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserLocation } from '../hooks/useUserLocation';

describe('useUserLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default Bhopal location', () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.userLocation).toEqual({
      lat: 23.2332,
      lng: 77.429,
      accuracy: 30,
      label: 'Bhopal City Center, MP',
    });
    expect(result.current.isLocating).toBe(false);
  });

  it('should have detectUserLocation function', () => {
    const { result } = renderHook(() => useUserLocation());
    expect(typeof result.current.detectUserLocation).toBe('function');
  });

  it('should have mapInstanceRef', () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.mapInstanceRef).toBeDefined();
    expect(result.current.mapInstanceRef.current).toBeNull();
  });

  it('should set isLocating to true when showAnimation is true', () => {
    const { result } = renderHook(() => useUserLocation());
    
    act(() => {
      result.current.detectUserLocation(true);
    });
    
    expect(result.current.isLocating).toBe(true);
  });

  it('should handle geolocation success', async () => {
    const { result } = renderHook(() => useUserLocation());
    
    // Mock geolocation success
    const mockPosition = {
      coords: {
        latitude: 23.304088,
        longitude: 77.362972,
        accuracy: 10,
      },
    };
    
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((success) => {
      success(mockPosition as GeolocationPosition);
    });
    
    act(() => {
      result.current.detectUserLocation(false);
    });
    
    expect(result.current.userLocation).toEqual({
      lat: 23.304088,
      lng: 77.362972,
      accuracy: 10,
      label: 'Your Current Location',
    });
    expect(result.current.isLocating).toBe(false);
  });

  it('should handle geolocation error', async () => {
    const { result } = renderHook(() => useUserLocation());
    
    // Mock geolocation error
    vi.spyOn(navigator.geolocation, 'getCurrentPosition').mockImplementation((_, error) => {
      if (error) {
        error({ message: 'Permission denied' } as GeolocationPositionError);
      }
    });
    
    act(() => {
      result.current.detectUserLocation(false);
    });
    
    expect(result.current.isLocating).toBe(false);
  });
});