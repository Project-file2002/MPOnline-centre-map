import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Navigation,
  SlidersHorizontal,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Mic,
  MicOff,
  Languages,
  FileText,
  AlertCircle,
  Volume2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { FilterOptions, Kiosk, Language, UITheme } from '../types';
import { POPULAR_SERVICES, MP_CITIES } from '../data/kiosks';
import { formatDistance } from '../services/geoUtils';
import { getT } from '../utils/translations';
import { getKioskWhatsAppUrl, WhatsAppIcon } from '../utils/whatsappShare';
import { UIThemeMenu } from './UIThemeMenu';

const POPULAR_VOICE_QUERIES_HI = [
  'मेरे पास का कियोस्क',
  'समग्र ई-केवाईसी',
  'खसरा खतौनी नकल',
  'समग्र के दस्तावेज व फीस',
  'अभी खुले कियोस्क',
  'लाड़ली बहना योजना',
  'रास्ता बताओ (नेविगेशन)',
  'व्यापम परीक्षा फॉर्म',
];

const POPULAR_VOICE_QUERIES_EN = [
  'Nearest Kiosk Center',
  'Samagra e-KYC',
  'Khasra Khatauni Copy',
  'Documents & Govt Rates',
  'Open Kiosks Now',
  'Ladli Behna Yojana',
  'Start Directions',
  'Vyapam MPPEB Form',
];

interface GoogleMapsSearchBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  kiosks: Kiosk[];
  onSelectKiosk: (kiosk: Kiosk) => void;
  selectedKiosk: Kiosk | null;
  onToggleDirections: () => void;
  isDirectionsActive: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onOpenOfflineManager: () => void;
  kiosksWithDistance: Array<Kiosk & { distanceKm: number | null }>;
  language: Language;
  onToggleLanguage: () => void;
  onOpenDocsModal: (serviceId?: string) => void;
  uiTheme?: UITheme;
  onChangeUiTheme?: (theme: UITheme) => void;
}

