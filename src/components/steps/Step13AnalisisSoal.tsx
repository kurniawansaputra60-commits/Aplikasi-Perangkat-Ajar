import React, { useState } from 'react';
import { QuestionAnalysisItem, AppState } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Sliders } from 'lucide-react';
import { requestAiGeneration } from '../../services/aiService';

interface Step13Props {
  analysis: QuestionAnalysisItem[];
  onChange: (updated: QuestionAnalysisItem[]) => void;
  appState: AppState;
}

export const Step13AnalisisSoal: React.FC<Step13Props> = ({ analysis, onChange, appState }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const handleRunAnalysis = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      await requestAiGeneration({
        type: 'analisis_soal',
        prompt: `Lakukan analisis butir soal evaluasi tingkat kesukaran dan daya pembeda untuk paket soal ${activePkg.subject}.`,
        context: { subject: activePkg.subject },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictBadge = (verdict: QuestionAnalysisItem['verdict']) => {
    switch (verdict) {
      case 'Diterima Baik':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Diterima Baik
          </span>
        );
      case 'Perlu Direvisi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Perlu Direvisi
          </span>
        );
      case 'Dibuang / Diganti':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Dibuang / Diganti
          </span>
        );
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
            <h3 className="text-base font-black text-slate-900">
              Analisis Butir Soal (Langkah 13 — Fitur Terbaru)
            </h3>
            <p className="text-xs text-slate-500">
              Cek butir soal mana yang sudah baik dan mana yang perlu diperbaiki berdasarkan tingkat kesukaran (P) dan daya pembeda (D).
            </p>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-700" />
            <span>{isAnalyzing ? 'Menganalisis Butir...' : 'Kalkulasi Ulang Analisis Soal'}</span>
          </button>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
            <div className="text-xs font-bold text-emerald-900 uppercase">Soal Kualitas Baik</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">
              {analysis.filter((a) => a.verdict === 'Diterima Baik').length} Butir
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Siap masuk bank soal permanen sekolah
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300">
            <div className="text-xs font-bold text-amber-900 uppercase">Perlu Perbaikan Pengecoh</div>
            <div className="text-2xl font-black text-amber-800 mt-0.5">
              {analysis.filter((a) => a.verdict === 'Perlu Direvisi').length} Butir
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Distraktor perlu diganti agar lebih mengecoh
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-300">
            <div className="text-xs font-bold text-indigo-900 uppercase">Rata-rata Daya Pembeda</div>
            <div className="text-2xl font-black text-indigo-800 mt-0.5">
              +0.44 (Tinggi)
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">
              Efektif membedakan murid berkemampuan tinggi
            </div>
          </div>
        </div>

        {/* Analysis Table */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-2 text-center">Tipe / Level</th>
                <th className="py-2.5 px-3 text-center">Tingkat Kesukaran (P)</th>
                <th className="py-2.5 px-3 text-center">Daya Pembeda (D)</th>
                <th className="py-2.5 px-3">Fungsi Pengecoh / Distraktor</th>
                <th className="py-2.5 px-3 text-center">Keputusan Butir</th>
                <th className="py-2.5 px-3">Saran Rekomendasi Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analysis.map((item) => (
                <tr key={item.noSoal} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-black text-slate-900">No. {item.noSoal}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="font-bold text-indigo-700">{item.type}</span>{' '}
                    <span className="text-[10px] text-slate-500">({item.level})</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-bold text-slate-900">{item.difficultyIndex}</span>{' '}
                    <span className="text-[10px] text-slate-500 block">({item.difficultyLabel})</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-bold text-slate-900">+{item.discriminationIndex}</span>{' '}
                    <span className="text-[10px] text-slate-500 block">({item.discriminationLabel})</span>
                  </td>
                  <td className="py-2 px-3 text-slate-700">{item.distractorQuality}</td>
                  <td className="py-2 px-3 text-center">{getVerdictBadge(item.verdict)}</td>
                  <td className="py-2 px-3 text-slate-600">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
