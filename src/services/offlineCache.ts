// IndexedDB storage for offline Leaflet map tiles
const DB_NAME = 'mponline_map_offline_cache';
const DB_VERSION = 1;
const STORE_NAME = 'map_tiles';

interface TileRecord {
  key: string; // "z/x/y" or full tile URL
  blob: Blob;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function getCachedTile(key: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as TileRecord | undefined;
        resolve(record ? record.blob : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function saveTileToCache(key: string, blob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record: TileRecord = {
        key,
        blob,
        timestamp: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore storage quota errors silently
  }
}

export async function getCacheStats(): Promise<{ count: number; sizeMB: number }> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => {
        const count = countReq.result || 0;
        // Average tile size is around 18-24KB
        const estimatedBytes = count * 22 * 1024;
        const sizeMB = Number((estimatedBytes / (1024 * 1024)).toFixed(2));
        resolve({ count, sizeMB });
      };

      countReq.onerror = () => {
        resolve({ count: 0, sizeMB: 0 });
      };
    });
  } catch {
    return { count: 0, sizeMB: 0 };
  }
}

export async function clearTileCache(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear tile cache:', error);
  }
}

// Convert LatLng to Tile Coordinates
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
  return { x, y };
}

// Pre-download map tiles for a specified geographic area and zoom range
export async function downloadAreaTiles(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  minZoom = 12,
  maxZoom = 15,
  onProgress?: (downloaded: number, total: number) => void
): Promise<number> {
  const tileTasks: Array<{ z: number; x: number; y: number }> = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const nw = latLngToTile(bounds.maxLat, bounds.minLng, z);
    const se = latLngToTile(bounds.minLat, bounds.maxLng, z);

    const minX = Math.min(nw.x, se.x);
    const maxX = Math.max(nw.x, se.x);
    const minY = Math.min(nw.y, se.y);
    const maxY = Math.max(nw.y, se.y);

    // Bound the maximum tiles per download to prevent overwhelming
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tileTasks.push({ z, x, y });
        if (tileTasks.length > 300) break; // Safe threshold for single area download
      }
      if (tileTasks.length > 300) break;
    }
  }

  const total = tileTasks.length;
  let downloaded = 0;

  for (const { z, x, y } of tileTasks) {
    const tileKey = `${z}/${x}/${y}`;
    const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

    try {
      // Check if already in cache
      const cached = await getCachedTile(tileKey);
      if (!cached) {
        const response = await fetch(tileUrl);
        if (response.ok) {
          const blob = await response.blob();
          await saveTileToCache(tileKey, blob);
        }
      }
    } catch {
      // Ignore single tile fetch failures
    }

    downloaded++;
    if (onProgress) {
      onProgress(downloaded, total);
    }
  }

  return downloaded;
}
