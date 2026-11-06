import React, { useState } from 'react';
import {
  Sparkles,
  FileCheck2,
  Edit3,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Step12Data, QuestionItem, KartuSoalItem, AppState } from '../../types';
import { requestAiGeneration } from '../../services/aiService';

interface Step12Props {
  data: Step12Data;
  onChange: (updated: Step12Data) => void;
  appState: AppState;
}

const normalizeQuestionArray = (raw: any): any[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === 'object');
};

const validateGeneratedQuestions = (questions: any[], expectedPg: number, expectedEssay: number) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { valid: false, message: 'AI tidak mengembalikan daftar soal sama sekali.' };
  }

  const pgCount = questions.filter((q) => q?.type === 'PG').length;
  const essayCount = questions.filter((q) => q?.type === 'Uraian' || q?.type === 'Essay').length;

  if (pgCount !== expectedPg || essayCount !== expectedEssay) {
    return {
      valid: false,
      message: `AI menghasilkan ${pgCount} PG dan ${essayCount} uraian. Dipersyaratkan ${expectedPg} PG dan ${expectedEssay} uraian.`,
    };
  }

  const invalidQuestion = questions.find((q) => {
    if (!q || typeof q !== 'object') return true;
    if (!q.id || !q.questionText || !q.tpCode || !q.materi || !q.indicator) return true;
    if (q.type === 'PG') {
      return !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer || !q.explanation;
    }
    return !q.questionText;
  });

  if (invalidQuestion) {
    return { valid: false, message: 'Struktur soal yang dihasilkan AI tidak lengkap atau tidak valid.' };
  }

  return { valid: true, message: 'OK' };
};

