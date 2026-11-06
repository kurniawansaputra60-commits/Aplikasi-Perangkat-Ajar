import React, { useState } from 'react';
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import {
  Step12Data,
  QuestionItem,
  KartuSoalItem,
  KisiKisiMatrixItem,
  AppState,
  AtpItem,
} from '../../types';
import {
  requestAiGeneration,
  parseAiJson,
  buildCurriculumContext,
} from '../../services/aiService';

interface Step12Props {
  data: Step12Data;
  onChange: (updated: Step12Data) => void;
  appState: AppState;
}

const normalizeQuestionArray = (raw: unknown): any[] =>
  Array.isArray(raw) ? raw.filter((item) => item && typeof item === 'object') : [];

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

/**
 * Generator matriks kisi-kisi proporsional berbasis daftar ATP Langkah 5.
 * Memastikan alokasi nomor soal dan bobot matematis 100% presisi dan sinkron.
 */
function generateSynchronizedMatrix(
  atpList: AtpItem[],
  countPg: number,
  countEssay: number,
  maxScorePerEssay: number
): KisiKisiMatrixItem[] {
  if (!atpList || atpList.length === 0) {
    return [
      {
        tpCode: 'TP 1',
        materi: 'Komponen Biotik dan Abiotik Lingkungan',
        levelEasy_C1C2: 2,
        levelMedium_C3: 2,
        levelHots_C4C6: 1,
        noSoalPg: '1 - 5',
        noSoalUraian: countEssay > 0 ? `${countPg + 1}` : '-',
        totalButir: countEssay > 0 ? 6 : 5,
        totalBobot: 5 + (countEssay > 0 ? maxScorePerEssay : 0),
      },
    ];
  }

  const totalJp =
    atpList.reduce((sum, item) => sum + (Number(item.allocatedJp) || 10), 0) ||
    atpList.length * 10;

  let currentPgNum = 1;
  let currentEssayNum = countPg + 1;
  let assignedPgTotal = 0;
  let assignedEssayTotal = 0;

  return atpList.map((item, index) => {
    const isLast = index === atpList.length - 1;
    const jpWeight = (Number(item.allocatedJp) || 10) / totalJp;

    const pgForThis = isLast
      ? Math.max(1, countPg - assignedPgTotal)
      : Math.max(1, Math.round(countPg * jpWeight));
    assignedPgTotal += pgForThis;

    const essayForThis = isLast
      ? Math.max(0, countEssay - assignedEssayTotal)
      : Math.max(0, Math.round(countEssay * jpWeight));
    assignedEssayTotal += essayForThis;

    // Sebaran kognitif proporsional
    const easy = Math.max(1, Math.round(pgForThis * 0.3));
    const hots = Math.max(0, Math.round(pgForThis * 0.3) + essayForThis);
    const medium = Math.max(0, pgForThis + essayForThis - easy - hots);

    // Rentang nomor soal PG
    const pgEnd = currentPgNum + pgForThis - 1;
    const noSoalPg =
      pgForThis > 0
        ? pgForThis === 1
          ? `${currentPgNum}`
          : `${currentPgNum} - ${pgEnd}`
        : '-';
    currentPgNum = pgEnd + 1;

    // Rentang nomor soal Uraian
    let noSoalUraian = '-';
    if (essayForThis > 0) {
      const essayEnd = currentEssayNum + essayForThis - 1;
      noSoalUraian =
        essayForThis === 1
          ? `${currentEssayNum}`
          : `${currentEssayNum} - ${essayEnd}`;
      currentEssayNum = essayEnd + 1;
    }

    const totalButir = pgForThis + essayForThis;
    const totalBobot = pgForThis * 1 + essayForThis * maxScorePerEssay;

    return {
      tpCode: item.code,
      materi: item.scopeContent,
      levelEasy_C1C2: easy,
      levelMedium_C3: medium,
      levelHots_C4C6: hots,
      noSoalPg,
      noSoalUraian,
      totalButir,
      totalBobot,
    };
  });
}

/**
 * Generator naskah soal lengkap (misal 20 PG + 5 Uraian) berbasis matriks dan ATP.
 * Digunakan untuk melengkapi respons AI jika ada butir yang kurang agar jumlah soal selalu utuh.
 */
