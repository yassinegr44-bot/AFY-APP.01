import { useState } from 'react';
import { Search, ChevronRight, Download, FileText, ArrowLeft } from 'lucide-react';
import { AppData, DeceasedRecord } from '../types';
import { generateDossiersPDF } from '../utils/pdf';

interface ArchiveViewProps {
  data: AppData;
  onNavigate: (screen: string) => void;
  onSelectDeceased: (id: string) => void;
}

export function ArchiveView({ data, onNavigate, onSelectDeceased }: ArchiveViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const filteredDeceased = data.deceased.filter((d: DeceasedRecord) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.refNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: DeceasedRecord, b: DeceasedRecord) => b.admissionDate.toMillis() - a.admissionDate.toMillis());

  const handleQuickDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      generateDossiersPDF(filteredDeceased.length > 0 ? filteredDeceased : data.deceased);
      setIsExporting(false);
    }, 200);
  };

  return (
    <div className="space-y-6 pb-24">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Registre Complet des Dossiers</h1>
          <p className="text-xs text-slate-500">{data.deceased.length} dossiers archivés au total</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => onNavigate('reports')}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={16} /> Retour
          </button>
          <button 
            onClick={handleQuickDownload}
            disabled={isExporting || data.deceased.length === 0}
            className="bg-[#006050] hover:bg-[#004d40] text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50">
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download size={16} />
                Exporter PDF ({filteredDeceased.length})
              </>
            )}
          </button>
          <button 
            onClick={() => onNavigate('archive-pdf-generator')}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors">
            <FileText size={16} /> Vue Détaillée
          </button>
        </div>
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par nom ou référence..." 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-xs font-black">
            <tr>
              <th className="px-6 py-4 text-left">Référence</th>
              <th className="px-6 py-4 text-left">Nom Complet</th>
              <th className="px-6 py-4 text-left">Position</th>
              <th className="px-6 py-4 text-left">État</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDeceased.map((d: DeceasedRecord) => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">#{d.refNumber}</td>
                <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{d.name}</td>
                <td className="px-6 py-4 text-slate-500">
                  {d.fridgePosition && d.fridgePosition !== -1 
                    ? `FRIGO-${d.fridgePosition.toString().padStart(2, '0')}` 
                    : 'Frigo Inconnu'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${d.status === 'released' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                    {d.status === 'released' ? 'Sorti' : 'Admis'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelectDeceased(d.id)}
                    className="p-2 text-slate-400 hover:text-[#006050] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Voir les détails"
                  >
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDeceased.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-medium">Aucun dossier trouvé correspondant à votre recherche.</div>
        )}
      </div>
    </div>
  );
}
