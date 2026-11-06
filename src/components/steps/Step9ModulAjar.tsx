import React, { useRef, useState } from 'react';
import { DeepLearningModule, AppState } from '../../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { parseAiJson, requestAiGeneration } from '../../services/aiService';

interface Step9Props {
  module: DeepLearningModule;
  onChange: (updated: DeepLearningModule) => void;
  appState: AppState;
}

type ModuleStep = 1 | 2 | 3 | 4 | 5;
type StepData = DeepLearningModule['step1'] | DeepLearningModule['step2'] | DeepLearningModule['step3'] | DeepLearningModule['step4'] | DeepLearningModule['step5'];

const stepInstructions: Record<ModuleStep, string> = {
  1: 'Identifikasi peserta didik: karakteristik dan kebutuhan belajar, pengetahuan awal dan minat, jenis pengetahuan faktual-konseptual-prosedural, relevansi kehidupan nyata, kesulitan/struktur materi, dimensi profil lulusan dan konteks penerapannya.',
  2: 'Desain pembelajaran: capaian pembelajaran dan TP, keterkaitan lintas disiplin 3–4 mata pelajaran, tujuan tiga pertemuan yang terukur, praktik PBL/PjBL, pertanyaan pemandu, kemitraan dan lingkungan belajar.',
  3: 'Pengalaman belajar secara rinci dan berurutan: kegiatan awal mindful, inti memahami yang bermakna, inti menerapkan yang joyful melalui investigasi/proyek kolaboratif, refleksi, dan penutup menggunakan 3-2-1.',
  4: 'Asesmen lengkap: diagnostik kognitif dan non-kognitif, asesmen proses as/for learning dengan kriteria dan umpan balik, serta asesmen sumatif dengan jenis dan deskripsi instrumen yang selaras dengan TP.',
  5: 'KKTP dan tindak lanjut: kriteria ketuntasan dan interval, remedial serta pengayaan, refleksi guru dan murid, minimal tiga pertanyaan diagnostik beserta kunci, checklist proses, serta minimal tiga soal akhir beserta rubrik dan skor maksimum.',
};

const requiredStrings: Record<ModuleStep, string[]> = {
  1: ['studentCharacteristics', 'initialKnowledge', 'learningNeedsAndInterests', 'subjectKnowledgeType', 'realWorldRelevance', 'difficultyAndStructure', 'dimensionsContext'],
  2: ['cpStatement', 'crossDisciplinary', 'pedagogicalPractices', 'guidingQuestions', 'partnershipsAndEnvironment'],
  3: ['mindfulBeginning', 'meaningfulCoreUnderstand', 'joyfulCoreApply', 'reflectiveCoreReflect', 'closingSummary'],
  4: ['initialDiagnostic', 'processAssessment', 'finalAssessmentDesc'],
  5: ['kktpCriteria', 'remedialAndEnrichment', 'reflectionStudentTeacher', 'processChecklist'],
};

const emptyString = (value: unknown): value is string => typeof value !== 'string' || value.trim().length === 0;