export const GoogleMapsSearchBar: React.FC<GoogleMapsSearchBarProps> = ({
  filters,
  onFilterChange,
  onSelectKiosk,
  selectedKiosk,
  onToggleDirections,
  isDirectionsActive,
  isDarkMode,
  onToggleDarkMode,
  isOnline,
  isSimulatedOffline,
  onOpenOfflineManager,
  kiosksWithDistance,
  language,
  onToggleLanguage,
  onOpenDocsModal,
  uiTheme = 'aero',
  onChangeUiTheme,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<
    'idle' | 'requesting' | 'connected' | 'listening' | 'blocked' | 'error' | 'network-error'
  >('idle');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);

  const t = getT(language);

  // Intelligent Natural Language Query & Voice Intent Processor
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      setLiveTranscript(text);
      const lower = text.toLowerCase().trim();

      // 1. Document & Fees / General Questions Intent
      const docKeywords = [
        'document',
        'documents',
        'paper',
        'dastavej',
        'dastavez',
        'kaagaz',
        'kya chahiye',
        'patrata',
        'eligibility',
        'fees',
        'fee',
        'charges',
        'rate',
        'rates',
        'shulk',
        'kitna lagta',
        'दस्तावेज',
        'कागजात',
        'फीस',
        'शुल्क',
        'दर',
        'नियम',
      ];
      if (docKeywords.some((w) => lower.includes(w))) {
        let targetServiceId = 'samagra';
        if (
          lower.includes('khasra') ||
          lower.includes('khatauni') ||
          lower.includes('bhulekh') ||
          lower.includes('खसरा') ||
          lower.includes('जमीन')
        ) {
          targetServiceId = 'khasra';
        } else if (
          lower.includes('ladli') ||
          lower.includes('behna') ||
          lower.includes('लाड़ली') ||
          lower.includes('बहना')
        ) {
          targetServiceId = 'ladli-behna';
        } else if (lower.includes('pan') || lower.includes('पैन')) {
          targetServiceId = 'pancard';
        } else if (
          lower.includes('bijli') ||
          lower.includes('electricity') ||
          lower.includes('बिजली')
        ) {
          targetServiceId = 'electricity';
        } else if (
          lower.includes('caste') ||
          lower.includes('income') ||
          lower.includes('jati') ||
          lower.includes('aay') ||
          lower.includes('जाति')
        ) {
          targetServiceId = 'caste-cert';
        } else if (
          lower.includes('vyapam') ||
          lower.includes('esb') ||
          lower.includes('peb') ||
          lower.includes('व्यापम')
        ) {
          targetServiceId = 'vyapam';
        } else if (
          lower.includes('ayushman') ||
          lower.includes('golden') ||
          lower.includes('आयुष्मान')
        ) {
          targetServiceId = 'ayushman';
        }

        onOpenDocsModal(targetServiceId);
        setSpeechNotice(
          language === 'hi'
            ? '📋 सरकारी दस्तावेज एवं शुल्क दर सूची खोली गई'
            : '📋 Opened Citizen Document Checklist & Govt Rates'
        );
        return;
      }

      // 2. Detect Specific Service
      let serviceFilter = 'All Services';
      if (
        lower.includes('samagra') ||
        lower.includes('ekyc') ||
        lower.includes('ईकेवाईसी') ||
        lower.includes('समग्र')
      ) {
        serviceFilter = 'Samagra e-KYC';
      } else if (
        lower.includes('khasra') ||
        lower.includes('khatauni') ||
        lower.includes('bhulekh') ||
        lower.includes('खसरा') ||
        lower.includes('खतौनी')
      ) {
        serviceFilter = 'MP Bhulekh / Khasra Khatauni';
      } else if (
        lower.includes('ladli') ||
        lower.includes('behna') ||
        lower.includes('लाड़ली') ||
        lower.includes('बहना')
      ) {
        serviceFilter = 'Ladli Behna Yojana';
      } else if (
        lower.includes('vyapam') ||
        lower.includes('peb') ||
        lower.includes('esb') ||
        lower.includes('व्यापम')
      ) {
        serviceFilter = 'MPPEB / Vyapam Exam Form';
      } else if (lower.includes('pan card') || lower.includes('pan') || lower.includes('पैन')) {
        serviceFilter = 'PAN Card Application';
      } else if (
        lower.includes('bijli') ||
        lower.includes('electricity') ||
        lower.includes('बिजली')
      ) {
        serviceFilter = 'Electricity Bill Payment';
      } else if (
        lower.includes('ayushman') ||
        lower.includes('golden') ||
        lower.includes('आयुष्मान')
      ) {
        serviceFilter = 'Ayushman Bharat Golden Card';
      } else if (
        lower.includes('caste') ||
        lower.includes('income') ||
        lower.includes('jati') ||
        lower.includes('जाति')
      ) {
        serviceFilter = 'Caste & Income Certificate';
      }

      // 3. Nearest Kiosk / Proximity Intent ("nearest", "pass ka", "near me", "closest")
      const nearestKeywords = [
        'nearest',
        'near me',
        'closest',
        'nearby',
        'pass ka',
        'paas ka',
        'paas wala',
        'pass wala',
        'sabse paas',
        'sabse pass',
        'najdeek',
        'nazdeek',
        'paas',
        'पास का',
        'समीप',
        'नज़दीक',
        'मेरे पास',
      ];
      if (nearestKeywords.some((w) => lower.includes(w))) {
        let pool = [...kiosksWithDistance].filter((k) => k.distanceKm !== null);
        if (serviceFilter !== 'All Services') {
          pool = pool.filter((k) => k.services.includes(serviceFilter));
          onFilterChange({ selectedService: serviceFilter, searchQuery: '' });
        } else {
          onFilterChange({ searchQuery: '' });
        }

        pool.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        if (pool.length > 0) {
          const nearestKiosk = pool[0];
          onSelectKiosk(nearestKiosk);
          setSpeechNotice(
            language === 'hi'
              ? `📍 सबसे नज़दीकी केंद्र चुना गया: ${nearestKiosk.name} (${nearestKiosk.distanceKm?.toFixed(1)} किमी)`
              : `📍 Selected Nearest Center: ${nearestKiosk.name} (${nearestKiosk.distanceKm?.toFixed(1)} km)`
          );
          return;
        }
      }

      // 4. Open Now Intent ("open now", "khula hai")
      const openKeywords = ['open', 'open now', 'khula', 'khule', 'chaloo', 'chalu', 'खुला', 'चालू'];
      if (openKeywords.some((w) => lower.includes(w))) {
        onFilterChange({ onlyOpenNow: true, searchQuery: '' });
        setSpeechNotice(
          language === 'hi'
            ? '✅ केवल अभी खुले कियोस्क फ़िल्टर किए गए'
            : '✅ Filtered to kiosks open right now'
        );
        return;
      }

      // 5. Start Directions / Navigation Intent ("rasta batao", "directions")
      const directionKeywords = [
        'direction',
        'directions',
        'route',
        'rasta',
        'raasta',
        'navigation',
        'रास्ता',
        'मार्ग',
        'नेविगेशन',
      ];
      if (directionKeywords.some((w) => lower.includes(w))) {
        onToggleDirections();
        setSpeechNotice(
          language === 'hi' ? '🧭 मार्ग व नेविगेशन चालू किया गया' : '🧭 Started route navigation'
        );
        return;
      }

      // 6. If specific service matched without other intents
      if (serviceFilter !== 'All Services') {
        onFilterChange({ selectedService: serviceFilter, searchQuery: '' });
        setSpeechNotice(
          language === 'hi'
            ? `🔍 सेवा फ़िल्टर: ${serviceFilter}`
            : `🔍 Service filter: ${serviceFilter}`
        );
        return;
      }

      // 7. General search query fallback
      onFilterChange({ searchQuery: text });
      setSpeechNotice(`"${text}"`);
    },
    [kiosksWithDistance, language, onFilterChange, onOpenDocsModal, onSelectKiosk, onToggleDirections]
  );

  // Stop Voice Search and cleanup media stream & Web Audio API
  const stopVoiceSearch = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;
    setMicStatus('idle');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Start Voice Search with proper microphone permission & live audio monitoring
  const startVoiceSearch = async () => {
    setShowVoiceModal(true);
    setMicStatus('requesting');
    setSpeechNotice(t.micConnecting);
    setLiveTranscript('');

    // 1. Explicitly request hardware microphone access via getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        // Set up Web Audio API to detect real-time audio volume
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!isListeningRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          }
        } catch (audioErr) {
          console.warn('Web Audio error:', audioErr);
        }
      } catch (mediaErr: any) {
        console.warn('Microphone permission info from getUserMedia:', mediaErr);
        // Do not early return: SpeechRecognition may still be granted or supported
      }
    }

    // 2. Initialize SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatus('error');
      setSpeechNotice(t.voiceNotSupported);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setMicStatus('listening');
        setSpeechNotice(t.micConnected);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTxt = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTxt += trans;
          } else {
            interim += trans;
          }
        }
        const text = (finalTxt || interim).trim();
        if (text) {
          handleVoiceTranscript(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicStatus('blocked');
          setSpeechNotice(t.micPermissionBlocked);
        } else if (event.error === 'no-speech') {
          setSpeechNotice(t.micNoSpeech);
        } else if (event.error === 'network') {
          setMicStatus('network-error');
          setSpeechNotice(t.micNetworkIssue);
        } else {
          setSpeechNotice(t.voiceSearchError);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice start error:', err);
      setMicStatus('error');
      setSpeechNotice(t.voiceSearchError);
    }
  };

  const handleVoiceSearch = () => {
    if (isListening || showVoiceModal) {
      stopVoiceSearch();
      setShowVoiceModal(false);
    } else {
      startVoiceSearch();
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceSearch();
    };
  }, [stopVoiceSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestions filtered by query
  const query = filters.searchQuery.trim().toLowerCase();
  const suggestions = query
    ? kiosksWithDistance
        .filter(
          (k) =>
            k.name.toLowerCase().includes(query) ||
            k.code.toLowerCase().includes(query) ||
            k.locality.toLowerCase().includes(query) ||
            k.city.toLowerCase().includes(query) ||
            k.operatorName.toLowerCase().includes(query) ||
            k.services.some((s) => s.toLowerCase().includes(query))
        )
        .slice(0, 5)
    : [];

  return (
    <div
      ref={searchContainerRef}
      className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-[1000] sm:w-[440px] md:w-[460px] max-w-[calc(100vw-24px)] pointer-events-auto"
    >
      {/* Floating Google Maps-style Card */}
      <div className="theme-panel bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all duration-200">
        <div className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 gap-1 sm:gap-1.5 w-full">
          {/* Brand Emblem */}
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-sm flex-shrink-0">
            <span className="font-extrabold text-[11px] sm:text-xs tracking-tighter">MP</span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[70px]">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              onFocus={() => setIsFocused(true)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none truncate"
            />
          </div>

          {/* Clear Button */}
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center flex-shrink-0"
              title={t.clearSearch}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Voice Search (बोलकर खोजें 🎙️) Button */}
          <button
            onClick={handleVoiceSearch}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition flex items-center justify-center relative flex-shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-300 dark:ring-rose-900'
                : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40'
            }`}
            title={t.voiceSearchTooltip}
            aria-label="Voice Search"
          >
            <Mic className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isListening ? 'animate-bounce' : ''}`} />
          </button>

          {/* Hindi / English Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 transition text-[11px] font-black flex items-center justify-center flex-shrink-0"
            title={t.switchLangTooltip}
            aria-label={t.switchLangTooltip}
          >
            <span>{language === 'hi' ? 'हि' : 'EN'}</span>
          </button>

          {/* UI Changing Menu Button (Frosted Aero & Skins) */}
          {onChangeUiTheme && (
            <div className="flex-shrink-0 flex items-center justify-center">
              <UIThemeMenu
                currentTheme={uiTheme}
                onChangeTheme={onChangeUiTheme}
                language={language}
                variant="compact"
              />
            </div>
          )}

          {/* Directions Toggle Button */}
          <button
            onClick={onToggleDirections}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition flex items-center justify-center flex-shrink-0 ${
              isDirectionsActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isDirectionsActive ? t.exitDirectionsTooltip : t.directionsTooltip}
            aria-label={t.directionsTooltip}
          >
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform rotate-45" />
          </button>

          {/* Offline Warning Badge (Shown only if network offline or simulated offline) */}
          {(!isOnline || isSimulatedOffline) && (
            <button
              onClick={onOpenOfflineManager}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition flex items-center justify-center relative flex-shrink-0 text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse"
              title="Offline Mode Active"
              aria-label="Offline Mode Active"
            >
              <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center flex-shrink-0"
            title={isDarkMode ? t.switchLightMode : t.switchDarkMode}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Filter options toggle (Always neatly inside the card) */}
          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition flex items-center justify-center flex-shrink-0 ${
              filters.onlyOpenNow ||
              filters.onlyVerified ||
              filters.onlyCSC ||
              filters.selectedService !== 'All Services' ||
              filters.minRating > 0
                ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.filterButton}
            aria-label={t.filterButton}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Speech Recognition Active Feedback Banner */}
        {speechNotice && (
          <div className="px-3.5 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/80 dark:to-amber-950/80 border-t border-orange-200 dark:border-orange-900/70 flex items-center justify-between text-xs text-orange-950 dark:text-orange-100 antialiased shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              {micStatus === 'listening' ? (
                <span className="flex h-3 w-3 relative flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              ) : micStatus === 'blocked' || micStatus === 'error' || micStatus === 'network-error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse flex-shrink-0" />
              )}
              <span className="font-extrabold truncate text-xs text-slate-900 dark:text-white tracking-tight">
                {speechNotice}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(micStatus === 'blocked' || micStatus === 'error' || micStatus === 'network-error') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startVoiceSearch();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.micRetry}</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopVoiceSearch();
                  setSpeechNotice(null);
                  setShowVoiceModal(false);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title={t.closeButton}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Suggestion Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 py-2 max-h-72 overflow-y-auto custom-scrollbar">
            {suggestions.map((kiosk) => (
              <div
                key={kiosk.id}
                onMouseDown={() => {
                  onSelectKiosk(kiosk);
                  setIsFocused(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {kiosk.name}
                    </span>
                    {kiosk.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {kiosk.locality}, {kiosk.city} •{' '}
                    <span className="text-orange-600 dark:text-orange-400 font-mono">
                      {kiosk.code}
                    </span>
                  </div>
                </div>
                {kiosk.distanceKm !== null && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">
                    {formatDistance(kiosk.distanceKm)}
                  </span>
                )}
                <a
                  href={getKioskWhatsAppUrl(kiosk, language)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#1da851] hover:text-white transition flex-shrink-0"
                  title="Share on WhatsApp (Google Maps Nav link)"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Quick Documents Checklist Button */}
        <button
          onClick={() => onOpenDocsModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-95"
          title={t.docsChecklistModalTitle}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t.docsChecklistButton}</span>
        </button>

        {/* Open Now Chip */}
        <button
          onClick={() => onFilterChange({ onlyOpenNow: !filters.onlyOpenNow })}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition whitespace-nowrap ${
            filters.onlyOpenNow
              ? 'bg-emerald-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t.openNowFilter}
        </button>

        {/* Nearest Chip */}
        <button
          onClick={() =>
            onFilterChange({
              maxDistanceKm: filters.maxDistanceKm ? null : 5,
            })
          }
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition whitespace-nowrap ${
            filters.maxDistanceKm
              ? 'bg-blue-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Navigation className="w-3 h-3" />
          {t.nearMeFilter}
        </button>

        {/* Samagra eKYC Chip */}
        <button
          onClick={() =>
            onFilterChange({
              selectedService:
                filters.selectedService === 'Samagra e-KYC'
                  ? 'All Services'
                  : 'Samagra e-KYC',
            })
          }
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition whitespace-nowrap ${
            filters.selectedService === 'Samagra e-KYC'
              ? 'bg-orange-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          समग्र e-KYC
        </button>

        {/* MPPEB / Vyapam */}
        <button
          onClick={() =>
            onFilterChange({
              selectedService:
                filters.selectedService === 'MPPEB / Vyapam Exam Form'
                  ? 'All Services'
                  : 'MPPEB / Vyapam Exam Form',
            })
          }
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition whitespace-nowrap ${
            filters.selectedService === 'MPPEB / Vyapam Exam Form'
              ? 'bg-indigo-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          व्यापम (PEB)
        </button>

        {/* Top Rated */}
        <button
          onClick={() =>
            onFilterChange({
              minRating: filters.minRating === 4.7 ? 0 : 4.7,
            })
          }
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition whitespace-nowrap ${
            filters.minRating >= 4.7
              ? 'bg-amber-600 text-white'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          ★ 4.7+
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {showFiltersModal && (
        <>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-[1040] bg-black/20 backdrop-blur-[2px]"
            onClick={() => setShowFiltersModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-[1050] mt-2 theme-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {language === 'hi' ? 'एमपीऑनलाइन कियोस्क फ़िल्टर' : 'Filter MPOnline Kiosks'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {language === 'hi' ? 'अपनी सुविधानुसार कियोस्क चुनें' : 'Refine centers by distance, service & status'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange({
                      onlyOpenNow: false,
                      onlyVerified: false,
                      onlyCSC: false,
                      minRating: 0,
                      selectedService: 'All Services',
                      maxDistanceKm: null,
                      cityFilter: 'All Cities',
                    });
                  }}
                  className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline px-1.5 py-0.5"
                >
                  {language === 'hi' ? 'रीसेट करें' : 'Reset All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title={t.closeButton}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Citizen Service Dropdown */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  {language === 'hi' ? 'सरकारी नागरिक सेवा (Citizen Service)' : 'Citizen Service'}
                </label>
                <select
                  value={filters.selectedService}
                  onChange={(e) => onFilterChange({ selectedService: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 dark:border-slate-700"
                >
                  {POPULAR_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              {/* City / District Dropdown */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  {language === 'hi' ? 'जिला / शहर चुनें (District / City)' : 'District / City'}
                </label>
                <select
                  value={filters.cityFilter}
                  onChange={(e) => onFilterChange({ cityFilter: e.target.value })}
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-200 dark:border-slate-700"
                >
                  <option value="All Cities">
                    {language === 'hi' ? 'सभी जिले (All Districts of MP)' : 'All Cities'}
                  </option>
                  {MP_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} (MP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Maximum Distance Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">
                  {language === 'hi' ? 'दूरी सीमा (Maximum Distance)' : 'Maximum Distance'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: language === 'hi' ? 'सभी' : 'Any', val: null },
                    { label: '2 km', val: 2 },
                    { label: '5 km', val: 5 },
                    { label: '10 km', val: 10 },
                  ].map((d) => (
                    <button
                      key={String(d.val)}
                      type="button"
                      onClick={() => onFilterChange({ maxDistanceKm: d.val })}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition ${
                        filters.maxDistanceKm === d.val
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">
                  {language === 'hi' ? 'न्यूनतम रेटिंग (Minimum Rating)' : 'Minimum Rating'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: language === 'hi' ? 'कोई भी' : 'Any', val: 0 },
                    { label: '★ 4.0+', val: 4.0 },
                    { label: '★ 4.5+', val: 4.5 },
                    { label: '★ 4.7+', val: 4.7 },
                  ].map((r) => (
                    <button
                      key={String(r.val)}
                      type="button"
                      onClick={() => onFilterChange({ minRating: r.val })}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition ${
                        filters.minRating === r.val
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyOpenNow}
                    onChange={(e) => onFilterChange({ onlyOpenNow: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-bold text-[11px]">
                    {language === 'hi' ? '🟢 अभी खुला है' : '🟢 Open Now'}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyVerified}
                    onChange={(e) => onFilterChange({ onlyVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-bold text-[11px]">
                    {language === 'hi' ? '✓ सत्यापित केंद्र' : '✓ Verified Only'}
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyCSC}
                    onChange={(e) => onFilterChange({ onlyCSC: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-bold text-[11px]">
                    {language === 'hi' ? '🏛️ CSC अधिकृत' : '🏛️ CSC Authorized'}
                  </span>
                </label>
              </div>

              {/* Apply / Done Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-extrabold text-xs shadow-md shadow-orange-600/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? 'फ़िल्टर लागू करें (Apply Filters)'
                      : 'Apply Filters'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dedicated Interactive Voice Search Dialog */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col items-center text-center space-y-4 overflow-hidden">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t.voiceModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopVoiceSearch();
                  setShowVoiceModal(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={t.closeButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Central Animated Mic Sphere */}
            <div className="relative my-2 flex items-center justify-center">
              {/* Outer pulsing wave rings */}
              {micStatus === 'listening' && (
                <>
                  <div
                    className="absolute rounded-full bg-emerald-500/20 animate-ping"
                    style={{
                      width: `${80 + Math.min(60, audioLevel * 1.2)}px`,
                      height: `${80 + Math.min(60, audioLevel * 1.2)}px`,
                    }}
                  />
                  <div
                    className="absolute rounded-full bg-emerald-500/10"
                    style={{
                      width: `${100 + Math.min(80, audioLevel * 1.5)}px`,
                      height: `${100 + Math.min(80, audioLevel * 1.5)}px`,
                      transition: 'all 0.1s ease-out',
                    }}
                  />
                </>
              )}

              {/* Central Mic Button */}
              <button
                type="button"
                onClick={() => {
                  if (micStatus === 'listening') {
                    stopVoiceSearch();
                  } else {
                    startVoiceSearch();
                  }
                }}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition transform active:scale-95 ${
                  micStatus === 'listening'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/40 ring-4 ring-emerald-200 dark:ring-emerald-950'
                    : micStatus === 'blocked' || micStatus === 'error'
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/30 ring-4 ring-rose-200 dark:ring-rose-950'
                    : 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-500/30'
                }`}
                title={micStatus === 'listening' ? 'Stop Listening' : 'Start Listening'}
              >
                {micStatus === 'listening' ? (
                  <Mic className="w-8 h-8 animate-pulse" />
                ) : micStatus === 'blocked' || micStatus === 'error' ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Audio Waveform Equalizer Display */}
            {micStatus === 'listening' && (
              <div className="flex items-center gap-1.5 h-6">
                {[1, 2, 3, 4, 5].map((bar) => {
                  const height = Math.max(
                    6,
                    Math.min(24, (audioLevel / 2) * (1 + (bar % 3) * 0.4))
                  );
                  return (
                    <div
                      key={bar}
                      className="w-1.5 bg-emerald-500 rounded-full transition-all duration-75"
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
            )}

            {/* Connection / Status Label */}
            <div>
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {micStatus === 'listening'
                  ? t.micConnected
                  : micStatus === 'requesting'
                  ? t.micConnecting
                  : micStatus === 'blocked'
                  ? t.micPermissionBlocked
                  : micStatus === 'network-error'
                  ? t.micNetworkIssue
                  : t.voiceModalTitle}
              </p>
              {micStatus === 'blocked' && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-left space-y-2">
                  <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {language === 'hi'
                          ? 'Iframe सैंडबॉक्स सीमा (Iframe Sandbox Restriction)'
                          : 'Iframe Sandbox Restriction'}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        {t.iframeMicNotice}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                    >
                      <span>{t.openInNewTab}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Live Transcript / Speech Preview Box */}
            <div className="w-full min-h-[56px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center">
              {liveTranscript ? (
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  "{liveTranscript}"
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  {language === 'hi'
                    ? 'बोलिए... जैसे "समग्र ईकेवाईसी", "खसरा खतौनी", "एमपी नगर"...'
                    : 'Speak now... e.g. "Samagra KYC", "Khasra copy", "MP Nagar"...'}
                </span>
              )}
            </div>

            {/* Quick 1-Tap Voice Suggestions (MP Citizen Services) */}
            <div className="w-full text-left pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t.quickVoicePicks}
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {(language === 'hi' ? POPULAR_VOICE_QUERIES_HI : POPULAR_VOICE_QUERIES_EN).map(
                  (query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => {
                        handleVoiceTranscript(query);
                        stopVoiceSearch();
                        setShowVoiceModal(false);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/60 hover:text-orange-700 dark:hover:text-orange-300 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition active:scale-95"
                    >
                      {query}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-2 pt-1">
              {(micStatus === 'blocked' || micStatus === 'error' || micStatus === 'network-error') ? (
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className="flex-1 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.micRetry}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceSearch();
                    setShowVoiceModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition active:scale-95"
                >
                  {language === 'hi' ? 'सर्च परिणाम देखें' : 'View Search Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
