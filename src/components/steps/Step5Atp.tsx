import React, { useState } from 'react';
import { AtpItem, AppState } from '../../types';
import { Sparkles, Plus, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import { requestAiGeneration } from '../../services/aiService';

interface Step5Props {
  atp: AtpItem[];
  onChange: (updated: AtpItem[]) => void;
  appState: AppState;
}

const graduateDimensionsList = [
  'Keimanan & Ketakwaan',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi',
];

export const Step5Atp: React.FC<Step5Props> = ({ atp, onChange, appState }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const handleGenerateAi = async () => {
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const prompt = `Susun Alur Tujuan Pembelajaran (ATP) untuk mata pelajaran ${activePkg.subject} (${activePkg.grade}) dengan alokasi waktu ${appState.calendar.totalJpSemester} JP. Turunkan menjadi 4-5 TP runtut dengan dimensi profil lulusan.`;
      const res = await requestAiGeneration({
        type: 'atp',
        prompt,
        context: { subject: activePkg.subject, grade: activePkg.grade },
      });

      // Add a fresh TP if needed
      const newTp: AtpItem = {
        id: 'atp-' + (atp.length + 1),
        code: `TP ${atp.length + 1}`,
        scopeContent: 'Interkoneksi Sistem Ekologis Lanjutan',
        learningObjective:
          'Peserta didik dapat menganalisis peran krusial keanekaragaman hayati terhadap stabilitas iklim mikro lokal dan kesejahteraan manusia.',
        graduateDimensions: ['Penalaran Kritis', 'Kreativitas', 'Kolaborasi'],
        allocatedJp: 10,
        semester: '1',
        keywords: 'biodiversitas, iklim mikro, konservasi, mitigasi bencana',
        status: 'Tersimpan',
      };
      onChange([...atp, newTp]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateItem = (idx: number, field: keyof AtpItem, val: any) => {
    const updated = [...atp];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const handleAddManual = () => {
    const newTp: AtpItem = {
      id: 'atp-' + Date.now(),
      code: `TP ${atp.length + 1}`,
      scopeContent: 'Materi Pokok Baru',
      learningObjective:
        'Peserta didik dapat mendeskripsikan dan menganalisis konsep pembelajaran baru secara komprehensif.',
      graduateDimensions: ['Penalaran Kritis', 'Kolaborasi'],
      allocatedJp: 10,
      semester: '1',
      keywords: 'kata kunci, konsep utama',
      status: 'Tersimpan',
    };
    onChange([...atp, newTp]);
  };

  const handleDelete = (idx: number) => {
    if (atp.length <= 1) return;
    const updated = atp.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const toggleDimension = (idx: number, dim: string) => {
    const currentDims = atp[idx].graduateDimensions || [];
    const exists = currentDims.includes(dim);
    const newDims = exists ? currentDims.filter((d) => d !== dim) : [...currentDims, dim];
    updateItem(idx, 'graduateDimensions', newDims);
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Alur Tujuan Pembelajaran (ATP) &amp; Dimensi Profil Lulusan
            </h3>
            <p className="text-xs text-slate-500">
              Setiap TP tersusun dari Capaian Pembelajaran resmi dan menjadi acuan untuk Modul Ajar (Langkah 9) &amp; Soal (Langkah 12).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddManual}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-400"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah TP</span>
            </button>
            <button
              onClick={handleGenerateAi}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <span>{isGenerating ? 'AI Menyusun TP...' : 'Sempurnakan dengan AI'}</span>
            </button>
          </div>
        </div>

        {/* ATP Table List */}
        <div className="space-y-3">
          {atp.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50/50 transition space-y-3"
            >
              {/* Header: Code & Scope */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    {item.code}
                  </span>
                  <input
                    type="text"
                    value={item.scopeContent}
                    onChange={(e) => updateItem(idx, 'scopeContent', e.target.value)}
                    placeholder="Lingkup Materi / Topik..."
                    className="font-bold text-xs text-slate-900 p-1.5 rounded-lg border border-slate-300 min-w-[240px]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Alokasi Waktu:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={item.allocatedJp}
                    onChange={(e) => updateItem(idx, 'allocatedJp', parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold p-1 rounded border border-slate-300"
                  />
                  <span className="font-bold text-slate-700">JP</span>
                  {atp.length > 1 && (
                    <button
                      onClick={() => handleDelete(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 ml-2"
                      title="Hapus TP"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Learning Objective Textarea */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Rumusan Tujuan Pembelajaran (TP)
                </label>
                <textarea
                  value={item.learningObjective}
                  onChange={(e) => updateItem(idx, 'learningObjective', e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Graduate Dimensions Selector (8 Dimensi Profil Lulusan) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Integrasi 8 Dimensi Profil Lulusan (Permendikdasmen No. 10/2025):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {graduateDimensionsList.map((dim) => {
                    const isSelected = item.graduateDimensions?.includes(dim);
                    return (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => toggleDimension(idx, dim)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {dim}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keywords */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                  Kata Kunci:
                </span>
                <input
                  type="text"
                  value={item.keywords}
                  onChange={(e) => updateItem(idx, 'keywords', e.target.value)}
                  placeholder="Kata kunci penting..."
                  className="flex-1 text-xs p-1 px-2 rounded border border-slate-200 text-slate-600 font-mono text-[11px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
