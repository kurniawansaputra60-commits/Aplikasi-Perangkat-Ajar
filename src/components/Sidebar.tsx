import React from 'react';
import { StepStatus } from '../types';

interface SidebarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  stepStatuses: { [stepNumber: number]: StepStatus };
  onOpenProgressModal: () => void;
}

export const stepMeta = [
  { number: 1, name: 'Profil', hasAi: false, tag: 'TANPA AI' },
  { number: 2, name: 'Paket Mengajar', hasAi: false, tag: 'TANPA AI' },
  { number: 3, name: 'Kalender', hasAi: false, tag: 'TANPA AI' },
  { number: 4, name: 'CP', hasAi: false, tag: 'TANPA AI' },
  { number: 5, name: 'ATP', hasAi: true, tag: 'AI' },
  { number: 6, name: 'Prota', hasAi: false, tag: 'TANPA AI' },
  { number: 7, name: 'Promes', hasAi: false, tag: 'TANPA AI' },
  { number: 8, name: 'KKTP', hasAi: true, tag: 'AI' },
  { number: 9, name: 'Modul Ajar/RPM', hasAi: true, tag: 'AI 5-KLIK' },
  { number: 10, name: 'LKPD (opsional)', hasAi: true, tag: 'AI' },
  { number: 11, name: 'Asesmen', hasAi: true, tag: 'AI' },
  { number: 12, name: 'Kisi & Kartu Soal', hasAi: true, tag: 'AI 3-KLIK' },
  { number: 13, name: 'Analisis Soal', hasAi: true, tag: 'BARU' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  onSelectStep,
  stepStatuses,
  onOpenProgressModal,
}) => {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 p-3 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200 mb-2.5">
          <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase">
            ALUR 13 LANGKAH
          </h2>
          <button
            onClick={onOpenProgressModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Lihat Matriks
          </button>
        </div>

        {/* Step List */}
        <div className="flex flex-col gap-1.5">
          {stepMeta.map((step) => {
            const isActive = currentStep === step.number;
            const status = stepStatuses[step.number] || 'Tersimpan';

            return (
              <button
                key={step.number}
                onClick={() => onSelectStep(step.number)}
                className={`w-full text-left rounded-xl border-2 transition-all duration-150 p-2 flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-600 text-white border-slate-900 shadow-sm translate-x-1'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Number Badge */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border flex-shrink-0 ${
                      isActive
                        ? 'bg-white text-indigo-700 border-indigo-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-400'
                    }`}
                  >
                    {step.number}
                  </span>

                  {/* Name and check */}
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs truncate">{step.name}</span>
                      <span
                        className={`text-xs font-bold ${
                          isActive ? 'text-emerald-300' : 'text-emerald-600'
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    <div
                      className={`text-[10px] ${
                        isActive ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {status}
                    </div>
                  </div>
                </div>

                {/* AI / Non-AI pill badge */}
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${
                    isActive
                      ? 'bg-indigo-800 text-indigo-200 border-indigo-500'
                      : step.hasAi
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {step.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
