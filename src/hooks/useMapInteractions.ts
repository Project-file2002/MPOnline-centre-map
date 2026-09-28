import { useCallback } from 'react';
import { useRef } from 'react';
import L from 'leaflet';
import type { Kiosk, UserLocation, RouteInfo } from '../types';

interface UseMapInteractionsProps {
  userLocation: UserLocation | null;
  selectedKiosk: Kiosk | null;
  routeInfo: RouteInfo | null;
  detectUserLocation: (showAnimation?: boolean) => void;
}

interface UseMapInteractionsReturn {
  mapInstanceRef: React.RefObject<L.Map | null>;
  handleRecenter: () => void;
  handleCenterUserLocation: () => void;
  handleCenterKiosk: () => void;
  handleFitRoute: () => void;
  handleSelectCity: (city: { name: string; lat: number; lng: number; zoom: number }) => void;
  onMapReady: (map: L.Map) => void;
}

export const useMapInteractions = ({
  userLocation,
  selectedKiosk,
  routeInfo,
  detectUserLocation,
}: UseMapInteractionsProps): UseMapInteractionsReturn => {
  const mapInstanceRef = useRef<L.Map | null>(null);

  const onMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
    detectUserLocation(true);
  }, [userLocation, detectUserLocation]);

  const handleCenterUserLocation = useCallback(() => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [userLocation]);

  const handleCenterKiosk = useCallback(() => {
    const map = mapInstanceRef.current;
    if (selectedKiosk && map) {
      map.flyTo([selectedKiosk.lat, selectedKiosk.lng], 16, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [selectedKiosk]);

  const handleFitRoute = useCallback(() => {
    const map = mapInstanceRef.current;
    if (userLocation && selectedKiosk && map) {
      const points: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [selectedKiosk.lat, selectedKiosk.lng],
      ];
      if (routeInfo?.coordinates) {
        routeInfo.coordinates.forEach((pt) => points.push(pt));
      }
      map.fitBounds(points, {
        paddingTopLeft: [window.innerWidth > 768 ? 440 : 40, 80],
        paddingBottomRight: [70, 70],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [userLocation, selectedKiosk, routeInfo]);

  const handleSelectCity = useCallback(
    (city: { name: string; lat: number; lng: number; zoom: number }) => {
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo([city.lat, city.lng], city.zoom, {
          animate: true,
          duration: 1.2,
        });
      }
    },
    []
  );

  return {
    mapInstanceRef,
    handleRecenter,
    handleCenterUserLocation,
    handleCenterKiosk,
    handleFitRoute,
    handleSelectCity,
    onMapReady,
  };
};