import React, { useState } from 'react';
import { AssessmentPlanItem, AppState } from '../../types';
import { ClipboardList, Sparkles, Plus, Trash2 } from 'lucide-react';
import { requestAiGeneration } from '../../services/aiService';

interface Step11Props {
  plans: AssessmentPlanItem[];
  onChange: (updated: AssessmentPlanItem[]) => void;
  appState: AppState;
}

export const Step11Asesmen: React.FC<Step11Props> = ({ plans, onChange, appState }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const handleGenerateAi = async () => {
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      await requestAiGeneration({
        type: 'assessment_plan',
        prompt: `Susun rencana asesmen komprehensif (Asesmen Awal, Formatif Proses, dan Sumatif Akhir) untuk mata pelajaran ${activePkg.subject}.`,
        context: { subject: activePkg.subject },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateItem = (idx: number, field: keyof AssessmentPlanItem, val: any) => {
    const updated = [...plans];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const handleAdd = () => {
    const newItem: AssessmentPlanItem = {
      type: 'Proses (Formatif)',
      tpCode: 'TP 2',
      technique: 'Observasi Perilaku',
      instrument: 'Lembar Catatan Anekdot & Refleksi',
      timing: 'Pertemuan 2 (Selama Diskusi)',
      details: 'Memantau perkembangan penalaran kritis dan kolaborasi.',
    };
    onChange([...plans, newItem]);
  };

  const handleDelete = (idx: number) => {
    if (plans.length <= 1) return;
    onChange(plans.filter((_, i) => i !== idx));
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
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Matriks Rencana Asesmen Komprehensif
            </h3>
            <p className="text-xs text-slate-500">
              Menyatukan asesmen diagnostik, formatif proses (as &amp; for learning), dan sumatif akhir (of learning).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Rencana</span>
            </button>
            <button
              onClick={handleGenerateAi}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <span>{isGenerating ? 'AI Menyusun...' : 'Sempurnakan dengan AI'}</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 mb-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                <th className="py-2.5 px-3">Jenis Asesmen</th>
                <th className="py-2.5 px-2 text-center">TP</th>
                <th className="py-2.5 px-3">Teknik Asesmen</th>
                <th className="py-2.5 px-3">Bentuk Instrumen</th>
                <th className="py-2.5 px-3">Waktu Pelaksanaan</th>
                <th className="py-2.5 px-3">Tujuan &amp; Keterangan</th>
                <th className="py-2.5 px-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plans.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold">
                    <select
                      value={p.type}
                      onChange={(e) => updateItem(idx, 'type', e.target.value as any)}
                      className="p-1 rounded border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Awal (Diagnostik)">Awal (Diagnostik)</option>
                      <option value="Proses (Formatif)">Proses (Formatif)</option>
                      <option value="Akhir (Sumatif)">Akhir (Sumatif)</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-indigo-700">
                    <input
                      type="text"
                      value={p.tpCode}
                      onChange={(e) => updateItem(idx, 'tpCode', e.target.value)}
                      className="w-14 text-center font-bold p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={p.technique}
                      onChange={(e) => updateItem(idx, 'technique', e.target.value)}
                      className="w-full p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={p.instrument}
                      onChange={(e) => updateItem(idx, 'instrument', e.target.value)}
                      className="w-full p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={p.timing}
                      onChange={(e) => updateItem(idx, 'timing', e.target.value)}
                      className="w-full p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={p.details}
                      onChange={(e) => updateItem(idx, 'details', e.target.value)}
                      className="w-full p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {plans.length > 1 && (
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
