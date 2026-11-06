import React, { useState } from 'react';
import { AtpItem, AppState } from '../../types';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { requestAiGeneration, parseAiJson } from '../../services/aiService';

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
    if (!activePkg) {
      setErrorMsg('Paket aktif tidak ditemukan. Pilih paket terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const totalJp = Number(appState.calendar?.totalJpSemester) || 72;
      const cpContext = appState.cp?.generalDescription || '';
      const prompt = `Anda adalah ahli kurikulum dan penyusun ATP Kurikulum Merdeka untuk pendidikan dasar.

Susun ATP BARU untuk paket aktif berikut. Gunakan hanya konteks paket ini:
- Mata pelajaran: ${activePkg.subject}
- Kelas: ${activePkg.grade}
- Fase: ${activePkg.phase}
- Jenjang: ${activePkg.level}
- Topik paket: ${activePkg.themeTopic}
- Alokasi waktu semester: ${totalJp} JP
- Capaian Pembelajaran yang tersedia: ${cpContext || 'Gunakan capaian yang sesuai dengan mata pelajaran dan fase tersebut.'}

Buat 4 sampai 6 tujuan pembelajaran yang berurutan, spesifik terhadap mata pelajaran dan kelas di atas, terukur, dan sesuai perkembangan peserta didik. Jangan menyalin materi mata pelajaran lain. Alokasikan total JP secara wajar dan jumlahnya tidak boleh melebihi ${totalJp} JP.
Kembalikan hanya JSON array valid tanpa markdown atau teks di luar JSON, dengan struktur:
[
  {
    "code": "TP 1",
    "scopeContent": "Materi/topik",
    "learningObjective": "Peserta didik dapat ...",
    "graduateDimensions": ["Penalaran Kritis"],
    "allocatedJp": 12,
    "semester": "1",
    "keywords": "kata kunci"
  }
]`;

      const response = await requestAiGeneration({
        type: 'atp',
        prompt,
        isJsonMode: true,
        context: {
          subject: activePkg.subject,
          grade: activePkg.grade,
          phase: activePkg.phase,
          themeTopic: activePkg.themeTopic,
          totalJpSemester: totalJp,
          cpSummary: cpContext,
        },
      });

      const parsed = parseAiJson<unknown>(response, null);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Respons AI tidak berisi daftar ATP yang valid. Silakan coba lagi.');
      }

      const generatedAtp: AtpItem[] = parsed.map((item: any, index: number) => {
        if (
          !item ||
          typeof item.scopeContent !== 'string' ||
          !item.scopeContent.trim() ||
          typeof item.learningObjective !== 'string' ||
          !item.learningObjective.trim()
        ) {
          throw new Error(`Data TP nomor ${index + 1} dari AI tidak lengkap. Silakan coba lagi.`);
        }

        const dimensions = Array.isArray(item.graduateDimensions)
          ? item.graduateDimensions.filter(
              (dimension: unknown): dimension is string =>
                typeof dimension === 'string' && graduateDimensionsList.includes(dimension),
            )
          : [];

        return {
          id: `atp-ai-${Date.now()}-${index}`,
          code: typeof item.code === 'string' && item.code.trim() ? item.code.trim() : `TP ${index + 1}`,
          scopeContent: item.scopeContent.trim(),
          learningObjective: item.learningObjective.trim(),
          graduateDimensions: dimensions.length ? dimensions : ['Penalaran Kritis'],
          allocatedJp: Math.max(1, Number(item.allocatedJp) || Math.floor(totalJp / parsed.length)),
          semester: item.semester === '2' ? '2' : '1',
          keywords: typeof item.keywords === 'string' ? item.keywords : '',
          status: 'Tersimpan',
        };
      });

      // Gunakan respons AI untuk mengganti ATP. Jangan menambahkan data hardcoded dari mata pelajaran lain.
      onChange(generatedAtp);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyusun ATP dengan AI. Silakan coba lagi.');
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
      id: `atp-${Date.now()}`,
      code: `TP ${atp.length + 1}`,
      scopeContent: 'Materi Pokok Baru',
      learningObjective: 'Peserta didik dapat mendeskripsikan dan menganalisis konsep pembelajaran.',
      graduateDimensions: ['Penalaran Kritis', 'Kolaborasi'],
      allocatedJp: 10,
      semester: '1',
      keywords: '',
      status: 'Draf',
    };
    onChange([...atp, newTp]);
  };

  const handleDelete = (idx: number) => {
    if (atp.length <= 1) return;
    onChange(atp.filter((_, index) => index !== idx));
  };

  const toggleDimension = (idx: number, dimension: string) => {
    const current = atp[idx].graduateDimensions || [];
    const next = current.includes(dimension)
      ? current.filter((item) => item !== dimension)
      : [...current, dimension];
    updateItem(idx, 'graduateDimensions', next);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="px-2 py-0.5 rounded bg-red-200">
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
              Paket aktif: {activePkg?.subject} — {activePkg?.grade}. Hasil AI akan menggantikan daftar TP untuk paket aktif ini.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddManual}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-400"
            >
              <Plus className="w-4 h-4" /> + Tambah TP
            </button>
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-700" />
              {isGenerating ? 'AI Menyusun TP...' : 'Sempurnakan dengan AI'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {atp.map((item, idx) => (
            <div key={item.id} className="p-4 rounded-xl border-2 border-slate-900 bg-white space-y-3">
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
                    onChange={(e) => updateItem(idx, 'allocatedJp', parseInt(e.target.value, 10) || 0)}
                    className="w-14 text-center font-bold p-1 rounded border border-slate-300"
                  />
                  <span className="font-bold text-slate-700">JP</span>
                  {atp.length > 1 && (
                    <button type="button" onClick={() => handleDelete(idx)} className="text-slate-400 hover:text-red-600 p-1" title="Hapus TP">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Rumusan Tujuan Pembelajaran (TP)</label>
                <textarea
                  value={item.learningObjective}
                  onChange={(e) => updateItem(idx, 'learningObjective', e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Integrasi 8 Dimensi Profil Lulusan:</label>
                <div className="flex flex-wrap gap-1.5">
                  {graduateDimensionsList.map((dimension) => {
                    const selected = item.graduateDimensions?.includes(dimension);
                    return (
                      <button
                        key={dimension}
                        type="button"
                        onClick={() => toggleDimension(idx, dimension)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${selected ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
                      >
                        {selected ? '✓ ' : '+ '}{dimension}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label htmlFor={`atp-keywords-${item.id}`} className="text-[10px] font-bold text-slate-500 uppercase">Kata Kunci:</label>
                <input
                  id={`atp-keywords-${item.id}`}
                  type="text"
                  value={item.keywords}
                  onChange={(e) => updateItem(idx, 'keywords', e.target.value)}
                  placeholder="Kata kunci penting..."
                  className="flex-1 text-xs p-1 px-2 rounded border border-slate-200 text-slate-600 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
