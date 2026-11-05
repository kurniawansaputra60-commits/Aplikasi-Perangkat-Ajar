import { AppState } from '../types';

export function downloadJsonFile(state: AppState, customName?: string) {
  const activePkg = state.packages.find((p) => p.id === state.activePackageId) || state.packages[0];
  const cleanSubject = activePkg.subject.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanGrade = activePkg.grade.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const defaultFilename = `perangkat-ajar-${cleanSubject}-${cleanGrade}.json`;
  const filename = customName || defaultFilename;

  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseJsonFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppState;
        if (!parsed.profile || !parsed.packages || !parsed.currentStep) {
          throw new Error('Format berkas .json tidak valid untuk Tools Perangkat Ajar.');
        }
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal membaca berkas JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk'));
    reader.readAsText(file);
  });
}
