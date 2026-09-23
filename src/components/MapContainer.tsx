import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { Kiosk, MapTileStyle, RouteInfo, UserLocation, TransportMode, Language } from '../types';
import { CachedTileLayer } from '../services/CachedTileLayer';
import { formatDistance } from '../services/geoUtils';

interface MapContainerProps {
  kiosks: Array<Kiosk & { distanceKm: number | null }>;
  selectedKiosk: Kiosk | null;
  onSelectKiosk: (kiosk: Kiosk) => void;
  userLocation: UserLocation | null;
  routeInfo: RouteInfo | null;
  isDirectionsActive?: boolean;
  mapStyle: MapTileStyle;
  isDarkMode: boolean;
  isSimulatedOffline: boolean;
  onMapReady: (map: L.Map) => void;
  transportMode?: TransportMode;
  language?: Language;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  kiosks,
  selectedKiosk,
  onSelectKiosk,
  userLocation,
  routeInfo,
  isDirectionsActive = false,
  mapStyle,
  isDarkMode,
  isSimulatedOffline,
  onMapReady,
  transportMode = 'driving',
  language = 'hi',
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<CachedTileLayer | null>(null);
  const clusterLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const superclusterRef = useRef<Supercluster<{ kiosk: Kiosk & { distanceKm: number | null } }> | null>(null);
  const travelerMarkerRef = useRef<L.Marker | null>(null);
  const travelerAnimFrameRef = useRef<number | null>(null);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    // Default center around Bhopal (Capital of Madhya Pradesh)
    const initialLat = userLocation?.lat || 23.2324;
    const initialLng = userLocation?.lng || 77.4332;

    const map = L.map(mapElementRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // We use custom Google Maps-style zoom controls
      attributionControl: false,
      inertia: true,
      inertiaDeceleration: 3000,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    mapRef.current = map;
    clusterLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    onMapReady(map);

    // ResizeObserver to adapt dynamically
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapElementRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      userMarkerRef.current = null;
      userCircleRef.current = null;
      clusterLayerGroupRef.current = null;
      routeLayerGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // 2. Manage Tile Layers & Offline Caching
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // 100% Free & Keyless Tile Layers (Zero Watermarks, Fast Global CDN)
    let urlTemplate = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let subdomains = '';
    let maxZoom = 19;

    switch (mapStyle) {
      case 'osm':
        // Official OpenStreetMap standard tile server
        urlTemplate = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        subdomains = 'abc';
        break;
      case 'hot':
        // Humanitarian OpenStreetMap Team (HOT) - Free community cartography
        urlTemplate = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
        subdomains = 'abc';
        break;
      case 'topo':
        // OpenTopoMap - Free topographic elevation and terrain
        urlTemplate = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        subdomains = 'abc';
        maxZoom = 17;
        break;
      case 'satellite':
        // Esri High-Resolution World Satellite Imagery
        urlTemplate = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        subdomains = '';
        break;
      case 'streets':
      default:
        // Esri World Street Map: closest free visual equivalent to Google Maps (streets, highways, parks, clean labels, zero watermark)
        urlTemplate = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
        subdomains = '';
        break;
    }

    const newTileLayer = new CachedTileLayer(urlTemplate, {
      subdomains,
      maxZoom,
      simulatedOffline: isSimulatedOffline,
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [mapStyle, isSimulatedOffline]);

  // 3. User Location Marker with Prominent Pin & Radar Pulse
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        try { map.removeLayer(userMarkerRef.current); } catch (e) {}
      }
      if (userCircleRef.current) {
        try { map.removeLayer(userCircleRef.current); } catch (e) {}
      }
      userMarkerRef.current = null;
      userCircleRef.current = null;
      return;
    }

    const pos: L.LatLngExpression = [userLocation.lat, userLocation.lng];

    const pinHtml = `
      <div class="user-location-pin-container">
        <div class="user-location-badge">
          <span class="user-badge-pulse"></span>
          <span>Your Location</span>
          <span class="user-badge-subtext">(आपका स्थान)</span>
        </div>
        <div class="user-pin-beacon-wrapper">
          <div class="user-pin-head">
            <div class="user-pin-inner-dot"></div>
          </div>
          <div class="user-pin-ground-pulse"></div>
        </div>
      </div>
    `;

