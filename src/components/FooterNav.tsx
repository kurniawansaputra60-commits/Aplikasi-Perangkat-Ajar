import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface FooterNavProps {
  currentStep: number;
  totalSteps?: number;
  onSelectStep: (step: number) => void;
}

export const FooterNav: React.FC<FooterNavProps> = ({
  currentStep,
  totalSteps = 13,
  onSelectStep,
}) => {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 shadow-sm mt-5 flex flex-wrap items-center justify-between gap-3">
      {/* Previous Step */}
      {currentStep > 1 ? (
        <button
          onClick={() => onSelectStep(currentStep - 1)}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Langkah {currentStep - 1}</span>
        </button>
      ) : (
        <div className="w-24" />
      )}

      {/* Middle Text */}
      <div className="text-center text-xs font-medium text-slate-600">
        Langkah {currentStep} dari {totalSteps} · Bebas lanjut tanpa simpan (Unduh .json sebelum tutup browser)
      </div>

      {/* Next Step */}
      {currentStep < totalSteps ? (
        <button
          onClick={() => onSelectStep(currentStep + 1)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
        >
          <span>Lanjut ke Langkah {currentStep + 1}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-24" />
      )}
    </div>
  );
};
