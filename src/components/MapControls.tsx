import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  MapPin,
  WifiOff,
  Download,
  Trash2,
  X,
  CheckCircle,
  Database,
  Building2,
  HardDriveDownload,
  Search,
} from 'lucide-react';
import { MapTileStyle, OfflineCacheStats, Language, UITheme } from '../types';
import { MP_CITIES } from '../data/kiosks';
import { UIThemeMenu } from './UIThemeMenu';

const MP_CITY_TRANSLATIONS: Record<string, { hi: string; en: string; district: string }> = {
  Bhopal: { hi: 'भोपाल', en: 'Bhopal', district: 'भोपाल जिला (राजधानी)' },
  Indore: { hi: 'इंदौर', en: 'Indore', district: 'इंदौर जिला (व्यापारिक केंद्र)' },
  Jabalpur: { hi: 'जबलपुर', en: 'Jabalpur', district: 'जबलपुर संभाग' },
  Gwalior: { hi: 'ग्वालियर', en: 'Gwalior', district: 'ग्वालियर चंबल संभाग' },
  Ujjain: { hi: 'उज्जैन', en: 'Ujjain', district: 'उज्जैन संभाग (महाकाल)' },
  Sagar: { hi: 'सागर', en: 'Sagar', district: 'बुंदेलखंड संभाग' },
  Rewa: { hi: 'रीवा', en: 'Rewa', district: 'विंध्य संभाग' },
  Satna: { hi: 'सतना', en: 'Satna', district: 'सतना जिला' },
  Dewas: { hi: 'देवास', en: 'Dewas', district: 'मालवा क्षेत्र' },
  Ratlam: { hi: 'रतलाम', en: 'Ratlam', district: 'रतलाम जिला' },
  Narmadapuram: { hi: 'नर्मदापुरम', en: 'Narmadapuram', district: 'नर्मदापुरम संभाग' },
  Sehore: { hi: 'सीहोर', en: 'Sehore', district: 'सीहोर जिला' },
  Vidisha: { hi: 'विदिशा', en: 'Vidisha', district: 'विदिशा जिला' },
};

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  isLocating: boolean;
  mapStyle: MapTileStyle;
  onChangeMapStyle: (style: MapTileStyle) => void;
  onSelectCity: (city: { name: string; lat: number; lng: number; zoom: number }) => void;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  offlineStats: OfflineCacheStats;
  onDownloadCurrentArea: () => void;
  onClearCache: () => void;
  showOfflineModal: boolean;
  onCloseOfflineModal: () => void;
  onOpenOfflineModal: () => void;
  language?: Language;
  uiTheme?: UITheme;
  onChangeUiTheme?: (theme: UITheme) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  isLocating,
  mapStyle,
  onChangeMapStyle,
  onSelectCity,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  offlineStats,
  onDownloadCurrentArea,
  onClearCache,
  showOfflineModal,
  onCloseOfflineModal,
  onOpenOfflineModal,
  language = 'hi',
  uiTheme = 'aero',
  onChangeUiTheme,
}) => {
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = MP_CITIES.filter((c) => {
    if (!citySearch.trim()) return true;
    const query = citySearch.trim().toLowerCase();
    const trans = MP_CITY_TRANSLATIONS[c.name];
    return (
      c.name.toLowerCase().includes(query) ||
      (trans && (trans.hi.includes(query) || trans.district.toLowerCase().includes(query)))
    );
  });

  return (
    <>
      {/* Right-Side Floating Map Action Buttons */}
      <div className="absolute right-3 sm:right-4 bottom-24 sm:bottom-6 z-[990] flex flex-col gap-2 pointer-events-auto">
        {/* UI Theme Switcher Floating Action Button */}
        {onChangeUiTheme && (
          <UIThemeMenu
            currentTheme={uiTheme}
            onChangeTheme={onChangeUiTheme}
            language={language}
            variant="floating-button"
          />
        )}

        {/* City Quick Jumper Button */}
        <div className="relative group">
          <button
            onClick={() => {
              setShowCityDropdown(!showCityDropdown);
              setShowLayersDropdown(false);
              setCitySearch('');
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-xl border flex items-center justify-center transition active:scale-95 ${
              showCityDropdown
                ? 'bg-orange-600 text-white border-orange-700 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600'
            }`}
            title={language === 'hi' ? 'मध्य प्रदेश के प्रमुख शहर चुनें' : 'Jump to Madhya Pradesh City'}
            aria-label={language === 'hi' ? 'मध्य प्रदेश के प्रमुख शहर' : 'Jump to MP City'}
          >
            <Building2 className={`w-5 h-5 ${showCityDropdown ? 'text-white' : 'text-orange-600'}`} />
          </button>

          {/* Floating Tooltip for Desktop */}
          <div className="hidden sm:group-hover:flex absolute right-14 top-1/2 -translate-y-1/2 items-center bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap pointer-events-none backdrop-blur-sm border border-slate-700/50">
            <span>{language === 'hi' ? 'मध्य प्रदेश के प्रमुख शहर' : 'MP Cities & Districts'}</span>
          </div>

          {/* City Dropdown Menu */}
          {showCityDropdown && (
            <>
              {/* Backdrop for click outside */}
              <div
                className="fixed inset-0 z-40 bg-black/5"
                onClick={() => setShowCityDropdown(false)}
              />
              <div className="absolute right-12 sm:right-14 bottom-0 w-[calc(100vw-68px)] sm:w-72 max-w-[290px] theme-panel bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold z-50 animate-in fade-in zoom-in-95 duration-150 antialiased">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/70 flex items-center justify-center text-orange-600 dark:text-orange-400">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-[12px] text-slate-900 dark:text-white leading-tight">
                        {language === 'hi' ? 'म.प्र. के जिले एवं शहर' : 'MP Districts & Cities'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {language === 'hi' ? '1-टैप में सीधे जिले पर जाएं' : 'Instant 1-tap district jump'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCityDropdown(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={language === 'hi' ? 'बंद करें' : 'Close'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Search inside cities */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={language === 'hi' ? 'शहर या संभाग खोजें...' : 'Search city or district...'}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-normal"
                    autoFocus
                  />
                </div>

                {/* City List */}
                <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {filteredCities.map((c) => {
                    const trans = MP_CITY_TRANSLATIONS[c.name] || {
                      hi: c.name,
                      en: c.name,
                      district: 'मध्य प्रदेश',
                    };
                    return (
                      <button
                        key={c.name}
                        onClick={() => {
                          onSelectCity(c);
                          setShowCityDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800/90 hover:text-orange-600 transition flex items-center justify-between group/city active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 group-hover/city:scale-110 transition-transform shrink-0" />
                          <div>
                            <p className="font-bold text-[12px] text-slate-800 dark:text-slate-200 group-hover/city:text-orange-600 dark:group-hover/city:text-orange-400 leading-tight">
                              {language === 'hi' ? trans.hi : trans.en}
                              {language === 'hi' && (
                                <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                  ({trans.en})
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {trans.district}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/city:bg-orange-100 dark:group-hover/city:bg-orange-950/60 group-hover/city:text-orange-600">
                          {c.zoom}x
                        </span>
                      </button>
                    );
                  })}
                  {filteredCities.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      {language === 'hi' ? 'कोई शहर नहीं मिला' : 'No cities found'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayersDropdown(!showLayersDropdown);
              setShowCityDropdown(false);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Change Map Layers"
          >
            <Layers className="w-5 h-5 text-blue-600" />
          </button>

          {/* Layer Options */}
          {showLayersDropdown && (
            <div className="absolute right-12 bottom-0 w-[calc(100vw-68px)] sm:w-64 max-w-[260px] theme-panel bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 font-semibold space-y-1.5 antialiased z-50">
              <div className="px-2 py-1 text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 pb-1.5 mb-1">
                Map Styles (100% Free)
              </div>
              <button
                type="button"
                onClick={() => {
                  onChangeMapStyle('streets');
                  setShowLayersDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-[13px] ${
                  mapStyle === 'streets'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">Esri Streets (Google Style)</span>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full font-bold border border-blue-200/80 dark:border-blue-700/60">
                  Default
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeMapStyle('osm');
                  setShowLayersDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-[13px] ${
                  mapStyle === 'osm'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">OpenStreetMap Standard</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold border border-emerald-300/80 dark:border-emerald-700/60">
                  Free
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeMapStyle('hot');
                  setShowLayersDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-[13px] ${
                  mapStyle === 'hot'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">OSM Humanitarian (HOT)</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold border border-emerald-300/80 dark:border-emerald-700/60">
                  Free
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeMapStyle('topo');
                  setShowLayersDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-[13px] ${
                  mapStyle === 'topo'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">OpenTopoMap (Terrain)</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold border border-emerald-300/80 dark:border-emerald-700/60">
                  Free
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeMapStyle('satellite');
                  setShowLayersDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-[13px] ${
                  mapStyle === 'satellite'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 font-medium'
                }`}
              >
                <span className="font-semibold text-slate-900 dark:text-white">Satellite Imagery</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold border border-emerald-300/80 dark:border-emerald-700/60">
                  Free
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Offline Cache Status & Tool */}
        <button
          onClick={onOpenOfflineModal}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-xl border flex items-center justify-center transition relative ${
            isSimulatedOffline
              ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Offline Map & Tile Cache Manager"
        >
          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {offlineStats.cachedTileCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              ✓
            </span>
          )}
        </button>

        {/* Recenter GPS Location Button */}
        <button
          onClick={onRecenter}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 ${
            isLocating ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/60' : ''
          }`}
          title="Mera Sthaan / My Location (आपका स्थान)"
        >
          <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-blue-600' : 'text-blue-600 dark:text-blue-400'}`} />
        </button>

        {/* Zoom In & Zoom Out Group */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <button
            onClick={onZoomIn}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition"
            title="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onZoomOut}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offline Storage Manager Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Offline Map Caching</h3>
                  <p className="text-xs text-slate-400">Low-connectivity & rural area support</p>
                </div>
              </div>
              <button
                onClick={onCloseOfflineModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Cached Map Tiles</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {offlineStats.cachedTileCount.toLocaleString()} tiles
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">IndexedDB Storage</span>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {offlineStats.cacheSizeMB} MB
                  </div>
                </div>
              </div>

              {/* Download Current Area */}
              <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 mb-1">
                  <Download className="w-4 h-4 text-blue-600" />
                  Pre-Cache Current Visible Area
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mb-3">
                  Pre-download road and street tiles for the current map viewport (zoom levels 12-15) so you can navigate MPOnline kiosks even without internet.
                </p>

                {offlineStats.isDownloading ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                      <span>Downloading tiles...</span>
                      <span>{offlineStats.downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-200"
                        style={{ width: `${offlineStats.downloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onDownloadCurrentArea}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <HardDriveDownload className="w-4 h-4" />
                    Download Current View Offline
                  </button>
                )}
              </div>

              {/* Simulated Offline Mode Toggle for Testing */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    Simulate Offline Mode
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Test how map and kiosks render without network connectivity
                  </p>
                </div>
                <button
                  onClick={onToggleSimulatedOffline}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSimulatedOffline ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSimulatedOffline ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Clear Storage */}
              {offlineStats.cachedTileCount > 0 && (
                <button
                  onClick={onClearCache}
                  className="w-full py-2 px-3 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Offline Cache
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
