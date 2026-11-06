import React, { useState } from 'react';
import { DeepLearningModule, AppState } from '../../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { parseAiJson, requestAiGeneration } from '../../services/aiService';

interface Step9Props {
  module: DeepLearningModule;
  onChange: (updated: DeepLearningModule) => void;
  appState: AppState;
}

type ModuleStep = 1 | 2 | 3 | 4 | 5;
type GeneratedStep = DeepLearningModule['step1'] | DeepLearningModule['step2'] | DeepLearningModule['step3'] | DeepLearningModule['step4'] | DeepLearningModule['step5'];

const stepInstructions: Record<ModuleStep, string> = {
  1: 'Identifikasi peserta didik: karakteristik dan kebutuhan belajar, pengetahuan awal, minat, jenis pengetahuan faktual-konseptual-prosedural, relevansi kehidupan nyata, kesulitan/struktur materi, delapan dimensi profil lulusan dan konteks penerapannya.',
  2: 'Desain pembelajaran: rumusan CP yang diberikan, keterkaitan lintas disiplin 3-4 mata pelajaran, tujuan tiga pertemuan yang terukur, praktik PBL/PjBL, pertanyaan pemandu, kemitraan dan lingkungan belajar.',
  3: 'Pengalaman belajar secara rinci dan berurutan: kegiatan awal mindful, inti memahami yang bermakna, inti menerapkan yang joyful melalui investigasi/proyek kolaboratif, refleksi, dan penutup menggunakan 3-2-1.',
  4: 'Asesmen lengkap: diagnostik kognitif dan non-kognitif, asesmen proses as/for learning dengan umpan balik, serta asesmen sumatif dengan jenis dan deskripsi instrumen yang selaras dengan TP.',
  5: 'KKTP dan tindak lanjut: kriteria ketuntasan dan interval, remedial serta pengayaan, refleksi guru dan murid, minimal tiga pertanyaan diagnostik beserta kunci, checklist proses, serta minimal tiga soal akhir beserta rubrik dan skor maksimum.',
};

const requiredStrings: Record<ModuleStep, string[]> = {
  1: ['studentCharacteristics', 'initialKnowledge', 'learningNeedsAndInterests', 'subjectKnowledgeType', 'realWorldRelevance', 'difficultyAndStructure', 'dimensionsContext'],
  2: ['cpStatement', 'crossDisciplinary', 'pedagogicalPractices', 'guidingQuestions', 'partnershipsAndEnvironment'],
  3: ['mindfulBeginning', 'meaningfulCoreUnderstand', 'joyfulCoreApply', 'reflectiveCoreReflect', 'closingSummary'],
  4: ['initialDiagnostic', 'processAssessment', 'finalAssessmentDesc'],
  5: ['kktpCriteria', 'remedialAndEnrichment', 'reflectionStudentTeacher', 'processChecklist'],
};

function normalizeGeneratedStep(stepNum: ModuleStep, raw: unknown): GeneratedStep {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Jawaban AI bukan objek JSON yang valid. Silakan coba klik kembali.');
  }
  const data = raw as Record<string, any>;
  const missing = requiredStrings[stepNum].filter((key) => typeof data[key] !== 'string' || !data[key].trim());
  if (missing.length) {
    throw new Error(`Jawaban AI belum lengkap (field: ${missing.join(', ')}). Klik kembali untuk mencoba lagi.`);
  }

  if (stepNum === 1) {
    if (!Array.isArray(data.selectedDimensions) || data.selectedDimensions.length === 0) {
      throw new Error('AI belum mengisi dimensi profil lulusan. Silakan coba klik kembali.');
    }
    return Object.fromEntries([...requiredStrings[1], 'selectedDimensions'].map((key) => [key, data[key]])) as DeepLearningModule['step1'];
  }
  if (stepNum === 2) {
    const objectives = data.meetingObjectives;
    if (!objectives || typeof objectives.meeting1 !== 'string' || !objectives.meeting1.trim() || typeof objectives.meeting2 !== 'string' || !objectives.meeting2.trim() || typeof objectives.meeting3 !== 'string' || !objectives.meeting3.trim()) {
      throw new Error('AI belum mengisi tujuan untuk tiga pertemuan. Silakan coba klik kembali.');
    }
    return { ...Object.fromEntries(requiredStrings[2].map((key) => [key, data[key]])), meetingObjectives: objectives } as DeepLearningModule['step2'];
  }
  if (stepNum === 3) return Object.fromEntries(requiredStrings[3].map((key) => [key, data[key]])) as DeepLearningModule['step3'];
  if (stepNum === 4) {
    if (!Array.isArray(data.finalAssessmentTypes) || !data.finalAssessmentTypes.length) {
      throw new Error('AI belum mengisi jenis asesmen sumatif. Silakan coba klik kembali.');
    }
    return Object.fromEntries([...requiredStrings[4], 'finalAssessmentTypes'].map((key) => [key, data[key]])) as DeepLearningModule['step4'];
  }

  if (!Array.isArray(data.diagnosticQuestions) || data.diagnosticQuestions.length < 3 || data.diagnosticQuestions.some((item: any) => !item?.question?.trim() || !item?.answerKey?.trim())) {
    throw new Error('Lampiran diagnostik AI belum lengkap. Silakan coba klik kembali.');
  }
  if (!Array.isArray(data.finalQuestions) || data.finalQuestions.length < 3 || data.finalQuestions.some((item: any) => !item?.question?.trim() || !item?.rubric?.trim() || Number(item.scoreMax) <= 0)) {
    throw new Error('Soal akhir atau rubrik AI belum lengkap. Silakan coba klik kembali.');
  }
  return {
    ...Object.fromEntries(requiredStrings[5].map((key) => [key, data[key]])),
    diagnosticQuestions: data.diagnosticQuestions,
    finalQuestions: data.finalQuestions.map((item: any) => ({ ...item, scoreMax: Number(item.scoreMax) })),
  } as DeepLearningModule['step5'];
}

