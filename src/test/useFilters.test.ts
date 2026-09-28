import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../hooks/useFilters';
import type { Kiosk } from '../types';

const mockKiosks: Kiosk[] = [
  {
    id: '1',
    code: 'MPOL-BHO-1042',
    name: 'Test Kiosk 1',
    operatorName: 'Operator 1',
    address: 'Address 1',
    locality: 'Locality 1',
    city: 'Bhopal',
    district: 'Bhopal',
    pincode: '462001',
    lat: 23.2332,
    lng: 77.429,
    phone: '+91 1234567890',
    email: 'test1@example.com',
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
  },
  {
    id: '2',
    code: 'MPOL-BHO-1043',
    name: 'Test Kiosk 2',
    operatorName: 'Operator 2',
    address: 'Address 2',
    locality: 'Locality 2',
    city: 'Indore',
    district: 'Indore',
    pincode: '452001',
    lat: 22.7196,
    lng: 75.8577,
    phone: '+91 0987654321',
    email: 'test2@example.com',
    openingHours: '10:00 AM - 5:00 PM',
    isOpenNow: false,
    rating: 4.0,
    reviewsCount: 50,
    services: ['Aadhaar'],
    hasPrinter: false,
    hasBiometricDevice: true,
    hasPhotostat: true,
    isAuthorizedCSC: false,
    isVerified: false,
  },
];

const mockUserLocation = {
  lat: 23.2332,
  lng: 77.429,
  accuracy: 30,
  label: 'Bhopal City Center, MP',
};

describe('useFilters', () => {
  it('should return all kiosks by default', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    expect(result.current.filteredKiosks).toHaveLength(2);
  });

  it('should filter by search query', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    
    act(() => {
      result.current.handleFilterChange({ searchQuery: 'Test Kiosk 1' });
    });
    
    expect(result.current.filteredKiosks).toHaveLength(1);
    expect(result.current.filteredKiosks[0].name).toBe('Test Kiosk 1');
  });

  it('should filter by open now status', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    
    act(() => {
      result.current.handleFilterChange({ onlyOpenNow: true });
    });
    
    expect(result.current.filteredKiosks).toHaveLength(1);
    expect(result.current.filteredKiosks[0].isOpenNow).toBe(true);
  });

  it('should filter by verified status', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    
    act(() => {
      result.current.handleFilterChange({ onlyVerified: true });
    });
    
    expect(result.current.filteredKiosks).toHaveLength(1);
    expect(result.current.filteredKiosks[0].isVerified).toBe(true);
  });

  it('should filter by city', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    
    act(() => {
      result.current.handleFilterChange({ cityFilter: 'Indore' });
    });
    
    expect(result.current.filteredKiosks).toHaveLength(1);
    expect(result.current.filteredKiosks[0].city).toBe('Indore');
  });

  it('should calculate distances correctly', () => {
    const { result } = renderHook(() => useFilters(mockKiosks, mockUserLocation, 'hi'));
    
    expect(result.current.kiosksWithDistance[0].distanceKm).toBeCloseTo(0, 0);
    expect(result.current.kiosksWithDistance[1].distanceKm).toBeGreaterThan(0);
  });
});