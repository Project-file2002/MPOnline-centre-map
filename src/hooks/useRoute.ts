import { useState, useCallback } from 'react';
import type { Kiosk, RouteInfo, TransportMode, UserLocation } from '../types';
import { calculateRoute } from '../services/routing';

interface UseRouteReturn {
  selectedKiosk: Kiosk | null;
  setSelectedKiosk: (kiosk: Kiosk | null) => void;
  isDirectionsActive: boolean;
  setIsDirectionsActive: (value: boolean) => void;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  routeInfo: RouteInfo | null;
  setRouteInfo: (info: RouteInfo | null) => void;
  isLoadingRoute: boolean;
  setIsLoadingRoute: (value: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  handleCalculateRoute: (targetKiosk: Kiosk, mode?: TransportMode) => Promise<void>;
  handleStartDirections: (kiosk: Kiosk) => void;
  handleChangeTransportMode: (mode: TransportMode) => void;
  handleCloseDetail: () => void;
  handleCloseDirections: () => void;
}

export const useRoute = (userLocation: UserLocation | null): UseRouteReturn => {
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);
  const [isDirectionsActive, setIsDirectionsActive] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleCalculateRoute = useCallback(
    async (targetKiosk: Kiosk, mode: TransportMode = transportMode) => {
      if (!userLocation) return;
      setIsLoadingRoute(true);

      try {
        const route = await calculateRoute(
          userLocation.lat,
          userLocation.lng,
          targetKiosk.lat,
          targetKiosk.lng,
          mode
        );
        setRouteInfo(route);
      } catch (error) {
        console.error('Route calculation failed:', error);
        setRouteInfo(null);
      } finally {
        setIsLoadingRoute(false);
      }
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

  const handleCloseDetail = () => {
    setSelectedKiosk(null);
    setIsDirectionsActive(false);
    setRouteInfo(null);
  };

  const handleCloseDirections = () => {
    setIsDirectionsActive(false);
    setRouteInfo(null);
  };

  return {
    selectedKiosk,
    setSelectedKiosk,
    isDirectionsActive,
    setIsDirectionsActive,
    transportMode,
    setTransportMode,
    routeInfo,
    setRouteInfo,
    isLoadingRoute,
    setIsLoadingRoute,
    isSidebarOpen,
    setIsSidebarOpen,
    handleCalculateRoute,
    handleStartDirections,
    handleChangeTransportMode,
    handleCloseDetail,
    handleCloseDirections,
  };
};