function normalizeGeneratedStep(stepNum: ModuleStep, raw: unknown): StepData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Jawaban AI bukan objek JSON yang valid. Silakan coba klik kembali.');
  }
  const data = raw as Record<string, any>;
  const missing = requiredStrings[stepNum].filter((key) => emptyString(data[key]));
  if (missing.length) {
    throw new Error(`Jawaban AI belum lengkap (field: ${missing.join(', ')}). Klik kembali untuk mencoba lagi.`);
  }

  if (stepNum === 1) {
    if (!Array.isArray(data.selectedDimensions) || data.selectedDimensions.length === 0 || data.selectedDimensions.some((value: unknown) => typeof value !== 'string' || !value.trim())) {
      throw new Error('AI belum mengisi dimensi profil lulusan dengan benar. Silakan coba klik kembali.');
    }
    return Object.fromEntries([...requiredStrings[1], 'selectedDimensions'].map((key) => [key, data[key]])) as DeepLearningModule['step1'];
  }
  if (stepNum === 2) {
    const objectives = data.meetingObjectives;
    if (!objectives || [1, 2, 3].some((meeting) => emptyString(objectives[`meeting${meeting}`]))) {
      throw new Error('AI belum mengisi tujuan untuk tiga pertemuan. Silakan coba klik kembali.');
    }
    return {
      ...Object.fromEntries(requiredStrings[2].map((key) => [key, data[key]])),
      meetingObjectives: { meeting1: objectives.meeting1.trim(), meeting2: objectives.meeting2.trim(), meeting3: objectives.meeting3.trim() },
    } as DeepLearningModule['step2'];
  }
  if (stepNum === 3) {
    return Object.fromEntries(requiredStrings[3].map((key) => [key, data[key]])) as DeepLearningModule['step3'];
  }
  if (stepNum === 4) {
    if (!Array.isArray(data.finalAssessmentTypes) || !data.finalAssessmentTypes.length || data.finalAssessmentTypes.some((value: unknown) => typeof value !== 'string' || !value.trim())) {
      throw new Error('AI belum mengisi jenis asesmen sumatif. Silakan coba klik kembali.');
    }
    return Object.fromEntries([...requiredStrings[4], 'finalAssessmentTypes'].map((key) => [key, data[key]])) as DeepLearningModule['step4'];
  }

  if (!Array.isArray(data.diagnosticQuestions) || data.diagnosticQuestions.length < 3 || data.diagnosticQuestions.some((item: any) => emptyString(item?.question) || emptyString(item?.answerKey))) {
    throw new Error('Lampiran diagnostik AI belum lengkap. Silakan coba klik kembali.');
  }
  if (!Array.isArray(data.finalQuestions) || data.finalQuestions.length < 3 || data.finalQuestions.some((item: any) => emptyString(item?.question) || emptyString(item?.rubric) || !Number.isFinite(Number(item?.scoreMax)) || Number(item.scoreMax) <= 0)) {
    throw new Error('Soal akhir atau rubrik AI belum lengkap. Silakan coba klik kembali.');
  }
  return {
    ...Object.fromEntries(requiredStrings[5].map((key) => [key, data[key]])),
    diagnosticQuestions: data.diagnosticQuestions.map((item: any) => ({ question: item.question.trim(), answerKey: item.answerKey.trim() })),
    finalQuestions: data.finalQuestions.map((item: any) => ({ question: item.question.trim(), rubric: item.rubric.trim(), scoreMax: Number(item.scoreMax) })),
  } as DeepLearningModule['step5'];
}

function makeOutputShape(stepNum: ModuleStep) {
  const examples: Record<ModuleStep, object> = {
    1: { studentCharacteristics: 'string detail', initialKnowledge: 'string detail', learningNeedsAndInterests: 'string detail', subjectKnowledgeType: 'string detail', realWorldRelevance: 'string detail', difficultyAndStructure: 'string detail', selectedDimensions: ['string'], dimensionsContext: 'string detail' },
    2: { cpStatement: 'string', crossDisciplinary: 'string detail', meetingObjectives: { meeting1: 'string terukur', meeting2: 'string terukur', meeting3: 'string terukur' }, pedagogicalPractices: 'string detail', guidingQuestions: 'string detail', partnershipsAndEnvironment: 'string detail' },
    3: { mindfulBeginning: 'string berurutan', meaningfulCoreUnderstand: 'string berurutan', joyfulCoreApply: 'string berurutan', reflectiveCoreReflect: 'string', closingSummary: 'string dengan 3-2-1' },
    4: { initialDiagnostic: 'string berisi prosedur dan tindak lanjut', processAssessment: 'string berisi teknik, kriteria, dan umpan balik', finalAssessmentTypes: ['string'], finalAssessmentDesc: 'string berisi instrumen dan kriteria' },
    5: { kktpCriteria: 'string dengan kriteria/interval', remedialAndEnrichment: 'string dengan langkah keduanya', reflectionStudentTeacher: 'string berisi panduan refleksi guru dan murid', processChecklist: 'string checklist observasi', diagnosticQuestions: [{ question: 'string', answerKey: 'string' }, { question: 'string', answerKey: 'string' }, { question: 'string', answerKey: 'string' }], finalQuestions: [{ question: 'string', rubric: 'string', scoreMax: 4 }, { question: 'string', rubric: 'string', scoreMax: 4 }, { question: 'string', rubric: 'string', scoreMax: 4 }] },
  };
  return JSON.stringify(examples[stepNum], null, 2);
}

