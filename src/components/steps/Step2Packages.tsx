import React from 'react';
import { TeachingPackage } from '../../types';
import { BookOpen, Copy, Plus, Check } from 'lucide-react';

interface Step2Props {
  packages: TeachingPackage[];
  activePackageId: string;
  onSelectPackage: (pkgId: string) => void;
  onOpenPackageModal: () => void;
}

export const Step2Packages: React.FC<Step2Props> = ({
  packages,
  activePackageId,
  onSelectPackage,
  onOpenPackageModal,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Daftar Paket Mengajar &amp; Rombongan Belajar
            </h3>
            <p className="text-xs text-slate-500">
              Satu berkas menampung banyak kelas dan mapel. Ganti paket dengan 1 kali klik.
            </p>
          </div>
          <button
            onClick={onOpenPackageModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah / Gandakan Paket</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {packages.map((pkg) => {
            const isActive = pkg.id === activePackageId;
            return (
              <div
                key={pkg.id}
                onClick={() => onSelectPackage(pkg.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-300 bg-white hover:border-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-black text-xs text-slate-900">{pkg.name}</span>
                    {isActive ? (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> AKTIF
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">Klik untuk beralih</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-indigo-900">{pkg.subject}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Jenjang: {pkg.level} · {pkg.grade}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 italic line-clamp-1">
                    Fokus: {pkg.themeTopic}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Alokasi Jam Belajar:</span>
                  <span className="font-bold text-indigo-700">{pkg.targetHourPerWeek} JP / Pekan</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
