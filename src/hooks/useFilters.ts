import { useState, useMemo, useCallback } from 'react';
import type { Kiosk, FilterOptions, UserLocation, Language } from '../types';
import { calculateDistanceKm } from '../services/geoUtils';

interface UseFiltersReturn {
  filters: FilterOptions;
  handleFilterChange: (newFilters: Partial<FilterOptions>) => void;
  kiosksWithDistance: Array<Kiosk & { distanceKm: number | null }>;
  filteredKiosks: Array<Kiosk & { distanceKm: number | null }>;
}

export const useFilters = (
  initialKiosks: Kiosk[],
  userLocation: UserLocation | null,
  language: Language
): UseFiltersReturn => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    onlyOpenNow: false,
    onlyVerified: false,
    onlyCSC: false,
    minRating: 0,
    selectedService: 'All Services',
    maxDistanceKm: null,
    cityFilter: 'All Cities',
  });

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const kiosksWithDistance = useMemo(() => {
    return initialKiosks.map((kiosk) => {
      const distance = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, kiosk.lat, kiosk.lng)
        : null;
      return {
        ...kiosk,
        distanceKm: distance,
      };
    });
  }, [initialKiosks, userLocation]);

  const filteredKiosks = useMemo(() => {
    return kiosksWithDistance
      .filter((kiosk) => {
        // Query search
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchName = kiosk.name.toLowerCase().includes(q);
          const matchCode = kiosk.code.toLowerCase().includes(q);
          const matchLocality = kiosk.locality.toLowerCase().includes(q);
          const matchCity = kiosk.city.toLowerCase().includes(q);
          const matchOperator = kiosk.operatorName.toLowerCase().includes(q);
          const matchService = kiosk.services.some((s) => s.toLowerCase().includes(q));
          if (!matchName && !matchCode && !matchLocality && !matchCity && !matchOperator && !matchService) {
            return false;
          }
        }

        // Open Now
        if (filters.onlyOpenNow && !kiosk.isOpenNow) return false;

        // Verified
        if (filters.onlyVerified && !kiosk.isVerified) return false;

        // CSC Authorized
        if (filters.onlyCSC && !kiosk.isAuthorizedCSC) return false;

        // Min Rating
        if (filters.minRating > 0 && kiosk.rating < filters.minRating) return false;

        // Service
        if (
          filters.selectedService !== 'All Services' &&
          !kiosk.services.includes(filters.selectedService)
        ) {
          return false;
        }

        // Max distance
        if (filters.maxDistanceKm !== null && kiosk.distanceKm !== null) {
          if (kiosk.distanceKm > filters.maxDistanceKm) return false;
        }

        // City
        if (filters.cityFilter !== 'All Cities' && kiosk.city !== filters.cityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by shortest distance first
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return b.rating - a.rating;
      });
  }, [kiosksWithDistance, filters]);

  return {
    filters,
    handleFilterChange,
    kiosksWithDistance,
    filteredKiosks,
  };
};