import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanguageAndTheme } from '../hooks/useLanguageAndTheme';

describe('useLanguageAndTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-ui-theme');
  });

  it('should initialize with Hindi language by default', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    expect(result.current.language).toBe('hi');
  });

  it('should toggle language between hi and en', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    
    act(() => {
      result.current.handleToggleLanguage();
    });
    expect(result.current.language).toBe('en');
    
    act(() => {
      result.current.handleToggleLanguage();
    });
    expect(result.current.language).toBe('hi');
  });

  it('should initialize with aero theme by default', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    expect(result.current.uiTheme).toBe('aero');
  });

  it('should change UI theme', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    
    act(() => {
      result.current.setUiTheme('sunset');
    });
    expect(result.current.uiTheme).toBe('sunset');
  });

  it('should initialize with system preference for dark mode', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    // Default is false (light mode) when no preference saved
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should toggle dark mode', () => {
    const { result } = renderHook(() => useLanguageAndTheme());
    
    act(() => {
      result.current.setIsDarkMode(true);
    });
    expect(result.current.isDarkMode).toBe(true);
    
    act(() => {
      result.current.setIsDarkMode(false);
    });
    expect(result.current.isDarkMode).toBe(false);
  });
});