function mergeGeneratedWithoutLosingConcurrentEdits(stepNum: ModuleStep, before: StepData, latest: StepData, generated: StepData): StepData {
  const merged: any = { ...generated };
  for (const key of Object.keys(generated) as Array<keyof StepData>) {
    const beforeValue = (before as any)[key];
    const latestValue = (latest as any)[key];
    if (JSON.stringify(beforeValue) !== JSON.stringify(latestValue)) merged[key] = latestValue;
  }
  if (stepNum === 2) {
    const beforeMeetings = (before as DeepLearningModule['step2']).meetingObjectives;
    const latestMeetings = (latest as DeepLearningModule['step2']).meetingObjectives;
    const generatedMeetings = (generated as DeepLearningModule['step2']).meetingObjectives;
    merged.meetingObjectives = { ...generatedMeetings };
    (['meeting1', 'meeting2', 'meeting3'] as const).forEach((key) => {
      if (beforeMeetings?.[key] !== latestMeetings?.[key]) merged.meetingObjectives[key] = latestMeetings?.[key] || '';
    });
  }
  return merged as StepData;
}

export const Step9ModulAjar: React.FC<Step9Props> = ({ module, onChange, appState }) => {
  const [activeTab, setActiveTab] = useState<ModuleStep>(1);
  const [loadingClick, setLoadingClick] = useState<ModuleStep | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const moduleRef = useRef(module);
  moduleRef.current = module;

  const activePkg = appState.packages.find((pkg) => pkg.id === appState.activePackageId) || appState.packages[0];
  const activeAtp = appState.atp?.find((item) => item.id === module.tpId || item.code === module.tpCode);
  const fieldClass = 'w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed';

  const commitModule = (updated: DeepLearningModule) => {
    moduleRef.current = updated;
    onChange(updated);
  };

  const updateStepField = (stepNum: ModuleStep, field: string, value: any) => {
    const latest = moduleRef.current;
    const stepKey = `step${stepNum}` as keyof DeepLearningModule;
    const currentStep = (latest[stepKey] as any) || {};
    commitModule({ ...latest, [stepKey]: { ...currentStep, [field]: value } });
  };

  const handleRunClick = async (stepNum: ModuleStep) => {
    if (loadingClick !== null) return;
    setErrorMsg(null);
    setActiveTab(stepNum);
    setLoadingClick(stepNum);
    const startingModule = moduleRef.current;
    const stepKey = `step${stepNum}` as keyof DeepLearningModule;
    const startingStep = ((startingModule[stepKey] as any) || {}) as StepData;
    try {
      const subject = activePkg?.subject || 'Mata pelajaran';
      const grade = activePkg?.grade || activePkg?.level || 'kelas sesuai paket ajar';
      const learningObjective = activeAtp?.learningObjective || module.tpText || module.topicTitle;
      const dimensions = activeAtp?.graduateDimensions || startingModule.step1?.selectedDimensions || [];
      const cpText = [appState.cp?.generalDescription, ...(appState.cp?.elements || []).map((element) => `${element.name}: ${element.cpText}`)].filter(Boolean).join('\n');
      const context = {
        subject,
        grade,
        materi: module.topicTitle,
        tpCode: module.tpCode,
        tpText: learningObjective,
        lingkupMateri: activeAtp?.scopeContent || module.topicTitle,
        capaianPembelajaran: cpText,
        fase: activePkg?.phase || appState.cp?.phase || '',
        alokasiJp: module.allocatedJp,
        jumlahPertemuan: module.totalMeetings || 3,
        dimensiProfilLulusan: dimensions,
        stepNum,
      };
      const prompt = `Anda adalah ahli perancang Modul Ajar Pembelajaran Mendalam (RPM) Kurikulum Merdeka di Indonesia. Susun hanya Bagian ${stepNum} dari 5 untuk topik "${module.topicTitle}" (${module.tpCode}) pada mata pelajaran ${subject}, ${grade}.\n\nKONTEKS PEMBELAJARAN:\n- Fase: ${context.fase || '-'}\n- Lingkup materi TP: ${context.lingkupMateri}\n- Tujuan Pembelajaran resmi: ${learningObjective}\n- Capaian Pembelajaran: ${cpText || 'Gunakan tujuan TP sebagai acuan.'}\n- Alokasi: ${module.allocatedJp || '-'} JP, ${module.totalMeetings || 3} pertemuan.\n- Dimensi profil lulusan yang relevan: ${dimensions.join(', ') || 'Pilih yang relevan dari 8 dimensi.'}\n\nINSTRUKSI BAGIAN ${stepNum}: ${stepInstructions[stepNum]}\n\nBuat hasil berbahasa Indonesia yang konkret, rinci, selaras dengan TP dan fase, dapat langsung digunakan guru, serta sesuai prinsip mindful, meaningful, joyful. Untuk materi ekosistem, gunakan contoh produsen, konsumen, pengurai, rantai/jaring-jaring makanan dan keseimbangan ekosistem hanya jika sesuai dengan TP. Jangan mengarang identitas sekolah atau data pribadi murid. Semua field wajib diisi dengan uraian yang substantif (bukan placeholder atau satu kalimat generik). Untuk bagian 2 isi tujuan pertemuan 1-3. Untuk bagian 5 berikan minimal 3 pertanyaan diagnostik dan 3 soal sumatif lengkap dengan jawaban/rubrik serta skor.\n\nKembalikan hanya JSON valid, tanpa markdown atau teks di luar JSON, dengan struktur persis berikut. Jangan mengganti nama key:\n${makeOutputShape(stepNum)}`;
      const response = await requestAiGeneration({
        type: `modul_step${stepNum}`,
        prompt,
        context,
        isJsonMode: true,
        systemInstruction: 'Anda menyusun perangkat ajar yang akurat, lengkap, sesuai konteks dan berorientasi pada tujuan pembelajaran. Kembalikan hanya JSON valid sesuai struktur yang diminta; jangan menghilangkan field atau memotong jawaban.',
      });
      const parsed = parseAiJson<any>(response, null);
      const generated = normalizeGeneratedStep(stepNum, parsed?.[`step${stepNum}`] || parsed);
      const latestModule = moduleRef.current;
      const latestStep = ((latestModule[stepKey] as any) || {}) as StepData;
      const mergedStep = mergeGeneratedWithoutLosingConcurrentEdits(stepNum, startingStep, latestStep, generated);
      commitModule({
        ...latestModule,
        [stepKey]: mergedStep,
        clicksCompleted: { ...latestModule.clicksCompleted, [stepNum]: true },
      });
    } catch (error: any) {
      setErrorMsg(error?.message || 'Gagal menyusun bagian modul dengan AI. Silakan coba lagi.');
    } finally {
      setLoadingClick(null);
    }
  };

  const clickButtons: { num: ModuleStep; title: string; sub: string }[] = [
    { num: 1, title: 'Klik 1: Identifikasi', sub: 'Murid & 8 Dimensi' },
    { num: 2, title: 'Klik 2: Desain', sub: 'CP, TP & Praktik PBL' },
    { num: 3, title: 'Klik 3: Pengalaman', sub: 'Awal-Inti-Penutup 321' },
    { num: 4, title: 'Klik 4: Asesmen', sub: 'Diagnostik & Formatif' },
    { num: 5, title: 'Klik 5: KKTP', sub: 'Rubrik & Lampiran Soal' },
  ];

  const renderTextField = (stepNum: ModuleStep, field: string, label: string, rows = 3) => (
    <div key={field}>
      <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">{label}</label>
      <textarea value={(module[`step${stepNum}` as keyof DeepLearningModule] as any)?.[field] || ''} onChange={(event) => updateStepField(stepNum, field, event.target.value)} rows={rows} className={fieldClass} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-base">⚠️</span><span>{errorMsg}</span></div>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-xs px-2 py-0.5 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold">Tutup</button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border border-indigo-700">Sistem 5 Klik Bertahap</span>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">⚡ Tidak Ada yang Terpotong</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Materi TP: <strong>{module.tpCode}</strong> — {module.topicTitle}</span>
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1">Modul Ajar Pembelajaran Mendalam (Deep Learning / RPM)</h3>
        <p className="text-xs text-slate-600 mb-4">Berkesadaran (Mindful), Bermakna (Meaningful), Menggembirakan (Joyful). Lima klik bertahap menjamin setiap kotak terisi super detail dan bebas diedit per kotak!</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
          {clickButtons.map((button) => {
            const isDone = module.clicksCompleted?.[button.num];
            const isCurrent = activeTab === button.num;
            return (
              <button key={button.num} type="button" disabled={loadingClick !== null} onClick={() => { setActiveTab(button.num); if (!isDone) void handleRunClick(button.num); }} className={`p-2.5 rounded-xl border-2 text-left transition shadow-xs flex flex-col justify-between disabled:opacity-70 ${isCurrent ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20' : isDone ? 'border-slate-900 bg-emerald-50/70 hover:bg-emerald-100' : 'border-slate-900 bg-white hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-1 mb-1"><span className="font-bold text-xs text-slate-900">{button.title}</span>{isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}</div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between"><span>{button.sub}</span>{loadingClick === button.num && <span className="text-indigo-600 font-bold animate-pulse">Menulis...</span>}</div>
              </button>
            );
          })}
        </div>

        <div className="flex border-b-2 border-slate-900 overflow-x-auto bg-slate-100 rounded-t-xl">
          {clickButtons.map(({ num }) => (
            <button key={num} type="button" onClick={() => setActiveTab(num)} className={`py-2.5 px-4 text-xs font-black uppercase whitespace-nowrap transition border-r border-slate-300 ${activeTab === num ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>
              Bagian {num}: {num === 1 ? 'Identifikasi' : num === 2 ? 'Desain Pembelajaran' : num === 3 ? 'Pengalaman Belajar' : num === 4 ? 'Asesmen' : 'KKTP & Lampiran'}
            </button>
          ))}
        </div>

        <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian {activeTab}: {clickButtons[activeTab - 1].title.replace(`Klik ${activeTab}: `, '')}</h4>
            <button type="button" disabled={loadingClick !== null} onClick={() => void handleRunClick(activeTab)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"><Sparkles className="h-3.5 w-3.5" />{loadingClick === activeTab ? 'AI sedang menyusun...' : module.clicksCompleted?.[activeTab] ? 'Buat ulang dengan AI' : 'Isi bagian ini dengan AI'}</button>
          </div>

          {activeTab === 1 && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderTextField(1, 'studentCharacteristics', 'Karakteristik & Kebutuhan Belajar Peserta Didik')}
              {renderTextField(1, 'initialKnowledge', 'Pengetahuan Awal & Minat Belajar')}
              {renderTextField(1, 'learningNeedsAndInterests', 'Kebutuhan dan Minat Belajar')}
              {renderTextField(1, 'subjectKnowledgeType', 'Jenis Pengetahuan Materi (Faktual, Konseptual, Prosedural)', 2)}
              {renderTextField(1, 'realWorldRelevance', 'Relevansi dengan Kehidupan Nyata Murid', 2)}
              {renderTextField(1, 'difficultyAndStructure', 'Tingkat Kesulitan dan Struktur Materi', 2)}
            </div>
            <div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Dimensi Profil Lulusan Terpilih (pisahkan dengan koma)</label><textarea value={module.step1.selectedDimensions?.join(', ') || ''} onChange={(event) => updateStepField(1, 'selectedDimensions', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} rows={2} className={fieldClass} /></div>
            {renderTextField(1, 'dimensionsContext', 'Penjabaran Kontekstual Dimensi Profil Lulusan', 2)}
          </>}

          {activeTab === 2 && <>
            {renderTextField(2, 'cpStatement', 'Capaian Pembelajaran')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderTextField(2, 'crossDisciplinary', 'Keterkaitan Lintas Disiplin (3–4 Mapel Lain)', 4)}
              {renderTextField(2, 'pedagogicalPractices', 'Praktik Pedagogis (PBL/PjBL) & Strategi Pembelajaran', 4)}
            </div>
            <div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Tujuan Tiap Pertemuan</label><div className="space-y-2">{([1, 2, 3] as const).map((meeting) => <input key={meeting} value={module.step2.meetingObjectives?.[`meeting${meeting}`] || ''} onChange={(event) => updateStepField(2, 'meetingObjectives', { ...moduleRef.current.step2.meetingObjectives, [`meeting${meeting}`]: event.target.value })} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder={`Pertemuan ${meeting}...`} />)}</div></div>
            {renderTextField(2, 'guidingQuestions', 'Pertanyaan Pemandu', 2)}
            {renderTextField(2, 'partnershipsAndEnvironment', 'Kemitraan dan Lingkungan Belajar', 2)}
          </>}

          {activeTab === 3 && <>
            {renderTextField(3, 'mindfulBeginning', 'TAHAP AWAL · Berkesadaran (Mindful): Orientasi & Pertanyaan Pemantik', 3)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{renderTextField(3, 'meaningfulCoreUnderstand', 'INTI · Memahami: Diskusi Konsep & Kasus Otentik', 4)}{renderTextField(3, 'joyfulCoreApply', 'INTI · Mengaplikasikan (Joyful): Praktik/Proyek Kelompok & Umpan Balik', 4)}</div>
            {renderTextField(3, 'reflectiveCoreReflect', 'INTI · Merefleksikan: Refleksi Pribadi & Kelompok', 3)}
            {renderTextField(3, 'closingSummary', 'TAHAP PENUTUP · Refleksi 3-2-1 & Jembatan Pertemuan Berikutnya', 3)}
          </>}

          {activeTab === 4 && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{renderTextField(4, 'initialDiagnostic', 'Asesmen Awal (Diagnostik Kognitif & Non-Kognitif)', 4)}{renderTextField(4, 'processAssessment', 'Asesmen Proses (Assessment as & for Learning)', 4)}</div>
            <div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Jenis Asesmen Akhir (pisahkan dengan koma)</label><input value={module.step4.finalAssessmentTypes?.join(', ') || ''} onChange={(event) => updateStepField(4, 'finalAssessmentTypes', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} className="w-full text-xs p-2 rounded-lg border border-slate-300" /></div>
            {renderTextField(4, 'finalAssessmentDesc', 'Asesmen Akhir (Sumatif): Bentuk & Deskripsi Instrumen', 3)}
          </>}

          {activeTab === 5 && <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{renderTextField(5, 'kktpCriteria', 'Kriteria Ketuntasan & Interval Sumatif', 4)}{renderTextField(5, 'remedialAndEnrichment', 'Program Remedial & Pengayaan', 4)}</div>
            {renderTextField(5, 'reflectionStudentTeacher', 'Refleksi Guru dan Refleksi Murid', 3)}
            {renderTextField(5, 'processChecklist', 'Checklist Asesmen Proses', 3)}
            <div className="space-y-2"><h5 className="text-[11px] font-bold text-slate-700 uppercase">Lampiran Pertanyaan Diagnostik & Kunci Jawaban</h5>{(module.step5.diagnosticQuestions || []).map((item, index) => <div key={`diagnostic-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2"><input value={item.question} onChange={(event) => { const rows = [...moduleRef.current.step5.diagnosticQuestions]; rows[index] = { ...rows[index], question: event.target.value }; updateStepField(5, 'diagnosticQuestions', rows); }} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder={`Pertanyaan ${index + 1}`} /><input value={item.answerKey} onChange={(event) => { const rows = [...moduleRef.current.step5.diagnosticQuestions]; rows[index] = { ...rows[index], answerKey: event.target.value }; updateStepField(5, 'diagnosticQuestions', rows); }} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder="Kunci jawaban" /></div>)}</div>
            <div className="space-y-2"><h5 className="text-[11px] font-bold text-slate-700 uppercase">Soal Akhir, Rubrik & Skor</h5>{(module.step5.finalQuestions || []).map((item, index) => <div key={`final-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2"><textarea value={item.question} onChange={(event) => { const rows = [...moduleRef.current.step5.finalQuestions]; rows[index] = { ...rows[index], question: event.target.value }; updateStepField(5, 'finalQuestions', rows); }} rows={2} className={fieldClass} placeholder={`Soal ${index + 1}`} /><textarea value={item.rubric} onChange={(event) => { const rows = [...moduleRef.current.step5.finalQuestions]; rows[index] = { ...rows[index], rubric: event.target.value }; updateStepField(5, 'finalQuestions', rows); }} rows={2} className={fieldClass} placeholder="Rubrik penilaian" /><input type="number" min={1} value={item.scoreMax} onChange={(event) => { const rows = [...moduleRef.current.step5.finalQuestions]; rows[index] = { ...rows[index], scoreMax: Number(event.target.value) }; updateStepField(5, 'finalQuestions', rows); }} className="w-full text-xs p-2 rounded-lg border border-slate-300" aria-label={`Skor maksimal soal ${index + 1}`} /></div>)}</div>
          </>}
        </div>
      </div>
    </div>
  );
};