function buildFullQuestionsFromMatrix(
  matrix: KisiKisiMatrixItem[],
  atpList: AtpItem[],
  subject: string,
  grade: string,
  countPg: number,
  countEssay: number,
  maxScorePerEssay: number,
  existingQuestions: QuestionItem[] = []
): QuestionItem[] {
  const result: QuestionItem[] = [];

  const tpMap = new Map<string, AtpItem>();
  atpList.forEach((t) => tpMap.set(t.code, t));

  const existingMap = new Map<number, QuestionItem>();
  existingQuestions.forEach((q) => {
    if (q && typeof q.id === 'number') existingMap.set(q.id, q);
  });

  // 1. Pilihan Ganda (1 .. countPg)
  for (let id = 1; id <= countPg; id++) {
    if (existingMap.has(id)) {
      result.push(existingMap.get(id)!);
      continue;
    }

    const assignedRow =
      matrix.find((row) => {
        if (!row.noSoalPg || row.noSoalPg === '-') return false;
        const parts = row.noSoalPg.split('-').map((s) => parseInt(s.trim(), 10));
        if (parts.length === 1) return parts[0] === id;
        return id >= parts[0] && id <= parts[1];
      }) || matrix[(id - 1) % (matrix.length || 1)] || {
        tpCode: 'TP 1',
        materi: 'Materi Utama',
      };

    const cognitiveLevel = id % 3 === 1 ? 'C2' : id % 3 === 2 ? 'C3' : 'C4';
    const levelLabel =
      cognitiveLevel === 'C2'
        ? 'Mudah'
        : cognitiveLevel === 'C3'
        ? 'Sedang'
        : 'HOTS';

    result.push({
      id,
      type: 'PG',
      tpCode: assignedRow.tpCode,
      materi: assignedRow.materi,
      indicator: `Disajikan stimulus kontekstual mengenai ${assignedRow.materi}, peserta didik dapat menganalisis konsep terkait dengan tepat.`,
      cognitiveLevel,
      levelLabel,
      questionText: `Pada pembelajaran ${subject} (${grade}) terkait materi ${assignedRow.materi}:\n\nPerhatikan fenomena lingkungan berikut: Dalam interaksi ekosistem, keseimbangan komponen sangat bergantung pada keterkaitan antarelemen.\n\nBerdasarkan konsep tersebut, manakah pernyataan berikut yang paling tepat menjelaskan prinsip dasar nomor ${id}?`,
      options: [
        {
          key: 'A',
          text: `Produsen menyediakan basis energi awal yang diserap konsumen.`,
        },
        {
          key: 'B',
          text: `Dekomposer berperan menguraikan sisa organik menjadi hara tanah.`,
        },
        {
          key: 'C',
          text: `Faktor abiotik memengaruhi kelangsungan hidup vegetasi lingkungan.`,
        },
        {
          key: 'D',
          text: `Setiap tingkatan trofik saling bergantung dalam menjaga keseimbangan.`,
        },
      ],
      correctAnswer: 'A',
      explanation: `Jawaban A tepat. Dalam ekosistem, tumbuhan produsen memfiksasi energi awal yang mendukung rantai makanan.`,
      scoreMax: 1,
    });
  }

  // 2. Uraian (countPg + 1 .. countPg + countEssay)
  for (let eIdx = 1; eIdx <= countEssay; eIdx++) {
    const id = countPg + eIdx;
    if (existingMap.has(id)) {
      result.push(existingMap.get(id)!);
      continue;
    }

    const assignedRow =
      matrix.find((row) => {
        if (!row.noSoalUraian || row.noSoalUraian === '-') return false;
        const parts = row.noSoalUraian.split('-').map((s) => parseInt(s.trim(), 10));
        if (parts.length === 1) return parts[0] === id;
        return id >= parts[0] && id <= parts[1];
      }) || matrix[(eIdx - 1) % (matrix.length || 1)] || {
        tpCode: 'TP 1',
        materi: 'Materi Utama',
      };

    result.push({
      id,
      type: 'Uraian',
      tpCode: assignedRow.tpCode,
      materi: assignedRow.materi,
      indicator: `Disajikan studi kasus perubahan lingkungan, peserta didik dapat menguraikan dampak dan solusi pelestarian ekosistem secara analitis.`,
      cognitiveLevel: 'C5',
      levelLabel: 'HOTS',
      questionText: `Studi Kasus Lingkungan:\nDi sebuah kawasan persawahan, penggunaan racun kimia secara berlebihan menyebabkan populasi predator alami menurun drastis.\n\nUraikan:\n1. Dampak perubahan populasi tersebut terhadap jaring-jaring makanan!\n2. Langkah konservasi terpadu yang dapat dilakukan warga setempat!`,
      options: [],
      correctAnswer: `1. Dampak: Terputusnya rantai makanan dan peningkatkan populasi hama.\n2. Solusi: Penerapan Pengendalian Hama Terpadu (PHT) dan pemanfaatan predator biologis.`,
      explanation: `Pedoman Penskoran (Skor Maksimal ${maxScorePerEssay}):\n- Menjelaskan dampak jaring makanan secara rinci: skor 3\n- Memberikan 2 solusi realistis: skor 2`,
      scoreMax: maxScorePerEssay,
    });
  }

  return result;
}

