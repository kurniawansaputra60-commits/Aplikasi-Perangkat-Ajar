import React from 'react';
import { PromesRow, AppState } from '../../types';
import { CalendarDays, Wand2 } from 'lucide-react';

interface Step7Props {
  promes: PromesRow[];
  onChange: (updated: PromesRow[]) => void;
  appState: AppState;
}

export const Step7Promes: React.FC<Step7Props> = ({ promes, onChange, appState }) => {
  const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const handleCellChange = (rowIdx: number, key: string, val: number) => {
    const updated = [...promes];
    const newWeeks = { ...updated[rowIdx].weeks, [key]: val };
    updated[rowIdx] = { ...updated[rowIdx], weeks: newWeeks };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Program Semester (Promes) Matriks Mingguan
            </h3>
            <p className="text-xs text-slate-500">
              Sebaran materi TP per pekan tatap muka (5 JP per pertemuan). Hari libur terlewati otomatis.
            </p>
          </div>
        </div>

        {/* Promes Matrix Table */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 mb-4">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 text-center font-bold">
                <th rowSpan={2} className="py-2 px-2 text-left w-16 border-r border-slate-300">
                  TP
                </th>
                <th rowSpan={2} className="py-2 px-3 text-left border-r border-slate-300">
                  Materi Pokok
                </th>
                <th rowSpan={2} className="py-2 px-2 border-r border-slate-300 w-14">
                  Jml JP
                </th>
                {months.map((m, mIdx) => (
                  <th
                    key={m}
                    colSpan={mIdx === 0 || mIdx === 3 ? 5 : 4}
                    className="py-1 px-1 border-r border-slate-300 text-[11px]"
                  >
                    {m}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-200/80 text-[10px] text-slate-700 border-b border-slate-300">
                {/* Juli (5) */}
                <th className="w-6 py-1">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6">4</th><th className="w-6 border-r border-slate-300">5</th>
                {/* Agustus (4) */}
                <th className="w-6">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6 border-r border-slate-300">4</th>
                {/* September (4) */}
                <th className="w-6">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6 border-r border-slate-300">4</th>
                {/* Oktober (5) */}
                <th className="w-6">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6">4</th><th className="w-6 border-r border-slate-300">5</th>
                {/* November (4) */}
                <th className="w-6">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6 border-r border-slate-300">4</th>
                {/* Desember (4) */}
                <th className="w-6">1</th><th className="w-6">2</th><th className="w-6">3</th><th className="w-6">4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {promes.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 font-bold text-indigo-700 border-r border-slate-300">
                    {row.tpCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-300">
                    {row.material}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-800 border-r border-slate-300">
                    {row.totalJp}
                  </td>

                  {/* Juli weeks */}
                  <td className="text-center bg-slate-100 text-slate-400">L</td>
                  <td className="text-center bg-slate-100 text-slate-400">L</td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m0_w3'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm0_w3', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m0_w4'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm0_w4', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center border-r border-slate-300"></td>

                  {/* Agustus weeks */}
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m1_w1'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm1_w1', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m1_w2'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm1_w2', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m1_w3'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm1_w3', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center border-r border-slate-300">
                    <input
                      type="text"
                      value={row.weeks['m1_w4'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm1_w4', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>

                  {/* September weeks */}
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m2_w1'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm2_w1', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m2_w2'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm2_w2', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center bg-amber-50 text-amber-800 text-[10px] font-bold">PTS</td>
                  <td className="text-center border-r border-slate-300"></td>

                  {/* Oktober weeks */}
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m3_w1'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm3_w1', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="text"
                      value={row.weeks['m3_w2'] || ''}
                      onChange={(e) => handleCellChange(rIdx, 'm3_w2', parseInt(e.target.value) || 0)}
                      className="w-6 text-center font-bold text-xs p-0.5 rounded bg-transparent"
                    />
                  </td>
                  <td className="text-center"></td>
                  <td className="text-center"></td>
                  <td className="text-center border-r border-slate-300"></td>

                  {/* November weeks */}
                  <td className="text-center"></td><td className="text-center"></td><td className="text-center"></td>
                  <td className="text-center border-r border-slate-300"></td>

                  {/* Desember weeks */}
                  <td className="text-center bg-indigo-50 text-indigo-800 text-[10px] font-bold">PAS</td>
                  <td className="text-center bg-slate-100 text-slate-400">L</td>
                  <td className="text-center bg-slate-100 text-slate-400">L</td>
                  <td className="text-center bg-slate-100 text-slate-400">L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 inline-block text-center text-[9px] font-bold">L</span>
            <span>Libur Semester / MPLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 inline-block text-center text-[9px] font-bold">PTS</span>
            <span>Asesmen Tengah Semester</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-100 border border-indigo-300 inline-block text-center text-[9px] font-bold">PAS</span>
            <span>Asesmen Sumatif Akhir (ASAS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
