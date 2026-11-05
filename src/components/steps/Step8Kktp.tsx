import React, { useState } from 'react';
import { KktpData, AppState } from '../../types';
import { Target, Sparkles, Sliders } from 'lucide-react';
import { requestAiGeneration } from '../../services/aiService';

interface Step8Props {
  kktp: KktpData;
  onChange: (updated: KktpData) => void;
  appState: AppState;
}

export const Step8Kktp: React.FC<Step8Props> = ({ kktp, onChange, appState }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const handleGenerateAi = async () => {
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      await requestAiGeneration({
        type: 'kktp',
        prompt: `Susun rubrik KKTP dan interval tindak lanjut remedial pengayaan untuk TP pada mata pelajaran ${activePkg.subject}.`,
        context: { subject: activePkg.subject },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs px-2 py-0.5 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold"
            >
              Tutup
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
            </h3>
            <p className="text-xs text-slate-500">
              Pilihan 3 pendekatan resmi Kurikulum Merdeka (Interval Nilai, Rubrik, &amp; Deskripsi Kriteria).
            </p>
          </div>

          <button
            onClick={handleGenerateAi}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-700" />
            <span>{isGenerating ? 'AI Menyusun...' : 'Sempurnakan KKTP dengan AI'}</span>
          </button>
        </div>

        {/* Model Selector & Passing Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Pendekatan KKTP Utama
            </label>
            <div className="flex gap-2">
              {(['interval', 'rubric', 'description'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onChange({ ...kktp, modelType: m })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                    kktp.modelType === m
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {m === 'interval' ? 'Interval Nilai' : m === 'rubric' ? 'Rubrik' : 'Deskripsi'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Batas Kriteria Ketuntasan Minimal (%):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={90}
                value={kktp.passingGrade}
                onChange={(e) => onChange({ ...kktp, passingGrade: parseInt(e.target.value) || 70 })}
                className="w-16 p-1.5 text-center font-black text-sm rounded-lg border-2 border-slate-900 bg-white"
              />
              <span className="text-xs text-slate-600">
                (Standar satuan pendidikan: nilai {kktp.passingGrade} ke atas dinyatakan tuntas)
              </span>
            </div>
          </div>
        </div>

        {/* 1. Interval Nilai Table */}
        <div className="space-y-3 mb-6">
          <h4 className="font-extrabold text-xs text-slate-900 uppercase">
            1. Tabel Interval Nilai &amp; Tindak Lanjut Pembelajaran:
          </h4>
          <div className="overflow-x-auto rounded-xl border-2 border-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                  <th className="py-2.5 px-3">Interval</th>
                  <th className="py-2.5 px-3">Predikat</th>
                  <th className="py-2.5 px-3">Deskripsi Pencapaian</th>
                  <th className="py-2.5 px-3">Tindak Lanjut Remedial / Pengayaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {kktp.intervals.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-indigo-700">{it.range}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{it.predicate}</td>
                    <td className="py-2 px-3 text-slate-700">{it.description}</td>
                    <td className="py-2 px-3 text-slate-600 italic">{it.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Rubrik Kompetensi */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-xs text-slate-900 uppercase">
            2. Rubrik Tingkat Kemampuan Kompetensi TP:
          </h4>
          <div className="overflow-x-auto rounded-xl border-2 border-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                  <th className="py-2.5 px-3">TP &amp; Indikator</th>
                  <th className="py-2.5 px-3 text-red-800">Perlu Bimbingan (0-69)</th>
                  <th className="py-2.5 px-3 text-amber-800">Cukup (70-79)</th>
                  <th className="py-2.5 px-3 text-blue-800">Baik (80-89)</th>
                  <th className="py-2.5 px-3 text-emerald-800">Sangat Baik (90-100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {kktp.rubricItems.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900 w-1/4">
                      <span className="text-indigo-700 block mb-0.5">{r.tpCode}</span>
                      {r.indicator}
                    </td>
                    <td className="py-2 px-3 text-slate-600 bg-red-50/30">{r.needGuidance}</td>
                    <td className="py-2 px-3 text-slate-600 bg-amber-50/30">{r.fair}</td>
                    <td className="py-2 px-3 text-slate-600 bg-blue-50/30">{r.good}</td>
                    <td className="py-2 px-3 text-slate-700 bg-emerald-50/30 font-medium">
                      {r.excellent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