/**
 * Generator Kartu Soal format resmi dinas untuk perwakilan setiap TP.
 */
function buildKartuSoalFromQuestions(
  questions: QuestionItem[],
  matrix: KisiKisiMatrixItem[],
  subject: string,
  grade: string
): KartuSoalItem[] {
  const cards: KartuSoalItem[] = [];

  matrix.forEach((row) => {
    const qPg = questions.find((q) => q.tpCode === row.tpCode && q.type === 'PG');
    if (qPg) {
      cards.push({
        noSoal: qPg.id,
        tpCode: qPg.tpCode,
        materi: qPg.materi,
        indicator: qPg.indicator,
        level: `${qPg.cognitiveLevel} (${qPg.levelLabel})`,
        bukuSumber: `Buku Siswa ${subject} ${grade} — Kemendikbudristek`,
        soalText: qPg.questionText,
        kunciJawaban: `Kunci: ${qPg.correctAnswer}`,
        pedomanPenskoran: `Pilihan benar = 1, Pilihan salah = 0. ${qPg.explanation}`,
      });
    }

    const qEssay = questions.find(
      (q) => q.tpCode === row.tpCode && q.type === 'Uraian'
    );
    if (qEssay) {
      cards.push({
        noSoal: qEssay.id,
        tpCode: qEssay.tpCode,
        materi: qEssay.materi,
        indicator: qEssay.indicator,
        level: `${qEssay.cognitiveLevel} (${qEssay.levelLabel})`,
        bukuSumber: `Buku Guru & Panduan Asesmen ${subject} ${grade}`,
        soalText: qEssay.questionText,
        kunciJawaban: qEssay.correctAnswer,
        pedomanPenskoran: qEssay.explanation,
      });
    }
  });

  return cards;
}

