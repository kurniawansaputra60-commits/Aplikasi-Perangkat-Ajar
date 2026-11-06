import React from 'react';
import { AtpItem } from '../../types';
import { Sparkles } from 'lucide-react';

interface DerivedAtpDraftProps {
  items: AtpItem[];
  packageName: string;
}

export const DerivedAtpDraft: React.FC<DerivedAtpDraftProps> = ({ items, packageName }) => {
  if (!items.length) return null;

  return (
    <section className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 shadow-sm" aria-labelledby="derived-atp-title">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
        <div>
          <h3 id="derived-atp-title" className="text-sm font-black text-amber-950">
            Draf CP Turunan dari ATP
          </h3>
          <p className="text-xs text-amber-900 mt-1">
            Paket aktif: <strong>{packageName}</strong>. Ini adalah draf tujuan pembelajaran yang disinkronkan dari Langkah 5, bukan CP resmi. CP resmi di atas tetap dipertahankan.
          </p>
        </div>
      </div>

      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="bg-white border border-amber-200 rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-xs font-black text-amber-950">{item.code} · {item.scopeContent}</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">DRAF · Semester {item.semester}</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">{item.learningObjective}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};
