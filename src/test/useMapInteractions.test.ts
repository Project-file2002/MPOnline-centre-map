import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapInteractions } from '../hooks/useMapInteractions';
import L from 'leaflet';
import type { Kiosk, UserLocation, RouteInfo } from '../types';

const mockUserLocation: UserLocation = {
  lat: 23.2332,
  lng: 77.429,
  accuracy: 30,
  label: 'Bhopal City Center, MP',
};

const mockKiosk: Kiosk = {
  id: '1',
  code: 'MPOL-BHO-1042',
  name: 'Test Kiosk',
  operatorName: 'Test Operator',
  address: 'Test Address',
  locality: 'Test Locality',
  city: 'Bhopal',
  district: 'Bhopal',
  pincode: '462001',
  lat: 23.304088,
  lng: 77.362972,
  phone: '+91 1234567890',
  email: 'test@example.com',
  openingHours: '9:00 AM - 6:00 PM',
  isOpenNow: true,
  rating: 4.5,
  reviewsCount: 100,
  services: ['Aadhaar', 'PAN'],
  hasPrinter: true,
  hasBiometricDevice: true,
  hasPhotostat: false,
  isAuthorizedCSC: true,
  isVerified: true,
};

const mockRouteInfo: RouteInfo = {
  distanceKm: 5.5,
  durationMinutes: 15,
  transportMode: 'driving',
  coordinates: [[23.2332, 77.429], [23.304088, 77.362972]],
  steps: [],
  summary: 'Test route',
};

describe('useMapInteractions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty map instance ref', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    expect(result.current.mapInstanceRef.current).toBeNull();
  });

  it('should have all required functions', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    
    expect(typeof result.current.onMapReady).toBe('function');
    expect(typeof result.current.handleRecenter).toBe('function');
    expect(typeof result.current.handleCenterUserLocation).toBe('function');
    expect(typeof result.current.handleCenterKiosk).toBe('function');
    expect(typeof result.current.handleFitRoute).toBe('function');
    expect(typeof result.current.handleSelectCity).toBe('function');
  });

  it('should set map instance on onMapReady', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    
    const mockMap = {} as L.Map;
    act(() => {
      result.current.onMapReady(mockMap);
    });
    
    expect(result.current.mapInstanceRef.current).toBe(mockMap);
  });

  it('should not crash when handleCenterKiosk is called with no selected kiosk', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    
    expect(() => {
      act(() => {
        result.current.handleCenterKiosk();
      });
    }).not.toThrow();
  });

  it('should not crash when handleFitRoute is called with no selected kiosk', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    
    expect(() => {
      act(() => {
        result.current.handleFitRoute();
      });
    }).not.toThrow();
  });

  it('should handle select city', () => {
    const { result } = renderHook(() =>
      useMapInteractions({
        userLocation: mockUserLocation,
        selectedKiosk: null,
        routeInfo: null,
        detectUserLocation: vi.fn(),
      })
    );
    
    const mockCity = { name: 'Bhopal', lat: 23.2332, lng: 77.429, zoom: 12 };
    const mockMap = {
      flyTo: vi.fn(),
    } as unknown as L.Map;
    
    result.current.mapInstanceRef.current = mockMap;
    
    act(() => {
      result.current.handleSelectCity(mockCity);
    });
    
    expect(mockMap.flyTo).toHaveBeenCalledWith([23.2332, 77.429], 12, {
      animate: true,
      duration: 1.2,
    });
  });
});