    const userPinIcon = L.divIcon({
      className: 'user-pin-wrapper',
      html: pinHtml,
      iconSize: [160, 68],
      iconAnchor: [80, 64],
      popupAnchor: [0, -64],
    });

    const popupHtml = `
      <div style="font-family: inherit; padding: 4px; min-width: 180px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 15px;">📍</span>
          <strong style="font-size: 13px; color: #1e40af;">Your Current Location</strong>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px; font-weight: 500;">
          ${userLocation.label || 'Madhya Pradesh, India'}
        </div>
        <div style="display: flex; gap: 6px; font-size: 10px; color: #64748b; background: #eff6ff; padding: 4px 6px; border-radius: 6px; border: 1px solid #dbeafe;">
          <span>Lat: ${userLocation.lat.toFixed(4)}°</span>
          <span>•</span>
          <span>Lng: ${userLocation.lng.toFixed(4)}°</span>
        </div>
      </div>
    `;

    // Ensure marker is attached to the current active map instance
    if (!userMarkerRef.current || !map.hasLayer(userMarkerRef.current)) {
      if (userMarkerRef.current) {
        try { map.removeLayer(userMarkerRef.current); } catch (e) {}
      }
      userMarkerRef.current = L.marker(pos, {
        icon: userPinIcon,
        zIndexOffset: 3500, // Always visible on top of kiosks and routes
      })
        .bindPopup(popupHtml, { closeButton: false, offset: [0, -64] })
        .addTo(map);
    } else {
      userMarkerRef.current.setLatLng(pos);
      userMarkerRef.current.setIcon(userPinIcon);
      userMarkerRef.current.setPopupContent(popupHtml);
    }

