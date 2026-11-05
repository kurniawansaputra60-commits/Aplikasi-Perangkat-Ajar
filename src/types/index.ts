export type StepStatus = 'Tersimpan' | 'Draf' | 'Perlu Ditinjau' | 'Belum Dibuat';

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  address: string;
  village: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  teacherName: string;
  teacherNip: string;
  teacherRank: string;
  documentCity: string;
  documentDate: string;
  academicYear: string;
  semester: string;
}

export interface TeachingPackage {
  id: string;
  name: string;
  subject: string;
  grade: string;
  phase: string;
  level: string;
  themeTopic: string;
  targetHourPerWeek: number;
}

export interface CalendarMonth {
  monthName: string;
  weeksTotal: number;
  weeksEffective: number;
  nonEffectiveDetails: string;
}

export interface AcademicCalendar {
  semesterName: string;
  months: CalendarMonth[];
  jpPerWeek: number;
  totalWeeksEffective: number;
  totalJpSemester: number;
  notes: string;
}

export interface CpElement {
  id: string;
  name: string;
  cpText: string;
  matchesSubject: boolean;
  notes?: string;
}

export interface CapaianPembelajaranData {
  officialSource: string;
  generalDescription: string;
  phase: string;
  elements: CpElement[];
  isVerified: boolean;
}

export interface AtpItem {
  id: string;
  code: string;
  scopeContent: string;
  learningObjective: string;
  graduateDimensions: string[];
  allocatedJp: number;
  semester: '1' | '2';
  keywords: string;
  status: StepStatus;
}

export interface ProtaItem {
  semester: '1' | '2';
  tpCode: string;
  material: string;
  allocatedJp: number;
}

export interface PromesWeek {
  monthIndex: number;
  weekIndex: number;
  allocatedJp: number;
  isHoliday?: boolean;
  holidayNote?: string;
}

export interface PromesRow {
  tpCode: string;
  material: string;
  totalJp: number;
  weeks: { [key: string]: number }; // e.g. "m0_w1": 5
}

export interface KktpInterval {
  range: string;
  predicate: string;
  description: string;
  followUp: string;
}

export interface KktpRubricItem {
  tpCode: string;
  indicator: string;
  needGuidance: string;
  fair: string;
  good: string;
  excellent: string;
}

export interface KktpData {
  modelType: 'interval' | 'rubric' | 'description';
  passingGrade: number;
  intervals: KktpInterval[];
  rubricItems: KktpRubricItem[];
  descriptionCriteria: { tpCode: string; criteriaText: string; minimumTarget: string }[];
}

export interface DeepLearningModule {
  tpId: string;
  tpCode: string;
  tpText: string;
  topicTitle: string;
  totalMeetings: number;
  allocatedJp: number;
  
  // Klik 1: Identifikasi
  step1: {
    studentCharacteristics: string;
    initialKnowledge: string;
    learningNeedsAndInterests: string;
    subjectKnowledgeType: string;
    realWorldRelevance: string;
    difficultyAndStructure: string;
    selectedDimensions: string[];
    dimensionsContext: string;
  };

  // Klik 2: Desain Pembelajaran
  step2: {
    cpStatement: string;
    crossDisciplinary: string;
    meetingObjectives: { meeting1: string; meeting2: string; meeting3?: string };
    pedagogicalPractices: string;
    guidingQuestions: string;
    partnershipsAndEnvironment: string;
  };

  // Klik 3: Pengalaman Belajar
  step3: {
    mindfulBeginning: string;
    meaningfulCoreUnderstand: string;
    joyfulCoreApply: string;
    reflectiveCoreReflect: string;
    closingSummary: string;
  };

  // Klik 4: Asesmen
  step4: {
    initialDiagnostic: string;
    processAssessment: string;
    finalAssessmentTypes: string[];
    finalAssessmentDesc: string;
  };

  // Klik 5: KKTP & Lampiran
  step5: {
    kktpCriteria: string;
    remedialAndEnrichment: string;
    reflectionStudentTeacher: string;
    diagnosticQuestions: { question: string; answerKey: string }[];
    processChecklist: string;
    finalQuestions: { question: string; rubric: string; scoreMax: number }[];
  };

  clicksCompleted: {
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
    5: boolean;
  };
}

export interface LkpdData {
  tpCode: string;
  title: string;
  groupType: 'Individu' | 'Kelompok (4-5 siswa)';
  estimatedTime: string;
  contextualStimulus: string;
  toolsAndMaterials: string[];
  investigationSteps: string[];
  tableHeaders: string[];
  tableRows: string[][];
  discussionQuestions: string[];
  reflectionPrompt: string;
}

export interface AssessmentPlanItem {
  type: 'Awal (Diagnostik)' | 'Proses (Formatif)' | 'Akhir (Sumatif)';
  tpCode: string;
  technique: string;
  instrument: string;
  timing: string;
  details: string;
}

export interface QuestionItem {
  id: number;
  type: 'PG' | 'Uraian';
  tpCode: string;
  materi: string;
  indicator: string;
  cognitiveLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  levelLabel: 'Mudah' | 'Sedang' | 'HOTS';
  questionText: string;
  options?: { key: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
  correctAnswer: string;
  explanation: string;
  scoreMax: number;
}

export interface KartuSoalItem {
  noSoal: number;
  tpCode: string;
  materi: string;
  indicator: string;
  level: string;
  bukuSumber: string;
  soalText: string;
  kunciJawaban: string;
  pedomanPenskoran: string;
}

export interface KisiKisiMatrixItem {
  tpCode: string;
  materi: string;
  levelEasy_C1C2: number;
  levelMedium_C3: number;
  levelHots_C4C6: number;
  noSoalPg: string;
  noSoalUraian: string;
  totalButir: number;
  totalBobot: number;
}

export interface Step12Data {
  assessmentName: string;
  assessmentType: string;
  countPg: number;
  countEssay: number;
  optionsCount: '4 opsi (A-D)' | '5 opsi (A-E)';
  maxScorePerEssay: number;
  matrix: KisiKisiMatrixItem[];
  questions: QuestionItem[];
  kartuSoal: KartuSoalItem[];
  click1Done: boolean;
  click2Done: boolean;
  click3Done: boolean;
}

export interface QuestionAnalysisItem {
  noSoal: number;
  tpCode: string;
  level: string;
  type: 'PG' | 'Uraian';
  difficultyIndex: number; // 0.0 - 1.0
  difficultyLabel: 'Mudah' | 'Sedang' | 'Sukar';
  discriminationIndex: number; // -1.0 to 1.0
  discriminationLabel: 'Jelek' | 'Cukup' | 'Baik' | 'Sangat Baik';
  distractorQuality: string;
  verdict: 'Diterima Baik' | 'Perlu Direvisi' | 'Dibuang / Diganti';
  recommendation: string;
}

export interface RegulationReference {
  id: string;
  code: string;
  title: string;
  description: string;
  checkedDate: string;
  isChecked: boolean;
}

export interface AppState {
  currentStep: number;
  activePackageId: string;
  packages: TeachingPackage[];
  profile: SchoolProfile;
  calendar: AcademicCalendar;
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
  regulations: RegulationReference[];
  lastSavedAt: string;
}
