import { describe, it, expect } from 'vitest';
import { getKioskWhatsAppMessage, getKioskWhatsAppUrl } from '../utils/whatsappShare';
import type { Kiosk } from '../types';

const mockKiosk: Kiosk = {
  id: '1',
  code: 'MPOL-BHO-1053',
  name: 'Test Kiosk',
  operatorName: 'Dharmendra Meena',
  address: 'Near Main Chauraha',
  locality: 'Krishak Nagar',
  city: 'Bhopal',
  district: 'Bhopal',
  pincode: '462001',
  lat: 23.304088,
  lng: 77.362972,
  phone: '+91 97554 81203',
  email: 'test@example.com',
  openingHours: '9:00 AM - 6:00 PM',
  isOpenNow: true,
  rating: 4.7,
  reviewsCount: 132,
  services: ['Aadhaar', 'PAN'],
  hasPrinter: true,
  hasBiometricDevice: true,
  hasPhotostat: false,
  isAuthorizedCSC: true,
  isVerified: true,
};

describe('whatsappShare', () => {
  describe('getKioskWhatsAppMessage', () => {
    it('should return Hindi message by default', () => {
      const message = getKioskWhatsAppMessage(mockKiosk, 'hi');
      expect(message).toContain('एमपी ऑनलाइन कियोस्क की लाइव लोकेशन');
      expect(message).toContain(mockKiosk.name);
      expect(message).toContain(mockKiosk.operatorName);
      expect(message).toContain(mockKiosk.phone);
    });

    it('should return English message when language is en', () => {
      const message = getKioskWhatsAppMessage(mockKiosk, 'en');
      expect(message).toContain('MPOnline Kiosk Location & Navigation');
      expect(message).toContain(mockKiosk.name);
    });

    it('should include Google Maps link', () => {
      const message = getKioskWhatsAppMessage(mockKiosk, 'hi');
      expect(message).toContain('https://www.google.com/maps/dir/?api=1&destination=23.304088,77.362972');
    });

    it('should show open status correctly', () => {
      const message = getKioskWhatsAppMessage(mockKiosk, 'hi');
      expect(message).toContain('अभी खुला है (Open Now)');
    });

    it('should show closed status when kiosk is closed', () => {
      const closedKiosk = { ...mockKiosk, isOpenNow: false };
      const message = getKioskWhatsAppMessage(closedKiosk, 'hi');
      expect(message).toContain('बंद है (Closed)');
    });
  });

  describe('getKioskWhatsAppUrl', () => {
    it('should return a properly encoded WhatsApp URL', () => {
      const url = getKioskWhatsAppUrl(mockKiosk, 'hi');
      expect(url).toContain('https://api.whatsapp.com/send?text=');
      expect(url).toContain(encodeURIComponent('एमपी ऑनलाइन कियोस्क की लाइव लोकेशन'));
    });
  });
});