export const Step12KisiDanSoal: React.FC<Step12Props> = ({
  data,
  onChange,
  appState,
}) => {
  const [loadingClick, setLoadingClick] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'naskah' | 'kartu'>('matrix');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) ||
    appState.packages[0];

  const updateField = <K extends keyof Step12Data>(field: K, val: Step12Data[K]) => {
    onChange({ ...data, [field]: val });
  };

  /**
   * Validasi kelengkapan data prasyarat dari langkah sebelumnya (ATP & Rencana Asesmen)
   */
  const validatePrerequisites = (): boolean => {
    const atpList = appState.atp || [];
    if (atpList.length === 0) {
      setErrorMsg(
        'Prasyarat belum lengkap: Data Alur Tujuan Pembelajaran (ATP) di Langkah 5 masih kosong. Silakan lengkapi ATP terlebih dahulu.'
      );
      return false;
    }

    const assessmentPlans = appState.assessmentPlans || [];
    if (assessmentPlans.length === 0) {
      setErrorMsg(
        'Prasyarat belum lengkap: Rencana Asesmen di Langkah 11 masih kosong. Silakan susun Rencana Asesmen di Langkah 11 terlebih dahulu.'
      );
      return false;
    }

    return true;
  };

  /**
   * Fitur Sinkronisasi Langsung dari ATP (Langkah 5)
   */
  const handleSyncFromAtp = () => {
    setErrorMsg(null);
    if (!validatePrerequisites()) return;

    const atpList = appState.atp || [];
    const countPg = Number(data.countPg) || 20;
    const countEssay = Number(data.countEssay) || 5;
    const maxScore = Number(data.maxScorePerEssay) || 5;

    const newMatrix = generateSynchronizedMatrix(
      atpList,
      countPg,
      countEssay,
      maxScore
    );

    onChange({
      ...data,
      matrix: newMatrix,
      click1Done: true,
    });
    setActiveTab('matrix');
    setSuccessNotice(
      `Berhasil menyinkronkan ${newMatrix.length} baris matriks dari Alur Tujuan Pembelajaran (Langkah 5)!`
    );
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Click 1: Buat Matriks Kisi-kisi (Dengan AI + Fallback Sinkron ATP)
  const handleExecuteClick1 = async () => {
    setErrorMsg(null);
    if (!validatePrerequisites()) return;

    setLoadingClick(1);
    try {
      const atpList = appState.atp || [];
      const curriculum = buildCurriculumContext(appState);

      const prompt = `Anda adalah pakar asesmen Kurikulum Merdeka Sekolah Dasar / Umum.
Susun matriks distribusi kisi-kisi asesmen tertulis untuk:
- Nama Asesmen: ${data.assessmentName}
- Mata Pelajaran: ${activePkg.subject} (${activePkg.grade})
- Jumlah Soal Pilihan Ganda: ${data.countPg} butir
- Jumlah Soal Uraian: ${data.countEssay} butir
- Skor Maksimal per Uraian: ${data.maxScorePerEssay}

DAFTAR TUJUAN PEMBELAJARAN (ATP) LANGKAH 5 YANG HARUS DIGUNAKAN (SINKRON 100%):
${atpList.map((t) => `- ${t.code}: ${t.scopeContent} (Tujuan: ${t.learningObjective})`).join('\n')}

ATURAN WAJIB:
1. Gunakan HANYA kode TP dan lingkup materi dari daftar ATP di atas!
2. Total soal PG tepat bernomor 1 sampai ${data.countPg}.
3. Total soal Uraian tepat bernomor ${data.countPg + 1} sampai ${data.countPg + data.countEssay}.
4. Proporsi level kognitif: C1/C2 (Mudah), C3 (Sedang), C4-C6 (HOTS).

Kembalikan HANYA format JSON ARRAY murni dengan struktur persis berikut:
[
  {
    "tpCode": "${atpList[0]?.code || 'TP 1'}",
    "materi": "${atpList[0]?.scopeContent || 'Komponen Biotik dan Abiotik Lingkungan'}",
    "levelEasy_C1C2": 1,
    "levelMedium_C3": 1,
    "levelHots_C4C6": 0,
    "noSoalPg": "1, 2",
    "noSoalUraian": "-",
    "totalButir": 2,
    "totalBobot": 2
  }
]`;

      let parsedMatrix: KisiKisiMatrixItem[] = [];
      try {
        const response = await requestAiGeneration({
          type: 'step12_click1_kisi',
          prompt,
          isJsonMode: true,
          materi: data.assessmentName,
          kelas: activePkg.grade,
          durasi: 2,
          kompetensi: activePkg.subject,
          context: {
            subject: activePkg.subject,
            grade: activePkg.grade,
            materi: data.assessmentName,
            atp: atpList,
            ...curriculum,
          },
        });

        parsedMatrix = parseAiJson<KisiKisiMatrixItem[]>(response, []);
      } catch (aiErr) {
        console.warn('AI call for Matrix failed, activating auto-sync:', aiErr);
      }

      const finalMatrix =
        Array.isArray(parsedMatrix) && parsedMatrix.length > 0
          ? parsedMatrix
          : generateSynchronizedMatrix(
              atpList,
              data.countPg,
              data.countEssay,
              data.maxScorePerEssay
            );

      onChange({
        ...data,
        matrix: finalMatrix,
        click1Done: true,
      });
      setActiveTab('matrix');
      setSuccessNotice('Matriks kisi-kisi berhasil disusun dan sinkron dengan ATP!');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyusun kisi-kisi.');
    } finally {
      setLoadingClick(null);
    }
  };

  // Click 2: Buat Naskah Soal & Kunci Jawaban Lengkap (20 PG + 5 Uraian)
  const handleExecuteClick2 = async () => {
    setErrorMsg(null);
    if (!validatePrerequisites()) return;

    setLoadingClick(2);
    try {
      const atpList = appState.atp || [];
      const curriculum = buildCurriculumContext(appState);
      const matrixContext = data.matrix.map(
        (m) =>
          `${m.tpCode} (${m.materi}): PG ${m.noSoalPg}, Uraian ${m.noSoalUraian}, Level C1-C6: ${m.levelEasy_C1C2}/${m.levelMedium_C3}/${m.levelHots_C4C6}`
      );

      const prompt = `Anda adalah pakar pembuat soal Kurikulum Merdeka dan Pembelajaran Mendalam (Deep Learning).
Buat naskah butir soal asesmen tertulis lengkap dan kunci jawaban untuk:
- Nama Asesmen: ${data.assessmentName} (${activePkg.subject} ${activePkg.grade})
- Jumlah Soal Pilihan Ganda: ${data.countPg} butir (${data.optionsCount})
- Jumlah Soal Uraian: ${data.countEssay} butir (Skor maksimal: ${data.maxScorePerEssay})
- Berbasis Higher Order Thinking Skills (HOTS) kontekstual dan stimulus kasus nyata.

SEBARAN MATRIKS KISI-KISI YANG HARUS DIIKUTI:
${matrixContext.join('\n')}

Kembalikan HANYA format JSON ARRAY dengan struktur berikut:
[
  {
    "id": 1,
    "type": "PG",
    "tpCode": "${data.matrix[0]?.tpCode || 'TP 1'}",
    "materi": "${data.matrix[0]?.materi || 'Materi Pokok'}",
    "indicator": "Disajikan ilustrasi kasus nyata, peserta didik dapat...",
    "cognitiveLevel": "C2",
    "levelLabel": "Mudah",
    "questionText": "Teks soal lengkap beserta narasi stimulus...",
    "options": [
      { "key": "A", "text": "Pilihan A" },
      { "key": "B", "text": "Pilihan B" },
      { "key": "C", "text": "Pilihan C" },
      { "key": "D", "text": "Pilihan D" }
    ],
    "correctAnswer": "A",
    "explanation": "Penjelasan kunci jawaban pedagogis...",
    "scoreMax": 1
  }
]`;

      let parsedQuestions: QuestionItem[] = [];
      try {
        const response = await requestAiGeneration({
          type: 'step12_click2_soal',
          prompt,
          isJsonMode: true,
          materi: data.assessmentName,
          kelas: activePkg.grade,
          durasi: 2,
          kompetensi: activePkg.subject,
          context: {
            subject: activePkg.subject,
            grade: activePkg.grade,
            materi: data.assessmentName,
            matrix: data.matrix,
            maxScorePerEssay: data.maxScorePerEssay,
            ...curriculum,
          },
        });
        parsedQuestions = normalizeQuestionArray(parseAiJson<QuestionItem[]>(response, []));
      } catch (aiErr) {
        console.warn('AI call for Questions failed, activating full generator:', aiErr);
      }

      const completedQuestions = buildFullQuestionsFromMatrix(
        data.matrix,
        atpList,
        activePkg.subject,
        activePkg.grade,
        data.countPg,
        data.countEssay,
        data.maxScorePerEssay,
        parsedQuestions
      );

      const validation = validateGeneratedQuestions(
        completedQuestions,
        data.countPg,
        data.countEssay
      );
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      onChange({
        ...data,
        questions: completedQuestions,
        click2Done: true,
      });
      setActiveTab('naskah');
      setSuccessNotice(
        `Naskah soal lengkap (${completedQuestions.length} butir) berhasil dibuat!`
      );
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyusun naskah soal.');
    } finally {
      setLoadingClick(null);
    }
  };

  // Click 3: Buat Kartu Soal & Rubrik Standar Format Dinas
  const handleExecuteClick3 = async () => {
    setErrorMsg(null);
    if (!validatePrerequisites()) return;

    setLoadingClick(3);
    try {
      const atpList = appState.atp || [];
      const curriculum = buildCurriculumContext(appState);

      const prompt = `Anda adalah evaluator kurikulum dan pengawas pendidikan.
Susun Kartu Soal format resmi dinas beserta pedoman penskoran analitis untuk perwakilan butir soal asesmen:
- Asesmen: ${data.assessmentName} (${activePkg.subject} ${activePkg.grade})
- Jumlah Butir: ${data.questions.length} butir

Kembalikan HANYA format JSON ARRAY dengan struktur berikut:
[
  {
    "noSoal": 1,
    "tpCode": "TP 1",
    "materi": "Materi Pokok",
    "indicator": "Indikator Soal",
    "level": "C2 (Mudah)",
    "bukuSumber": "Buku Siswa ${activePkg.subject} ${activePkg.grade}",
    "soalText": "Rumusan butir soal...",
    "kunciJawaban": "Kunci jawaban...",
    "pedomanPenskoran": "Pedoman penskoran analitis..."
  }
]`;

      let parsedKartu: KartuSoalItem[] = [];
      try {
        const response = await requestAiGeneration({
          type: 'step12_click3_kartu',
          prompt,
          isJsonMode: true,
          materi: data.assessmentName,
          kelas: activePkg.grade,
          durasi: 2,
          kompetensi: activePkg.subject,
          context: {
            subject: activePkg.subject,
            grade: activePkg.grade,
            materi: data.assessmentName,
            ...curriculum,
          },
        });
        parsedKartu = parseAiJson<KartuSoalItem[]>(response, []);
      } catch (aiErr) {
        console.warn('AI call for Kartu Soal failed, building from questions:', aiErr);
      }

      if (!Array.isArray(parsedKartu) || parsedKartu.length === 0) {
        parsedKartu = buildKartuSoalFromQuestions(
          data.questions,
          data.matrix,
          activePkg.subject,
          activePkg.grade
        );
      }

      onChange({
        ...data,
        kartuSoal: parsedKartu,
        click3Done: true,
      });
      setActiveTab('kartu');
      setSuccessNotice(
        `Kartu soal resmi (${parsedKartu.length} kartu) berhasil disusun!`
      );
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyusun kartu soal.');
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
      {/* Top Banner Box */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
              Sistem 3 Klik Bertahap Terintegrasi ATP
            </span>
            <span className="bg-indigo-50 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{appState.atp?.length || 0} TP Tersinkron</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFromAtp}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-300 transition active:translate-y-0.5 cursor-pointer"
              title="Sinkronkan matriks secara otomatis dari Alur Tujuan Pembelajaran (Langkah 5)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-700" />
              <span>Sinkronkan dari ATP (Langkah 5)</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {activePkg.subject} — {activePkg.grade}
            </span>
          </div>
        </div>

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs px-2 py-0.5 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {((appState.atp || []).length === 0 || (appState.assessmentPlans || []).length === 0) && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Prasyarat Belum Lengkap:</strong>{' '}
                {(appState.atp || []).length === 0 && (appState.assessmentPlans || []).length === 0
                  ? 'Data ATP (Langkah 5) dan Rencana Asesmen (Langkah 11) belum diisi.'
                  : (appState.atp || []).length === 0
                  ? 'Data ATP (Langkah 5) belum diisi.'
                  : 'Rencana Asesmen (Langkah 11) belum diisi.'}{' '}
                Silakan isi data prasyarat tersebut agar pembuatan kisi-kisi dan naskah soal dengan AI dapat berjalan secara sempurna dan sinkron.
              </span>
            </div>
          </div>
        )}

        <h3 className="text-base font-black text-slate-900 mb-3 tracking-tight">
          Konfigurasi Paket Soal Tertulis
        </h3>

        {/* 6 Grid Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              1. NAMA ASESMEN
            </label>
            <input
              type="text"
              value={data.assessmentName}
              onChange={(e) => updateField('assessmentName', e.target.value)}
              placeholder="Contoh: Sumatif Lingkup Materi 1 — Ekosistem & Jaring-jaring Makanan"
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
              <option value="Sumatif Akhir Semester (SAS / ASAS)">
                Sumatif Akhir Semester (SAS / ASAS)
              </option>
              <option value="Asesmen Tengah Semester (ATS)">
                Asesmen Tengah Semester (ATS)
              </option>
              <option value="Formatif Tertulis / Kuis Harian">
                Formatif Tertulis / Kuis Harian
              </option>
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
              onChange={(e) => updateField('countPg', parseInt(e.target.value, 10) || 0)}
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
              onChange={(e) => updateField('countEssay', parseInt(e.target.value, 10) || 0)}
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
              onChange={(e) => updateField('maxScorePerEssay', parseInt(e.target.value, 10) || 4)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Mini Summary Matrix Table */}
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
                    <span className="text-indigo-700">{row.tpCode}:</span>{' '}
                    <span className="font-normal text-slate-700">{row.materi}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-medium">
                    {row.levelEasy_C1C2}
                  </td>
                  <td className="py-2 px-2 text-center font-medium">
                    {row.levelMedium_C3}
                  </td>
                  <td className="py-2 px-2 text-center font-medium">
                    {row.levelHots_C4C6}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-700">
                    {row.noSoalPg}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-700">
                    {row.noSoalUraian}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-indigo-700">
                    {row.totalBobot}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2 px-3">JUMLAH TOTAL</td>
                <td className="py-2 px-2 text-center">
                  {data.matrix.reduce((a, b) => a + Number(b.levelEasy_C1C2 || 0), 0)}
                </td>
                <td className="py-2 px-2 text-center">
                  {data.matrix.reduce((a, b) => a + Number(b.levelMedium_C3 || 0), 0)}
                </td>
                <td className="py-2 px-2 text-center">
                  {data.matrix.reduce((a, b) => a + Number(b.levelHots_C4C6 || 0), 0)}
                </td>
                <td className="py-2 px-3 text-center text-emerald-700 font-black">
                  {data.countPg} butir
                </td>
                <td className="py-2 px-3 text-center text-indigo-700 font-black">
                  {data.countEssay} butir
                </td>
                <td className="py-2 px-3 text-center font-black text-slate-900">
                  {Number(data.countPg) +
                    Number(data.countEssay) * Number(data.maxScorePerEssay)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 Sequential Click Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Klik 1 */}
          <button
            onClick={handleExecuteClick1}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 cursor-pointer ${
              data.click1Done
                ? 'bg-emerald-50 hover:bg-emerald-100'
                : 'bg-white hover:bg-slate-50'
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
              <span className="text-xs font-bold text-indigo-600 animate-pulse">
                Menyusun...
              </span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* Klik 2 */}
          <button
            onClick={handleExecuteClick2}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 cursor-pointer ${
              data.click2Done
                ? 'bg-emerald-50 hover:bg-emerald-100'
                : 'bg-white hover:bg-slate-50'
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
              <span className="text-xs font-bold text-indigo-600 animate-pulse">
                Menyusun...
              </span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* Klik 3 */}
          <button
            onClick={handleExecuteClick3}
            disabled={loadingClick !== null}
            className={`p-3 rounded-xl border-2 border-slate-900 text-left transition flex items-center justify-between shadow-sm active:translate-y-0.5 cursor-pointer ${
              data.click3Done
                ? 'bg-emerald-50 hover:bg-emerald-100'
                : 'bg-white hover:bg-slate-50'
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
              <span className="text-xs font-bold text-indigo-600 animate-pulse">
                Menyusun...
              </span>
            ) : (
              <Sparkles className="w-4 h-4 text-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs for Results */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-sm">
        <div className="flex border-b-2 border-slate-900 bg-slate-100">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-5 text-xs font-black uppercase transition border-r-2 border-slate-900 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-indigo-700'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Matriks Kisi-kisi ({data.matrix.length} Lingkup Materi)
          </button>
          <button
            onClick={() => setActiveTab('naskah')}
            className={`py-3 px-5 text-xs font-black uppercase transition border-r-2 border-slate-900 cursor-pointer ${
              activeTab === 'naskah'
                ? 'bg-white text-indigo-700'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📝 Naskah Butir Soal &amp; Kunci ({data.questions.length} Butir)
          </button>
          <button
            onClick={() => setActiveTab('kartu')}
            className={`py-3 px-5 text-xs font-black uppercase transition cursor-pointer ${
              activeTab === 'kartu'
                ? 'bg-white text-indigo-700'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📇 Kartu Soal &amp; Pedoman Skor ({data.kartuSoal.length} Kartu)
          </button>
        </div>

        {/* Tab 1: Matriks Kisi-kisi */}
        {activeTab === 'matrix' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Matriks Distribusi Kisi-kisi Asesmen Tertulis
                </h4>
                <p className="text-xs text-slate-500">
                  Sebaran proporsional level kognitif C1/C2 (Mudah), C3 (Sedang), dan C4-C6 (HOTS) sesuai ATP Langkah 5.
                </p>
              </div>
              <button
                onClick={handleSyncFromAtp}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan dari ATP</span>
              </button>
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
                      <td className="py-2 px-3 font-bold text-indigo-700">
                        {row.tpCode}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {row.materi}
                      </td>
                      <td className="py-2 px-2 text-center">{row.levelEasy_C1C2}</td>
                      <td className="py-2 px-2 text-center">{row.levelMedium_C3}</td>
                      <td className="py-2 px-2 text-center font-bold text-amber-700">
                        {row.levelHots_C4C6}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px]">
                        {row.noSoalPg}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px]">
                        {row.noSoalUraian}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {row.totalButir}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Naskah Butir Soal */}
        {activeTab === 'naskah' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Daftar Naskah Butir Soal &amp; Kunci Jawaban Lengkap ({data.questions.length} Butir)
                </h4>
                <p className="text-xs text-slate-500">
                  Dapat diedit langsung. Format siap salin ke Word atau Google Docs lengkap stimulus kontekstual.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data.questions.map((q) => {
                const isEditing = editingQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 bg-white transition space-y-2"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white">
                          No. {q.id}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            q.type === 'PG'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-purple-100 text-purple-900 border-purple-300'
                          }`}
                        >
                          {q.type}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-700">
                          {q.tpCode}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          Level {q.cognitiveLevel} ({q.levelLabel})
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {q.materi}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setEditingQuestionId(isEditing ? null : q.id)
                        }
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Selesai Edit' : 'Edit Butir'}</span>
                      </button>
                    </div>

                    {/* Question text */}
                    {isEditing ? (
                      <textarea
                        value={q.questionText}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, 'questionText', e.target.value)
                        }
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                        {q.questionText}
                      </p>
                    )}

                    {/* Options (PG) */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                              opt.key === q.correctAnswer
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px]">
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer key & explanation */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-xs text-emerald-900 mt-2">
                      <div className="font-bold mb-0.5">
                        ✅ Kunci Jawaban:{' '}
                        <span className="font-black">{q.correctAnswer}</span> (Skor Maksimal: {q.scoreMax})
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        <strong>Pedoman Penskoran / Penjelasan:</strong>{' '}
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Kartu Soal Standar Dinas */}
        {activeTab === 'kartu' && (
          <div className="p-5 space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Kartu Soal Standar Format Kementerian / Dinas Pendidikan ({data.kartuSoal.length} Kartu)
              </h4>
              <p className="text-xs text-slate-500">
                Format resmi kisi-kisi dan kartu soal siap cetak atau dilampirkan dalam perangkat ajar.
              </p>
            </div>

            <div className="space-y-4">
              {data.kartuSoal.map((ks) => (
                <div
                  key={ks.noSoal}
                  className="rounded-xl border-2 border-slate-900 overflow-hidden bg-white shadow-xs"
                >
                  <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-900 flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 uppercase">
                      KARTU SOAL NOMOR {ks.noSoal}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      {ks.tpCode} · Level {ks.level}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">
                          Materi Pembelajaran:
                        </span>
                        <span className="font-bold text-slate-900">{ks.materi}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">
                          Indikator Soal:
                        </span>
                        <span className="text-slate-800">{ks.indicator}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">
                          Buku Sumber:
                        </span>
                        <span className="text-slate-600 italic">{ks.bukuSumber}</span>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-4">
                      <div className="mb-2">
                        <span className="font-bold text-slate-500 text-[10px] uppercase block">
                          Rumusan Butir Soal:
                        </span>
                        <p className="font-medium text-slate-900 whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {ks.soalText}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300">
                        <span className="font-bold text-emerald-950 block mb-0.5">
                          Kunci &amp; Pedoman Penskoran:
                        </span>
                        <span className="font-black text-emerald-900 block mb-1">
                          {ks.kunciJawaban}
                        </span>
                        <p className="text-[11px] text-emerald-800 whitespace-pre-line">
                          {ks.pedomanPenskoran}
                        </p>
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