    if (!userCircleRef.current || !map.hasLayer(userCircleRef.current)) {
      if (userCircleRef.current) {
        try { map.removeLayer(userCircleRef.current); } catch (e) {}
      }
      if (userLocation.accuracy) {
        userCircleRef.current = L.circle(pos, {
          radius: Math.min(250, userLocation.accuracy),
          color: '#2563eb',
          weight: 1.5,
          opacity: 0.35,
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
        }).addTo(map);
      }
    } else {
      userCircleRef.current.setLatLng(pos);
      if (userLocation.accuracy) {
        userCircleRef.current.setRadius(Math.min(250, userLocation.accuracy));
      }
    }
  }, [userLocation]);

  // 4. Marker Clustering with Supercluster
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterLayerGroupRef.current;
    if (!map || !clusterGroup) return;

    // Build GeoJSON features for Supercluster
    const features: Array<{
      type: 'Feature';
      geometry: { type: 'Point'; coordinates: [number, number] };
      properties: { kiosk: Kiosk & { distanceKm: number | null } };
    }> = kiosks.map((kiosk) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [kiosk.lng, kiosk.lat],
      },
      properties: {
        kiosk,
      },
    }));

    const supercluster = new Supercluster<{ kiosk: Kiosk & { distanceKm: number | null } }>({
      radius: 60,
      maxZoom: 16,
    });
    supercluster.load(features);
    superclusterRef.current = supercluster;

    function renderClusters() {
      if (!map || !clusterGroup || !superclusterRef.current) return;
      clusterGroup.clearLayers();

      const bounds = map.getBounds();
      const zoom = Math.round(map.getZoom());

      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      const clusters = superclusterRef.current.getClusters(bbox, zoom);

      clusters.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = 'cluster' in feature.properties && feature.properties.cluster;

        if (isCluster) {
          // Render Cluster Bubble
          const clusterProps = feature.properties as { point_count: number; cluster_id?: number };
          const count = clusterProps.point_count;
          const clusterId = feature.id as number;
          const size = count > 10 ? 46 : 38;
          const isLg = count > 10;

          const clusterIcon = L.divIcon({
            className: `mponline-cluster-icon ${isLg ? 'cluster-lg' : ''}`,
            html: `<span>${count}</span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const clusterMarker = L.marker([lat, lng], { icon: clusterIcon });
          clusterMarker.on('click', () => {
            const expansionZoom = superclusterRef.current!.getClusterExpansionZoom(clusterId);
            map.flyTo([lat, lng], Math.min(expansionZoom, 17), {
              animate: true,
              duration: 0.8,
            });
          });

          clusterGroup.addLayer(clusterMarker);
        } else {
          // Render Individual Kiosk Pin
          const kiosk = (feature.properties as { kiosk: Kiosk & { distanceKm: number | null } }).kiosk;
          const isSelected = selectedKiosk?.id === kiosk.id;

          const distanceText = kiosk.distanceKm !== null ? ` • ${formatDistance(kiosk.distanceKm)}` : '';
          const shortName = kiosk.name.replace(/MPOnline.*$/i, '').trim() || kiosk.name.split(' ').slice(0, 2).join(' ');

          // Kiosk Storefront Awning & Digital Terminal SVG
          const kioskBoothSvg = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l2-5h14l2 5"></path>
              <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"></path>
              <path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3-1"></path>
              <line x1="9" y1="16" x2="15" y2="16"></line>
              <rect x="8" y="12" width="8" height="4" rx="1"></rect>
            </svg>
          `;

          const pinIcon = L.divIcon({
            className: 'custom-kiosk-marker',
            html: `
              <div class="kiosk-center-pin ${isSelected ? 'is-selected' : ''}">
                <div class="kiosk-label-card">
                  <span class="kiosk-mp-badge">MP</span>
                  <span class="truncate max-w-[105px]">${shortName}</span>
                  ${distanceText ? `<span class="opacity-80 font-semibold text-[10px]">${distanceText}</span>` : ''}
                  <span class="kiosk-live-dot ${kiosk.isOpenNow ? 'open' : 'closed'}" title="${kiosk.isOpenNow ? 'Open Now' : 'Closed'}"></span>
                </div>
                <div class="kiosk-booth-pin">
                  <div class="kiosk-booth-icon-inner">
                    ${kioskBoothSvg}
                  </div>
                </div>
                <div class="kiosk-ground-shadow"></div>
              </div>
            `,
            iconSize: [180, 68],
            iconAnchor: [90, 62],
            popupAnchor: [0, -62],
          });

          const marker = L.marker([lat, lng], {
            icon: pinIcon,
            zIndexOffset: isSelected ? 500 : 100,
          });

          marker.on('click', () => {
            onSelectKiosk(kiosk);
            map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
              animate: true,
              duration: 0.8,
            });
          });

          clusterGroup.addLayer(marker);
        }
      });
    }

    renderClusters();

    map.on('moveend', renderClusters);
    map.on('zoomend', renderClusters);

    return () => {
      map.off('moveend', renderClusters);
      map.off('zoomend', renderClusters);
    };
  }, [kiosks, selectedKiosk]);

  // 5. Route Polyline Rendering & Bounds Fitting with Mode-Specific Animations
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!routeLayerGroupRef.current || !map.hasLayer(routeLayerGroupRef.current)) {
      routeLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    const routeGroup = routeLayerGroupRef.current;
    routeGroup.clearLayers();

    // Mode-specific route visual styles and traveler configurations
    const modeConfigs = {
      driving: {
        casingColor: isDarkMode ? '#1e3a8a' : '#1d4ed8',
        casingWeight: 8,
        mainColor: '#38bdf8',
        mainWeight: 5,
        className: 'route-mode-driving',
        speed: 0.0028,
        avatarHtml: `
          <div class="traveler-avatar-container">
            <div class="traveler-avatar-driving" title="Driving (Car)">
              <span class="text-base leading-none">🚗</span>
              <div class="traveler-headlight-beam"></div>
            </div>
          </div>
        `,
      },
      motorcycle: {
        casingColor: isDarkMode ? '#064e3b' : '#047857',
        casingWeight: 7,
        mainColor: '#34d399',
        mainWeight: 5,
        className: 'route-mode-motorcycle',
        speed: 0.0042,
        avatarHtml: `
          <div class="traveler-avatar-container">
            <div class="traveler-avatar-motorcycle" title="Two-Wheeler (Bike/Scooter)">
              <span class="text-base leading-none">🛵</span>
              <div class="traveler-speed-lines"></div>
            </div>
          </div>
        `,
      },
      walking: {
        casingColor: isDarkMode ? '#0c4a6e' : '#0369a1',
        casingWeight: 6,
        mainColor: '#38bdf8',
        mainWeight: 5,
        className: 'route-mode-walking',
        speed: 0.0012,
        avatarHtml: `
          <div class="traveler-avatar-container">
            <div class="traveler-avatar-walking" title="Walking (Pedestrian)">
              <span class="text-base leading-none">🚶‍♂️</span>
              <div class="traveler-footprint-wave"></div>
            </div>
          </div>
        `,
      },
    };

    const currentModeConfig = modeConfigs[transportMode || 'driving'];

    // Clean up previous traveler animation frame
    if (travelerAnimFrameRef.current) {
      cancelAnimationFrame(travelerAnimFrameRef.current);
      travelerAnimFrameRef.current = null;
    }

    // If directions are active, fit both the user location and destination kiosk
    if (isDirectionsActive && userLocation && selectedKiosk) {
      const boundsPoints: L.LatLngExpression[] = [
        [userLocation.lat, userLocation.lng],
        [selectedKiosk.lat, selectedKiosk.lng],
      ];

      if (routeInfo && routeInfo.coordinates && routeInfo.coordinates.length > 0) {
        const latLngs: L.LatLngExpression[] = routeInfo.coordinates.map(([lat, lng]) => [lat, lng]);

        // Outer Glow / Casing Line
        const casingPolyline = L.polyline(latLngs, {
          color: currentModeConfig.casingColor,
          weight: currentModeConfig.casingWeight,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Inner Active Animated Line tailored to selected transport mode
        const mainPolyline = L.polyline(latLngs, {
          color: currentModeConfig.mainColor,
          weight: currentModeConfig.mainWeight,
          opacity: 1,
          className: currentModeConfig.className,
          lineCap: transportMode === 'walking' ? 'round' : 'square',
          lineJoin: 'round',
        });

        routeGroup.addLayer(casingPolyline);
        routeGroup.addLayer(mainPolyline);
        latLngs.forEach((pt) => boundsPoints.push(pt));
      }

      // Smoothly fit both pins and route into view
      map.stop();
      map.invalidateSize();
      const routeBounds = L.latLngBounds(boundsPoints);
      map.fitBounds(routeBounds, {
        paddingTopLeft: [window.innerWidth > 768 ? 440 : 40, 80],
        paddingBottomRight: [70, 70],
        maxZoom: 15,
        animate: true,
      });
    } else if (routeInfo && routeInfo.coordinates && routeInfo.coordinates.length > 0) {
      const latLngs: L.LatLngExpression[] = routeInfo.coordinates.map(([lat, lng]) => [lat, lng]);

      const casingPolyline = L.polyline(latLngs, {
        color: currentModeConfig.casingColor,
        weight: currentModeConfig.casingWeight,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const mainPolyline = L.polyline(latLngs, {
        color: currentModeConfig.mainColor,
        weight: currentModeConfig.mainWeight,
        opacity: 1,
        className: currentModeConfig.className,
        lineCap: transportMode === 'walking' ? 'round' : 'square',
        lineJoin: 'round',
      });

      routeGroup.addLayer(casingPolyline);
      routeGroup.addLayer(mainPolyline);

      map.stop();
      map.invalidateSize();
      const routeBounds = L.latLngBounds(latLngs);
      map.fitBounds(routeBounds, {
        paddingTopLeft: [window.innerWidth > 768 ? 440 : 40, 80],
        paddingBottomRight: [70, 70],
        maxZoom: 15,
        animate: true,
      });
    }

    // Dynamic Moving Traveler Avatar along the route
    if (routeInfo && routeInfo.coordinates && routeInfo.coordinates.length >= 2) {
      const coords = routeInfo.coordinates;

      // Precompute segment lengths and cumulative distances
      const cumDistances: number[] = [0];
      let totalDist = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const d = Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
        totalDist += d;
        cumDistances.push(totalDist);
      }

      const travelerIcon = L.divIcon({
        className: 'traveler-marker-wrapper',
        html: currentModeConfig.avatarHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!travelerMarkerRef.current || !map.hasLayer(travelerMarkerRef.current)) {
        if (travelerMarkerRef.current) {
          try {
            map.removeLayer(travelerMarkerRef.current);
          } catch (e) {
            // ignore
          }
        }
        travelerMarkerRef.current = L.marker([coords[0][0], coords[0][1]], {
          icon: travelerIcon,
          zIndexOffset: 4000,
        }).addTo(map);
      } else {
        travelerMarkerRef.current.setIcon(travelerIcon);
      }

      // Continuous 60fps movement along route coordinates
      let progress = 0;
      const animateTraveler = () => {
        progress = (progress + currentModeConfig.speed) % 1;
        const targetDist = progress * totalDist;

        // Locate segment index
        let segIdx = 0;
        for (let i = 0; i < cumDistances.length - 1; i++) {
          if (targetDist >= cumDistances[i] && targetDist <= cumDistances[i + 1]) {
            segIdx = i;
            break;
          }
        }

        const segStartDist = cumDistances[segIdx];
        const segLen = cumDistances[segIdx + 1] - segStartDist;
        const segFrac = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;

        const curLat = coords[segIdx][0] + segFrac * (coords[segIdx + 1][0] - coords[segIdx][0]);
        const curLng = coords[segIdx][1] + segFrac * (coords[segIdx + 1][1] - coords[segIdx][1]);

        if (travelerMarkerRef.current) {
          travelerMarkerRef.current.setLatLng([curLat, curLng]);
        }

        travelerAnimFrameRef.current = requestAnimationFrame(animateTraveler);
      };

      travelerAnimFrameRef.current = requestAnimationFrame(animateTraveler);
    } else {
      if (travelerMarkerRef.current) {
        try {
          map.removeLayer(travelerMarkerRef.current);
        } catch (e) {
          // ignore
        }
        travelerMarkerRef.current = null;
      }
    }

    return () => {
      if (travelerAnimFrameRef.current) {
        cancelAnimationFrame(travelerAnimFrameRef.current);
        travelerAnimFrameRef.current = null;
      }
    };
  }, [routeInfo, isDirectionsActive, userLocation, selectedKiosk, transportMode, isDarkMode]);

  return (
    <div className={`relative w-full h-full ${isDarkMode && mapStyle !== 'satellite' ? 'dark-map-tiles' : ''}`}>
      <div
        ref={mapElementRef}
        id="leaflet-map-canvas"
        className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none"
      />
      {/* Dynamic Floating Transport Mode Indicator Badge on Map */}
      {isDirectionsActive && routeInfo && (
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[450] pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-full shadow-2xl border text-xs font-bold backdrop-blur-md transition-all duration-300 ${
            transportMode === 'driving'
              ? 'bg-blue-600/90 text-white border-blue-400/50 shadow-blue-500/20'
              : transportMode === 'motorcycle'
              ? 'bg-emerald-600/90 text-white border-emerald-400/50 shadow-emerald-500/20'
              : 'bg-sky-600/90 text-white border-sky-400/50 shadow-sky-500/20'
          }`}
        >
          <span className="text-base animate-bounce">
            {transportMode === 'driving' ? '🚗' : transportMode === 'motorcycle' ? '🛵' : '🚶‍♂️'}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold tracking-wide leading-tight">
              {transportMode === 'driving'
                ? language === 'hi'
                  ? 'कार मोड (Drive Car) — हाईवे ट्रैफिक फ्लो'
                  : 'Drive (Car) — Highway Traffic Flow'
                : transportMode === 'motorcycle'
                ? language === 'hi'
                  ? 'टू-व्हीलर मोड (Two-Wheeler) — सुपरफास्ट स्ट्रीक'
                  : 'Two-Wheeler — Agile City Streak'
                : language === 'hi'
                ? 'पैदल मोड (Walk) — स्टेपिंग डॉट्स एनीमेशन'
                : 'Walk — Stepping Dots Animation'}
            </span>
            <span className="text-[9px] opacity-85 font-medium leading-tight">
              {language === 'hi'
                ? 'लाइव एनीमेटेड ट्रैवेलर मार्ग पर आगे बढ़ रहा है'
                : 'Live moving traveler progressing along route'}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-white animate-ping ml-1" />
        </div>
      )}

      {/* Free Tile Layer Attribution Badge */}
      <div className="absolute bottom-1 right-2 z-[400] pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-1">
        <span>©</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {mapStyle === 'streets' || mapStyle === 'satellite' ? 'Esri, HERE, Garmin' : 'OpenStreetMap'}
        </span>
        <span>contributors (Free)</span>
      </div>
    </div>
  );
};
