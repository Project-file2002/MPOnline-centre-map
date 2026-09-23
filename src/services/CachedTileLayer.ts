import L from 'leaflet';
import { getCachedTile } from './offlineCache';

export class CachedTileLayer extends L.TileLayer {
  private isSimulatedOffline = false;

  constructor(urlTemplate: string, options?: L.TileLayerOptions & { simulatedOffline?: boolean }) {
    super(urlTemplate, options);
    if (options?.simulatedOffline !== undefined) {
      this.isSimulatedOffline = options.simulatedOffline;
    }
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

    const tileKey = `${coords.z}/${coords.x}/${coords.y}`;
    const tileUrl = this.getTileUrl(coords);

    // If offline (or simulated offline), check local IndexedDB cache first
    if (!navigator.onLine || this.isSimulatedOffline) {
      getCachedTile(tileKey)
        .then((cachedBlob) => {
          if (cachedBlob) {
            const objectUrl = URL.createObjectURL(cachedBlob);
            tile.onload = () => {
              URL.revokeObjectURL(objectUrl);
              done(undefined, tile);
            };
            tile.src = objectUrl;
          } else {
            tile.style.backgroundColor = '#1e293b';
            tile.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%231a202c" fill-opacity="0.5"/><text x="128" y="130" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Offline (Tile not cached)</text></svg>';
          }
        })
        .catch(() => {
          tile.style.backgroundColor = '#1e293b';
          tile.src =
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%231a202c" fill-opacity="0.5"/><text x="128" y="130" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Offline</text></svg>';
        });
      return tile;
    }

    // When online: start browser download immediately so map renders with zero delay
    tile.src = tileUrl;
    return tile;
  }
}
