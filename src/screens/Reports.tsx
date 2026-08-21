import { FileText, Plus, Archive, Calendar } from 'lucide-react';
import { AppData } from '../types';

interface ReportsProps {
  data: AppData;
  onNavigate: (screen: string) => void;
}

export function Reports({ data, onNavigate }: ReportsProps) {
  return (
    <div className="space-y-6 pb-24">
      <section className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Rapports & Archives</h1>
        <button 
          onClick={() => onNavigate('statistics')}
          className="bg-[#006050] dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Nouveau Rapport
        </button>
      </section>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Archive size={16} /> Archives
        </h2>
        <div className="text-center py-10 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun rapport archivé pour le moment.</p>
        </div>
      </div>
    </div>
  );
}
