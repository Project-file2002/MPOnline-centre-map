import React, { useState } from 'react';
import {
  Kiosk,
  RouteInfo,
  TransportMode,
  UserLocation,
  Language,
} from '../types';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle2,
  ChevronLeft,
  X,
  Share2,
  Copy,
  Printer,
  Fingerprint,
  FileText,
  Car,
  Bike,
  Footprints,
  ExternalLink,
  ShieldCheck,
  Check,
  Route,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { formatDistance, formatDuration } from '../services/geoUtils';
import { getT } from '../utils/translations';
import {
  getKioskWhatsAppUrl,
  getKioskWhatsAppMessage,
  WhatsAppIcon,
} from '../utils/whatsappShare';

interface KioskSidebarProps {
  kiosks: Array<Kiosk & { distanceKm: number | null }>;
  selectedKiosk: Kiosk | null;
  onSelectKiosk: (kiosk: Kiosk) => void;
  onCloseDetail: () => void;
  isDirectionsActive: boolean;
  onStartDirections: (kiosk: Kiosk) => void;
  onCloseDirections: () => void;
  routeInfo: RouteInfo | null;
  transportMode: TransportMode;
  onChangeTransportMode: (mode: TransportMode) => void;
  userLocation: UserLocation | null;
  isLoadingRoute: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onCenterUserLocation?: () => void;
  onCenterKiosk?: () => void;
  onFitRoute?: () => void;
  language: Language;
  onOpenDocsModal?: (serviceId?: string) => void;
}

