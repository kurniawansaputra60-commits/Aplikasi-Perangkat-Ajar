import { create } from 'zustand';
import localforage from 'localforage';
import {
  AppState,
  StepStatus,
  TeachingPackage,
  SchoolProfile,
  AcademicCalendar,
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
  RegulationReference,
} from '../types';
import { defaultState } from '../data/defaultData';

// Configure IndexedDB with localforage
localforage.config({
  name: 'AplikasiPerangkatAjar',
  storeName: 'app_data',
  description: 'Penyimpanan lokal perangkat ajar kapasitas besar (IndexedDB)',
});

export interface AppStore extends AppState {
  isInitialized: boolean;
  saveStatus: 'saved' | 'saving' | 'idle';

  // Actions
  initializeStore: () => Promise<void>;
  setCurrentStep: (step: number) => void;
  setStepStatus: (step: number, status: StepStatus) => void;
  setActivePackage: (pkgId: string) => void;
  addPackage: (pkg: TeachingPackage) => void;
  clonePackage: (sourcePkgId: string, newName: string) => void;
  deletePackage: (pkgId: string) => void;
  updateProfile: (profile: SchoolProfile) => void;
  updateCalendar: (calendar: AcademicCalendar) => void;
  updateCp: (cp: CapaianPembelajaranData) => void;
  updateAtp: (atp: AtpItem[]) => void;
  updateProta: (prota: ProtaItem[]) => void;
  updatePromes: (promes: PromesRow[]) => void;
  updateKktp: (kktp: KktpData) => void;
  updateModule: (tpCode: string, mod: DeepLearningModule) => void;
  updateLkpd: (tpCode: string, lkpd: LkpdData) => void;
  updateAssessmentPlans: (plans: AssessmentPlanItem[]) => void;
  updateStep12: (step12: Step12Data) => void;
  updateAnalysis: (analysis: QuestionAnalysisItem[]) => void;
  toggleRegulation: (id: string) => void;
  addRegulation: (reg: RegulationReference) => void;
  loadState: (newState: AppState) => void;
  resetToDefault: () => void;
}

// Helper to extract pure data snapshot from AppState, stripping functions to avoid DataCloneError
export function extractPureAppState(state: any): AppState {
  return {
    currentStep: state.currentStep,
    activePackageId: state.activePackageId,
    packages: state.packages,
    profile: state.profile,
    calendar: state.calendar,
    cp: state.cp,
    atp: state.atp,
    prota: state.prota,
    promes: state.promes,
    kktp: state.kktp,
    activeModuleTp: state.activeModuleTp,
    modules: state.modules,
    lkpd: state.lkpd,
    assessmentPlans: state.assessmentPlans,
    step12: state.step12,
    analysis: state.analysis,
    stepStatuses: state.stepStatuses,
    regulations: state.regulations,
    lastSavedAt: state.lastSavedAt,
  };
}

