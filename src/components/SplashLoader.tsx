import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Code,
  Heart,
} from 'lucide-react';
import { Language } from '../types';

interface SplashLoaderProps {
  onComplete: () => void;
  language: Language;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete, language }) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const steps = [
    {
      hi: '🛰️ मध्य प्रदेश GIS सैटेलाइट ग्रिड से संपर्क स्थापित हो रहा है...',
      en: '🛰️ Establishing connection to MP GIS Satellite Grid...',
      subHi: 'भोपाल, इंदौर, ग्वालियर, जबलपुर नोड्स ऑनलाइन',
      subEn: 'Bhopal, Indore, Gwalior, Jabalpur nodes online',
    },
    {
      hi: '📍 54+ अधिकृत MPOnline कियोस्क व CSC केंद्र स्कैन हो रहे हैं...',
      en: '📍 Scanning 54+ Authorized MPOnline & CSC Centers...',
      subHi: 'लाइव स्थिति, दूरी व प्रमाणिकता सत्यापित की जा रही है',
      subEn: 'Verifying live status, distance & authentications',
    },
    {
      hi: '⚡ समग्र e-KYC, व्यापम एवं 35+ सरकारी सेवाओं का डेटा सिंक...',
      en: '⚡ Syncing Samagra e-KYC, Vyapam & Citizen Services...',
      subHi: 'ऑफलाइन मैप कैशे व त्वरित नेविगेशन सक्रिय',
      subEn: 'Offline tile cache & smart routing activated',
    },
    {
      hi: '✅ स्वागतम्! मध्य प्रदेश कियोस्क नेविगेटर तैयार है...',
      en: '✅ Welcome! Madhya Pradesh Kiosk Navigator is Ready...',
      subHi: 'नागरिक सेवा पोर्टल में प्रवेश कर रहे हैं',
      subEn: 'Entering Citizen Service Portal',
    },
  ];

  useEffect(() => {
    // Smooth progress counter from 0 to 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Increment smoothly
        const delta = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(100, prev + delta);

        if (next < 28) setStepIndex(0);
        else if (next < 62) setStepIndex(1);
        else if (next < 92) setStepIndex(2);
        else setStepIndex(3);

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const finishTimer = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(finishTimer);
      }, 400);

      return () => clearTimeout(exitTimer);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 select-none transition-all duration-700 ease-out bg-slate-950 text-white overflow-hidden ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Animated Radar / GIS Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Ambient Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />

        {/* GIS Coordinate Grid Lines */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Circular Radar Sweep Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[420px] md:w-[560px] h-[280px] sm:h-[420px] md:h-[560px] rounded-full border border-orange-500/20 flex items-center justify-center pointer-events-none">
          <div className="w-[80%] h-[80%] rounded-full border border-cyan-500/20 flex items-center justify-center">
            <div className="w-[70%] h-[70%] rounded-full border border-dashed border-amber-500/30 animate-spin" style={{ animationDuration: '30s' }} />
          </div>
        </div>

        {/* Scanning Radar Beam */}
        <div
          className="absolute top-1/2 left-1/2 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-40 animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(249, 115, 22, 0.4) 60deg, transparent 90deg)',
            animationDuration: '4s',
          }}
        />
      </div>

      {/* Top Header Bar: Skip Button & Citizen Emblem */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>MPOnline GIS Portal • v2.6</span>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition backdrop-blur-md hover:border-orange-500/50"
        >
          <span>{language === 'hi' ? 'सीधे प्रवेश करें' : 'Skip Intro'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Hero: Emblem & Kinetic Motion Graphic */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg my-auto px-4">
        {/* Central Glowing Shield / Pin Emblem */}
        <div className="relative mb-6">
          {/* Orbital Outer Halo */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-400 to-cyan-400 opacity-30 blur-xl animate-pulse" />

          {/* Core Emblem Box */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 p-1 shadow-2xl flex items-center justify-center ring-4 ring-orange-500/30">
            <div className="w-full h-full rounded-[22px] bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-white">
              <span className="text-3xl sm:text-4xl font-black tracking-tighter drop-shadow-md">
                MP
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                Online
              </span>
            </div>
          </div>

          {/* Floating Beacon Nodes (City representations) */}
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-500 text-[10px] font-black tracking-wider uppercase shadow-lg shadow-cyan-500/40 animate-bounce">
            Live GIS
          </span>
          <span className="absolute -bottom-2 -left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black tracking-wider uppercase shadow-lg shadow-emerald-500/40">
            54+ Kiosks
          </span>
        </div>

        {/* Portal Title & MP Heart Branding */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
          {language === 'hi' ? (
            <>
              मध्य प्रदेश <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">MPOnline</span> कियोस्क नेविगेटर
            </>
          ) : (
            <>
              Madhya Pradesh <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">MPOnline</span> Kiosk Navigator
            </>
          )}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {language === 'hi'
            ? 'नागरिक सेवा केंद्र, समग्र e-KYC, व्यापम व 35+ सरकारी योजनाओं की रियल-टाइम नेविगेशन प्रणाली'
            : 'Real-time GPS routing, authorized kiosks locator, and verified citizen services directory'}
        </p>

        {/* Progress Bar & Percentage */}
        <div className="w-full max-w-sm flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium">
              <Compass className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              <span>{steps[stepIndex].subHi}</span>
            </span>
            <span className="font-extrabold text-orange-400">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-150 ease-out shadow-lg shadow-orange-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Ticker Description */}
        <div className="min-h-[44px] flex items-center justify-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-200 transition-all duration-300 ease-in-out">
            {language === 'hi' ? steps[stepIndex].hi : steps[stepIndex].en}
          </p>
        </div>
      </div>

      {/* Bottom Creator Showcase: Abhishek Maurya */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        <div className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-850/90 to-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          {/* Creator Avatar / Badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-cyan-500 p-0.5 flex-shrink-0 shadow-md">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-xs text-orange-400">
              AM
            </div>
          </div>

          {/* Creator Title Details */}
          <div className="flex flex-col text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {language === 'hi' ? 'संकल्पना एवं निर्माण' : 'Conceptualized & Crafted by'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                Abhishek Maurya
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                (अभिषेक मौर्य)
              </span>
            </div>
          </div>

          {/* Full-Stack Architect Badge */}
          <div className="ml-auto hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[10px] font-bold">
            <Code className="w-3 h-3" />
            <span>Lead Architect</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-2 font-medium text-center">
          {language === 'hi'
            ? 'मध्य प्रदेश के नागरिकों की सुविधा हेतु समर्पित • स्वच्छ, तेज एवं स्वतंत्र जीआईएस प्रणाली'
            : 'Dedicated to the citizens of Madhya Pradesh • Free, Open & Fast Citizen GIS'}
        </p>
      </div>
    </div>
  );
};
