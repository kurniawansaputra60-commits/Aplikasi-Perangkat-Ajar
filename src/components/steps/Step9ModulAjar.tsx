import React, { useState } from 'react';
import { DeepLearningModule, AppState } from '../../types';
import { Sparkles, CheckCircle2, ChevronRight, Layers, FileText } from 'lucide-react';
import { requestAiGeneration } from '../../services/aiService';

interface Step9Props {
  module: DeepLearningModule;
  onChange: (updated: DeepLearningModule) => void;
  appState: AppState;
}

export const Step9ModulAjar: React.FC<Step9Props> = ({ module, onChange, appState }) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loadingClick, setLoadingClick] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const updateStepField = (stepNum: 1 | 2 | 3 | 4 | 5, field: string, val: any) => {
    const stepKey = `step${stepNum}` as keyof DeepLearningModule;
    const currentStepObj = (module[stepKey] as any) || {};
    onChange({
      ...module,
      [stepKey]: {
        ...currentStepObj,
        [field]: val,
      },
    });
  };

  const handleRunClick = async (stepNum: 1 | 2 | 3 | 4 | 5) => {
    setErrorMsg(null);
    setLoadingClick(stepNum);
    try {
      const typeKey = `modul_step${stepNum}` as any;
      const res = await requestAiGeneration({
        type: typeKey,
        prompt: `Buat isi modul ajar Pembelajaran Mendalam (Deep Learning) Bagian ${stepNum} untuk topik ${module.topicTitle} pada mata pelajaran ${activePkg.subject}.`,
        context: { subject: activePkg.subject, materi: module.topicTitle },
      });

      // Mark click as completed
      const newClicks = { ...module.clicksCompleted, [stepNum]: true };
      onChange({ ...module, clicksCompleted: newClicks });
      setActiveTab(stepNum);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses AI');
    } finally {
      setLoadingClick(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Box */}
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
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full border border-indigo-700">
              Sistem 5 Klik Bertahap
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300">
              ⚡ Tidak Ada yang Terpotong
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Materi TP: <strong>{module.tpCode}</strong> — {module.topicTitle}
          </span>
        </div>

        <h3 className="text-base font-black text-slate-900 mb-1">
          Modul Ajar Pembelajaran Mendalam (Deep Learning / RPM)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Berkesadaran (Mindful), Bermakna (Meaningful), Menggembirakan (Joyful). Lima klik bertahap menjamin setiap kotak terisi super detail dan bebas diedit per kotak!
        </p>

        {/* 5 Sequential Click Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
          {[
            { num: 1 as const, title: 'Klik 1: Identifikasi', sub: 'Murid & 8 Dimensi' },
            { num: 2 as const, title: 'Klik 2: Desain', sub: 'CP, TP & Praktik PBL' },
            { num: 3 as const, title: 'Klik 3: Pengalaman', sub: 'Awal-Inti-Penutup 321' },
            { num: 4 as const, title: 'Klik 4: Asesmen', sub: 'Diagnostik & Formatif' },
            { num: 5 as const, title: 'Klik 5: KKTP', sub: 'Rubrik & Lampiran Soal' },
          ].map((btn) => {
            const isDone = module.clicksCompleted?.[btn.num];
            const isCurrent = activeTab === btn.num;

            return (
              <button
                key={btn.num}
                onClick={() => {
                  setActiveTab(btn.num);
                  if (!isDone) handleRunClick(btn.num);
                }}
                className={`p-2.5 rounded-xl border-2 text-left transition shadow-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : isDone
                    ? 'border-slate-900 bg-emerald-50/70 hover:bg-emerald-100'
                    : 'border-slate-900 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-900">{btn.title}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>{btn.sub}</span>
                  {loadingClick === btn.num && (
                    <span className="text-indigo-600 font-bold animate-pulse">Menulis...</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Navigation header */}
        <div className="flex border-b-2 border-slate-900 overflow-x-auto bg-slate-100 rounded-t-xl">
          {[1, 2, 3, 4, 5].map((tabNum) => (
            <button
              key={tabNum}
              onClick={() => setActiveTab(tabNum as any)}
              className={`py-2.5 px-4 text-xs font-black uppercase whitespace-nowrap transition border-r border-slate-300 ${
                activeTab === tabNum ? 'bg-white text-indigo-700' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bagian {tabNum}:{' '}
              {tabNum === 1
                ? 'Identifikasi'
                : tabNum === 2
                ? 'Desain Pembelajaran'
                : tabNum === 3
                ? 'Pengalaman Belajar'
                : tabNum === 4
                ? 'Asesmen'
                : 'KKTP & Lampiran'}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Identifikasi */}
        {activeTab === 1 && (
          <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
              Bagian 1: Identifikasi Peserta Didik, Pengetahuan &amp; Profil Lulusan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Karakteristik &amp; Kebutuhan Belajar Peserta Didik
                </label>
                <textarea
                  value={module.step1.studentCharacteristics}
                  onChange={(e) => updateStepField(1, 'studentCharacteristics', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Pengetahuan Awal &amp; Minat Belajar
                </label>
                <textarea
                  value={module.step1.initialKnowledge}
                  onChange={(e) => updateStepField(1, 'initialKnowledge', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Jenis Pengetahuan Materi (Faktual, Konseptual, Prosedural)
                </label>
                <textarea
                  value={module.step1.subjectKnowledgeType}
                  onChange={(e) => updateStepField(1, 'subjectKnowledgeType', e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Relevansi dengan Kehidupan Nyata Murid
                </label>
                <textarea
                  value={module.step1.realWorldRelevance}
                  onChange={(e) => updateStepField(1, 'realWorldRelevance', e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Penjabaran Kontekstual Dimensi Profil Lulusan
              </label>
              <textarea
                value={module.step1.dimensionsContext}
                onChange={(e) => updateStepField(1, 'dimensionsContext', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Tab Content 2: Desain Pembelajaran */}
        {activeTab === 2 && (
          <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
              Bagian 2: Desain Pembelajaran &amp; Lintas Disiplin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Keterkaitan Lintas Disiplin (3–4 Mapel Lain)
                </label>
                <textarea
                  value={module.step2.crossDisciplinary}
                  onChange={(e) => updateStepField(2, 'crossDisciplinary', e.target.value)}
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Praktik Pedagogis (PBL/PjBL) &amp; Pertanyaan Pemandu
                </label>
                <textarea
                  value={module.step2.pedagogicalPractices}
                  onChange={(e) => updateStepField(2, 'pedagogicalPractices', e.target.value)}
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Tujuan Tiap Pertemuan (Dijabarkan Per Pertemuan 1, 2, dst.)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={module.step2.meetingObjectives.meeting1}
                  onChange={(e) =>
                    updateStepField(2, 'meetingObjectives', {
                      ...module.step2.meetingObjectives,
                      meeting1: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  placeholder="Pertemuan 1..."
                />
                <input
                  type="text"
                  value={module.step2.meetingObjectives.meeting2}
                  onChange={(e) =>
                    updateStepField(2, 'meetingObjectives', {
                      ...module.step2.meetingObjectives,
                      meeting2: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  placeholder="Pertemuan 2..."
                />
                <input
                  type="text"
                  value={module.step2.meetingObjectives.meeting3 || ''}
                  onChange={(e) =>
                    updateStepField(2, 'meetingObjectives', {
                      ...module.step2.meetingObjectives,
                      meeting3: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  placeholder="Pertemuan 3..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Pengalaman Belajar (Mindful-Meaningful-Joyful) */}
        {activeTab === 3 && (
          <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
              Bagian 3: Pengalaman Belajar (Awal Berkesadaran, Inti Bermakna, Penutup 3-2-1)
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-emerald-800 mb-1 uppercase">
                TAHAP AWAL · Berkesadaran (Mindful): Orientasi Bermakna &amp; Pertanyaan Pemantik
              </label>
              <textarea
                value={module.step3.mindfulBeginning}
                onChange={(e) => updateStepField(3, 'mindfulBeginning', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/20 focus:ring-1 focus:ring-emerald-500 leading-relaxed font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-800 mb-1 uppercase">
                  INTI · Memahami: Diskusi Konsep &amp; Kasus Otentik
                </label>
                <textarea
                  value={module.step3.meaningfulCoreUnderstand}
                  onChange={(e) => updateStepField(3, 'meaningfulCoreUnderstand', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-800 mb-1 uppercase">
                  INTI · Mengaplikasikan (Joyful): Praktik / Proyek Kelompok &amp; Peer Feedback
                </label>
                <textarea
                  value={module.step3.joyfulCoreApply}
                  onChange={(e) => updateStepField(3, 'joyfulCoreApply', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 leading-relaxed font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-800 mb-1 uppercase">
                INTI · Merefleksikan: Refleksi Pribadi &amp; Kelompok Mendalam
              </label>
              <textarea
                value={module.step3.reflectiveCoreReflect}
                onChange={(e) => updateStepField(3, 'reflectiveCoreReflect', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500 leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1 uppercase">
                TAHAP PENUTUP · Strategi Refleksi 3-2-1 &amp; Jembatan Pertemuan Berikutnya
              </label>
              <textarea
                value={module.step3.closingSummary}
                onChange={(e) => updateStepField(3, 'closingSummary', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-medium"
              />
            </div>
          </div>
        )}

        {/* Tab Content 4: Asesmen */}
        {activeTab === 4 && (
          <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
              Bagian 4: Rencana Asesmen Awal, Proses (As &amp; For Learning), dan Akhir
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Asesmen Awal (Diagnostik Kognitif &amp; Non-Kognitif)
                </label>
                <textarea
                  value={module.step4.initialDiagnostic}
                  onChange={(e) => updateStepField(4, 'initialDiagnostic', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Asesmen Proses (Assessment as Learning &amp; for Learning)
                </label>
                <textarea
                  value={module.step4.processAssessment}
                  onChange={(e) => updateStepField(4, 'processAssessment', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Asesmen Akhir (Sumatif): Bentuk &amp; Deskripsi Instrumen
              </label>
              <textarea
                value={module.step4.finalAssessmentDesc}
                onChange={(e) => updateStepField(4, 'finalAssessmentDesc', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        )}

        {/* Tab Content 5: KKTP & Lampiran */}
        {activeTab === 5 && (
          <div className="p-4 border-2 border-t-0 border-slate-900 rounded-b-xl bg-white space-y-3">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
              Bagian 5: KKTP, Remedial-Pengayaan &amp; Lampiran Instrumen Lengkap
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Kriteria Ketuntasan 70% &amp; Interval Sumatif
                </label>
                <textarea
                  value={module.step5.kktpCriteria}
                  onChange={(e) => updateStepField(5, 'kktpCriteria', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Tabel Program Remedial &amp; Pengayaan
                </label>
                <textarea
                  value={module.step5.remedialAndEnrichment}
                  onChange={(e) => updateStepField(5, 'remedialAndEnrichment', e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                Refleksi Guru dan Refleksi Murid
              </label>
              <textarea
                value={module.step5.reflectionStudentTeacher}
                onChange={(e) => updateStepField(5, 'reflectionStudentTeacher', e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
