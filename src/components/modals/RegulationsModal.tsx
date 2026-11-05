import React, { useState } from 'react';
import { X, CheckSquare, Square, Plus, Scale } from 'lucide-react';
import { RegulationReference } from '../../types';

interface RegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  regulations: RegulationReference[];
  onToggleRegulation: (id: string) => void;
  onAddRegulation: (newReg: RegulationReference) => void;
}

export const RegulationsModal: React.FC<RegulationsModalProps> = ({
  isOpen,
  onClose,
  regulations,
  onToggleRegulation,
  onAddRegulation,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    onAddRegulation({
      id: 'reg-' + Date.now(),
      code: code.trim(),
      title: title.trim(),
      description: desc.trim() || 'Regulasi acuan tambahan satuan pendidikan.',
      checkedDate: '26 Oktober 2026',
      isChecked: true,
    });

    setCode('');
    setTitle('');
    setDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border-2 border-slate-900 w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-100 text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          Acuan Hukum &amp; Regulasi Terkini
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Seluruh rumusan perangkat ajar diaudit berkala sesuai regulasi resmi Kemendikdasmen &amp; BSKAP.
          Acuan dicek per <strong>26 Oktober 2026</strong>. Bisa dicentang atau ditambah sendiri.
        </p>

        {/* List of Regulations */}
        <div className="space-y-2.5 mb-6">
          {regulations.map((reg) => (
            <div
              key={reg.id}
              onClick={() => onToggleRegulation(reg.id)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                reg.isChecked
                  ? 'bg-white border-slate-900 shadow-xs'
                  : 'bg-slate-100/70 border-slate-300 opacity-60'
              }`}
            >
              <div className="mt-0.5 text-indigo-600 flex-shrink-0">
                {reg.isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900">{reg.code}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{reg.checkedDate}</span>
                </div>
                <div className="text-xs font-semibold text-indigo-900 mt-0.5">{reg.title}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{reg.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Regulation Form */}
        <div className="p-4 rounded-xl bg-white border-2 border-slate-900">
          <h4 className="text-xs font-black text-slate-900 uppercase mb-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            Tambah Acuan Hukum / Perda / SK Sekolah Sendiri
          </h4>
          <form onSubmit={handleAdd} className="space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nomor Regulasi (contoh: SK Kadisdik No. 45/2026)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Judul / Pokok Regulasi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Deskripsi singkat relevansi dengan perangkat ajar"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg border-2 border-slate-900 shadow-sm transition active:translate-y-0.5"
              >
                + Tambah Regulasi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
