import React, { useState } from 'react';
import { X, Copy, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { TeachingPackage } from '../../types';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: TeachingPackage[];
  activePackageId: string;
  onSelectPackage: (pkgId: string) => void;
  onAddPackage: (pkg: TeachingPackage) => void;
  onClonePackage: (sourcePkgId: string, newName: string) => void;
  onDeletePackage: (pkgId: string) => void;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  packages,
  activePackageId,
  onSelectPackage,
  onAddPackage,
  onClonePackage,
  onDeletePackage,
}) => {
  const [cloneName, setCloneName] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState(activePackageId);

  // New package form state
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('Kelas 5 (Fase C)');
  const [newTopic, setNewTopic] = useState('');
  const [newJp, setNewJp] = useState(5);

  if (!isOpen) return null;

  const handleClone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName.trim()) return;
    onClonePackage(selectedSourceId, cloneName.trim());
    setCloneName('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSubject.trim()) return;

    const newPkg: TeachingPackage = {
      id: 'pkg-' + Date.now(),
      name: newName.trim(),
      subject: newSubject.trim(),
      grade: newGrade,
      phase: newGrade.includes('Fase C') ? 'Fase C' : newGrade.includes('Fase B') ? 'Fase B' : 'Fase A',
      level: 'Sekolah Dasar (SD)',
      themeTopic: newTopic.trim() || 'Topik Esensial Semester 1',
      targetHourPerWeek: newJp,
    };

    onAddPackage(newPkg);
    setNewName('');
    setNewSubject('');
    setNewTopic('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <span>🎒</span> Kelola Paket Mengajar &amp; Gandakan Kelas
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Banyak kelas dan mapel cukup dalam satu berkas. Buat salinan untuk kelas paralel (5A ke 5B) dalam 1 detik!
        </p>

        {/* Existing Packages List */}
        <div className="mb-6 space-y-2">
          <h4 className="text-xs font-black text-slate-900 uppercase">Daftar Paket Tersimpan:</h4>
          {packages.map((pkg) => {
            const isActive = pkg.id === activePackageId;
            return (
              <div
                key={pkg.id}
                className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 transition ${
                  isActive ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{pkg.name}</span>
                    {isActive && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {pkg.subject} · {pkg.grade} · {pkg.targetHourPerWeek} JP/Minggu
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => onSelectPackage(pkg.id)}
                      className="text-xs font-bold px-3 py-1 bg-white hover:bg-slate-100 text-indigo-700 rounded-lg border border-indigo-300"
                    >
                      Pilih Paket Ini
                    </button>
                  )}
                  {packages.length > 1 && (
                    <button
                      onClick={() => onDeletePackage(pkg.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Hapus paket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Clone Section */}
        <div className="p-4 rounded-xl bg-white border-2 border-slate-900 mb-4">
          <h4 className="text-xs font-black text-slate-900 uppercase mb-1.5 flex items-center gap-1.5">
            <Copy className="w-4 h-4 text-emerald-600" />
            Gandakan Paket Mengajar (Untuk Kelas Paralel)
          </h4>
          <p className="text-[11px] text-slate-600 mb-3">
            Menyalin seluruh CP, ATP, Modul, dan Kisi-kisi dari paket yang sudah ada ke paket baru.
          </p>
          <form onSubmit={handleClone} className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  Sumber: {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nama Paket Baru (misal: IPAS Kelas 5B)"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="flex-1 min-w-[200px] p-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
            >
              Gandakan Sekarang
            </button>
          </form>
        </div>

        {/* Create New Package */}
        <div className="p-4 rounded-xl bg-white border-2 border-slate-900">
          <h4 className="text-xs font-black text-slate-900 uppercase mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Buat Paket Baru dari Nol
          </h4>
          <form onSubmit={handleCreate} className="space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Paket (misal: Matematika Kelas 5 SD)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Mata Pelajaran (misal: Matematika)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Kelas 1 (Fase A)">Kelas 1 (Fase A)</option>
                <option value="Kelas 2 (Fase A)">Kelas 2 (Fase A)</option>
                <option value="Kelas 3 (Fase B)">Kelas 3 (Fase B)</option>
                <option value="Kelas 4 (Fase B)">Kelas 4 (Fase B)</option>
                <option value="Kelas 5 (Fase C)">Kelas 5 (Fase C)</option>
                <option value="Kelas 6 (Fase C)">Kelas 6 (Fase C)</option>
                <option value="Kelas 7 (Fase D)">Kelas 7 (Fase D)</option>
              </select>
              <input
                type="text"
                placeholder="Topik/Materi Utama (opsional)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:col-span-2"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
              >
                + Tambah Paket
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
