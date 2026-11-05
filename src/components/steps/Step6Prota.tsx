import React from 'react';
import { ProtaItem, AppState } from '../../types';
import { CalendarRange, Plus, Trash2 } from 'lucide-react';

interface Step6Props {
  prota: ProtaItem[];
  onChange: (updated: ProtaItem[]) => void;
  appState: AppState;
}

export const Step6Prota: React.FC<Step6Props> = ({ prota, onChange, appState }) => {
  const activePkg =
    appState.packages.find((p) => p.id === appState.activePackageId) || appState.packages[0];

  const sem1 = prota.filter((p) => p.semester === '1');
  const sem2 = prota.filter((p) => p.semester === '2');

  const totalSem1 = sem1.reduce((a, b) => a + (Number(b.allocatedJp) || 0), 0);
  const totalSem2 = sem2.reduce((a, b) => a + (Number(b.allocatedJp) || 0), 0);

  const updateItem = (globalIdx: number, field: keyof ProtaItem, val: any) => {
    const updated = [...prota];
    updated[globalIdx] = { ...updated[globalIdx], [field]: val };
    onChange(updated);
  };

  const syncFromAtp = () => {
    const newItems: ProtaItem[] = appState.atp.map((item, idx) => ({
      semester: idx < 4 ? '1' : '2',
      tpCode: item.code,
      material: item.scopeContent,
      allocatedJp: item.allocatedJp,
    }));
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-indigo-600" />
              Program Tahunan (Prota) Otomatis
            </h3>
            <p className="text-xs text-slate-500">
              Distribusi alokasi materi per semester untuk Tahun Ajaran {appState.profile.academicYear}.
            </p>
          </div>
          <button
            onClick={syncFromAtp}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300"
          >
            🔄 Sinkronkan Ulang dari ATP
          </button>
        </div>

        {/* Table Prota */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 mb-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3">Kode TP</th>
                <th className="py-2.5 px-3">Materi Pokok Pembelajaran</th>
                <th className="py-2.5 px-3 text-center">Alokasi Waktu (JP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prota.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-700">
                    <select
                      value={item.semester}
                      onChange={(e) => updateItem(idx, 'semester', e.target.value as any)}
                      className="p-1 rounded border border-slate-200 bg-white"
                    >
                      <option value="1">Semester 1 (Ganjil)</option>
                      <option value="2">Semester 2 (Genap)</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 font-bold text-indigo-700">
                    <input
                      type="text"
                      value={item.tpCode}
                      onChange={(e) => updateItem(idx, 'tpCode', e.target.value)}
                      className="w-16 p-1 rounded border border-slate-200 text-xs font-bold"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.material}
                      onChange={(e) => updateItem(idx, 'material', e.target.value)}
                      className="w-full p-1 rounded border border-slate-200 text-xs"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.allocatedJp}
                      onChange={(e) => updateItem(idx, 'allocatedJp', parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-bold p-1 rounded border border-slate-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <td colSpan={3} className="py-2 px-3 text-right">
                  Subtotal Semester 1:
                </td>
                <td className="py-2 px-3 text-center text-emerald-800">{totalSem1} JP</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={3} className="py-2 px-3 text-right">
                  Subtotal Semester 2:
                </td>
                <td className="py-2 px-3 text-center text-emerald-800">{totalSem2} JP</td>
              </tr>
              <tr className="bg-indigo-50 font-black text-indigo-900 border-t-2 border-slate-900">
                <td colSpan={3} className="py-2.5 px-3 text-center text-xs">
                  TOTAL WAKTU SATU TAHUN AJARAN
                </td>
                <td className="py-2.5 px-3 text-center text-sm font-black text-indigo-700">
                  {totalSem1 + totalSem2} JP
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
