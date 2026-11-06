import React from 'react';
import { CapaianPembelajaranData, CpElement, AppState } from '../../types';
import { BookCheck, AlertTriangle, ShieldCheck, Check, Info } from 'lucide-react';

interface Step4Props {
  cp: CapaianPembelajaranData;
  onChange: (updated: CapaianPembelajaranData) => void;
  appState: AppState;
}

export const Step4Cp: React.FC<Step4Props> = ({ cp, onChange, appState }) => {
  const activePkg = appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];
  const phaseMismatch = Boolean(activePkg?.phase && cp.phase && activePkg.phase.toLowerCase() !== cp.phase.toLowerCase());

  const updateElement = (idx: number, field: keyof CpElement, val: any) => {
    const updated = [...cp.elements];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange({ ...cp, elements: updated, isVerified: false });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-indigo-600" />
              Capaian Pembelajaran (CP)
            </h3>
            <p className="text-xs text-slate-500">
              Paket aktif: <strong>{activePkg?.name || 'Belum dipilih'}</strong> · {activePkg?.subject} · {activePkg?.grade} · {activePkg?.phase}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${phaseMismatch ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
            {phaseMismatch ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{phaseMismatch ? 'Fase CP tidak cocok—periksa data' : 'Tinjau dengan dokumen CP resmi'}</span>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
          <strong>Catatan:</strong> CP ditetapkan berdasarkan fase (contoh Fase C mencakup Kelas 5–6). Gunakan CP mata pelajaran dan fase paket aktif sebagai rujukan; sesuaikan TP untuk kebutuhan kelas di Langkah 5. Templat aplikasi adalah titik awal dan tidak menggantikan pemeriksaan dokumen resmi sekolah.
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sumber / Dasar Dokumen CP</label>
          <input
            type="text"
            value={cp.officialSource || ''}
            onChange={(e) => onChange({ ...cp, officialSource: e.target.value, isVerified: false })}
            className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
            placeholder="Masukkan nama dokumen dan nomor regulasi yang benar-benar digunakan"
          />
        </div>

        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deskripsi Rasional &amp; Capaian Umum Fase ({activePkg?.phase || cp.phase})</label>
          <textarea
            value={cp.generalDescription || ''}
            onChange={(e) => onChange({ ...cp, generalDescription: e.target.value, isVerified: false })}
            rows={4}
            className="w-full text-xs font-medium p-3 rounded-xl border-2 border-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        </div>

        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide mb-3">Elemen Capaian Pembelajaran &amp; Pemeriksaan Kesesuaian:</h4>
        <div className="space-y-3">
          {(cp.elements || []).map((el, idx) => (
            <div key={el.id} className={`p-4 rounded-xl border-2 transition ${el.matchesSubject ? 'bg-white border-slate-900' : 'bg-red-50 border-red-500 ring-2 ring-red-400'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">{idx + 1}</span>
                  <input type="text" value={el.name || ''} onChange={(e) => updateElement(idx, 'name', e.target.value)} className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none" aria-label={`Nama elemen CP ${idx + 1}`} />
                </div>
                <div className="flex items-center gap-2">
                  {el.matchesSubject ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1"><Check className="w-3 h-3" /> Ditandai sesuai</span> : <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Perlu ditinjau</span>}
                  <button type="button" onClick={() => updateElement(idx, 'matchesSubject', !el.matchesSubject)} className="text-[10px] text-slate-500 hover:text-slate-800 underline">Ubah status</button>
                </div>
              </div>
              <textarea value={el.cpText || ''} onChange={(e) => updateElement(idx, 'cpText', e.target.value)} rows={3} className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-normal bg-slate-50/50" aria-label={`Rumusan CP elemen ${idx + 1}`} />
              {el.notes && <div className="text-[11px] text-slate-500 mt-1 italic">Catatan: {el.notes}</div>}
            </div>
          ))}
          {(!cp.elements || cp.elements.length === 0) && <div className="p-3 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-900">Belum ada elemen CP untuk paket ini. Periksa paket dan isi rumusan berdasarkan dokumen resmi sebelum menyusun ATP.</div>}
        </div>
      </div>
    </div>
  );
};
