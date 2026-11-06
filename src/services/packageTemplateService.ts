import {
  TeachingPackage,
  CapaianPembelajaranData,
  AtpItem,
  ProtaItem,
  PromesRow,
  KktpData,
  DeepLearningModule,
  LkpdData,
  AssessmentPlanItem,
  Step12Data,
  QuestionAnalysisItem,
  StepStatus,
} from '../types';

export interface PackageContent {
  cp: CapaianPembelajaranData;
  atp: AtpItem[];
  prota: ProtaItem[];
  promes: PromesRow[];
  kktp: KktpData;
  modules: { [tpCode: string]: DeepLearningModule };
  activeModuleTp: string;
  lkpd: { [tpCode: string]: LkpdData };
  assessmentPlans: AssessmentPlanItem[];
  step12: Step12Data;
  analysis: QuestionAnalysisItem[];
  stepStatuses: { [stepNumber: number]: StepStatus };
}

/**
 * Menghasilkan konten kurikulum awal terstandar untuk paket mengajar baru
 * yang disesuaikan secara dinamis dengan Mata Pelajaran, Jenjang, dan Fase.
 */
export function createInitialPackageData(pkg: TeachingPackage): PackageContent {
  const subjectLower = (pkg.subject || '').toLowerCase();
  const isMatematika = subjectLower.includes('matematika');
  const isBIndo = subjectLower.includes('indonesia');

  let cp: CapaianPembelajaranData;
  let atp: AtpItem[];
  let prota: ProtaItem[];
  let promes: PromesRow[];
  let kktp: KktpData;
  let defaultModule: DeepLearningModule;
  let defaultLkpd: LkpdData;
  let assessmentPlans: AssessmentPlanItem[];
  let step12: Step12Data;

  if (isMatematika) {
    cp = {
      officialSource: 'Kepka BSKAP No. 046/H/KR/2025 & BKPDM 020/2026',
      generalDescription: `Pada akhir ${pkg.phase}, peserta didik dapat menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 1.000.000, pecahan, desimal, dan persentase. Peserta didik dapat menyelesaikan masalah berkaitan dengan operasi hitung campuran, mengukur luas dan volume bangun ruang, serta menyajikan data dalam bentuk tabel dan diagram batang.`,
      phase: pkg.phase,
      elements: [
        {
          id: 'cp-mat-1',
          name: 'Bilangan & Operasi Hitung',
          cpText: 'Peserta didik memahami bilangan pecahan senilai, desimal, persentase, serta terampil melakukan operasi hitung penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah dan pecahan dalam kehidupan sehari-hari.',
          matchesSubject: true,
          notes: 'Sesuai dengan standar elemen Bilangan Fase C.',
        },
        {
          id: 'cp-mat-2',
          name: 'Pengukuran & Geometri',
          cpText: 'Peserta didik dapat menentukan keliling dan luas bangun datar gabungan serta volume kubus dan balok menggunakan satuan baku, serta mengonstruksi jaring-jaring bangun ruang sederhana.',
          matchesSubject: true,
          notes: 'Sesuai dengan elemen Geometri dan Pengukuran.',
        },
        {
          id: 'cp-mat-3',
          name: 'Analisis Data & Peluang',
          cpText: 'Peserta didik dapat mengumpulkan, mengorganisasi, menyajikan data dalam bentuk diagram batang dan diagram garis, serta menarik kesimpulan berdasarkan interpretasi data.',
          matchesSubject: true,
          notes: 'Sesuai dengan elemen Analisis Data.',
        },
      ],
      isVerified: true,
    };

    atp = [
      {
        id: 'atp-mat-1',
        code: 'TP 1',
        scopeContent: 'Pecahan Senilai dan Operasi Hitung Campuran',
        learningObjective: 'Peserta didik dapat menganalisis dan menyelesaikan masalah sehari-hari yang melibatkan pecahan senilai dan operasi hitung campuran.',
        graduateDimensions: ['Penalaran Kritis', 'Kemandirian'],
        allocatedJp: 15,
        semester: '1',
        keywords: 'pecahan, operasi campuran, penyederhanaan, penyebut',
        status: 'Tersimpan',
      },
      {
        id: 'atp-mat-2',
        code: 'TP 2',
        scopeContent: 'Pecahan Desimal dan Persentase',
        learningObjective: 'Peserta didik dapat mengubah pecahan biasa ke desimal dan persen serta mengaplikasikannya dalam konteks jual-beli dan diskon.',
        graduateDimensions: ['Penalaran Kritis', 'Kreativitas'],
        allocatedJp: 15,
        semester: '1',
        keywords: 'desimal, persen, nilai tempat, aplikasi ekonomi',
        status: 'Tersimpan',
      },
      {
        id: 'atp-mat-3',
        code: 'TP 3',
        scopeContent: 'Keliling dan Luas Bangun Datar Gabungan',
        learningObjective: 'Peserta didik dapat menghitung keliling dan luas bangun datar gabungan (persegi, persegi panjang, segitiga) dengan satuan baku.',
        graduateDimensions: ['Penalaran Kritis', 'Kolaborasi'],
        allocatedJp: 15,
        semester: '1',
        keywords: 'keliling, luas, bangun gabungan, dimensi panjang',
        status: 'Tersimpan',
      },
      {
        id: 'atp-mat-4',
        code: 'TP 4',
        scopeContent: 'Penyajian dan Interpretasi Data Diagram Batang',
        learningObjective: 'Peserta didik dapat menyajikan data hasil survei kelas dalam diagram batang serta menafsirkan informasi modus dan selisih.',
        graduateDimensions: ['Penalaran Kritis', 'Komunikasi'],
        allocatedJp: 10,
        semester: '1',
        keywords: 'diagram batang, frekuensi, data survei, modus',
        status: 'Tersimpan',
      },
    ];
  } else if (isBIndo) {
    cp = {
      officialSource: 'Kepka BSKAP No. 046/H/KR/2025 & BKPDM 020/2026',
      generalDescription: `Pada akhir ${pkg.phase}, peserta didik memiliki kemampuan berbahasa untuk berkomunikasi dan bernalar sesuai dengan tujuan dan konteks sosial. Peserta didik mampu memahami, mengolah, dan menginterpretasi informasi teks eksplanasi, narasi, dan visual, serta terampil menulis tanggapan kritis dan mempresentasikan ide secara santun.`,
      phase: pkg.phase,
      elements: [
        {
          id: 'cp-bi-1',
          name: 'Menyimak & Membaca',
          cpText: 'Peserta didik mampu menganalisis ide pokok dan ide pendukung pada teks eksplanasi dan naratif, serta membedakan fakta dan opini dari informasi yang disimak.',
          matchesSubject: true,
          notes: 'Sesuai dengan elemen Menyimak dan Membaca Fase C.',
        },
        {
          id: 'cp-bi-2',
          name: 'Berbicara & Mempresentasikan',
          cpText: 'Peserta didik terampil melakukan wawancara dengan tokoh narasumber menggunakan kalimat efektif dan etika kesantunan berbahasa.',
          matchesSubject: true,
          notes: 'Sesuai dengan elemen Berbicara.',
        },
        {
          id: 'cp-bi-3',
          name: 'Menulis',
          cpText: 'Peserta didik mampu menulis teks eksplanasi ilmiah sederhana dengan ejaan Bahasa Indonesia yang tepat (EYD V) dan struktur kronologis kausalitas.',
          matchesSubject: true,
          notes: 'Sesuai dengan elemen Menulis.',
        },
      ],
      isVerified: true,
    };

    atp = [
      {
        id: 'atp-bi-1',
        code: 'TP 1',
        scopeContent: 'Teks Eksplanasi Ilmiah Sederhana',
        learningObjective: 'Peserta didik dapat menemukan ide pokok dan hubungan sebab-akibat dalam teks eksplanasi fenomena alam dan sosial.',
        graduateDimensions: ['Penalaran Kritis', 'Komunikasi'],
        allocatedJp: 14,
        semester: '1',
        keywords: 'eksplanasi, ide pokok, kausalitas, fakta',
        status: 'Tersimpan',
      },
      {
        id: 'atp-bi-2',
        code: 'TP 2',
        scopeContent: 'Teknik Wawancara dan Etika Berbahasa',
        learningObjective: 'Peserta didik dapat menyusun daftar pertanyaan adiksimba (5W1H) dan melakukan simulasi wawancara dengan narasumber lokal.',
        graduateDimensions: ['Kolaborasi', 'Kewargaan'],
        allocatedJp: 14,
        semester: '1',
        keywords: 'wawancara, narasumber, adiksimba, santun',
        status: 'Tersimpan',
      },
      {
        id: 'atp-bi-3',
        code: 'TP 3',
        scopeContent: 'Menulis Narasi dan Deskripsi Berdasar Fakta',
        learningObjective: 'Peserta didik dapat menulis teks narasi pengalaman nyata dengan struktur awal, konflik, dan resolusi menggunakan kalimat efektif.',
        graduateDimensions: ['Kreativitas', 'Kemandirian'],
        allocatedJp: 14,
        semester: '1',
        keywords: 'narasi, alur cerita, kalimat efektif, EYD',
        status: 'Tersimpan',
      },
    ];
  } else {
    // Default IPAS / Sains / Topik Umum
    cp = {
      officialSource: 'Kepka BSKAP No. 046/H/KR/2025 & BKPDM 020/2026',
      generalDescription: `Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antarkomponen biotik dan abiotik dapat memengaruhi kestabilan suatu ekosistem di lingkungan sekitarnya. Peserta didik mengidentifikasi peran produsen, konsumen, dan dekomposer dalam jaring-jaring makanan serta merumuskan aksi nyata menjaga kelestarian alam.`,
      phase: pkg.phase,
      elements: [
        {
          id: 'cp-el-1',
          name: `Pemahaman ${pkg.subject}`,
          cpText: `Peserta didik memahami konsep-konsep kunci ${pkg.subject} dan mengaitkannya dengan fenomena faktual di lingkungan kehidupan sehari-hari secara kritis dan bertanggung jawab.`,
          matchesSubject: true,
          notes: `Sesuai dengan mapel ${pkg.subject} ${pkg.grade}.`,
        },
        {
          id: 'cp-el-2',
          name: 'Keterampilan Proses & Penyelidikan',
          cpText: 'Peserta didik mengamati fenomena alam/sosial, menyusun pertanyaan investigatif, melakukan eksplorasi terpandu, mengorganisasi data, dan mengomunikasikan temuan.',
          matchesSubject: true,
          notes: 'Sesuai dengan Keterampilan Proses Sains & Sosial.',
        },
      ],
      isVerified: true,
    };

    atp = [
      {
        id: 'atp-1',
        code: 'TP 1',
        scopeContent: 'Komponen Biotik & Abiotik Ekosistem',
        learningObjective: 'Peserta didik dapat mengidentifikasi komponen biotik dan abiotik di lingkungan sekolah serta menjelaskan interaksi saling ketergantungan di antaranya.',
        graduateDimensions: ['Penalaran Kritis', 'Kolaborasi', 'Keimanan & Ketakwaan'],
        allocatedJp: 10,
        semester: '1',
        keywords: 'biotik, abiotik, habitat, interaksi, ekosistem',
        status: 'Tersimpan',
      },
      {
        id: 'atp-2',
        code: 'TP 2',
        scopeContent: 'Rantai Makanan & Jaring-jaring Kehidupan',
        learningObjective: 'Peserta didik dapat menganalisis alur perpindahan energi melalui rantai makanan dan jaring-jaring makanan dalam suatu ekosistem darat dan perairan.',
        graduateDimensions: ['Penalaran Kritis', 'Kreativitas', 'Kemandirian'],
        allocatedJp: 15,
        semester: '1',
        keywords: 'produsen, konsumen, dekomposer, rantai makanan, trofik',
        status: 'Tersimpan',
      },
      {
        id: 'atp-3',
        code: 'TP 3',
        scopeContent: 'Keseimbangan Ekosistem & Dampak Perubahan',
        learningObjective: 'Peserta didik dapat memprediksi dampak kepunahan atau ledakan populasi suatu makhluk hidup terhadap keseimbangan jaring-jaring makanan.',
        graduateDimensions: ['Penalaran Kritis', 'Kewargaan', 'Komunikasi'],
        allocatedJp: 15,
        semester: '1',
        keywords: 'keseimbangan ekosistem, overpopulasi, pestisida, kepunahan',
        status: 'Tersimpan',
      },
      {
        id: 'atp-4',
        code: 'TP 4',
        scopeContent: 'Aksi Nyata Pelestarian Lingkungan Lokal',
        learningObjective: 'Peserta didik dapat merancang dan mempresentasikan kampanye solusi nyata menjaga keanekaragaman hayati dan habitat makhluk hidup di lingkungan sekitar.',
        graduateDimensions: ['Kreativitas', 'Kolaborasi', 'Kewargaan'],
        allocatedJp: 10,
        semester: '1',
        keywords: 'konservasi, penghijauan, aksi peduli, kampanye lingkungan',
        status: 'Tersimpan',
      },
    ];
  }

  // Generate Prota based on ATP
  prota = atp.map((item, idx) => ({
    semester: (idx < 3 ? '1' : '2') as '1' | '2',
    tpCode: item.code,
    material: item.scopeContent,
    allocatedJp: item.allocatedJp,
  }));

  // Generate Promes rows
  promes = atp.map((item, idx) => ({
    tpCode: item.code,
    material: item.scopeContent,
    totalJp: item.allocatedJp,
    weeks: {
      [`m${Math.min(5, idx)}_w${(idx % 4) + 1}`]: 5,
      [`m${Math.min(5, idx)}_w${(idx % 4) + 2}`]: 5,
    },
  }));

  // Generate KKTP matching KktpData interface
  kktp = {
    modelType: 'interval',
    passingGrade: 70,
    intervals: [
      {
        range: '0 – 60',
        predicate: 'Perlu Bimbingan',
        description: `Belum mencapai ketuntasan, perlu remedial penuh pada konsep dasar ${pkg.subject}.`,
        followUp: 'Bimbingan perorangan oleh guru dan tutor sebaya.',
      },
      {
        range: '61 – 75',
        predicate: 'Cukup',
        description: 'Mencapai ketuntasan minimal, mampu menjelaskan konsep dasar secara terbatas.',
        followUp: 'Pemberian tugas latihan mandiri terfokus.',
      },
      {
        range: '76 – 89',
        predicate: 'Baik',
        description: 'Mencapai ketuntasan dengan baik, terampil menerapkan konsep dalam tugas.',
        followUp: 'Pengayaan materi dengan studi kasus kontekstual.',
      },
      {
        range: '90 – 100',
        predicate: 'Sangat Baik',
        description: 'Menguasai materi secara mendalam dan dapat menganalisis pemecahan masalah kompleks.',
        followUp: 'Pengayaan menjadi kelompok penggerak dan proyek investigasi mandiri.',
      },
    ],
    rubricItems: [
      {
        tpCode: 'TP 1',
        indicator: `Menganalisis konsep utama ${pkg.subject}.`,
        needGuidance: 'Belum mampu mengidentifikasi komponen utama.',
        fair: 'Mampu mengidentifikasi komponen namun penjelasan kurang tepat.',
        good: 'Mampu menjelaskan konsep utama dengan benar dan terstruktur.',
        excellent: 'Mampu menganalisis dan mengaitkan konsep utama dengan studi kasus nyata.',
      },
    ],
    descriptionCriteria: [
      {
        tpCode: 'TP 1',
        criteriaText: `Menyebutkan indikator utama ${pkg.subject} dan memberikan 2 contoh nyata.`,
        minimumTarget: 'Memenuhi minimal 2 kriteria deskripsi dengan tepat.',
      },
    ],
  };

  // Generate Default Module matching DeepLearningModule interface
  const primaryTp = atp[0];
  defaultModule = {
    tpId: primaryTp.id,
    tpCode: primaryTp.code,
    tpText: primaryTp.learningObjective,
    topicTitle: primaryTp.scopeContent,
    totalMeetings: 3,
    allocatedJp: primaryTp.allocatedJp,
    clicksCompleted: { 1: true, 2: true, 3: true, 4: true, 5: true },
    step1: {
      studentCharacteristics: 'Siswa menyukai kegiatan eksplorasi visual dan permainan kolaboratif kelompok kecil.',
      initialKnowledge: 'Siswa telah mengenal konsep dasar dari pengalaman sehari-hari.',
      learningNeedsAndInterests: 'Membutuhkan media konkrit, kartu visual, dan eksplorasi lingkungan sekolah.',
      subjectKnowledgeType: 'Konseptual dan Prosedural terintegrasi.',
      realWorldRelevance: 'Berkaitan dengan aktivitas dan masalah di lingkungan sekitar murid.',
      difficultyAndStructure: 'Tingkat kesulitan menengah berjenjang dari mendasar ke aplikatif.',
      selectedDimensions: primaryTp.graduateDimensions,
      dimensionsContext: 'Penalaran kritis diasah saat memecahkan masalah kelompok.',
    },
    step2: {
      cpStatement: cp.generalDescription,
      crossDisciplinary: 'Integrasi dengan Bahasa Indonesia (Laporan) dan Seni Rupa (Infografis).',
      meetingObjectives: {
        meeting1: `Pertemuan 1: Mengidentifikasi komponen utama ${primaryTp.scopeContent}.`,
        meeting2: `Pertemuan 2: Menganalisis keterkaitan antarunsur dalam ${primaryTp.scopeContent}.`,
        meeting3: `Pertemuan 3: Merumuskan aksi nyata pemecahan masalah.`,
      },
      pedagogicalPractices: 'Problem-Based Learning (PBL) berbasis studi kasus kontekstual.',
      guidingQuestions: `1. Mengapa pemahaman tentang ${primaryTp.scopeContent} penting dalam kehidupan kita?\n2. Bagaimana kita menjaga keseimbangan lingkungan?`,
      partnershipsAndEnvironment: 'Lingkungan sekolah dan perpustakaan sebagai laboratorium belajar.',
    },
    step3: {
      mindfulBeginning: 'Awal Berkesadaran: Berdoa bersama, ice breaking pengusir jenuh, dan apersepsi kontekstual.',
      meaningfulCoreUnderstand: 'Inti Bermakna: Investigasi kelompok terpandu menggunakan kartu studi kasus.',
      joyfulCoreApply: 'Inti Menggembirakan: Simulasi interaktif dan presentasi kelompok metode gallery walk.',
      reflectiveCoreReflect: 'Inti Merefleksi: Refleksi 3-2-1 tentang hal baru yang dipelajari dan aksi nyata.',
      closingSummary: 'Penutup: Menyimpulkan inti pembelajaran dan doa bersama.',
    },
    step4: {
      initialDiagnostic: 'Kuis singkat 3 pertanyaan pemantik kesiapan awal.',
      processAssessment: 'Observasi keaktifan diskusi kelompok dan rubrik unjuk kerja.',
      finalAssessmentTypes: ['Tes Tertulis', 'Kinerja'],
      finalAssessmentDesc: 'Naskah soal sumatif lingkup materi dan penilaian produk LKPD.',
    },
    step5: {
      kktpCriteria: 'Batas ketuntasan minimal 70% berbasis indikator capaian.',
      remedialAndEnrichment: 'Remedial: Bimbingan perorangan. Pengayaan: Proyek mini mandiri.',
      reflectionStudentTeacher: 'Refleksi guru dan murid terhadap efektivitas proses belajar.',
      diagnosticQuestions: [
        { question: `Apa yang kamu ketahui tentang ${primaryTp.scopeContent}?`, answerKey: 'Pemahaman awal siswa' },
      ],
      processChecklist: 'Checklist keaktifan: Kerjasama, menghargai pendapat, dan ketelitian.',
      finalQuestions: [
        {
          question: `Jelaskan dampak bila komponen utama ${primaryTp.scopeContent} terganggu!`,
          rubric: 'Skor 5: Penjelasan logis dan tepat.',
          scoreMax: 5,
        },
      ],
    },
  };

  // Generate Default LKPD matching LkpdData interface
  defaultLkpd = {
    tpCode: primaryTp.code,
    title: `LEMBAR KERJA PESERTA DIDIK (LKPD) — ${primaryTp.scopeContent}`,
    groupType: 'Kelompok (4-5 siswa)',
    estimatedTime: '2 x 35 Menit (Pertemuan 1)',
    contextualStimulus: `Cermati studi kasus tentang ${primaryTp.scopeContent} di lingkungan sekitar sekolah kita.`,
    toolsAndMaterials: [
      'Alat tulis dan kertas manila',
      'Spidol warna-warni',
      'Kartu studi kasus kontekstual',
    ],
    investigationSteps: [
      '1. Bacalah studi kasus bersama anggota kelompokmu.',
      '2. Identifikasi masalah dan data penting yang ditemukan.',
      '3. Diskusikan solusi alternatif yang paling efektif.',
      '4. Tuliskan hasil kesimpulan pada tabel pengamatan.',
    ],
    tableHeaders: ['No', 'Komponen Organisme', 'Peran Utama', 'Dampak Lingkungan'],
    tableRows: [
      ['1', 'Komponen A', 'Produsen / Utama', 'Menjaga kestabilan awal'],
      ['2', 'Komponen B', 'Konsumen / Pengolah', 'Pengendali populasi'],
      ['3', 'Komponen C', 'Pengurai / Dekomposer', 'Penyubur nutrisi tanah'],
    ],
    discussionQuestions: [
      `1. Mengapa ${primaryTp.scopeContent} memiliki peran penting dalam kehidupan sehari-hari?`,
      '2. Solusi konkret apa yang dapat kelompokmu tawarkan untuk menjaga kelestarian lingkungan?',
    ],
    reflectionPrompt: 'Tuliskan 1 tindakan positif yang akan kamu lakukan mulai hari ini!',
  };

  // Generate Assessment Plans matching AssessmentPlanItem interface
  assessmentPlans = [
    {
      type: 'Awal (Diagnostik)',
      tpCode: primaryTp.code,
      technique: 'Tes Lisan & Kuis Interaktif',
      instrument: 'Daftar Pertanyaan Pemantik Kesiapan Belajar',
      timing: 'Sebelum Pembelajaran Dimulai',
      details: 'Memetakan kesiapan awal murid ke dalam 3 kategori: Perlu Bimbingan, Cukup, dan Mahir.',
    },
    {
      type: 'Proses (Formatif)',
      tpCode: primaryTp.code,
      technique: 'Observasi & Unjuk Kerja',
      instrument: 'Lembar Ceklis Sikap Kolaborasi & Rubrik Kinerja LKPD',
      timing: 'Sepanjang Pertemuan 1 - 3',
      details: 'Memberikan umpan balik langsung (feedback deskriptif) untuk memperbaiki proses belajar.',
    },
    {
      type: 'Akhir (Sumatif)',
      tpCode: primaryTp.code,
      technique: 'Tes Tertulis & Portofolio',
      instrument: 'Naskah Soal 20 Pilihan Ganda & 5 Uraian Terstandar + Rubrik Skor',
      timing: 'Akhir Lingkup Materi',
      details: 'Mengukur ketercapaian Tujuan Pembelajaran untuk nilai rapor (Total skor: 45 poin).',
    },
  ];

  // Generate Step 12 (Kisi-kisi dan Naskah Soal 20 PG + 5 Uraian = 45 poin)
  const tp1 = atp[0];
  const tp2 = atp[1] || tp1;
  const tp3 = atp[2] || tp1;

  step12 = {
    assessmentName: `Sumatif Lingkup Materi 1 — ${primaryTp.scopeContent}`,
    assessmentType: 'Sumatif Lingkup Materi',
    countPg: 20,
    countEssay: 5,
    optionsCount: '4 opsi (A-D)',
    maxScorePerEssay: 5,
    click1Done: true,
    click2Done: true,
    click3Done: true,
    matrix: [
      {
        tpCode: tp1.code,
        materi: tp1.scopeContent,
        levelEasy_C1C2: 2,
        levelMedium_C3: 2,
        levelHots_C4C6: 1,
        noSoalPg: '1 - 4',
        noSoalUraian: '21',
        totalButir: 5,
        totalBobot: 9,
      },
      {
        tpCode: tp2.code,
        materi: tp2.scopeContent,
        levelEasy_C1C2: 4,
        levelMedium_C3: 5,
        levelHots_C4C6: 3,
        noSoalPg: '5 - 14',
        noSoalUraian: '22, 23',
        totalButir: 12,
        totalBobot: 20,
      },
      {
        tpCode: tp3.code,
        materi: tp3.scopeContent,
        levelEasy_C1C2: 2,
        levelMedium_C3: 3,
        levelHots_C4C6: 3,
        noSoalPg: '15 - 20',
        noSoalUraian: '24, 25',
        totalButir: 8,
        totalBobot: 16,
      },
    ],
    questions: Array.from({ length: 25 }, (_, i) => {
      const id = i + 1;
      const isPg = id <= 20;
      const assignedTp = id <= 4 ? tp1 : id <= 14 ? tp2 : tp3;
      const cog = id % 3 === 1 ? 'C2' : id % 3 === 2 ? 'C3' : 'C4';

      if (isPg) {
        return {
          id,
          type: 'PG' as const,
          tpCode: assignedTp.code,
          materi: assignedTp.scopeContent,
          indicator: `Disajikan stimulus kontekstual mengenai ${assignedTp.scopeContent}, siswa dapat menentukan jawaban yang tepat.`,
          cognitiveLevel: cog,
          levelLabel: cog === 'C2' ? 'Mudah' : cog === 'C3' ? 'Sedang' : 'HOTS',
          questionText: `Perhatikan fenomena terkait ${assignedTp.scopeContent} berikut! Manakah pernyataan yang paling tepat untuk mendeskripsikan keterkaitan konsep tersebut?`,
          options: [
            { key: 'A', text: 'Konsep pertama berhubungan searah dengan proses utama' },
            { key: 'B', text: 'Konsep kedua menjadi faktor penentu keseimbangan utama' },
            { key: 'C', text: 'Konsep ketiga tidak dipengaruhi oleh perubahan lingkungan' },
            { key: 'D', text: 'Semua komponen berjalan terpisah tanpa ada keterkaitan' },
          ],
          correctAnswer: 'B',
          explanation: `Pilihan B benar karena dalam ${assignedTp.scopeContent}, faktor utama menentukan ketercapaian keseimbangan sistem.`,
          scoreMax: 1,
        };
      } else {
        return {
          id,
          type: 'Uraian' as const,
          tpCode: assignedTp.code,
          materi: assignedTp.scopeContent,
          indicator: `Siswa dapat menganalisis dan menguraikan pemecahan masalah terkait ${assignedTp.scopeContent} secara komprehensif.`,
          cognitiveLevel: 'C4',
          levelLabel: 'HOTS',
          questionText: `Jelaskan secara mendalam bagaimana konsep ${assignedTp.scopeContent} dapat diterapkan untuk memecahkan permasalahan nyata yang sering ditemui peserta didik di lingkungan sekitar sekolah!`,
          correctAnswer: 'Jawaban harus memuat: (1) Identifikasi masalah nyata; (2) Penerapan konsep yang relevan; (3) Solusi alternatif yang aplikatif dan berkelanjutan.',
          explanation: 'Menganalisis kemampuan transfer pengetahuan peserta didik ke dalam konteks autentik.',
          scoreMax: 5,
        };
      }
    }),
    kartuSoal: [
      {
        noSoal: 1,
        tpCode: tp1.code,
        materi: tp1.scopeContent,
        indicator: `Disajikan stimulus mengenai ${tp1.scopeContent}, siswa dapat menentukan jawaban yang tepat.`,
        level: 'C2 (Mudah)',
        bukuSumber: `Buku Siswa ${pkg.subject} ${pkg.grade} Kemendikbudristek`,
        soalText: `Perhatikan pernyataan terkait ${tp1.scopeContent} berikut...`,
        kunciJawaban: 'B',
        pedomanPenskoran: 'Jawaban benar skor 1, jawaban salah skor 0.',
      },
      {
        noSoal: 21,
        tpCode: tp1.code,
        materi: tp1.scopeContent,
        indicator: `Siswa dapat menguraikan penerapan konsep ${tp1.scopeContent}.`,
        level: 'C4 (HOTS)',
        bukuSumber: `Buku Guru ${pkg.subject} ${pkg.grade} Kemendikbudristek`,
        soalText: `Jelaskan penerapan konsep ${tp1.scopeContent} dalam kehidupan sehari-hari!`,
        kunciJawaban: 'Uraian solusi komprehensif mencakup 3 aspek analisis.',
        pedomanPenskoran: 'Skor 5: 3 aspek lengkap dan tepat.\nSkor 3: 2 aspek tepat.\nSkor 1: 1 aspek kurang tepat.\nSkor 0: Tidak menjawab.',
      },
    ],
  };

  // Generate Question Analysis matching QuestionAnalysisItem interface
  const analysis: QuestionAnalysisItem[] = Array.from({ length: 25 }, (_, i) => {
    const no = i + 1;
    const isPg = no <= 20;
    const assignedTp = no <= 4 ? tp1 : no <= 14 ? tp2 : tp3;
    const isEasy = no % 3 === 1;
    const isMed = no % 3 === 2;

    return {
      noSoal: no,
      tpCode: assignedTp.code,
      level: isEasy ? 'C2' : isMed ? 'C3' : 'C4',
      type: isPg ? 'PG' : 'Uraian',
      difficultyIndex: isEasy ? 0.82 : isMed ? 0.62 : 0.38,
      difficultyLabel: isEasy ? 'Mudah' : isMed ? 'Sedang' : 'Sukar',
      discriminationIndex: isEasy ? 0.35 : isMed ? 0.44 : 0.49,
      discriminationLabel: 'Baik',
      distractorQuality: isPg ? 'Semua opsi distraktor dipilih proporsional' : 'Pedoman skor analitis terkalibrasi',
      verdict: 'Diterima Baik',
      recommendation: `Butir ${isPg ? 'PG' : 'Uraian'} nomor ${no} valid dan direkomendasikan untuk bank asesmen sekolah.`,
    };
  });

  const stepStatuses: { [stepNumber: number]: StepStatus } = {
    1: 'Tersimpan',
    2: 'Tersimpan',
    3: 'Tersimpan',
    4: 'Tersimpan',
    5: 'Tersimpan',
    6: 'Tersimpan',
    7: 'Tersimpan',
    8: 'Tersimpan',
    9: 'Tersimpan',
    10: 'Tersimpan',
    11: 'Tersimpan',
    12: 'Tersimpan',
    13: 'Tersimpan',
  };

  return {
    cp,
    atp,
    prota,
    promes,
    kktp,
    modules: { [primaryTp.code]: defaultModule },
    activeModuleTp: primaryTp.code,
    lkpd: { [primaryTp.code]: defaultLkpd },
    assessmentPlans,
    step12,
    analysis,
    stepStatuses,
  };
}
