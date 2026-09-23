export interface Kiosk {
  id: string;
  code: string; // e.g. MPOL-BHO-1042
  name: string;
  operatorName: string;
  address: string;
  locality: string;
  city: string;
  district: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  email?: string;
  openingHours: string;
  isOpenNow: boolean;
  rating: number;
  reviewsCount: number;
  services: string[];
  hasPrinter: boolean;
  hasBiometricDevice: boolean;
  hasPhotostat: boolean;
  isAuthorizedCSC: boolean;
  isVerified: boolean;
}

export type TransportMode = 'driving' | 'motorcycle' | 'walking';

export type Language = 'hi' | 'en';

export type UITheme = 'aero' | 'classic' | 'emerald' | 'sunset' | 'cyber';

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSec: number;
  modifier?: string;
  type?: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  transportMode: TransportMode;
  coordinates: [number, number][];
  steps: RouteStep[];
  summary: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  label?: string;
}

export type MapTileStyle = 'streets' | 'osm' | 'hot' | 'topo' | 'satellite';

export interface OfflineCacheStats {
  cachedTileCount: number;
  cacheSizeMB: number;
  isDownloading: boolean;
  downloadProgress: number;
  lastCachedArea?: string;
}

export interface FilterOptions {
  searchQuery: string;
  onlyOpenNow: boolean;
  onlyVerified: boolean;
  onlyCSC: boolean;
  minRating: number;
  selectedService: string;
  maxDistanceKm: number | null;
  cityFilter: string;
}
