/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import L from 'leaflet';
import {
  Kiosk,
  RouteInfo,
  TransportMode,
  UserLocation,
  MapTileStyle,
  FilterOptions,
  OfflineCacheStats,
  Language,
  UITheme,
} from './types';
import { INITIAL_KIOSKS, MP_CITIES } from './data/kiosks';
import { calculateDistanceKm } from './services/geoUtils';
import { calculateRoute } from './services/routing';
import {
  clearTileCache,
  downloadAreaTiles,
  getCacheStats,
} from './services/offlineCache';
import { MapContainer } from './components/MapContainer';
import { GoogleMapsSearchBar } from './components/GoogleMapsSearchBar';
import { KioskSidebar } from './components/KioskSidebar';
import { MapControls } from './components/MapControls';
import { DocumentChecklistModal } from './components/DocumentChecklistModal';
import { SplashLoader } from './components/SplashLoader';

export default function App() {
  // Splash Loader Animation State (runs on page reload / initial load)
  const [showSplash, setShowSplash] = useState(true);

  // 0. Language State (Hindi by default for MP common citizens)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_lang') as Language;
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'hi';
  });

  const handleToggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      localStorage.setItem('mponline_lang', next);
      return next;
    });
  };

  // Document Checklist Modal State
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [activeDocService, setActiveDocService] = useState<string | null>(null);

  const handleOpenDocsModal = (serviceId?: string) => {
    if (serviceId) setActiveDocService(serviceId);
    setIsDocsModalOpen(true);
  };

  // 1. UI Skin / Surface Theme State (Frosted UI / Aero by default - 🟢 Most Recommended)
  const [uiTheme, setUiTheme] = useState<UITheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_ui_theme') as UITheme;
      if (['aero', 'classic', 'emerald', 'sunset', 'cyber'].includes(saved)) {
        return saved;
      }
    }
    return 'aero';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-theme', uiTheme);
    localStorage.setItem('mponline_ui_theme', uiTheme);
  }, [uiTheme]);

  // 1.5. Dark / Light Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mponline_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mponline_theme', 'light');
    }
  }, [isDarkMode]);

  // 2. Connectivity & Offline Cache State
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

  // 3. User Location State
  const [userLocation, setUserLocation] = useState<UserLocation | null>({
    lat: 23.2332,
    lng: 77.429,
    accuracy: 30,
    label: 'Bhopal City Center, MP',
  });
  const [isLocating, setIsLocating] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Request actual browser geolocation
  const detectUserLocation = useCallback((showAnimation = false) => {
    if (!navigator.geolocation) return;

    if (showAnimation) setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const newLoc: UserLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 50,
          label: 'Your Current Location',
        };
        setUserLocation(newLoc);

        const currentMap = mapInstanceRef.current;
        if (currentMap) {
          currentMap.flyTo([latitude, longitude], 16, {
            animate: true,
            duration: 1.2,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation access denied or unavailable:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    detectUserLocation(false);
  }, [detectUserLocation]);

  // 4. Map & Layer State
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('streets');

  // 5. Selected Kiosk & Route
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [isDirectionsActive, setIsDirectionsActive] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 6. Filter Options
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

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Compute Kiosks with Distances and Filter
  const kiosksWithDistance = useMemo(() => {
    return INITIAL_KIOSKS.map((kiosk) => {
      const distance = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, kiosk.lat, kiosk.lng)
        : null;
      return {
        ...kiosk,
        distanceKm: distance,
      };
    });
  }, [userLocation]);

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

  // 7. Route Calculation Logic
  const handleCalculateRoute = useCallback(
    async (targetKiosk: Kiosk, mode: TransportMode = transportMode) => {
      if (!userLocation) return;
      setIsLoadingRoute(true);

      const route = await calculateRoute(
        userLocation.lat,
        userLocation.lng,
        targetKiosk.lat,
        targetKiosk.lng,
        mode
      );

      setRouteInfo(route);
      setIsLoadingRoute(false);
    },
    [userLocation, transportMode]
  );

  const handleStartDirections = (kiosk: Kiosk) => {
    setSelectedKiosk(kiosk);
    setIsDirectionsActive(true);
    setIsSidebarOpen(true);
    handleCalculateRoute(kiosk, transportMode);
  };

  const handleChangeTransportMode = (mode: TransportMode) => {
    setTransportMode(mode);
    if (selectedKiosk) {
      handleCalculateRoute(selectedKiosk, mode);
    }
  };

  const handleSelectKiosk = (kiosk: Kiosk) => {
    setSelectedKiosk(kiosk);
    setIsSidebarOpen(true);
    const map = mapInstanceRef.current;
    if (!isDirectionsActive && map) {
      map.flyTo([kiosk.lat, kiosk.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
    // If directions view is already open, refresh route to newly selected kiosk
    if (isDirectionsActive) {
      handleCalculateRoute(kiosk, transportMode);
    }
  };

  const handleCloseDetail = () => {
    setSelectedKiosk(null);
    setIsDirectionsActive(false);
    setRouteInfo(null);
  };

  const handleCloseDirections = () => {
    setIsDirectionsActive(false);
    setRouteInfo(null);
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
    detectUserLocation(true);
  };

  const handleCenterUserLocation = () => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
  };

  const handleCenterKiosk = () => {
    const map = mapInstanceRef.current;
    if (selectedKiosk && map) {
      map.flyTo([selectedKiosk.lat, selectedKiosk.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
  };

  const handleFitRoute = () => {
    const map = mapInstanceRef.current;
    if (userLocation && selectedKiosk && map) {
      const points: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [selectedKiosk.lat, selectedKiosk.lng],
      ];
      if (routeInfo?.coordinates) {
        routeInfo.coordinates.forEach((pt) => points.push(pt));
      }
      map.stop();
      map.fitBounds(points, {
        paddingTopLeft: [window.innerWidth > 768 ? 440 : 40, 80],
        paddingBottomRight: [70, 70],
        maxZoom: 15,
        animate: true,
      });
    }
  };

  // 8. Offline Map Tile Pre-Caching Handler
  const handleDownloadCurrentArea = async () => {
    if (!mapInstance) return;

    const bounds = mapInstance.getBounds();
    setOfflineStats((prev) => ({
      ...prev,
      isDownloading: true,
      downloadProgress: 0,
    }));

    try {
      await downloadAreaTiles(
        {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        },
        12,
        15,
        (done, total) => {
          const progress = Math.min(100, Math.round((done / Math.max(1, total)) * 100));
          setOfflineStats((prev) => ({ ...prev, downloadProgress: progress }));
        }
      );
    } finally {
      await refreshCacheStats();
      setOfflineStats((prev) => ({
        ...prev,
        isDownloading: false,
        downloadProgress: 100,
      }));
    }
  };

  const handleClearCache = async () => {
    await clearTileCache();
    await refreshCacheStats();
  };

  // Quick jump to MP cities
  const handleSelectCity = (city: { name: string; lat: number; lng: number; zoom: number }) => {
    if (mapInstance) {
      mapInstance.flyTo([city.lat, city.lng], city.zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* 0. Relatable Motion Splash & GIS Satellite Loader */}
      {showSplash && (
        <SplashLoader
          onComplete={() => setShowSplash(false)}
          language={language}
        />
      )}

      {/* 1. Google Maps-Style Top Floating Search & Quick Filters */}
      <GoogleMapsSearchBar
        filters={filters}
        onFilterChange={handleFilterChange}
        kiosks={INITIAL_KIOSKS}
        onSelectKiosk={handleSelectKiosk}
        selectedKiosk={selectedKiosk}
        onToggleDirections={() => {
          if (isDirectionsActive) {
            handleCloseDirections();
          } else if (selectedKiosk) {
            handleStartDirections(selectedKiosk);
          } else if (filteredKiosks.length > 0) {
            handleStartDirections(filteredKiosks[0]);
          }
        }}
        isDirectionsActive={isDirectionsActive}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onOpenOfflineManager={() => setShowOfflineModal(true)}
        kiosksWithDistance={kiosksWithDistance}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenDocsModal={handleOpenDocsModal}
        uiTheme={uiTheme}
        onChangeUiTheme={setUiTheme}
      />

      {/* 2. Responsive Kiosks Sidebar & Directions Sheet */}
      <KioskSidebar
        kiosks={filteredKiosks}
        selectedKiosk={selectedKiosk}
        onSelectKiosk={handleSelectKiosk}
        onCloseDetail={handleCloseDetail}
        isDirectionsActive={isDirectionsActive}
        onStartDirections={handleStartDirections}
        onCloseDirections={handleCloseDirections}
        routeInfo={routeInfo}
        transportMode={transportMode}
        onChangeTransportMode={handleChangeTransportMode}
        userLocation={userLocation}
        isLoadingRoute={isLoadingRoute}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        onCenterUserLocation={handleCenterUserLocation}
        onCenterKiosk={handleCenterKiosk}
        onFitRoute={handleFitRoute}
        language={language}
        onOpenDocsModal={handleOpenDocsModal}
      />

      {/* 3. Interactive Leaflet Map Container */}
      <MapContainer
        kiosks={filteredKiosks}
        selectedKiosk={selectedKiosk}
        onSelectKiosk={handleSelectKiosk}
        userLocation={userLocation}
        routeInfo={routeInfo}
        isDirectionsActive={isDirectionsActive}
        mapStyle={mapStyle}
        isDarkMode={isDarkMode}
        isSimulatedOffline={isSimulatedOffline}
        transportMode={transportMode}
        language={language}
        onMapReady={(map) => {
          mapInstanceRef.current = map;
          setMapInstance(map);
        }}
      />

      {/* 4. Google Maps-Style Floating Map Controls */}
      <MapControls
        onZoomIn={() => mapInstance?.zoomIn()}
        onZoomOut={() => mapInstance?.zoomOut()}
        onRecenter={handleRecenter}
        isLocating={isLocating}
        mapStyle={mapStyle}
        onChangeMapStyle={setMapStyle}
        onSelectCity={handleSelectCity}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        offlineStats={offlineStats}
        onDownloadCurrentArea={handleDownloadCurrentArea}
        onClearCache={handleClearCache}
        showOfflineModal={showOfflineModal}
        onCloseOfflineModal={() => setShowOfflineModal(false)}
        onOpenOfflineModal={() => setShowOfflineModal(true)}
        language={language}
        uiTheme={uiTheme}
        onChangeUiTheme={setUiTheme}
      />

      {/* 5. Citizen Document Checklist & Govt Rates Modal */}
      <DocumentChecklistModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        language={language}
        initialServiceId={activeDocService}
      />

      {/* 6. Offline Connectivity Toast */}
      {(!isOnline || isSimulatedOffline) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-amber-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {language === 'hi'
            ? 'ऑफलाइन मोड सक्रिय — सेव किए गए मैप से चल रहा है'
            : 'Offline Mode Active — Map rendering with cached local tiles'}
        </div>
      )}
    </div>
  );
}
