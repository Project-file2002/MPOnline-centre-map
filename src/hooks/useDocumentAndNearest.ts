import { useState, useCallback } from 'react';
import type { Language, Kiosk } from '../types';

interface UseDocumentAndNearestReturn {
  isDocsModalOpen: boolean;
  setIsDocsModalOpen: (value: boolean) => void;
  activeDocService: string | null;
  setActiveDocService: (value: string | null) => void;
  handleOpenDocsModal: (serviceId?: string) => void;
  nearestToast: string | null;
  setNearestToast: (value: string | null) => void;
  handleFindNearestKiosk: (kiosksWithDistance: Array<Kiosk & { distanceKm: number | null }>, detectUserLocation: () => void, language: Language) => void;
}

export const useDocumentAndNearest = (): UseDocumentAndNearestReturn => {
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [activeDocService, setActiveDocService] = useState<string | null>(null);
  const [nearestToast, setNearestToast] = useState<string | null>(null);

  const handleOpenDocsModal = useCallback((serviceId?: string) => {
    if (serviceId) setActiveDocService(serviceId);
    setIsDocsModalOpen(true);
  }, []);

  const handleFindNearestKiosk = useCallback(
    (
      kiosksWithDistance: Array<Kiosk & { distanceKm: number | null }>,
      detectUserLocation: () => void,
      language: Language
    ) => {
      detectUserLocation();

      const sorted = [...kiosksWithDistance]
        .filter((k) => k.distanceKm !== null)
        .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));

      if (sorted.length > 0) {
        const nearest = sorted[0];
        setNearestToast(
          language === 'hi'
            ? `सबसे नज़दीक कियोस्क: ${nearest.name} (${nearest.distanceKm?.toFixed(1)} किमी)`
            : `Nearest Kiosk: ${nearest.name} (${nearest.distanceKm?.toFixed(1)} km)`
        );
        setTimeout(() => setNearestToast(null), 4000);
      }
    },
    []
  );

  return {
    isDocsModalOpen,
    setIsDocsModalOpen,
    activeDocService,
    setActiveDocService,
    handleOpenDocsModal,
    nearestToast,
    setNearestToast,
    handleFindNearestKiosk,
  };
};