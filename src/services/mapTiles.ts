import type { MapTileStyle } from '../types';

export interface MapTileSource {
  cacheKey: string;
  urlTemplate: string;
  subdomains?: string;
  maxZoom: number;
}

const MAP_TILE_SOURCES: Record<MapTileStyle, MapTileSource> = {
  streets: {
    cacheKey: 'esri-world-street-v1',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  osm: {
    cacheKey: 'openstreetmap-standard-v1',
    urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
  },
  hot: {
    cacheKey: 'hot-openstreetmap-v1',
    urlTemplate: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
  },
  topo: {
    cacheKey: 'opentopomap-v1',
    urlTemplate: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 17,
  },
  satellite: {
    cacheKey: 'esri-world-imagery-v1',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
};

export function getMapTileSource(style: MapTileStyle): MapTileSource {
  return MAP_TILE_SOURCES[style];
}

export function getTileCacheKey(sourceKey: string, z: number, x: number, y: number): string {
  return `${sourceKey}/${z}/${x}/${y}`;
}

export function getTileUrl(source: MapTileSource, z: number, x: number, y: number): string {
  const subdomains = source.subdomains ?? '';
  const subdomain = subdomains ? subdomains[Math.abs(x + y) % subdomains.length] : '';

  return source.urlTemplate
    .replace(/\{s\}/g, subdomain)
    .replace(/\{z\}/g, String(z))
    .replace(/\{x\}/g, String(x))
    .replace(/\{y\}/g, String(y));
}
