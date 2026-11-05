import React from 'react';
import {
  FileCheck2,
  FolderOpen,
  BarChart3,
  BookOpen,
  Scale,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { TeachingPackage } from '../types';

interface HeaderProps {
  packages: TeachingPackage[];
  activePackageId: string;
  onSelectPackage: (pkgId: string) => void;
  onOpenPackageModal: () => void;
  onOpenFileModal: () => void;
  onOpenProgressModal: () => void;
  onOpenTutorialModal: () => void;
  onOpenRegulationsModal: () => void;
  lastSavedAt: string;
}

export const Header: React.FC<HeaderProps> = ({
  packages,
  activePackageId,
  onSelectPackage,
  onOpenPackageModal,
  onOpenFileModal,
  onOpenProgressModal,
  onOpenTutorialModal,
  onOpenRegulationsModal,
}) => {
  const activePackage = packages.find((p) => p.id === activePackageId) || packages[0];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5] border-b-2 border-slate-900 px-4 py-2.5 shadow-sm">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Acuan Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white font-black text-lg shadow-sm">
            PA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
                Tools Perangkat Ajar — Sekolah Umum
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                v1.3
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Kurikulum Merdeka &amp; Pembelajaran Mendalam · Acuan dicek per 26 Oktober 2026
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls matching screenshot */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Package Dropdown */}
          <div className="relative inline-block">
            <select
              value={activePackageId}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  onOpenPackageModal();
                } else {
                  onSelectPackage(e.target.value);
                }
              }}
              className="appearance-none bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 pr-8 rounded-lg border-2 border-slate-900 shadow-sm cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  Paket Aktif: {pkg.name}
                </option>
              ))}
              <option value="__NEW__">+ Tambah / Gandakan Paket...</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Indicator */}
          <button
            onClick={onOpenFileModal}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
            title="Data tersimpan di memori browser. Klik untuk unduh berkas .json"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>File .json Tersimpan</span>
          </button>

          {/* Buka Berkas Data */}
          <button
            onClick={onOpenFileModal}
            className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <FolderOpen className="w-4 h-4 text-amber-900" />
            <span>Buka Berkas Data</span>
          </button>

          {/* Ringkasan Progres */}
          <button
            onClick={onOpenProgressModal}
            className="flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            <span>Ringkasan Progres</span>
          </button>

          {/* Cara Pakai */}
          <button
            onClick={onOpenTutorialModal}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Cara Pakai</span>
          </button>

          {/* Acuan Hukum */}
          <button
            onClick={onOpenRegulationsModal}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
          >
            <Scale className="w-3.5 h-3.5 text-slate-600" />
            <span>Acuan Hukum</span>
          </button>
        </div>
      </div>
    </header>
  );
};
