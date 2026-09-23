import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, Sliders, X } from 'lucide-react';
import { UITheme, Language } from '../types';

interface ThemeOption {
  id: UITheme;
  nameHi: string;
  nameEn: string;
  badgeHi?: string;
  badgeEn?: string;
  isRecommended?: boolean;
  taglineHi: string;
  taglineEn: string;
  descHi: string;
  descEn: string;
  previewClass: string;
  borderPreview: string;
  glowColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'aero',
    nameHi: 'Frosted UI / Aero',
    nameEn: 'Frosted UI / Aero',
    badgeHi: '🟢 सबसे बेस्ट (Most Recommended)',
    badgeEn: '🟢 Most Recommended',
    isRecommended: true,
    taglineHi: 'Structural, Native Chrome, Soft Backdrop Blur',
    taglineEn: 'Structural, Native Chrome, Soft Backdrop Blur',
    descHi:
      'यह आपके मैप के रास्तों (Routes) और पिन को छिपाए बिना, उसके ऊपर एक साफ और पठनीय (readable) लेयर बनाता है।',
    descEn:
      'Creates a clean, legible layer without obscuring your map routes and kiosk pins underneath.',
    previewClass: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-md',
    borderPreview: 'border-white/80 dark:border-white/20',
    glowColor: 'ring-emerald-500/30',
  },
  {
    id: 'classic',
    nameHi: 'Classic Solid (क्लासिक)',
    nameEn: 'Classic Solid Enterprise',
    badgeHi: '🏢 100% Solid',
    badgeEn: '🏢 High Contrast',
    taglineHi: 'High Contrast, Opaque & Sharp',
    taglineEn: 'High Contrast, Opaque & Sharp',
    descHi: 'पारंपरिक सॉलिड स्टाइल, बिना किसी ट्रांसपेरेंसी के अधिकतम कंट्रास्ट और स्पष्ट कार्ड्स।',
    descEn: 'Traditional solid opaque surfaces with maximum contrast and zero transparency.',
    previewClass: 'bg-slate-100 dark:bg-slate-900',
    borderPreview: 'border-slate-300 dark:border-slate-700',
    glowColor: 'ring-blue-500/30',
  },
  {
    id: 'emerald',
    nameHi: 'Deep Emerald / MP Shasan',
    nameEn: 'MP Shasan Official Emerald',
    badgeHi: '🏛️ MP शासन',
    badgeEn: '🏛️ Official MP',
    taglineHi: 'Govt Forest Green & Golden Trims',
    taglineEn: 'Govt Forest Green & Golden Trims',
    descHi: 'मध्य प्रदेश शासन की आधिकारिक हरी व सुनहरी थीम, नागरिक सेवा केंद्रों के अनुकूल।',
    descEn: 'Official MP Govt forest green and gold aesthetic optimized for citizen service hubs.',
    previewClass: 'bg-emerald-50 dark:bg-emerald-950/80',
    borderPreview: 'border-emerald-400 dark:border-emerald-600',
    glowColor: 'ring-emerald-500/40',
  },
  {
    id: 'sunset',
    nameHi: 'Solar Sunset (वार्म एम्बर)',
    nameEn: 'Solar Sunset & Amber',
    badgeHi: '🌅 सौम्य आई-केयर',
    badgeEn: '🌅 Warm Ambient',
    taglineHi: 'Eye-care Warm Amber & Parchment',
    taglineEn: 'Eye-care Warm Amber & Parchment',
    descHi: 'आंखों के लिए अत्यंत आरामदायक वार्म एम्बर व क्रीम टोन, रात व दिन में आसान पठन।',
    descEn: 'Gentle warm amber and cream tones engineered to reduce eye strain.',
    previewClass: 'bg-amber-50 dark:bg-stone-900/80',
    borderPreview: 'border-amber-300 dark:border-amber-700',
    glowColor: 'ring-amber-500/30',
  },
  {
    id: 'cyber',
    nameHi: 'Cyber Midnight OLED',
    nameEn: 'Cyber Midnight OLED',
    badgeHi: '⚡ हाई-टेक नियॉन',
    badgeEn: '⚡ Neon Tech',
    taglineHi: 'Pure Black OLED with Cyan Glow',
    taglineEn: 'Pure Black OLED with Cyan Glow',
    descHi: 'ओएलईडी स्क्रीनों के लिए डीप जेट ब्लैक बैकग्राउंड और नियॉन साइना हाइलाइट्स।',
    descEn: 'Deep true black background with electric cyan neon accents for OLED screens.',
    previewClass: 'bg-slate-950 text-cyan-400',
    borderPreview: 'border-cyan-500/50',
    glowColor: 'ring-cyan-500/50',
  },
];

