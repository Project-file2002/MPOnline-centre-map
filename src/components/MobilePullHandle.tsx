import React from 'react';
import { Language } from '../types';
import { getT } from '../utils/translations';

interface MobilePullHandleProps {
  mobileSheetMode: 'peek' | 'normal' | 'expanded';
  kiosksLength: number;
  language: Language;
  onToggleSheetMode: () => void;
}

export const MobilePullHandle: React.FC<MobilePullHandleProps> = ({
  mobileSheetMode,
  kiosksLength,
  language,
  onToggleSheetMode,
}) => {
  const t = getT(language);

  return (
    <div
      onClick={onToggleSheetMode}
      className="sm:hidden flex items-center justify-between px-4 py-2 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 select-none"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span>
          {mobileSheetMode === 'peek'
            ? language === 'hi'
              ? `📍 ${kiosksLength} कियोस्क (टैप करें)`
              : `📍 ${kiosksLength} Kiosks (Tap to view)`
            : language === 'hi'
              ? 'कियोस्क सूची'
              : 'Kiosks Drawer'}
        </span>
      </div>
      <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
      <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">
        {mobileSheetMode === 'peek'
          ? '▲ खोलें'
          : mobileSheetMode === 'expanded'
            ? '▼ छोटा करें'
            : '▲ बड़ा करें'}
      </div>
    </div>
  );
};