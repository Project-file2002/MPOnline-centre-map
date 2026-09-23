import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, IndianRupee, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { MP_CITIZEN_DOCUMENTS, getT } from '../utils/translations';

interface DocumentChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialServiceId?: string | null;
}

export const DocumentChecklistModal: React.FC<DocumentChecklistModalProps> = ({
  isOpen,
  onClose,
  language,
  initialServiceId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialServiceId || MP_CITIZEN_DOCUMENTS[0].id
  );

  if (!isOpen) return null;

  const t = getT(language);
  const activeGuide =
    MP_CITIZEN_DOCUMENTS.find((d) => d.id === selectedId) || MP_CITIZEN_DOCUMENTS[0];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                {t.docsChecklistModalTitle}
              </h3>
              <p className="text-xs text-orange-100/90 mt-0.5 leading-snug">
                {t.docsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition flex-shrink-0"
            title={t.closeButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Category Tabs */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 bg-slate-50/60 dark:bg-slate-950/40 custom-scrollbar flex-shrink-0">
            {MP_CITIZEN_DOCUMENTS.map((doc) => {
              const isSelected = doc.id === activeGuide.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedId(doc.id)}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between whitespace-nowrap md:whitespace-normal ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">
                    {language === 'hi' ? doc.nameHi : doc.nameEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Checklist */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
            {/* Service Title & Official Govt Fee */}
            <div>
              <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {language === 'hi' ? activeGuide.nameHi : activeGuide.nameEn}
              </h4>

              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <IndianRupee className="w-4 h-4" />
                <span>
                  {t.officialFeeLabel}{' '}
                  <span className="font-extrabold underline">
                    {language === 'hi' ? activeGuide.officialFeeHi : activeGuide.officialFeeEn}
                  </span>
                </span>
              </div>
            </div>

            {/* Checklist of mandatory documents */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'साथ ले जाने वाले ज़रूरी दस्तावेज़:' : 'Documents to Carry to Kiosk:'}
              </h5>
              <div className="space-y-2">
                {(language === 'hi' ? activeGuide.docsHi : activeGuide.docsEn).map((docItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {docItem}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Advisory / Tip */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">{t.importantNotice}</strong>{' '}
                {language === 'hi' ? activeGuide.importantTipHi : activeGuide.importantTipEn}
              </div>
            </div>

            {/* Operator transparency badge */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center gap-2.5 text-[11px] text-blue-900 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                {language === 'hi'
                  ? 'यह सरकारी दरें एवं नियम मध्य प्रदेश ई-गवर्नेंस एवं एमपीऑनलाइन के आधिकारिक दिशा-निर्देशों के अनुसार हैं।'
                  : 'Official fees according to Madhya Pradesh e-Governance and MPOnline citizen portal guidelines.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition"
          >
            {t.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
};
