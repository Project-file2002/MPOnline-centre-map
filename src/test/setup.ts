import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: () => {},
    watchPosition: () => {},
    clearWatch: () => {},
  },
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
});