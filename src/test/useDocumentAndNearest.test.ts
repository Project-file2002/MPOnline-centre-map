import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentAndNearest } from '../hooks/useDocumentAndNearest';
import type { Kiosk } from '../types';

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

const mockKiosksWithDistance = [
  { ...mockKiosk, distanceKm: 1.5 },
  { ...mockKiosk, id: '2', name: 'Kiosk 2', distanceKm: 2.5 },
];

describe('useDocumentAndNearest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDocumentAndNearest());
    expect(result.current.isDocsModalOpen).toBe(false);
    expect(result.current.activeDocService).toBeNull();
    expect(result.current.nearestToast).toBeNull();
  });

  it('should open docs modal', () => {
    const { result } = renderHook(() => useDocumentAndNearest());
    
    act(() => {
      result.current.handleOpenDocsModal('samagra');
    });
    
    expect(result.current.isDocsModalOpen).toBe(true);
    expect(result.current.activeDocService).toBe('samagra');
  });

  it('should open docs modal without service ID', () => {
    const { result } = renderHook(() => useDocumentAndNearest());
    
    act(() => {
      result.current.handleOpenDocsModal();
    });
    
    expect(result.current.isDocsModalOpen).toBe(true);
    expect(result.current.activeDocService).toBeNull();
  });

  it('should close docs modal', () => {
    const { result } = renderHook(() => useDocumentAndNearest());
    
    act(() => {
      result.current.handleOpenDocsModal('samagra');
    });
    
    act(() => {
      result.current.setIsDocsModalOpen(false);
    });
    
    expect(result.current.isDocsModalOpen).toBe(false);
  });

  it('should find nearest kiosk and show toast in Hindi', async () => {
    const mockDetectUserLocation = vi.fn();
    const { result } = renderHook(() => useDocumentAndNearest());
    
    await act(async () => {
      await result.current.handleFindNearestKiosk(
        mockKiosksWithDistance,
        mockDetectUserLocation,
        'hi'
      );
    });
    
    expect(result.current.nearestToast).toContain('सबसे नज़दीक कियोस्क');
    expect(result.current.nearestToast).toContain('Test Kiosk');
  });

  it('should find nearest kiosk and show toast in English', async () => {
    const mockDetectUserLocation = vi.fn();
    const { result } = renderHook(() => useDocumentAndNearest());
    
    await act(async () => {
      await result.current.handleFindNearestKiosk(
        mockKiosksWithDistance,
        mockDetectUserLocation,
        'en'
      );
    });
    
    expect(result.current.nearestToast).toContain('Nearest Kiosk');
    expect(result.current.nearestToast).toContain('Test Kiosk');
  });

  it('should auto-hide toast after timeout', async () => {
    const mockDetectUserLocation = vi.fn();
    const { result } = renderHook(() => useDocumentAndNearest());
    
    await act(async () => {
      await result.current.handleFindNearestKiosk(
        mockKiosksWithDistance,
        mockDetectUserLocation,
        'en'
      );
    });
    
    expect(result.current.nearestToast).not.toBeNull();
    
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    
    expect(result.current.nearestToast).toBeNull();
  });
});