export const Step9ModulAjar: React.FC<Step9Props> = ({ module, onChange, appState }) => {
  const [activeTab, setActiveTab] = useState<ModuleStep>(1);
  const [loadingClick, setLoadingClick] = useState<ModuleStep | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const activePkg = appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const updateStepField = (stepNum: ModuleStep, field: string, val: any) => {
    const stepKey = `step${stepNum}` as keyof DeepLearningModule;
    const currentStepObj = (module[stepKey] as any) || {};
    onChange({ ...module, [stepKey]: { ...currentStepObj, [field]: val } });
  };

  const handleRunClick = async (stepNum: ModuleStep) => {
    if (loadingClick !== null) return;
    setErrorMsg(null);
    setActiveTab(stepNum);
    setLoadingClick(stepNum);
    try {
      const subject = activePkg?.subject || 'Mata pelajaran';
      const grade = activePkg?.grade || appState.profile?.classGrade || 'kelas sesuai paket ajar';
      const dimensions = appState.atp?.find((item) => item.code === module.tpCode)?.graduateDimensions || [];
      const context = {
        subject,
        grade,
        materi: module.topicTitle,
        tpCode: module.tpCode,
        tpText: module.tpText,
        capaianPembelajaran: appState.cp?.generalDescription || '',
        fase: activePkg?.phase || appState.cp?.phase || '',
        alokasiJp: module.allocatedJp,
        jumlahPertemuan: module.totalMeetings,
        dimensiProfilLulusan: dimensions,
        stepNum,
      };
      const prompt = `Anda adalah ahli perancang modul ajar Pembelajaran Mendalam (RPM) Kurikulum Merdeka di Indonesia. Susun Bagian ${stepNum} dari 5 untuk topik "${module.topicTitle}" (${module.tpCode}) pada mata pelajaran ${subject}, ${grade}.\n\nKONTEKS TP: ${module.tpText || module.topicTitle}\nCAPAIAN PEMBELAJARAN: ${context.capaianPembelajaran || 'Gunakan TP yang tersedia sebagai acuan.'}\nFASE: ${context.fase || '-'}; ALOKASI: ${module.allocatedJp || '-'} JP; JUMLAH PERTEMUAN: ${module.totalMeetings || 3}.\nDIMENSI PROFIL LULUSAN YANG TERKAIT: ${dimensions.join(', ') || 'Pilih yang relevan dari 8 dimensi.'}\n\nTUGAS BAGIAN ${stepNum}: ${stepInstructions[stepNum]}\n\nBuat isi konkret, kontekstual, terukur, dapat langsung digunakan guru, rinci tetapi tetap relevan untuk murid. Gunakan konteks ekosistem, produsen-konsumen-pengurai, hubungan makan-dimakan, dan jaring-jaring makanan bila sesuai. Terapkan prinsip mindful, meaningful, joyful. Jangan mengarang identitas sekolah atau data murid tertentu.\n\nKELUARKAN HANYA JSON VALID tanpa markdown, tanpa teks pembuka/penutup, dengan seluruh key dan tipe berikut (semua key wajib diisi). Jangan menghilangkan properti.\n${JSON.stringify(stepNum === 1 ? { studentCharacteristics: 'string detail', initialKnowledge: 'string detail', learningNeedsAndInterests: 'string detail', subjectKnowledgeType: 'string detail', realWorldRelevance: 'string detail', difficultyAndStructure: 'string detail', selectedDimensions: ['string'], dimensionsContext: 'string detail' } : stepNum === 2 ? { cpStatement: 'string', crossDisciplinary: 'string detail', meetingObjectives: { meeting1: 'string terukur', meeting2: 'string terukur', meeting3: 'string terukur' }, pedagogicalPractices: 'string detail', guidingQuestions: 'string detail', partnershipsAndEnvironment: 'string detail' } : stepNum === 3 ? { mindfulBeginning: 'string berurutan', meaningfulCoreUnderstand: 'string berurutan', joyfulCoreApply: 'string berurutan', reflectiveCoreReflect: 'string', closingSummary: 'string dengan 3-2-1' } : stepNum === 4 ? { initialDiagnostic: 'string berisi prosedur dan tindak lanjut', processAssessment: 'string berisi teknik, kriteria, dan umpan balik', finalAssessmentTypes: ['string'], finalAssessmentDesc: 'string berisi instrumen dan kriteria' } : { kktpCriteria: 'string dengan kriteria/interval', remedialAndEnrichment: 'string dengan langkah keduanya', reflectionStudentTeacher: 'string berisi panduan refleksi guru dan murid', processChecklist: 'string checklist observasi', diagnosticQuestions: [{ question: 'string', answerKey: 'string' }, { question: 'string', answerKey: 'string' }, { question: 'string', answerKey: 'string' }], finalQuestions: [{ question: 'string', rubric: 'string', scoreMax: 4 }, { question: 'string', rubric: 'string', scoreMax: 4 }, { question: 'string', rubric: 'string', scoreMax: 4 }] }, null, 2)}`;
      const response = await requestAiGeneration({
        type: `modul_step${stepNum}`,
        prompt,
        context,
        isJsonMode: true,
        systemInstruction: 'Kembalikan hanya JSON valid sesuai struktur yang diminta. Isi setiap field secara lengkap dan konsisten dengan konteks TP. Jangan mengembalikan teks markdown.',
      });
      const parsed = parseAiJson<any>(response, null);
      const generatedStep = normalizeGeneratedStep(stepNum, parsed?.[`step${stepNum}`] || parsed);
      const stepKey = `step${stepNum}` as keyof DeepLearningModule;
      const latestStep = (module[stepKey] as any) || {};
      onChange({ ...module, [stepKey]: { ...latestStep, ...generatedStep }, clicksCompleted: { ...module.clicksCompleted, [stepNum]: true } });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyusun bagian modul dengan AI. Silakan coba lagi.');
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
  const fieldClass = 'w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        {errorMsg && <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-base">⚠️</span><span>{errorMsg}</span></div><button onClick={() => setErrorMsg(null)} className="text-xs px-2 py-0.5 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold">Tutup</button></div>}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2"><span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border border-indigo-700">Sistem 5 Klik Bertahap</span><span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">⚡ Tidak Ada yang Terpotong</span></div><span className="text-xs text-slate-500 font-medium">Materi TP: <strong>{module.tpCode}</strong> — {module.topicTitle}</span></div>
        <h3 className="text-base font-black text-slate-900 mb-1">Modul Ajar Pembelajaran Mendalam (Deep Learning / RPM)</h3>
        <p className="text-xs text-slate-600 mb-4">Berkesadaran (Mindful), Bermakna (Meaningful), Menggembirakan (Joyful). Lima klik bertahap menjamin setiap kotak terisi super detail dan bebas diedit per kotak!</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
          {clickButtons.map((btn) => {
            const isDone = module.clicksCompleted?.[btn.num];
            const isCurrent = activeTab === btn.num;
            return <button key={btn.num} type="button" disabled={loadingClick !== null} onClick={() => { setActiveTab(btn.num); if (!isDone) void handleRunClick(btn.num); }} className={`p-2.5 rounded-xl border-2 text-left transition shadow-xs flex flex-col justify-between disabled:opacity-70 ${isCurrent ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20' : isDone ? 'border-slate-900 bg-emerald-50/70 hover:bg-emerald-100' : 'border-slate-900 bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-1 mb-1"><span className="font-bold text-xs text-slate-900">{btn.title}</span>{isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between"><span>{btn.sub}</span>{loadingClick === btn.num && <span className="text-indigo-600 font-bold animate-pulse">Menulis...</span>}</div>
            </button>;
          })}
        </div>
        <div className="flex border-b-2 border-slate-900 overflow-x-auto bg-slate-100 rounded-t-xl">
          {clickButtons.map(({ num }) => <button key={num} type="button" onClick={() => setActiveTab(num)} className={`py-2.5 px-4 text-xs font-black uppercase whitespace-nowrap transition border-r border-slate-300 ${activeTab === num ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}>Bagian {num}: {num === 1 ? 'Identifikasi' : num === 2 ? 'Desain Pembelajaran' : num === 3 ? 'Pengalaman Belajar' : num === 4 ? 'Asesmen' : 'KKTP & Lampiran'}</button>)}
        </div>
        {activeTab === 1 && <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3"><h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian 1: Identifikasi Peserta Didik, Pengetahuan &amp; Profil Lulusan</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{([['studentCharacteristics','Karakteristik & Kebutuhan Belajar Peserta Didik',3],['initialKnowledge','Pengetahuan Awal & Minat Belajar',3],['subjectKnowledgeType','Jenis Pengetahuan Materi (Faktual, Konseptual, Prosedural)',2],['realWorldRelevance','Relevansi dengan Kehidupan Nyata Murid',2],['learningNeedsAndInterests','Kebutuhan dan Minat Belajar',2],['difficultyAndStructure','Tingkat Kesulitan dan Struktur Materi',2]] as [string,string,number][]).map(([field,label,rows])=><div key={field}><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">{label}</label><textarea value={(module.step1 as any)?.[field] || ''} onChange={(e) => updateStepField(1,field,e.target.value)} rows={rows} className={fieldClass}/></div>)}</div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Dimensi Profil Lulusan Terpilih</label><p className="text-xs text-slate-600">{module.step1.selectedDimensions?.join(', ') || 'Akan diisi oleh AI'}</p></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Penjabaran Kontekstual Dimensi Profil Lulusan</label><textarea value={module.step1.dimensionsContext || ''} onChange={(e) => updateStepField(1,'dimensionsContext',e.target.value)} rows={3} className={fieldClass}/></div></div>}
        {activeTab === 2 && <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3"><h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian 2: Desain Pembelajaran &amp; Lintas Disiplin</h4><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Capaian Pembelajaran</label><textarea value={module.step2.cpStatement || ''} onChange={(e) => updateStepField(2,'cpStatement',e.target.value)} rows={2} className={fieldClass}/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Keterkaitan Lintas Disiplin (3–4 Mapel Lain)</label><textarea value={module.step2.crossDisciplinary || ''} onChange={(e) => updateStepField(2,'crossDisciplinary',e.target.value)} rows={4} className={fieldClass}/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Praktik Pedagogis (PBL/PjBL)</label><textarea value={module.step2.pedagogicalPractices || ''} onChange={(e) => updateStepField(2,'pedagogicalPractices',e.target.value)} rows={4} className={fieldClass}/></div></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Tujuan Tiap Pertemuan</label><div className="space-y-2">{([1,2,3] as const).map((meeting) => <input key={meeting} value={(module.step2.meetingObjectives as any)?.[`meeting${meeting}`] || ''} onChange={(e) => updateStepField(2,'meetingObjectives',{...module.step2.meetingObjectives,[`meeting${meeting}`]:e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder={`Pertemuan ${meeting}...`}/>)}</div></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Pertanyaan Pemandu</label><textarea value={module.step2.guidingQuestions || ''} onChange={(e) => updateStepField(2,'guidingQuestions',e.target.value)} rows={2} className={fieldClass}/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Kemitraan dan Lingkungan Belajar</label><textarea value={module.step2.partnershipsAndEnvironment || ''} onChange={(e) => updateStepField(2,'partnershipsAndEnvironment',e.target.value)} rows={2} className={fieldClass}/></div></div>}
        {activeTab === 3 && <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3"><h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian 3: Pengalaman Belajar (Awal Berkesadaran, Inti Bermakna, Penutup 3-2-1)</h4>{([['mindfulBeginning','TAHAP AWAL · Berkesadaran (Mindful): Orientasi & Pertanyaan Pemantik',2],['meaningfulCoreUnderstand','INTI · Memahami: Diskusi Konsep & Kasus Otentik',4],['joyfulCoreApply','INTI · Mengaplikasikan (Joyful): Praktik / Proyek Kelompok & Peer Feedback',4],['reflectiveCoreReflect','INTI · Merefleksikan: Refleksi Pribadi & Kelompok',3],['closingSummary','TAHAP PENUTUP · Refleksi 3-2-1 & Jembatan Pertemuan Berikutnya',3]] as [string,string,number][]).map(([field,label,rows])=><div key={field}><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">{label}</label><textarea value={(module.step3 as any)?.[field] || ''} onChange={(e) => updateStepField(3,field,e.target.value)} rows={rows} className={fieldClass}/></div>)}</div>}
        {activeTab === 4 && <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3"><h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian 4: Rencana Asesmen Awal, Proses (As &amp; For Learning), dan Akhir</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Asesmen Awal (Diagnostik Kognitif &amp; Non-Kognitif)</label><textarea value={module.step4.initialDiagnostic || ''} onChange={(e) => updateStepField(4,'initialDiagnostic',e.target.value)} rows={4} className={fieldClass}/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Asesmen Proses (Assessment as &amp; for Learning)</label><textarea value={module.step4.processAssessment || ''} onChange={(e) => updateStepField(4,'processAssessment',e.target.value)} rows={4} className={fieldClass}/></div></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Jenis Asesmen Akhir</label><input value={module.step4.finalAssessmentTypes?.join(', ') || ''} onChange={(e) => updateStepField(4,'finalAssessmentTypes',e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full text-xs p-2 rounded-lg border border-slate-300"/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Asesmen Akhir (Sumatif): Bentuk &amp; Deskripsi Instrumen</label><textarea value={module.step4.finalAssessmentDesc || ''} onChange={(e) => updateStepField(4,'finalAssessmentDesc',e.target.value)} rows={3} className={fieldClass}/></div></div>}
        {activeTab === 5 && <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3"><h4 className="font-extrabold text-xs text-indigo-900 uppercase">Bagian 5: KKTP, Remedial-Pengayaan &amp; Lampiran Instrumen Lengkap</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Kriteria Ketuntasan &amp; Interval Sumatif</label><textarea value={module.step5.kktpCriteria || ''} onChange={(e) => updateStepField(5,'kktpCriteria',e.target.value)} rows={4} className={fieldClass}/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Program Remedial &amp; Pengayaan</label><textarea value={module.step5.remedialAndEnrichment || ''} onChange={(e) => updateStepField(5,'remedialAndEnrichment',e.target.value)} rows={4} className={fieldClass}/></div></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Refleksi Guru dan Refleksi Murid</label><textarea value={module.step5.reflectionStudentTeacher || ''} onChange={(e) => updateStepField(5,'reflectionStudentTeacher',e.target.value)} rows={3} className={fieldClass}/></div><div><label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">Checklist Asesmen Proses</label><textarea value={module.step5.processChecklist || ''} onChange={(e) => updateStepField(5,'processChecklist',e.target.value)} rows={3} className={fieldClass}/></div><div className="space-y-2"><h5 className="text-[11px] font-bold text-slate-700 uppercase">Lampiran Pertanyaan Diagnostik &amp; Kunci Jawaban</h5>{(module.step5.diagnosticQuestions || []).map((item,index)=><div key={`diagnostic-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2"><input value={item.question} onChange={(e) => {const rows=[...module.step5.diagnosticQuestions]; rows[index]={...rows[index],question:e.target.value}; updateStepField(5,'diagnosticQuestions',rows);}} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder={`Pertanyaan ${index+1}`}/><input value={item.answerKey} onChange={(e) => {const rows=[...module.step5.diagnosticQuestions]; rows[index]={...rows[index],answerKey:e.target.value}; updateStepField(5,'diagnosticQuestions',rows);}} className="w-full text-xs p-2 rounded-lg border border-slate-300" placeholder="Kunci jawaban"/></div>)}</div><div className="space-y-2"><h5 className="text-[11px] font-bold text-slate-700 uppercase">Soal Akhir, Rubrik &amp; Skor</h5>{(module.step5.finalQuestions || []).map((item,index)=><div key={`final-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2"><textarea value={item.question} onChange={(e) => {const rows=[...module.step5.finalQuestions]; rows[index]={...rows[index],question:e.target.value}; updateStepField(5,'finalQuestions',rows);}} rows={2} className={fieldClass} placeholder={`Soal ${index+1}`}/><textarea value={item.rubric} onChange={(e) => {const rows=[...module.step5.finalQuestions]; rows[index]={...rows[index],rubric:e.target.value}; updateStepField(5,'finalQuestions',rows);}} rows={2} className={fieldClass} placeholder="Rubrik penilaian"/><input type="number" min={1} value={item.scoreMax} onChange={(e) => {const rows=[...module.step5.finalQuestions]; rows[index]={...rows[index],scoreMax:Number(e.target.value)}; updateStepField(5,'finalQuestions',rows);}} className="w-full text-xs p-2 rounded-lg border border-slate-300" aria-label={`Skor maksimal soal ${index+1}`}/></div>)}</div></div>}
      </div>
    </div>
  );
};
