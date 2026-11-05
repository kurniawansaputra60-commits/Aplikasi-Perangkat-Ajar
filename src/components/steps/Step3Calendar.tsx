import React from 'react';
import { AcademicCalendar, CalendarMonth } from '../../types';
import { Calendar, Calculator, Sparkles } from 'lucide-react';

interface Step3Props {
  calendar: AcademicCalendar;
  onChange: (updated: AcademicCalendar) => void;
}

export const Step3Calendar: React.FC<Step3Props> = ({ calendar, onChange }) => {
  const updateMonth = (idx: number, field: keyof CalendarMonth, val: any) => {
    const updatedMonths = [...calendar.months];
    updatedMonths[idx] = { ...updatedMonths[idx], [field]: val };

    const totalWeeksEff = updatedMonths.reduce((a, b) => a + (Number(b.weeksEffective) || 0), 0);
    const totalJp = totalWeeksEff * calendar.jpPerWeek;

    onChange({
      ...calendar,
      months: updatedMonths,
      totalWeeksEffective: totalWeeksEff,
      totalJpSemester: totalJp,
    });
  };

  const updateJpPerWeek = (val: number) => {
    const totalJp = calendar.totalWeeksEffective * val;
    onChange({
      ...calendar,
      jpPerWeek: val,
      totalJpSemester: totalJp,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Analisis Pekan Efektif &amp; Alokasi Jam Tatap Muka
            </h3>
            <p className="text-xs text-slate-500">
              Perhitungan otomatis tanpa perlu kalkulator. Pagu jam ini langsung disinkronkan ke Prota &amp; Promes.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-700">JP / Minggu:</span>
            <input
              type="number"
              min={1}
              max={15}
              value={calendar.jpPerWeek}
              onChange={(e) => updateJpPerWeek(parseInt(e.target.value) || 1)}
              className="w-12 text-center text-xs font-black p-1 rounded border border-indigo-400 bg-white"
            />
          </div>
        </div>

        {/* Table of Months */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-900 mb-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-900 font-bold">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3 text-center">Jumlah Pekan Total</th>
                <th className="py-2.5 px-3 text-center text-emerald-800">Pekan Efektif</th>
                <th className="py-2.5 px-3">Keterangan Pekan Tidak Efektif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calendar.months.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{m.monthName}</td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={m.weeksTotal}
                      onChange={(e) => updateMonth(idx, 'weeksTotal', parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-bold p-1 rounded border border-slate-300"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={m.weeksEffective}
                      onChange={(e) => updateMonth(idx, 'weeksEffective', parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-black text-emerald-700 bg-emerald-50 p-1 rounded border border-emerald-300"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={m.nonEffectiveDetails}
                      onChange={(e) => updateMonth(idx, 'nonEffectiveDetails', e.target.value)}
                      placeholder="Contoh: 1 pekan MPLS, 1 pekan ujian"
                      className="w-full text-xs p-1 rounded border border-slate-200"
                    />
                  </td>
                </tr>
              ))}
              {/* Total Summary Row */}
              <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900">
                <td colSpan={2} className="py-3 px-3 text-center">
                  TOTAL REKAPITULASI
                </td>
                <td className="py-3 px-3 text-center">
                  {calendar.months.reduce((a, b) => a + b.weeksTotal, 0)} Pekan
                </td>
                <td className="py-3 px-3 text-center text-emerald-800 text-sm">
                  {calendar.totalWeeksEffective} Pekan Efektif
                </td>
                <td className="py-3 px-3 text-indigo-700 text-sm">
                  Total Jam Pelajaran = {calendar.totalWeeksEffective} x {calendar.jpPerWeek} JP ={' '}
                  <span className="underline decoration-indigo-400 font-black">
                    {calendar.totalJpSemester} JP Riil
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
          <span className="font-bold">Catatan PPA 2025:</span> Pagu alokasi jam tatap muka ini adalah batas riil
          untuk penuntasan seluruh Tujuan Pembelajaran (TP) pada semester berjalan.
        </div>
      </div>
    </div>
  );
};
