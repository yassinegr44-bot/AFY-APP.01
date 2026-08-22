import { useState } from 'react';
import { DossierPrintable } from '../components/DossierPrintable';
import { AppData, DeceasedRecord } from '../types';
import { generateDossiersPDF } from '../utils/pdf';
import { Download, ArrowLeft, CheckCircle2, FileText, Search, Filter, X, ArrowUpRight } from 'lucide-react';

interface ArchivePDFGeneratorProps {
  data: AppData;
  onNavigate: (screen: string) => void;
}

export function ArchivePDFGenerator({ data, onNavigate }: ArchivePDFGeneratorProps) {
  const { deceased = [], users = [] } = data || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_facility' | 'released'>('all');

  const filteredRecords = deceased.filter((d: DeceasedRecord) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.cause && d.cause.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.fridgePosition && `frigo-${d.fridgePosition}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.takingChargeResponsibleName && d.takingChargeResponsibleName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a: DeceasedRecord, b: DeceasedRecord) => b.admissionDate.toMillis() - a.admissionDate.toMillis());

  const handleGeneratePDF = async (recordsToExport: DeceasedRecord[]) => {
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);
      
      setTimeout(() => {
        generateDossiersPDF(recordsToExport.length > 0 ? recordsToExport : deceased, users);
        setIsGenerating(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      }, 200);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  const scrollToDossier = (id: string) => {
    const el = document.getElementById(`dossier-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Action Header Banner */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('archive-view')} 
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-2 font-bold text-sm"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText size={20} className="text-[#006050]" />
              Registre & Recherche de Dossiers ({deceased.length} dossiers au total)
            </h1>
            <p className="text-xs text-slate-500">
              Recherchez un dossier, accédez-y directement, ou téléchargez le PDF complet interactif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {searchQuery && (
            <button 
              onClick={() => handleGeneratePDF(filteredRecords)}
              disabled={isGenerating || filteredRecords.length === 0}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Download size={15} />
              Exporter Résultats ({filteredRecords.length})
            </button>
          )}

          <button 
            onClick={() => handleGeneratePDF(deceased)}
            disabled={isGenerating || deceased.length === 0}
            className="bg-[#006050] hover:bg-[#004d40] text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download size={18} />
                Télécharger Registre PDF ({deceased.length})
              </>
            )}
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="no-print bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          Le fichier PDF complet a été téléchargé avec succès sur votre appareil.
        </div>
      )}

      {/* Barre de Recherche Rapide & Filtres */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par Nom, Prénom, Réf (#2026-...), Frigo (ex: FRIGO-03), Cause..." 
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006050]/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <Filter size={16} className="text-slate-400 mr-1 hidden md:inline" />
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === 'all' ? 'bg-[#006050] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              Tous ({deceased.length})
            </button>
            <button 
              onClick={() => setStatusFilter('in_facility')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === 'in_facility' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              Admis ({deceased.filter(d => d.status === 'in_facility').length})
            </button>
            <button 
              onClick={() => setStatusFilter('released')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === 'released' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              Libérés ({deceased.filter(d => d.status === 'released').length})
            </button>
          </div>
        </div>

        {/* Raccourcis / Index cliquable rapide vers chaque dossier */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {filteredRecords.length} dossier{filteredRecords.length > 1 ? 's' : ''} trouvé{filteredRecords.length > 1 ? 's' : ''} — Cliquez pour accéder :
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {filteredRecords.map((d, index) => (
              <button 
                key={d.id} 
                onClick={() => scrollToDossier(d.id)}
                className="p-2.5 text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-[#006050]/10 dark:hover:bg-[#006050]/20 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center justify-between group"
              >
                <div className="truncate mr-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#006050] dark:group-hover:text-emerald-400 truncate">
                    #{d.refNumber} {d.name}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {d.fridgePosition && d.fridgePosition !== -1 
                      ? `FRIGO-${d.fridgePosition.toString().padStart(2, '0')}` 
                      : 'Frigo Inconnu'}
                  </span>
                </div>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#006050] dark:group-hover:text-emerald-400 flex-shrink-0" />
              </button>
            ))}

            {filteredRecords.length === 0 && (
              <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">
                Aucun dossier ne correspond à "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fiches Complètes Détaillées */}
      <div className="space-y-6">
        {filteredRecords.map((d) => (
          <div key={d.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <DossierPrintable record={d} users={users} />
          </div>
        ))}
      </div>
    </div>
  );
}
