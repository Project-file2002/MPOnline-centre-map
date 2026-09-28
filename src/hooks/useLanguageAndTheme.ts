import { useState, useEffect, useCallback } from 'react';
import type { Language, UITheme } from '../types';

export const useLanguageAndTheme = () => {
  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_lang') as Language;
      if (saved === 'hi' || saved === 'en') return saved;
    }
    return 'hi';
  });

  const handleToggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      localStorage.setItem('mponline_lang', next);
      return next;
    });
  }, []);

  // UI Theme State
  const [uiTheme, setUiTheme] = useState<UITheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_ui_theme') as UITheme;
      if (['aero', 'classic', 'emerald', 'sunset', 'cyber'].includes(saved)) {
        return saved;
      }
    }
    return 'aero';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-theme', uiTheme);
    localStorage.setItem('mponline_ui_theme', uiTheme);
  }, [uiTheme]);

  // Dark/Light Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mponline_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mponline_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mponline_theme', 'light');
    }
  }, [isDarkMode]);

  return {
    language,
    setLanguage,
    handleToggleLanguage,
    uiTheme,
    setUiTheme,
    isDarkMode,
    setIsDarkMode
  };
};