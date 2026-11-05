import React from 'react';
import { CapaianPembelajaranData, CpElement, AppState } from '../../types';
import { BookCheck, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

interface Step4Props {
  cp: CapaianPembelajaranData;
  onChange: (updated: CapaianPembelajaranData) => void;
  appState: AppState;
}

export const Step4Cp: React.FC<Step4Props> = ({ cp, onChange, appState }) => {
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const updateElement = (idx: number, field: keyof CpElement, val: any) => {
    const updated = [...cp.elements];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange({ ...cp, elements: updated });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-indigo-600" />
              Capaian Pembelajaran (CP) Dokumen Resmi
            </h3>
            <p className="text-xs text-slate-500">
              Rujukan resmi Kepka BSKAP No. 046/H/KR/2025 &amp; BKPDM 020/2026 untuk{' '}
              <strong>{activePkg.subject}</strong> ({activePkg.grade}).
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Terverifikasi Regulasi Terkini</span>
          </div>
        </div>

        {/* Source info */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
            Dasar Dokumen Regulasi
          </label>
          <input
            type="text"
            value={cp.officialSource}
            onChange={(e) => onChange({ ...cp, officialSource: e.target.value })}
            className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
          />
        </div>

        {/* General CP Description */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
            Deskripsi Rasional &amp; Capaian Umum Fase ({activePkg.phase})
          </label>
          <textarea
            value={cp.generalDescription}
            onChange={(e) => onChange({ ...cp, generalDescription: e.target.value })}
            rows={4}
            className="w-full text-xs font-medium p-3 rounded-xl border-2 border-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        {/* CP Elements */}
        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide mb-3">
          Elemen Capaian Pembelajaran &amp; Validasi Kesesuaian:
        </h4>

        <div className="space-y-3">
          {cp.elements.map((el, idx) => (
            <div
              key={el.id}
              className={`p-4 rounded-xl border-2 transition ${
                el.matchesSubject
                  ? 'bg-white border-slate-900'
                  : 'bg-red-50 border-red-500 ring-2 ring-red-400'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={el.name}
                    onChange={(e) => updateElement(idx, 'name', e.target.value)}
                    className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {el.matchesSubject ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Sesuai dengan Mapel
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-400 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-600" /> Peringatan: Elemen Kurang Cocok
                    </span>
                  )}
                  <button
                    onClick={() => updateElement(idx, 'matchesSubject', !el.matchesSubject)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                  >
                    Ubah Status
                  </button>
                </div>
              </div>

              <textarea
                value={el.cpText}
                onChange={(e) => updateElement(idx, 'cpText', e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-normal bg-slate-50/50"
              />

              {el.notes && (
                <div className="text-[11px] text-slate-500 mt-1 italic">
                  Catatan: {el.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
