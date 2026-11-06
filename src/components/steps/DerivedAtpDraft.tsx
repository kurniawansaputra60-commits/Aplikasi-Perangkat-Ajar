import React from 'react';
import { AtpItem } from '../../types';
import { Sparkles } from 'lucide-react';

interface DerivedAtpDraftProps {
  items: AtpItem[];
  packageName: string;
}

export const DerivedAtpDraft: React.FC<DerivedAtpDraftProps> = ({ items, packageName }) => (
  <section className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-5 shadow-sm" aria-labelledby="derived-atp-title">
    <div className="flex items-start gap-3 mb-4">
      <Sparkles className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
      <div>
        <h3 id="derived-atp-title" className="text-sm font-black text-amber-950">
          Draf ATP Turunan (hasil Langkah 5)
        </h3>
        <p className="text-xs text-amber-900 mt-1">
          Paket aktif: <strong>{packageName}</strong>. Draf ini terpisah dari CP resmi dan tidak mengubah sumber, deskripsi, atau elemen CP di atas.
        </p>
      </div>
    </div>

    {items.length > 0 ? (
      <ol className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="bg-white border border-amber-200 rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-xs font-black text-amber-950">{item.code} · {item.scopeContent}</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">DRAF · Semester {item.semester}</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">{item.learningObjective}</p>
            {item.keywords && <p className="text-[10px] text-slate-500 mt-1">Kata kunci: {item.keywords}</p>}
          </li>
        ))}
      </ol>
    ) : (
      <p className="rounded-xl border border-amber-200 bg-white p-3 text-xs text-amber-900">
        Belum ada ATP untuk ditampilkan. Buat atau sempurnakan ATP dengan AI di Langkah 5; hasilnya akan muncul di sini sebagai draf, tanpa mengganti CP resmi.
      </p>
    )}
  </section>
);
