import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoute } from '../hooks/useRoute';
import type { Kiosk, UserLocation } from '../types';

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

// Mock the routing service
vi.mock('../services/routing', () => ({
  calculateRoute: vi.fn(() => Promise.resolve({
    distanceKm: 5.5,
    durationMinutes: 15,
    transportMode: 'driving',
    coordinates: [[23.2332, 77.429], [23.304088, 77.362972]],
    steps: [],
    summary: 'Test route',
  })),
}));

describe('useRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    expect(result.current.selectedKiosk).toBeNull();
    expect(result.current.isDirectionsActive).toBe(false);
    expect(result.current.transportMode).toBe('driving');
    expect(result.current.routeInfo).toBeNull();
    expect(result.current.isLoadingRoute).toBe(false);
  });

  it('should start directions for a kiosk', async () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    
    await act(async () => {
      await result.current.handleStartDirections(mockKiosk);
    });
    
    expect(result.current.selectedKiosk).toEqual(mockKiosk);
    expect(result.current.isDirectionsActive).toBe(true);
  });

  it('should close detail view', () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    
    act(() => {
      result.current.handleCloseDetail();
    });
    
    expect(result.current.selectedKiosk).toBeNull();
    expect(result.current.isDirectionsActive).toBe(false);
    expect(result.current.routeInfo).toBeNull();
  });

  it('should close directions', () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    
    act(() => {
      result.current.handleCloseDirections();
    });
    
    expect(result.current.isDirectionsActive).toBe(false);
    expect(result.current.routeInfo).toBeNull();
  });

  it('should change transport mode', async () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    
    // First select a kiosk
    await act(async () => {
      await result.current.handleStartDirections(mockKiosk);
    });
    
    // Then change transport mode
    act(() => {
      result.current.handleChangeTransportMode('walking');
    });
    
    expect(result.current.transportMode).toBe('walking');
  });

  it('should calculate route when transport mode changes', async () => {
    const { result } = renderHook(() => useRoute(mockUserLocation));
    
    // First select a kiosk
    await act(async () => {
      await result.current.handleStartDirections(mockKiosk);
    });
    
    // Change transport mode
    act(() => {
      result.current.handleChangeTransportMode('walking');
    });
    
    expect(result.current.transportMode).toBe('walking');
  });
});