export const Step12KisiDanSoal: React.FC<Step12Props> = ({ data, onChange, appState }) => {
  const [loadingClick, setLoadingClick] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'naskah' | 'kartu'>('matrix');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const updateField = <K extends keyof Step12Data>(field: K, val: Step12Data[K]) => {
    onChange({ ...data, [field]: val });
  };

  const parseAiJson = <T,>(rawText: string, fallback: T): T => {
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.warn('JSON parsing failed, trying to extract array substring:', e);
      const startIdx = rawText.indexOf('[');
      const endIdx = rawText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          return JSON.parse(rawText.substring(startIdx, endIdx + 1)) as T;
        } catch (inner) {
          console.error('Inner extraction failed:', inner);
        }
      }
      return fallback;
    }
  };

  const handleExecuteClick1 = async () => {
    setErrorMsg(null);
    setLoadingClick(1);
    try {
      const prompt = `Anda adalah pakar asesmen Kurikulum Merdeka Sekolah Dasar / Umum.
Susun matriks distribusi kisi-kisi asesmen tertulis untuk:
- Asesmen: ${data.assessmentName}
- Mata Pelajaran: ${activePkg.subject} (${activePkg.grade})
- Jumlah Soal Pilihan Ganda: ${data.countPg} butir
- Jumlah Soal Uraian: ${data.countEssay} butir

Kembalikan HANYA format JSON ARRAY dengan struktur berikut (jangan tambahkan teks pengantar apapun):
[
  {
    "tpCode": "TP 1",
    "materi": "Lingkup materi spesifik",
    "levelEasy_C1C2": 1,
    "levelMedium_C3": 2,
    "levelHots_C4C6": 1,
    "noSoalPg": "1, 2",
    "noSoalUraian": "11",
    "totalButir": 3,
    "totalBobot": 5
  }
]`;

      const response = await requestAiGeneration({
        type: 'step12_click1_kisi',
        prompt,
        isJsonMode: true,
        materi: data.assessmentName,
        kelas: activePkg.grade,
        durasi: 2,
        kompetensi: activePkg.subject,
        context: { subject: activePkg.subject, grade: activePkg.grade, materi: data.assessmentName },
      });

      const parsedMatrix = parseAiJson<any[]>(response, []);
      if (Array.isArray(parsedMatrix) && parsedMatrix.length > 0) {
        updateField('matrix', parsedMatrix);
      }
      updateField('click1Done', true);
      setActiveTab('matrix');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI untuk menyusun kisi-kisi.');
    } finally {
      setLoadingClick(null);
    }
  };

  const handleExecuteClick2 = async () => {
    setErrorMsg(null);
    setLoadingClick(2);
    try {
      const prompt = `Anda adalah pakar pembuat soal Kurikulum Merdeka.
Buat naskah butir soal asesmen tertulis lengkap untuk:
- Asesmen: ${data.assessmentName} (${activePkg.subject} ${activePkg.grade})
- Jumlah Soal Pilihan Ganda: ${data.countPg} butir (${data.optionsCount})
- Jumlah Soal Uraian: ${data.countEssay} butir (Skor maksimal per uraian: ${data.maxScorePerEssay})
- Berbasis Higher Order Thinking Skills (HOTS) kontekstual dan stimulus kasus nyata.
- Pastikan hasil akhir berjumlah tepat ${data.countPg} soal PG dan ${data.countEssay} soal Uraian.
- Setiap soal harus lengkap: id, type, tpCode, materi, indicator, cognitiveLevel, levelLabel, questionText, options, correctAnswer, explanation, scoreMax.

Kembalikan HANYA format JSON ARRAY seperti contoh berikut:
[
  {
    "id": 1,
    "type": "PG",
    "tpCode": "TP 1",
    "materi": "Nama materi",
    "indicator": "Disajikan ilustrasi, peserta didik dapat...",
    "cognitiveLevel": "C2",
    "levelLabel": "Mudah",
    "questionText": "Teks soal lengkap...",
    "options": [
      { "key": "A", "text": "Pilihan A" },
      { "key": "B", "text": "Pilihan B" },
      { "key": "C", "text": "Pilihan C" },
      { "key": "D", "text": "Pilihan D" }
    ],
    "correctAnswer": "B",
    "explanation": "Penjelasan kunci jawaban...",
    "scoreMax": 1
  },
  {
    "id": 11,
    "type": "Uraian",
    "tpCode": "TP 2",
    "materi": "Nama materi",
    "indicator": "Peserta didik dapat...",
    "cognitiveLevel": "C4",
    "levelLabel": "HOTS",
    "questionText": "Teks soal uraian...",
    "correctAnswer": "Contoh jawaban...",
    "explanation": "Penjelasan...",
    "scoreMax": 4
  }
]

CATATAN PENTING:
- Jumlah soal PG harus tepat ${data.countPg}.
- Jumlah soal Uraian harus tepat ${data.countEssay}.
- Jangan mengembalikan soal kurang atau lebih dari target.`;

      const response = await requestAiGeneration({
        type: 'step12_click2_soal',
        prompt,
        isJsonMode: true,
        materi: data.assessmentName,
        kelas: activePkg.grade,
        durasi: 2,
        kompetensi: activePkg.subject,
        context: { subject: activePkg.subject, grade: activePkg.grade, materi: data.assessmentName },
      });

      const parsedQuestions = normalizeQuestionArray(parseAiJson<any[]>(response, []));
      const validation = validateGeneratedQuestions(parsedQuestions, data.countPg, data.countEssay);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      updateField('questions', parsedQuestions);
      updateField('click2Done', true);
      setActiveTab('naskah');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI untuk menyusun naskah soal.');
    } finally {
      setLoadingClick(null);
    }
  };

  const handleExecuteClick3 = async () => {
    setErrorMsg(null);
    setLoadingClick(3);
    try {
      const prompt = `Anda adalah pengawas/evaluator pendidikan.
Susun kartu soal format resmi dinas beserta pedoman penskoran analitis untuk:
- Asesmen: ${data.assessmentName} (${activePkg.subject} ${activePkg.grade})
- Ambil sampel butir soal PG dan Uraian terpenting.

Kembalikan HANYA format JSON ARRAY dengan struktur berikut:
[
  {
    "noSoal": 1,
    "tpCode": "TP 1",
    "materi": "Nama Materi Pokok",
    "indicator": "Indikator Soal",
    "level": "C2 (Mudah)",
    "bukuSumber": "Buku Siswa Kemendikbudristek",
    "soalText": "Rumusan butir soal...",
    "kunciJawaban": "Kunci jawaban...",
    "pedomanPenskoran": "Pedoman penskoran..."
  }
]`;

      const response = await requestAiGeneration({
        type: 'step12_click3_kartu',
        prompt,
        isJsonMode: true,
        materi: data.assessmentName,
        kelas: activePkg.grade,
        durasi: 2,
        kompetensi: activePkg.subject,
        context: { subject: activePkg.subject, grade: activePkg.grade, materi: data.assessmentName },
      });

      const parsedKartu = parseAiJson<any[]>(response, []);
      if (Array.isArray(parsedKartu) && parsedKartu.length > 0) {
        updateField('kartuSoal', parsedKartu);
      }
      updateField('click3Done', true);
      setActiveTab('kartu');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI untuk menyusun kartu soal.');
    } finally {
      setLoadingClick(null);
    }
  };

  const handleUpdateQuestion = (qId: number, field: keyof QuestionItem, val: any) => {
    const updated = data.questions.map((q) => (q.id === qId ? { ...q, [field]: val } : q));
    updateField('questions', updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
              Sistem 3 Klik Bertahap (1 Klik = 1 Panggilan AI)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Paket Aktif: {activePkg.subject} — {activePkg.grade}
          </span>
        </div>

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

        <h3 className="text-base font-black text-slate-900 mb-3 tracking-tight">
          Konfigurasi Paket Soal Tertulis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              1. NAMA ASESMEN
            </label>
            <input
              type="text"
              value={data.assessmentName}
              onChange={(e) => updateField('assessmentName', e.target.value)}
              placeholder="Contoh: Sumatif Lingkup Materi 1 — Ekosistem"
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              2. JENIS ASESMEN
            </label>
            <select
              value={data.assessmentType}
              onChange={(e) => updateField('assessmentType', e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option>
              <option value="Sumatif Akhir Semester (SAS / ASAS)">Sumatif Akhir Semester (SAS / ASAS)</option>
              <option value="Asesmen Tengah Semester (ATS)">Asesmen Tengah Semester (ATS)</option>
              <option value="Formatif Tertulis / Kuis Harian">Formatif Tertulis / Kuis Harian</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              3. JUMLAH SOAL PILIHAN GANDA
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={data.countPg}
              onChange={(e) => updateField('countPg', parseInt(e.target.value) || 0)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              4. JUMLAH SOAL URAIAN
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={data.countEssay}
              onChange={(e) => updateField('countEssay', parseInt(e.target.value) || 0)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              5. JUMLAH OPSI PG
            </label>
            <select
              value={data.optionsCount}
              onChange={(e) => updateField('optionsCount', e.target.value as any)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="4 opsi (A-D)">4 opsi (A-D)</option>
              <option value="5 opsi (A-E)">5 opsi (A-E)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              6. SKOR MAKSIMAL PER URAIAN
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={data.maxScorePerEssay}
              onChange={(e) => updateField('maxScorePerEssay', parseInt(e.target.value) || 4)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 bg-slate-50 mb-5">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-[11px]">
                <th className="py-2 px-3 font-bold">Sebaran Kompetensi (TP)</th>
                <th className="py-2 px-2 text-center font-bold">C1/C2 (Mudah)</th>
                <th className="py-2 px-2 text-center font-bold">C3 (Sedang)</th>
                <th className="py-2 px-2 text-center font-bold">C4-C6 (HOTS)</th>
                <th className="py-2 px-3 text-center font-bold">No. Soal PG</th>
                <th className="py-2 px-3 text-center font-bold">No. Soal Uraian</th>
                <th className="py-2 px-3 text-center font-bold">Skor Maksimal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.matrix.map((row, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="py-2 px-3 font-bold text-slate-900">
                    {row.tpCode}: <span className="font-normal text-slate-600">{row.materi}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-medium">{row.levelEasy_C1C2}</td>
                  <td className="py-2 px-2 text-center font-medium">{row.levelMedium_C3}</td>
                  <td className="py-2 px-2 text-center font-medium">{row.levelHots_C4C6}</td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-700">
                    {row.noSoalPg}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-700">
                    {row.noSoalUraian}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-indigo-700">{row.totalBobot}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2 px-3">JUMLAH TOTAL</td>
                <td className="py-2 px-2 text-center">{data.matrix.reduce((a, b) => a + b.levelEasy_C1C2, 0)}</td>
                <td className="py-2 px-2 text-center">{data.matrix.reduce((a, b) => a + b.levelMedium_C3, 0)}</td>
                <td className="py-2 px-2 text-center">{data.matrix.reduce((a, b) => a + b.levelHots_C4C6, 0)}</td>
                <td className="py-2 px-3 text-center text-emerald-700 font-black">{data.countPg} butir</td>
                <td className="py-2 px-3 text-center text-indigo-700 font-black">{data.countEssay} butir</td>
                <td className="py-2 px-3 text-center font-black text-slate-900">{data.countPg + data.countEssay * data.maxScorePerEssay}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleExecuteClick1}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 ${
              data.click1Done ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <span>Klik 1:</span>
                <span>Buat Kisi-kisi Soal</span>
                {data.click1Done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Matriks distribusi &amp; level kognitif
              </div>
            </div>
            {loadingClick === 1 ? (
              <span className="text-xs font-bold text-indigo-600 animate-pulse">Menyusun...</span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <button
            onClick={handleExecuteClick2}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 ${
              data.click2Done ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <span>Klik 2:</span>
                <span>Buat Naskah &amp; Kunci</span>
                {data.click2Done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {data.countPg} PG + {data.countEssay} Uraian lengkap
              </div>
            </div>
            {loadingClick === 2 ? (
              <span className="text-xs font-bold text-indigo-600 animate-pulse">Menyusun...</span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <button
            onClick={handleExecuteClick3}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 ${
              data.click3Done ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <span>Klik 3:</span>
                <span>Buat Kartu Soal &amp; Rubrik</span>
                {data.click3Done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Format standar dinas &amp; pedoman skor
              </div>
            </div>
            {loadingClick === 3 ? (
              <span className="text-xs font-bold text-indigo-600 animate-pulse">Menyusun...</span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-sm">
        <div className="flex border-b-2 border-slate-900 bg-slate-100">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-5 text-xs font-black uppercase transition border-r-2 border-slate-900 ${
              activeTab === 'matrix' ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Matriks Kisi-kisi ({data.matrix.length} Lingkup Materi)
          </button>
          <button
            onClick={() => setActiveTab('naskah')}
            className={`py-3 px-5 text-xs font-black uppercase transition border-r-2 border-slate-900 ${
              activeTab === 'naskah' ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📝 Naskah Butir Soal &amp; Kunci ({data.questions.length} Butir)
          </button>
          <button
            onClick={() => setActiveTab('kartu')}
            className={`py-3 px-5 text-xs font-black uppercase transition ${
              activeTab === 'kartu' ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📇 Kartu Soal &amp; Pedoman Skor ({data.kartuSoal.length} Kartu)
          </button>
        </div>

        {activeTab === 'matrix' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Matriks Distribusi Kisi-kisi Asesmen Tertulis
                </h4>
                <p className="text-xs text-slate-500">
                  Sebaran proporsional level kognitif C1/C2 (Mudah), C3 (Sedang), dan C4-C6 (HOTS).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                    <th className="py-2.5 px-3 font-bold">TP</th>
                    <th className="py-2.5 px-3 font-bold">Materi Pembelajaran</th>
                    <th className="py-2.5 px-2 text-center font-bold">C1/C2</th>
                    <th className="py-2.5 px-2 text-center font-bold">C3</th>
                    <th className="py-2.5 px-2 text-center font-bold">C4-C6</th>
                    <th className="py-2.5 px-3 text-center font-bold">No. Soal PG</th>
                    <th className="py-2.5 px-3 text-center font-bold">No. Uraian</th>
                    <th className="py-2.5 px-3 text-center font-bold">Total Butir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.matrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-indigo-700">{row.tpCode}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{row.materi}</td>
                      <td className="py-2 px-2 text-center">{row.levelEasy_C1C2}</td>
                      <td className="py-2 px-2 text-center">{row.levelMedium_C3}</td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700">{row.levelHots_C4C6}</td>
                      <td className="py-2 px-3 text-center font-mono">{row.noSoalPg}</td>
                      <td className="py-2 px-3 text-center font-mono">{row.noSoalUraian}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">{row.totalButir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'naskah' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Daftar Naskah Butir Soal &amp; Kunci Jawaban Lengkap
                </h4>
                <p className="text-xs text-slate-500">Dapat diedit langsung. Format siap salin ke Word atau Google Docs.</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.questions.map((q) => {
                const isEditing = editingQuestionId === q.id;
                return (
                  <div key={q.id} className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 bg-white transition space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white">No. {q.id}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">{q.type}</span>
                        <span className="text-[11px] font-bold text-indigo-700">{q.tpCode}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          Level {q.cognitiveLevel} ({q.levelLabel})
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Selesai Edit' : 'Edit Butir'}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(q.id, 'questionText', e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-900 whitespace-pre-line leading-relaxed">{q.questionText}</p>
                    )}

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => (
                          <div key={opt.key} className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${opt.key === q.correctAnswer ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px]">{opt.key}</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-xs text-emerald-900 mt-2">
                      <div className="font-bold mb-0.5">
                        ✅ Kunci Jawaban: <span className="font-black">{q.correctAnswer}</span> (Skor Maksimal: {q.scoreMax})
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        <strong>Pedoman Penskoran / Penjelasan:</strong> {q.explanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'kartu' && (
          <div className="p-5 space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Kartu Soal Standar Format Kementerian / Dinas Pendidikan
              </h4>
              <p className="text-xs text-slate-500">
                Format resmi kisi-kisi dan kartu soal siap cetak atau dilampirkan dalam perangkat ajar.
              </p>
            </div>

            <div className="space-y-4">
              {data.kartuSoal.map((ks) => (
                <div key={ks.noSoal} className="rounded-xl border-2 border-slate-900 overflow-hidden bg-white shadow-xs">
                  <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-900 flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 uppercase">KARTU SOAL NOMOR {ks.noSoal}</span>
                    <span className="text-[11px] font-bold text-indigo-700">{ks.tpCode} · Level {ks.level}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Materi Pembelajaran:</span>
                        <span className="font-bold text-slate-900">{ks.materi}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Indikator Soal:</span>
                        <span className="text-slate-800">{ks.indicator}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Buku Sumber:</span>
                        <span className="text-slate-600 italic">{ks.bukuSumber}</span>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-4">
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">Rumusan Butir Soal:</span>
                        <p className="font-medium text-slate-900 whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-200">{ks.soalText}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300">
                        <span className="font-bold text-emerald-950 block mb-0.5">Kunci &amp; Pedoman Penskoran:</span>
                        <span className="font-black text-emerald-900 block mb-1">{ks.kunciJawaban}</span>
                        <p className="text-[11px] text-emerald-800 whitespace-pre-line">{ks.pedomanPenskoran}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
