import React, { useState } from 'react';
import { LkpdData, AppState } from '../../types';
import { FileSpreadsheet, Sparkles, Plus, Trash2 } from 'lucide-react';
import { requestAiGeneration, parseAiJson, buildCurriculumContext } from '../../services/aiService';

interface Step10Props {
  lkpd: LkpdData;
  onChange: (updated: LkpdData) => void;
  appState: AppState;
}

export const Step10Lkpd: React.FC<Step10Props> = ({ lkpd, onChange, appState }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const handleGenerateAi = async () => {
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const curriculum = buildCurriculumContext(appState);
      const prompt = `Anda adalah pakar penyusun perangkat ajar Kurikulum Merdeka dan Pembelajaran Mendalam (Deep Learning).
Buatlah Lembar Kerja Peserta Didik (LKPD) kontekstual dan bermakna untuk:
- Mata Pelajaran: ${activePkg.subject}
- Kelas: ${activePkg.grade}
- Tema / Materi Pokok: ${activePkg.themeTopic || 'Materi Inti'}
- Sekolah: ${curriculum.schoolName || 'Sekolah Dasar'}

Format KELUARAN HARUS berupa SATU objek JSON valid murni tanpa teks pengantar dengan skema:
{
  "title": "LKPD Eksplorasi: ${activePkg.themeTopic || activePkg.subject}",
  "groupType": "Kelompok Kolaboratif (4-5 Murid)",
  "estimatedTime": "2 JP (70 Menit)",
  "contextualStimulus": "Cerita kasus otentik atau fenomena kehidupan sehari-hari anak...",
  "toolsAndMaterials": ["Alat/bahan 1", "Alat/bahan 2", "Alat/bahan 3"],
  "investigationSteps": [
    "1. Amati stimulus fenomena yang disajikan...",
    "2. Diskusikan bersama kelompok mengenai...",
    "3. Catat hasil observasi pada tabel..."
  ],
  "tableHeaders": ["No", "Aspek Pengamatan", "Hasil Pengamatan", "Analisis & Makna"],
  "tableRows": [
    ["1", "Aspek pertama...", "Data teramati...", "Penjelasan makna..."],
    ["2", "Aspek kedua...", "Data teramati...", "Penjelasan makna..."]
  ],
  "discussionQuestions": [
    "1. Mengapa hal tersebut dapat terjadi dalam kehidupan sehari-hari?",
    "2. Apa kesimpulan yang dapat kelompok Anda rumuskan?"
  ],
  "reflectionPrompt": "Apa pemahaman paling berharga yang saya dapatkan hari ini dan bagaimana menerapkannya?"
}`;

      const res = await requestAiGeneration({
        type: 'step10_lkpd',
        prompt,
        isJsonMode: true,
        materi: activePkg.themeTopic,
        kelas: activePkg.grade,
        durasi: 2,
        kompetensi: activePkg.subject,
        context: {
          subject: activePkg.subject,
          grade: activePkg.grade,
          materi: activePkg.themeTopic,
          ...curriculum,
        },
      });

      const parsed = parseAiJson<Partial<LkpdData>>(res, {});
      if (parsed && typeof parsed === 'object') {
        onChange({
          ...lkpd,
          title: parsed.title || lkpd.title,
          groupType: parsed.groupType || lkpd.groupType,
          estimatedTime: parsed.estimatedTime || lkpd.estimatedTime,
          contextualStimulus: parsed.contextualStimulus || lkpd.contextualStimulus,
          toolsAndMaterials: Array.isArray(parsed.toolsAndMaterials) && parsed.toolsAndMaterials.length > 0 ? parsed.toolsAndMaterials : lkpd.toolsAndMaterials,
          investigationSteps: Array.isArray(parsed.investigationSteps) && parsed.investigationSteps.length > 0 ? parsed.investigationSteps : lkpd.investigationSteps,
          tableHeaders: Array.isArray(parsed.tableHeaders) && parsed.tableHeaders.length > 0 ? parsed.tableHeaders : lkpd.tableHeaders,
          tableRows: Array.isArray(parsed.tableRows) && parsed.tableRows.length > 0 ? parsed.tableRows : lkpd.tableRows,
          discussionQuestions: Array.isArray(parsed.discussionQuestions) && parsed.discussionQuestions.length > 0 ? parsed.discussionQuestions : lkpd.discussionQuestions,
          reflectionPrompt: parsed.reflectionPrompt || lkpd.reflectionPrompt,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = <K extends keyof LkpdData>(field: K, val: LkpdData[K]) => {
    onChange({ ...lkpd, [field]: val });
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
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Lembar Kerja Peserta Didik (LKPD) Kontekstual
            </h3>
            <p className="text-xs text-slate-500">
              Siap dicetak dan dibagikan langsung kepada peserta didik untuk investigasi saintifik.
            </p>
          </div>

          <button
            onClick={handleGenerateAi}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-700" />
            <span>{isGenerating ? 'AI Menyusun...' : 'Sempurnakan LKPD dengan AI'}</span>
          </button>
        </div>

        {/* LKPD Header info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Judul LKPD
            </label>
            <input
              type="text"
              value={lkpd.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl border-2 border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
              Bentuk Pelaksanaan &amp; Waktu
            </label>
            <input
              type="text"
              value={`${lkpd.groupType} · ${lkpd.estimatedTime}`}
              onChange={(e) => updateField('estimatedTime', e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        {/* Stimulus Masalah Otentik */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
            Stimulus Kontekstual / Studi Kasus Lokal (Pemicu Masalah)
          </label>
          <textarea
            value={lkpd.contextualStimulus}
            onChange={(e) => updateField('contextualStimulus', e.target.value)}
            rows={3}
            className="w-full text-xs p-3 rounded-xl border-2 border-slate-900 bg-indigo-50/20 font-medium leading-relaxed"
          />
        </div>

        {/* Alat, Bahan & Langkah */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50">
            <h4 className="font-bold text-xs text-slate-900 mb-2">Alat dan Bahan:</h4>
            <div className="space-y-1">
              {lkpd.toolsAndMaterials.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <input
                    type="text"
                    value={t}
                    onChange={(e) => {
                      const updated = [...lkpd.toolsAndMaterials];
                      updated[idx] = e.target.value;
                      updateField('toolsAndMaterials', updated);
                    }}
                    className="w-full text-xs p-1 rounded bg-transparent border-b border-transparent hover:border-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/50">
            <h4 className="font-bold text-xs text-slate-900 mb-2">Langkah Investigasi Murid:</h4>
            <div className="space-y-1">
              {lkpd.investigationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-xs text-indigo-700">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step.replace(/^\d+\.\s*/, '')}
                    onChange={(e) => {
                      const updated = [...lkpd.investigationSteps];
                      updated[idx] = `${idx + 1}. ${e.target.value}`;
                      updateField('investigationSteps', updated);
                    }}
                    className="w-full text-xs p-1 rounded bg-transparent border-b border-transparent hover:border-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table of Observations */}
        <div className="mb-4">
          <h4 className="font-bold text-xs text-slate-900 mb-2">
            Tabel Lembar Pengamatan &amp; Investigasi:
          </h4>
          <div className="overflow-x-auto rounded-xl border-2 border-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                  {lkpd.tableHeaders.map((h, i) => (
                    <th key={i} className="py-2 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lkpd.tableRows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {r.map((c, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-700">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discussion Questions */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 mb-3">
          <h4 className="font-bold text-xs text-amber-950 mb-2">Pertanyaan Diskusi Terbimbing:</h4>
          <div className="space-y-1.5 text-xs text-amber-900">
            {lkpd.discussionQuestions.map((q, idx) => (
              <div key={idx} className="font-semibold">
                {q}
              </div>
            ))}
          </div>
        </div>

        {/* Student Reflection Prompt */}
        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
            Pertanyaan Refleksi Akhir Murid
          </label>
          <input
            type="text"
            value={lkpd.reflectionPrompt}
            onChange={(e) => updateField('reflectionPrompt', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
