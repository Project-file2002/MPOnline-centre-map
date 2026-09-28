import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLocation } from '../types';
import L from 'leaflet';

interface UseUserLocationReturn {
  userLocation: UserLocation | null;
  isLocating: boolean;
  detectUserLocation: (showAnimation?: boolean) => void;
  mapInstanceRef: React.RefObject<L.Map | null>;
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>({
    lat: 23.2332,
    lng: 77.429,
    accuracy: 30,
    label: 'Bhopal City Center, MP',
  });
  const [isLocating, setIsLocating] = useState(false);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

  return {
    userLocation,
    isLocating,
    detectUserLocation,
    mapInstanceRef,
  };
};