// Debounce helper for saving to IndexedDB
let saveTimeout: any = null;
const debouncedSaveToIndexedDb = (stateSnapshot: any) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      // Destrukturisasi dan ambil HANYA properti data murni (tanpa method/fungsi aksi Zustand)
      // untuk mencegah error DataCloneError pada IndexedDB
      const pureData = extractPureAppState(stateSnapshot);

      await localforage.setItem('appState', pureData);
      // Backup to localStorage as secondary fallback
      try {
        localStorage.setItem('perangkat_ajar_state_v1_3', JSON.stringify(pureData));
      } catch (e) {
        // Ignore if localStorage quota exceeded, IndexedDB has hundreds of MBs!
      }
      useAppStore.setState({ saveStatus: 'saved' });
    } catch (err) {
      console.error('Failed to save state to IndexedDB:', err);
    }
  }, 400);
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...defaultState,
  isInitialized: false,
  saveStatus: 'saved',

  initializeStore: async () => {
    try {
      const stored = await localforage.getItem<AppState>('appState');
      if (stored && stored.profile && stored.packages) {
        set({ ...stored, isInitialized: true, saveStatus: 'saved' });
        return;
      }

      // Check localStorage fallback
      const localFallback = localStorage.getItem('perangkat_ajar_state_v1_3');
      if (localFallback) {
        const parsed = JSON.parse(localFallback);
        if (parsed.profile && parsed.packages) {
          set({ ...parsed, isInitialized: true, saveStatus: 'saved' });
          await localforage.setItem('appState', parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading from IndexedDB, using default state:', e);
    }
    set({ isInitialized: true, saveStatus: 'saved' });
  },

  setCurrentStep: (step) => {
    set({ currentStep: step });
    debouncedSaveToIndexedDb(get());
  },

  setStepStatus: (step, status) => {
    set((state) => ({
      stepStatuses: { ...state.stepStatuses, [step]: status },
    }));
    debouncedSaveToIndexedDb(get());
  },

  setActivePackage: (pkgId) => {
    set({ activePackageId: pkgId });
    debouncedSaveToIndexedDb(get());
  },

  addPackage: (pkg) => {
    set((state) => ({
      packages: [...state.packages, pkg],
      activePackageId: pkg.id,
    }));
    debouncedSaveToIndexedDb(get());
  },

  clonePackage: (sourcePkgId, newName) => {
    const src = get().packages.find((p) => p.id === sourcePkgId) || get().packages[0];
    const cloned: TeachingPackage = {
      ...src,
      id: 'pkg-' + Date.now(),
      name: newName,
    };
    set((state) => ({
      packages: [...state.packages, cloned],
      activePackageId: cloned.id,
    }));
    debouncedSaveToIndexedDb(get());
  },

  deletePackage: (pkgId) => {
    const { packages, activePackageId } = get();
    if (packages.length <= 1) return;
    const remaining = packages.filter((p) => p.id !== pkgId);
    set({
      packages: remaining,
      activePackageId: activePackageId === pkgId ? remaining[0].id : activePackageId,
    });
    debouncedSaveToIndexedDb(get());
  },

  updateProfile: (profile) => {
    set({ profile });
    debouncedSaveToIndexedDb(get());
  },

  updateCalendar: (calendar) => {
    set({ calendar });
    debouncedSaveToIndexedDb(get());
  },

  updateCp: (cp) => {
    set({ cp });
    debouncedSaveToIndexedDb(get());
  },

  updateAtp: (atp) => {
    const currentPromes = get().promes || [];

    // 1. Sinkronisasi otomatis Program Tahunan (Prota) dari ATP
    const updatedProta: ProtaItem[] = atp.map((item, idx) => {
      const defaultSemester: '1' | '2' = item.semester
        ? item.semester
        : idx < Math.ceil(atp.length / 2)
        ? '1'
        : '2';
      return {
        semester: defaultSemester,
        tpCode: item.code,
        material: item.scopeContent,
        allocatedJp: Number(item.allocatedJp) || 10,
      };
    });

    // 2. Sinkronisasi otomatis Program Semester (Promes) Matriks Mingguan
    const teachingWeeks = [
      'm0_w3', 'm0_w4',
      'm1_w1', 'm1_w2', 'm1_w3', 'm1_w4',
      'm2_w1', 'm2_w2', 'm2_w4',
      'm3_w1', 'm3_w2', 'm3_w3', 'm3_w4', 'm3_w5',
      'm4_w1', 'm4_w2', 'm4_w3', 'm4_w4',
    ];

    let currentWeekOffset = 0;
    const updatedPromes: PromesRow[] = atp.map((item) => {
      const existing = currentPromes.find((p) => p.tpCode === item.code);
      const totalJp = Number(item.allocatedJp) || 10;

      // Jika baris promes sudah ada dengan data minggu terisi, pertahankan alokasi mingguan tersebut
      if (existing && existing.weeks && Object.keys(existing.weeks).length > 0) {
        return {
          tpCode: item.code,
          material: item.scopeContent,
          totalJp,
          weeks: existing.weeks,
        };
      }

      // Distribusi otomatis seimbang per pekan tatap muka (5 JP per pertemuan)
      const weeksObj: { [key: string]: number } = {};
      let remainingJp = totalJp;
      while (remainingJp > 0 && currentWeekOffset < teachingWeeks.length) {
        const weekKey = teachingWeeks[currentWeekOffset];
        const jpForWeek = Math.min(5, remainingJp);
        weeksObj[weekKey] = jpForWeek;
        remainingJp -= jpForWeek;
        currentWeekOffset++;
      }

      return {
        tpCode: item.code,
        material: item.scopeContent,
        totalJp,
        weeks: weeksObj,
      };
    });

    set({ atp, prota: updatedProta, promes: updatedPromes });
    debouncedSaveToIndexedDb(get());
  },

  updateProta: (prota) => {
    set({ prota });
    debouncedSaveToIndexedDb(get());
  },

  updatePromes: (promes) => {
    set({ promes });
    debouncedSaveToIndexedDb(get());
  },

  updateKktp: (kktp) => {
    set({ kktp });
    debouncedSaveToIndexedDb(get());
  },

  updateModule: (tpCode, mod) => {
    set((state) => ({
      modules: { ...state.modules, [tpCode]: mod },
    }));
    debouncedSaveToIndexedDb(get());
  },

  updateLkpd: (tpCode, lkpd) => {
    set((state) => ({
      lkpd: { ...state.lkpd, [tpCode]: lkpd },
    }));
    debouncedSaveToIndexedDb(get());
  },

  updateAssessmentPlans: (plans) => {
    set({ assessmentPlans: plans });
    debouncedSaveToIndexedDb(get());
  },

  updateStep12: (step12) => {
    set({ step12 });
    debouncedSaveToIndexedDb(get());
  },

  updateAnalysis: (analysis) => {
    set({ analysis });
    debouncedSaveToIndexedDb(get());
  },

  toggleRegulation: (id) => {
    set((state) => ({
      regulations: state.regulations.map((r) =>
        r.id === id ? { ...r, isChecked: !r.isChecked } : r
      ),
    }));
    debouncedSaveToIndexedDb(get());
  },

  addRegulation: (reg) => {
    set((state) => ({
      regulations: [...state.regulations, reg],
    }));
    debouncedSaveToIndexedDb(get());
  },

  loadState: (newState) => {
    set({ ...newState, saveStatus: 'saved' });
    debouncedSaveToIndexedDb(newState);
  },

  resetToDefault: () => {
    set({ ...defaultState, saveStatus: 'saved' });
    debouncedSaveToIndexedDb(defaultState);
  },
}));
