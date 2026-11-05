import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppState, StepStatus } from '../../types';
import { stepMeta } from '../Sidebar';

interface ProgressMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onJumpToStep: (stepNumber: number) => void;
}

export const ProgressMatrixModal: React.FC<ProgressMatrixModalProps> = ({
  isOpen,
  onClose,
  state,
  onJumpToStep,
}) => {
  if (!isOpen) return null;

  const activePkg = state.packages.find((p) => p.id === state.activePackageId) || state.packages[0];

  // Count steps saved
  const totalSteps = 13;
  const completedCount = Object.values(state.stepStatuses).filter(
    (s) => s === 'Tersimpan'
  ).length;
  const completionPercentage = Math.round((completedCount / totalSteps) * 100);

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'Tersimpan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Tersimpan
          </span>
        );
      case 'Perlu Ditinjau':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Perlu ditinjau
          </span>
        );
      case 'Draf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Draf
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
            Belum dibuat
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 w-full max-w-4xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <span>📊</span> Ringkasan Matriks Progres Perangkat Ajar
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Paket Aktif: <strong>{activePkg.name}</strong> ({activePkg.subject})
        </p>

        {/* Completion Progress Bar */}
        <div className="bg-white p-4 rounded-xl border-2 border-slate-900 mb-6">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-800">Status Kelengkapan 13 Langkah:</span>
            <span className="text-indigo-600">{completedCount} dari 13 Langkah ({completionPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full border border-slate-300 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* TP Progress Matrix Table */}
        <div className="bg-white rounded-xl border-2 border-slate-900 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase">
              Matriks Progres Per Tujuan Pembelajaran (TP)
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Contoh · {activePkg.subject} {activePkg.grade}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 font-bold">Tujuan Pembelajaran</th>
                  <th className="py-2.5 px-3 font-bold text-center">KKTP (L-8)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Modul / RPM (L-9)</th>
                  <th className="py-2.5 px-3 font-bold text-center">LKPD (L-10)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Asesmen (L-11)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Soal (L-12)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.atp.map((tp, idx) => {
                  const modStatus: StepStatus =
                    state.modules[tp.code] ? 'Tersimpan' : idx === 1 ? 'Perlu Ditinjau' : idx === 2 ? 'Draf' : 'Belum Dibuat';
                  const lkpdStatus: StepStatus =
                    state.lkpd[tp.code] ? 'Tersimpan' : idx === 1 ? 'Draf' : 'Belum Dibuat';
                  const kktpStatus: StepStatus = 'Tersimpan';
                  const asesmenStatus: StepStatus = idx <= 1 ? 'Tersimpan' : 'Draf';
                  const soalStatus: StepStatus = idx <= 2 ? 'Tersimpan' : 'Draf';

                  return (
                    <tr key={tp.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <span className="font-bold text-indigo-700">{tp.code}:</span> {tp.scopeContent}
                      </td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(kktpStatus)}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(modStatus)}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(lkpdStatus)}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(asesmenStatus)}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(soalStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 13-Step Overview Grid */}
        <h4 className="text-xs font-black text-slate-900 uppercase mb-3">
          Status Tiap Langkah &amp; Pintasan Langsung:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {stepMeta.map((s) => {
            const st = state.stepStatuses[s.number] || 'Tersimpan';
            const isCurrent = state.currentStep === s.number;

            return (
              <button
                key={s.number}
                onClick={() => {
                  onJumpToStep(s.number);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/70'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Langkah {s.number}: {s.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{st}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