export const KioskSidebar: React.FC<KioskSidebarProps> = ({
  kiosks,
  selectedKiosk,
  onSelectKiosk,
  onCloseDetail,
  isDirectionsActive,
  onStartDirections,
  onCloseDirections,
  routeInfo,
  transportMode,
  onChangeTransportMode,
  userLocation,
  isLoadingRoute,
  isOpen,
  onToggleOpen,
  onCenterUserLocation,
  onCenterKiosk,
  onFitRoute,
  language,
  onOpenDocsModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const t = getT(language);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWhatsAppMessage = (kiosk: Kiosk) => {
    const msg = getKioskWhatsAppMessage(kiosk, language);
    navigator.clipboard.writeText(msg);
    setShareToast(
      language === 'hi'
        ? '✅ व्हाट्सएप लोकेशन व Google Maps लिंक कॉपी हो गया!'
        : '✅ WhatsApp location & Google Maps link copied!'
    );
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleShare = (kiosk: Kiosk) => {
    const waUrl = getKioskWhatsAppUrl(kiosk, language);
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  // If sidebar is toggled closed on desktop
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="hidden sm:flex absolute left-4 top-[104px] z-[990] theme-panel-surface bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        title="Open Kiosks List"
      >
        <MapPin className="w-5 h-5 text-orange-600" />
      </button>
    );
  }

  return (
    <>
      {/* Desktop / Tablet Sidebar & Mobile Responsive Container */}
      <div
        className={`absolute z-[995] transition-all duration-300 ease-in-out
          /* Mobile styles: Bottom sheet */
          bottom-0 left-0 right-0 sm:bottom-auto sm:top-[106px] sm:left-4 sm:right-auto sm:w-[440px] md:w-[460px] max-w-[calc(100vw-24px)]
          theme-panel bg-white/95 dark:bg-slate-900/95 border-t sm:border border-slate-200/80 dark:border-slate-800
          shadow-2xl sm:rounded-2xl flex flex-col
          ${
            isMobileExpanded
              ? 'h-[82vh]'
              : selectedKiosk || isDirectionsActive
              ? 'h-[55vh] sm:h-[calc(100vh-120px)]'
              : 'h-[42vh] sm:h-[calc(100vh-120px)]'
          }
        `}
      >
        {/* Mobile Pull Handle */}
        <div
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="sm:hidden flex items-center justify-center py-2 cursor-pointer border-b border-slate-100 dark:border-slate-800/80"
        >
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* --- VIEW 1: DIRECTIONS VIEW --- */}
        {isDirectionsActive && selectedKiosk ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Directions Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={onCloseDirections}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.backToDetails}
                </button>
                <div className="flex items-center gap-1.5">
                  <a
                    href={getKioskWhatsAppUrl(selectedKiosk, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-extrabold shadow-sm transition active:scale-95"
                    title={t.shareLocationWhatsApp}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'व्हाट्सएप शेयर' : 'Share'}</span>
                  </a>
                  <button
                    onClick={onCloseDirections}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Origin & Destination inputs visual */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={onCenterUserLocation}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 text-left hover:bg-blue-100/80 dark:hover:bg-blue-900/50 transition group"
                  title="Click to view your live location marker on map"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-200 dark:ring-blue-800 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-blue-900 dark:text-blue-200 truncate">
                        {userLocation?.label || t.yourCurrentLocation}
                      </div>
                      <div className="text-[10px] text-blue-600/80 dark:text-blue-400">
                        {userLocation ? `${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°` : t.detectingLocation}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-xs ml-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                    {t.locateMe}
                  </span>
                </button>

                <div className="flex items-center justify-between px-2 py-0.5">
                  <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 ml-1.5" />
                  <button
                    type="button"
                    onClick={onFitRoute}
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    title="Fit map to show both your location and destination"
                  >
                    <span>{t.fitBothOnMap}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onCenterKiosk}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/70 text-left hover:bg-orange-100/80 dark:hover:bg-orange-900/50 transition group"
                  title="Click to center destination kiosk on map"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-600 ring-4 ring-orange-200 dark:ring-orange-800 flex-shrink-0" />
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-orange-950 dark:text-orange-200 truncate">
                        {selectedKiosk.name}
                      </div>
                      <div className="text-[10px] text-orange-700/80 dark:text-orange-400 truncate">
                        {selectedKiosk.address}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-xs ml-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                    {t.centerKiosk}
                  </span>
                </button>
              </div>

              {/* Transport Mode Switcher */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => onChangeTransportMode('driving')}
                  className={`flex flex-col items-center justify-center min-h-[50px] py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                    transportMode === 'driving'
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Drive Mode (Car) - Highway flow animation"
                >
                  <Car className={`w-4 h-4 mb-0.5 ${transportMode === 'driving' ? 'animate-bounce' : 'text-blue-500'}`} />
                  <span className="leading-tight">{t.driveMode}</span>
                  <span className="text-[9px] opacity-80 font-normal">🚗 Car</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTransportMode('motorcycle')}
                  className={`flex flex-col items-center justify-center min-h-[50px] py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                    transportMode === 'motorcycle'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Two-Wheeler Mode (Bike/Scooter) - Swift agility animation"
                >
                  <Bike className={`w-4 h-4 mb-0.5 ${transportMode === 'motorcycle' ? 'animate-bounce' : 'text-emerald-500'}`} />
                  <span className="leading-tight">{t.bikeMode}</span>
                  <span className="text-[9px] opacity-80 font-normal">🛵 Two-Wheeler</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeTransportMode('walking')}
                  className={`flex flex-col items-center justify-center min-h-[50px] py-2 px-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                    transportMode === 'walking'
                      ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-400 ring-offset-1 dark:ring-offset-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Walking Mode (Pedestrian) - Stepping dots animation"
                >
                  <Footprints className={`w-4 h-4 mb-0.5 ${transportMode === 'walking' ? 'animate-bounce' : 'text-sky-500'}`} />
                  <span className="leading-tight">{t.walkMode}</span>
                  <span className="text-[9px] opacity-80 font-normal">🚶 Walk</span>
                </button>
              </div>
            </div>

            {/* Route Stats & Steps */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoadingRoute ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-500">{t.calculatingRoute}</p>
                </div>
              ) : routeInfo ? (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                        {formatDuration(routeInfo.durationMinutes)}
                      </div>
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {formatDistance(routeInfo.distanceKm)}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Route className="w-3.5 h-3.5 text-blue-600" />
                      {routeInfo.summary}
                    </div>
                  </div>

                  {/* Turn-by-turn list */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {t.turnByTurnNav}
                    </h5>
                    <div className="space-y-3">
                      {routeInfo.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {step.instruction}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {step.distanceMeters > 0 ? `${step.distanceMeters} m` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  {t.selectLocationPrompt}
                </div>
              )}
            </div>
          </div>
        ) : selectedKiosk ? (
          /* --- VIEW 2: KIOSK PLACE DETAIL VIEW --- */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header image banner / illustration */}
            <div className="relative h-28 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-4 text-white flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <button
                  onClick={onCloseDetail}
                  className="p-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white backdrop-blur-md transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <a
                    href={getKioskWhatsAppUrl(selectedKiosk, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white backdrop-blur-md shadow-md transition active:scale-95 flex items-center justify-center"
                    title={t.shareLocationWhatsApp}
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                  </a>
                  <button
                    onClick={onCloseDetail}
                    className="p-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white backdrop-blur-md transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {t.authorizedCenter}
                </span>
                <h3 className="text-lg font-bold truncate mt-0.5">{selectedKiosk.name}</h3>
              </div>
            </div>

            {/* Quick Action Ribbon with Big Mobile Buttons */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onStartDirections(selectedKiosk)}
                  className="flex flex-col items-center justify-center min-h-[52px] py-2 px-1 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/25 hover:bg-blue-700 transition active:scale-95"
                  title="In-app route & turn-by-turn guidance"
                >
                  <Navigation className="w-5 h-5 mb-1 transform rotate-45" />
                  <span className="text-xs font-extrabold">{t.directions}</span>
                </button>

                <a
                  href={`https://wa.me/${selectedKiosk.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `${t.whatsappMsgPrefix} ${selectedKiosk.name} (${t.kioskCode} ${selectedKiosk.code})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center min-h-[52px] py-2 px-1 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition active:scale-95"
                  title="Chat on WhatsApp with kiosk operator to send documents"
                >
                  <MessageCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs font-extrabold">{t.whatsapp}</span>
                </a>

                <a
                  href={`tel:${selectedKiosk.phone}`}
                  className="flex flex-col items-center justify-center min-h-[52px] py-2 px-1 bg-amber-600 text-white rounded-2xl shadow-md shadow-amber-600/25 hover:bg-amber-700 transition active:scale-95"
                  title="Call kiosk operator directly"
                >
                  <Phone className="w-5 h-5 mb-1 text-white" />
                  <span className="text-xs font-extrabold">{t.callKiosk}</span>
                </a>
              </div>

              {/* Prominent WhatsApp Location Share Button (With Google Maps Live Nav Link) */}
              <div className="flex items-stretch gap-2">
                <a
                  href={getKioskWhatsAppUrl(selectedKiosk, language)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-extrabold shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
                  title={t.shareLocationWhatsAppSub}
                >
                  <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-black tracking-wide leading-tight">
                      {t.shareLocationWhatsApp}
                    </span>
                    <span className="text-[10px] opacity-90 font-medium leading-tight truncate">
                      {t.shareLocationWhatsAppSub}
                    </span>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppMessage(selectedKiosk)}
                  className="px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition active:scale-95"
                  title={language === 'hi' ? 'व्हाट्सएप संदेश व लिंक कॉपी करें' : 'Copy WhatsApp Message & Link'}
                >
                  <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'hi' ? 'कॉपी' : 'Copy'}</span>
                </button>
              </div>

              {/* Citizen Document Checklist Button */}
              <button
                onClick={() => onOpenDocsModal?.()}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-extrabold">{t.docsChecklistButton}</span>
                </div>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">
                  {language === 'hi' ? 'दस्तावेज़ व फीस देखें →' : 'View Fees & Rules →'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedKiosk.lat},${selectedKiosk.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[11px] font-bold"
                  title="Open GPS navigation in Google Maps app"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.googleMapsApp}</span>
                </a>

                <button
                  onClick={() => handleCopy(selectedKiosk.address)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-[11px] font-bold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Detailed Info Scroll View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-slate-700 dark:text-slate-200 text-xs">
              {/* Ratings and Status badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-extrabold text-sm">★ {selectedKiosk.rating}</span>
                  <span className="text-slate-400">({selectedKiosk.reviewsCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                      selectedKiosk.isOpenNow
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {selectedKiosk.isOpenNow ? `🟢 ${t.openNow}` : `🔴 ${t.closedNow}`}
                  </span>
                </div>
              </div>

              {/* Kiosk Identifier Block */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t.kioskCode}</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {selectedKiosk.code}
                  </div>
                </div>
                {selectedKiosk.isAuthorizedCSC && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    {t.authorizedCSC}
                  </div>
                )}
              </div>

              {/* Hardware / Facilities Available */}
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  {t.facilities}
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedKiosk.hasBiometricDevice && (
                    <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg font-bold">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                      {t.hasBiometric}
                    </span>
                  )}
                  {selectedKiosk.hasPrinter && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                      <Printer className="w-3.5 h-3.5" />
                      {t.hasPrinter}
                    </span>
                  )}
                  {selectedKiosk.hasPhotostat && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-semibold">
                      <FileText className="w-3.5 h-3.5" />
                      {t.hasPhotostat}
                    </span>
                  )}
                </div>
              </div>

              {/* Services List with Document Link for each service */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    {t.servicesProvided}
                  </h5>
                  <button
                    onClick={() => onOpenDocsModal?.()}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {t.docsChecklistButton}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {selectedKiosk.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {service}
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenDocsModal?.()}
                        className="text-[10px] font-extrabold text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-1 rounded-md border border-orange-200 dark:border-orange-800/60 flex-shrink-0 transition"
                      >
                        {t.viewDocsForThisService}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location & Contact Info */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedKiosk.address}
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      {selectedKiosk.city}, Madhya Pradesh - {selectedKiosk.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    {t.operatingHours}{' '}
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {selectedKiosk.openingHours}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a
                    href={`tel:${selectedKiosk.phone}`}
                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline text-sm"
                  >
                    {selectedKiosk.phone}
                  </a>
                  <span className="text-slate-400">({selectedKiosk.operatorName})</span>
                </div>

                {/* Open in OpenStreetMap */}
                <div className="pt-2">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedKiosk.lat}&mlon=${selectedKiosk.lng}#map=17/${selectedKiosk.lat}/${selectedKiosk.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View on OpenStreetMap.org</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- VIEW 3: KIOSKS LIST VIEW --- */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* List Header */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {t.nearbyHeading}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {kiosks.length} {t.kiosksCount}
                </p>
              </div>
              <button
                onClick={onToggleOpen}
                className="hidden sm:block p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* List of Kiosks */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar">
              {kiosks.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t.noKiosksFound}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.tryChangingFilter}
                  </p>
                </div>
              ) : (
                kiosks.map((kiosk) => (
                  <div
                    key={kiosk.id}
                    onClick={() => onSelectKiosk(kiosk)}
                    className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 cursor-pointer transition flex flex-col gap-2 theme-card border-b border-slate-100/80 dark:border-slate-800/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {kiosk.name}
                          </span>
                          {kiosk.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">
                          {kiosk.code}
                        </span>
                      </div>

                      {kiosk.distanceKm !== null && (
                        <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full flex-shrink-0 border border-blue-200 dark:border-blue-800">
                          {formatDistance(kiosk.distanceKm)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {kiosk.address}
                    </p>

                    <div className="flex items-center gap-2 text-xs pt-0.5">
                      <span className="font-extrabold text-amber-500">★ {kiosk.rating}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          kiosk.isOpenNow
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {kiosk.isOpenNow ? `🟢 ${t.openNow}` : `🔴 ${t.closedNow}`}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">{kiosk.locality}</span>
                    </div>

                    {/* Quick action buttons - Large touch friendly */}
                    <div className="flex items-center gap-2 pt-1 mt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartDirections(kiosk);
                        }}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition active:scale-95"
                      >
                        <Navigation className="w-4 h-4 transform rotate-45" />
                        <span>{t.directions}</span>
                      </button>

                      <a
                        href={getKioskWhatsAppUrl(kiosk, language)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[44px] px-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
                        title={t.shareLocationWhatsApp}
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span className="hidden xs:inline">{language === 'hi' ? 'शेयर' : 'Share'}</span>
                      </a>

                      <a
                        href={`tel:${kiosk.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[44px] px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition active:scale-95"
                        title={t.callOperator}
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>{t.callKiosk}</span>
                      </a>
                    </div>
                  </div>
                ))
              )}

              {/* Creator Signature Footer */}
              <div className="pt-3 pb-2 text-center border-t border-slate-100 dark:border-slate-800/80 mt-2">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>{language === 'hi' ? 'पोर्टल संकल्पना एवं निर्माण:' : 'Portal Crafted by:'}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-black">Abhishek Maurya</span>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold">(अभिषेक मौर्य)</span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  MPOnline Citizen GIS Navigator • MP Citizen Services
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Share Copy & Action Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold border border-[#25D366] transition-all">
          <WhatsAppIcon className="w-4 h-4 text-[#25D366] flex-shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}
    </>
  );
};
