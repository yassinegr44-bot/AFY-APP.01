import { FileText, Archive, TrendingUp, Table } from 'lucide-react';
import { AppData } from '../types';
import { generateStatisticsPDF } from '../utils/pdf';

interface ReportsProps {
  data: AppData;
  onNavigate: (screen: string) => void;
}

export function Reports({ data, onNavigate }: ReportsProps) {
  return (
    <div className="space-y-6 pb-24">
      <section className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Rapports & Archives</h1>
      </section>

      {/* SECTION 1: Rapport Statistique */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp size={16} /> Rapport Statistique / Activité
        </h2>
        <p className="text-sm text-slate-600 mb-4">Vue d'ensemble mensuelle: entrées, sorties, prises en charge et indicateurs clés.</p>
        <button 
          onClick={() => generateStatisticsPDF(data)}
          className="bg-[#006050] dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          Générer le rapport statistique
        </button>
      </div>

      {/* SECTION 2: Registre Complet */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Table size={16} /> Registre Complet des Dossiers (Archive)
        </h2>
        <p className="text-sm text-slate-600 mb-4">Export complet et détaillé de tous les dossiers archivés dans la base de données.</p>
        <button 
          onClick={() => onNavigate('archive-view')}
          className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Archive size={16} /> Générer le registre complet
        </button>
      </div>
    </div>
  );
}