interface UIThemeMenuProps {
  currentTheme: UITheme;
  onChangeTheme: (theme: UITheme) => void;
  language?: Language;
  variant?: 'compact' | 'floating-button';
}

export const UIThemeMenu: React.FC<UIThemeMenuProps> = ({
  currentTheme,
  onChangeTheme,
  language = 'hi',
  variant = 'compact',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeThemeObj =
    THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl transition text-xs font-bold relative flex-shrink-0 ${
            isOpen
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-300 dark:ring-emerald-800'
              : 'bg-slate-100/90 dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300'
          }`}
          title={`${language === 'hi' ? 'UI थीम बदलें:' : 'Change UI Theme:'} ${activeThemeObj.nameEn}`}
          aria-expanded={isOpen}
          aria-label="UI Theme Menu"
        >
          <Palette className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${currentTheme === 'aero' ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`} />
          {/* Active theme color indicator dot */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
              currentTheme === 'aero'
                ? 'bg-emerald-400'
                : currentTheme === 'cyber'
                ? 'bg-cyan-400'
                : currentTheme === 'sunset'
                ? 'bg-amber-400'
                : currentTheme === 'emerald'
                ? 'bg-emerald-600'
                : 'bg-blue-500'
            }`}
          />
        </button>
      ) : (
        /* Floating Round Action Button (for bottom-right map controls) */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-xl border flex items-center justify-center transition active:scale-95 relative ${
            isOpen
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700'
              : 'theme-panel-surface bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
          title={language === 'hi' ? 'UI थीम मेन्यू (Frosted Aero & Skins)' : 'UI Theme Menu'}
          aria-label="UI Theme Menu"
        >
          <Palette className="w-5 h-5" />
          {currentTheme === 'aero' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      )}

      {/* Popover Menu / Modal */}
      {isOpen && (
        <>
          {/* Backdrop overlay for outside click dismissal and screen safety */}
          <div
            className="fixed inset-0 z-[2490] bg-black/20 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`fixed ${
              variant === 'floating-button'
                ? 'right-3 sm:right-4 bottom-20 sm:bottom-16 sm:w-[370px]'
                : 'top-[60px] left-3 right-3 sm:left-4 sm:right-auto sm:w-[420px]'
            } max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] z-[2500] theme-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700 p-3 sm:p-3.5 flex flex-col animate-in fade-in zoom-in-95 duration-150`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/80 dark:border-slate-700/80 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{language === 'hi' ? 'UI थीम मेन्यू' : 'UI Theme Selector'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                    {language === 'hi'
                      ? 'अपनी पसंद का दृश्य रूप चुनें'
                      : 'Choose your desired interface styling'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                title={language === 'hi' ? 'बंद करें' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Options List */}
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-0.5 min-h-0 flex-1">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onChangeTheme(theme.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 relative theme-card ${
                      isSelected
                        ? `border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20`
                        : 'border-slate-200 dark:border-slate-700/90 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Visual Preview Swatch */}
                      <div
                        className={`w-9 h-9 rounded-lg border flex-shrink-0 flex items-center justify-center shadow-sm ${theme.previewClass} ${theme.borderPreview}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300 stroke-[3]" />
                        ) : theme.isRecommended ? (
                          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-500/50" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {language === 'hi' ? theme.nameHi : theme.nameEn}
                          </span>

                          {theme.isRecommended && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 text-[10px] font-black tracking-tight shadow-sm">
                              {language === 'hi' ? theme.badgeHi : theme.badgeEn}
                            </span>
                          )}
                          {!theme.isRecommended && theme.badgeHi && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-bold border border-slate-300 dark:border-slate-700">
                              {language === 'hi' ? theme.badgeHi : theme.badgeEn}
                            </span>
                          )}
                        </div>

                        {/* Tagline */}
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 leading-snug">
                          {language === 'hi' ? theme.taglineHi : theme.taglineEn}
                        </p>

                        {/* Description */}
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-medium">
                          {language === 'hi' ? theme.descHi : theme.descEn}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Status & Done Button */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 flex-shrink-0 gap-2">
              <span className="flex items-center gap-1.5 font-semibold truncate min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm flex-shrink-0" />
                <span className="truncate">
                  {language === 'hi' ? 'सक्रिय:' : 'Active:'}{' '}
                  <strong className="text-slate-900 dark:text-white font-extrabold">
                    {language === 'hi' ? activeThemeObj.nameHi.split(' ')[0] : activeThemeObj.nameEn.split(' ')[0]}
                  </strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 flex-shrink-0"
              >
                {language === 'hi' ? 'लागू करें ✓' : 'Done ✓'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
