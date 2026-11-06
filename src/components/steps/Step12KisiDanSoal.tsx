import React, { useState } from 'react';
import { Sparkles, Edit3, CheckCircle2 } from 'lucide-react';
import { Step12Data, QuestionItem, AppState } from '../../types';
import { requestAiGeneration } from '../../services/aiService';

interface Step12Props {
  data: Step12Data;
  onChange: (updated: Step12Data) => void;
  appState: AppState;
}

const normalizeQuestionArray = (raw: unknown): any[] =>
  Array.isArray(raw) ? raw.filter((item) => item && typeof item === 'object') : [];

const parseAiJson = <T,>(rawText: string, fallback: T): T => {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const startIdx = rawText.indexOf('[');
    const endIdx = rawText.lastIndexOf(']');
    if (startIdx !== -1 && endIdx > startIdx) {
      try {
        return JSON.parse(rawText.slice(startIdx, endIdx + 1)) as T;
      } catch {
        // Return fallback below when the response is not a valid JSON array.
      }
    }
    return fallback;
  }
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
    if (!q || typeof q !== 'object' || !q.id || !q.questionText || !q.tpCode || !q.materi || !q.indicator) return true;
    if (q.type === 'PG') {
      return !Array.isArray(q.options) || q.options.length < 2 || !q.correctAnswer || !q.explanation;
    }
    return !q.correctAnswer || !q.explanation;
  });

  return invalidQuestion
    ? { valid: false, message: 'Struktur soal yang dihasilkan AI tidak lengkap atau tidak valid.' }
    : { valid: true, message: 'OK' };
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

  const commonPayload = {
    materi: data.assessmentName,
    kelas: activePkg?.grade,
    durasi: 2,
    kompetensi: activePkg?.subject,
    context: {
      subject: activePkg?.subject,
      grade: activePkg?.grade,
      materi: data.assessmentName,
      maxScorePerEssay: data.maxScorePerEssay,
    },
    isJsonMode: true,
  };

  const handleExecuteClick1 = async () => {
    setErrorMsg(null);
    setLoadingClick(1);
    try {
      const prompt = `Anda adalah pakar asesmen Kurikulum Merdeka. Susun matriks distribusi kisi-kisi asesmen tertulis untuk asesmen ${data.assessmentName}, mata pelajaran ${activePkg?.subject} kelas ${activePkg?.grade}. Jumlah soal pilihan ganda: ${data.countPg} butir. Jumlah soal uraian: ${data.countEssay} butir. Kembalikan hanya JSON ARRAY valid dengan struktur: [{"tpCode":"TP 1","materi":"Lingkup materi spesifik","levelEasy_C1C2":1,"levelMedium_C3":2,"levelHots_C4C6":1,"noSoalPg":"1, 2","noSoalUraian":"11","totalButir":3,"totalBobot":5}].`;
      const response = await requestAiGeneration({ ...commonPayload, type: 'step12_click1_kisi', prompt });
      const parsedMatrix = parseAiJson<any[]>(response, []);
      if (!Array.isArray(parsedMatrix) || parsedMatrix.length === 0) {
        throw new Error('AI tidak mengembalikan matriks kisi-kisi yang valid.');
      }
      // Save generated data and completion state in one update to avoid stale-state overwrites.
      onChange({ ...data, matrix: parsedMatrix, click1Done: true });
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
      const prompt = `Anda adalah pakar pembuat soal Kurikulum Merdeka. Buat naskah asesmen untuk ${data.assessmentName} (${activePkg?.subject} kelas ${activePkg?.grade}). Jumlah Soal Pilihan Ganda: ${data.countPg} butir (${data.optionsCount}). Jumlah Soal Uraian: ${data.countEssay} butir (skor maksimal per uraian: ${data.maxScorePerEssay}). Buat soal kontekstual/HOTS dan hasilkan tepat sejumlah yang diminta. Setiap soal harus punya id, type (PG atau Uraian), tpCode, materi, indicator, cognitiveLevel, levelLabel, questionText, correctAnswer, explanation, scoreMax. Soal PG juga harus memiliki options dengan ${data.optionsCount}; gunakan key A-D atau A-E sesuai jumlah opsi. Kembalikan HANYA JSON ARRAY valid tanpa teks lain.`;
      const response = await requestAiGeneration({ ...commonPayload, type: 'step12_click2_soal', prompt });
      const parsedQuestions = normalizeQuestionArray(parseAiJson<any[]>(response, []));
      const validation = validateGeneratedQuestions(parsedQuestions, data.countPg, data.countEssay);
      if (!validation.valid) throw new Error(validation.message);

      // Save generated questions and completion state atomically; separate updates used stale props.
      onChange({ ...data, questions: parsedQuestions, click2Done: true });
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
      const prompt = `Anda adalah pengawas/evaluator pendidikan. Susun kartu soal beserta pedoman penskoran untuk asesmen ${data.assessmentName} (${activePkg?.subject}, kelas ${activePkg?.grade}). Buat kartu berdasarkan soal yang tersedia. Kembalikan hanya JSON ARRAY valid dengan struktur: [{"noSoal":1,"tpCode":"TP 1","materi":"Nama Materi Pokok","indicator":"Indikator Soal","level":"C2 (Mudah)","bukuSumber":"Buku Siswa","soalText":"Rumusan butir soal","kunciJawaban":"Kunci jawaban","pedomanPenskoran":"Pedoman penskoran"}].`;
      const response = await requestAiGeneration({ ...commonPayload, type: 'step12_click3_kartu', prompt });
      const parsedKartu = parseAiJson<any[]>(response, []);
      if (!Array.isArray(parsedKartu) || parsedKartu.length === 0) {
        throw new Error('AI tidak mengembalikan kartu soal yang valid.');
      }
      onChange({ ...data, kartuSoal: parsedKartu, click3Done: true });
      setActiveTab('kartu');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI untuk menyusun kartu soal.');
    } finally {
      setLoadingClick(null);
    }
  };

  const handleUpdateQuestion = (qId: number, field: keyof QuestionItem, val: any) => {
    const updated = data.questions.map((q) => (q.id === qId ? { ...q, [field]: val } : q));
    onChange({ ...data, questions: updated });
  };

  const buttons = [
    { number: 1, title: 'Buat Kisi-kisi Soal', subtitle: 'Matriks distribusi & level kognitif', done: data.click1Done, action: handleExecuteClick1 },
    { number: 2, title: 'Buat Naskah & Kunci', subtitle: `${data.countPg} PG + ${data.countEssay} Uraian`, done: data.click2Done, action: handleExecuteClick2 },
    { number: 3, title: 'Buat Kartu Soal & Rubrik', subtitle: 'Format standar & pedoman skor', done: data.click3Done, action: handleExecuteClick3 },
  ];

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-300">Sistem 3 Klik Bertahap</span>
          <span className="text-xs text-slate-500 font-medium">Paket Aktif: {activePkg?.subject} — {activePkg?.grade}</span>
        </div>
        {errorMsg && <div role="alert" className="p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold">⚠️ {errorMsg} <button onClick={() => setErrorMsg(null)} className="ml-2 underline">Tutup</button></div>}

        <h3 className="text-base font-black text-slate-900">Konfigurasi Paket Soal Tertulis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-[11px] font-black uppercase text-slate-700">Nama asesmen
            <input value={data.assessmentName} onChange={(e) => updateField('assessmentName', e.target.value)} className="mt-1 w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900" />
          </label>
          <label className="text-[11px] font-black uppercase text-slate-700">Jenis asesmen
            <select value={data.assessmentType} onChange={(e) => updateField('assessmentType', e.target.value)} className="mt-1 w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900">
              <option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option>
              <option value="Sumatif Akhir Semester (SAS / ASAS)">Sumatif Akhir Semester (SAS / ASAS)</option>
              <option value="Asesmen Tengah Semester (ATS)">Asesmen Tengah Semester (ATS)</option>
              <option value="Formatif Tertulis / Kuis Harian">Formatif Tertulis / Kuis Harian</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-[11px] font-black uppercase">Jumlah PG (maks. 50)
            <input type="number" min={1} max={50} value={data.countPg} onChange={(e) => updateField('countPg', parseInt(e.target.value) || 0)} className="mt-1 w-full p-2.5 rounded-xl border-2 border-slate-900" />
          </label>
          <label className="text-[11px] font-black uppercase">Jumlah uraian (maks. 20)
            <input type="number" min={0} max={20} value={data.countEssay} onChange={(e) => updateField('countEssay', parseInt(e.target.value) || 0)} className="mt-1 w-full p-2.5 rounded-xl border-2 border-slate-900" />
          </label>
          <label className="text-[11px] font-black uppercase">Jumlah opsi PG
            <select value={data.optionsCount} onChange={(e) => updateField('optionsCount', e.target.value as any)} className="mt-1 w-full p-2.5 rounded-xl border-2 border-slate-900">
              <option value="4 opsi (A-D)">4 opsi (A-D)</option><option value="5 opsi (A-E)">5 opsi (A-E)</option>
            </select>
          </label>
          <label className="text-[11px] font-black uppercase">Skor maksimal uraian
            <input type="number" min={1} max={10} value={data.maxScorePerEssay} onChange={(e) => updateField('maxScorePerEssay', parseInt(e.target.value) || 4)} className="mt-1 w-full p-2.5 rounded-xl border-2 border-slate-900" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {buttons.map((button) => (
            <button key={button.number} onClick={button.action} disabled={loadingClick !== null} className={`p-3 rounded-xl border-2 border-slate-900 text-left flex items-center justify-between ${button.done ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}`}>
              <span><span className="block font-bold text-xs">Klik {button.number}: {button.title} {button.done && <CheckCircle2 className="inline w-4 h-4 text-emerald-600" />}</span><span className="text-[10px] text-slate-500">{button.subtitle}</span></span>
              {loadingClick === button.number ? <span className="text-xs font-bold text-indigo-600">Menyusun...</span> : <Sparkles className="w-4 h-4 text-amber-500" />}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-sm">
        <nav className="flex flex-wrap border-b-2 border-slate-900 bg-slate-100">
          <button onClick={() => setActiveTab('matrix')} className={`py-3 px-5 text-xs font-black uppercase ${activeTab === 'matrix' ? 'bg-white text-indigo-700' : 'text-slate-600'}`}>📋 Matriks Kisi-kisi ({data.matrix.length})</button>
          <button onClick={() => setActiveTab('naskah')} className={`py-3 px-5 text-xs font-black uppercase ${activeTab === 'naskah' ? 'bg-white text-indigo-700' : 'text-slate-600'}`}>📝 Naskah Butir Soal &amp; Kunci ({data.questions.length} Butir)</button>
          <button onClick={() => setActiveTab('kartu')} className={`py-3 px-5 text-xs font-black uppercase ${activeTab === 'kartu' ? 'bg-white text-indigo-700' : 'text-slate-600'}`}>📇 Kartu Soal ({data.kartuSoal.length})</button>
        </nav>

        {activeTab === 'matrix' && <div className="p-5 overflow-x-auto"><h4 className="font-extrabold text-sm mb-3">Matriks Distribusi Kisi-kisi Asesmen Tertulis</h4><table className="w-full text-xs text-left"><thead><tr className="bg-slate-100"><th className="p-2">TP</th><th className="p-2">Materi</th><th className="p-2">C1/C2</th><th className="p-2">C3</th><th className="p-2">C4-C6</th><th className="p-2">No. PG</th><th className="p-2">No. Uraian</th><th className="p-2">Total</th></tr></thead><tbody>{data.matrix.map((row, i) => <tr key={i} className="border-t"><td className="p-2">{row.tpCode}</td><td className="p-2">{row.materi}</td><td className="p-2">{row.levelEasy_C1C2}</td><td className="p-2">{row.levelMedium_C3}</td><td className="p-2">{row.levelHots_C4C6}</td><td className="p-2">{row.noSoalPg}</td><td className="p-2">{row.noSoalUraian}</td><td className="p-2">{row.totalButir}</td></tr>)}</tbody></table></div>}

        {activeTab === 'naskah' && <div className="p-5 space-y-4"><h4 className="font-extrabold text-sm">Daftar Naskah Butir Soal &amp; Kunci Jawaban Lengkap ({data.questions.length} butir)</h4>{data.questions.map((q) => <article key={q.id} className="p-4 rounded-xl border-2 border-slate-200 space-y-2"><div className="flex justify-between gap-2"><div className="font-bold text-xs">No. {q.id} · {q.type} · {q.tpCode} · {q.cognitiveLevel} ({q.levelLabel})</div><button onClick={() => setEditingQuestionId(editingQuestionId === q.id ? null : q.id)} className="text-xs text-indigo-700 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />{editingQuestionId === q.id ? 'Selesai Edit' : 'Edit Butir'}</button></div>{editingQuestionId === q.id ? <textarea value={q.questionText} onChange={(e) => handleUpdateQuestion(q.id, 'questionText', e.target.value)} rows={3} className="w-full p-2 border rounded" /> : <p className="text-xs whitespace-pre-line">{q.questionText}</p>}{q.options?.map((option) => <div key={option.key} className="text-xs">{option.key}. {option.text}{option.key === q.correctAnswer ? ' ✓' : ''}</div>)}<p className="text-xs"><b>Kunci:</b> {q.correctAnswer} · <b>Skor:</b> {q.scoreMax}</p><p className="text-xs"><b>Pedoman/Penjelasan:</b> {q.explanation}</p></article>)}</div>}

        {activeTab === 'kartu' && <div className="p-5 space-y-4"><h4 className="font-extrabold text-sm">Kartu Soal &amp; Pedoman Skor</h4>{data.kartuSoal.map((card) => <article key={card.noSoal} className="p-4 rounded-xl border-2 border-slate-900 space-y-2"><h5 className="font-black text-xs">KARTU SOAL NOMOR {card.noSoal} · {card.tpCode} · {card.level}</h5><p className="text-xs"><b>Materi:</b> {card.materi}</p><p className="text-xs"><b>Indikator:</b> {card.indicator}</p><p className="text-xs"><b>Sumber:</b> {card.bukuSumber}</p><p className="text-xs"><b>Soal:</b> {card.soalText}</p><p className="text-xs"><b>Kunci:</b> {card.kunciJawaban}</p><p className="text-xs"><b>Pedoman skor:</b> {card.pedomanPenskoran}</p></article>)}</div>}
      </section>
    </div>
  );
};
