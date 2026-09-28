import L from 'leaflet';
import { getCachedTile } from './offlineCache';
import { getTileCacheKey } from './mapTiles';

interface CachedTileLayerOptions extends L.TileLayerOptions {
  cacheKey?: string;
  simulatedOffline?: boolean;
}

export class CachedTileLayer extends L.TileLayer {
  private readonly cacheKey: string;
  private isSimulatedOffline: boolean;

  constructor(urlTemplate: string, options: CachedTileLayerOptions = {}) {
    super(urlTemplate, options);
    this.cacheKey = options.cacheKey ?? 'default';
    this.isSimulatedOffline = options.simulatedOffline ?? false;
  }

  setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.redraw();
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');
    L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile));

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    if (!navigator.onLine || this.isSimulatedOffline) {
      const tileKey = getTileCacheKey(this.cacheKey, coords.z, coords.x, coords.y);
      getCachedTile(tileKey)
        .then((cachedBlob) => {
          if (cachedBlob) {
            const objectUrl = URL.createObjectURL(cachedBlob);
            const revokeObjectUrl = () => URL.revokeObjectURL(objectUrl);
            tile.addEventListener('load', revokeObjectUrl, { once: true });
            tile.addEventListener('error', revokeObjectUrl, { once: true });
            tile.src = objectUrl;
            return;
          }

          tile.style.backgroundColor = '#1e293b';
          tile.src =
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%231a202c" fill-opacity="0.5"/><text x="128" y="130" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Offline (Tile not cached)</text></svg>';
        })
        .catch(() => {
          tile.style.backgroundColor = '#1e293b';
          tile.src =
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%231a202c" fill-opacity="0.5"/><text x="128" y="130" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Offline</text></svg>';
        });
      return tile;
    }

    tile.src = this.getTileUrl(coords);
    return tile;
  }
}
