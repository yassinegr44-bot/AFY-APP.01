import { FileText, Archive, TrendingUp, Table, Calendar, ArrowLeft, ArrowRightLeft, BarChart3, FileDown, ChevronRight } from 'lucide-react';
import { AppData, DeceasedRecord, ReportConfig } from '../types';
import { generateStatisticsPDF, generateDossiersPDF } from '../utils/pdf';
import { useState, useMemo } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { cn, safeDate } from '../lib/utils';

interface ReportsProps {
  data: AppData;
  onNavigate: (screen: string) => void;
}

export function Reports({ data, onNavigate }: ReportsProps) {
  const { deceased = [], amputees = [] } = data || {};
  const [view, setView] = useState<'menu' | 'selection' | 'exploration'>('menu');
  const [reportType, setReportType] = useState<'statistical' | 'full_register'>('statistical');
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    startDate: '',
    endDate: '',
  });

  // Filtered Data
  const filteredData = useMemo(() => {
    let filteredDeceased = [...deceased];
    let filteredAmputees = [...amputees];

    if (reportConfig.startDate || reportConfig.endDate) {
      try {
        const start = reportConfig.startDate ? startOfDay(parseISO(reportConfig.startDate)) : new Date(0);
        const end = reportConfig.endDate ? endOfDay(parseISO(reportConfig.endDate)) : new Date();

        filteredDeceased = deceased.filter(d => {
          const admDate = safeDate(d.admissionDate);
          return admDate && isWithinInterval(admDate, { start, end });
        });

        filteredAmputees = amputees.filter(a => {
          const ampDate = safeDate(a.amputationDateTime);
          return ampDate && isWithinInterval(ampDate, { start, end });
        });
      } catch (err) {
        console.error("Filter error:", err);
      }
    }

    return {
      deceased: filteredDeceased,
      amputees: filteredAmputees,
    };
  }, [deceased, amputees, reportConfig.startDate, reportConfig.endDate]);

  const handleDownloadReport = async (reportFormat: 'csv' | 'pdf') => {
    const dataToUse = view === 'exploration' ? filteredData : data;
    const configToUse = view === 'exploration' ? reportConfig : undefined;

    if (reportFormat === 'pdf') {
      if (reportType === 'statistical') {
        generateStatisticsPDF(dataToUse, configToUse);
      } else {
        const records = view === 'exploration' ? filteredData.deceased : deceased;
        generateDossiersPDF(records, data.users);
      }
      return;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-[#006050]/20 p-2 rounded-xl text-[#006050] dark:text-emerald-400">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Rapports</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Centre de Documentation</p>
          </div>
        </div>
        {view !== 'menu' && (
          <button
            onClick={() => setView('menu')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={14} className="inline mr-2" />
            Menu
          </button>
        )}
      </div>

      {view === 'menu' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-[#006050] dark:text-emerald-400 mx-auto mb-6">
              <FileDown size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Exploration des rapports</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto font-medium">
              Générez des rapports institutionnels filtrés par période pour le registre ou les statistiques.
            </p>
            <button 
              onClick={() => setView('selection')}
              className="px-10 py-4 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#006050]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Explorer un rapport
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400">
                  <Archive size={18} />
                </div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Archives</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed mb-4">
                Accédez à l'historique complet des dossiers pour une consultation détaillée.
              </p>
              <button 
                onClick={() => onNavigate('archive-view')}
                className="text-[10px] font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
              >
                Accéder au registre <ChevronRight size={12} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400">
                  <TrendingUp size={18} />
                </div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Statistiques</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed mb-4">
                Consultez le dashboard analytique interactif de la morgue.
              </p>
              <button 
                onClick={() => onNavigate('statistics')}
                className="text-[10px] font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
              >
                Voir les stats <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'selection' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-[#006050] dark:text-emerald-400">
                <FileDown size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Choisir le type de rapport</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setReportType('full_register')}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2",
                  reportType === 'full_register'
                    ? "border-[#006050] bg-emerald-50/50 dark:bg-[#006050]/10"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-1",
                  reportType === 'full_register' ? "bg-[#006050] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  <Table size={20} />
                </div>
                <span className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">Rapport de registre complet</span>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">Liste détaillée de tous les dossiers archivés avec informations complètes.</p>
              </button>

              <button
                onClick={() => setReportType('statistical')}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2",
                  reportType === 'statistical'
                    ? "border-[#006050] bg-emerald-50/50 dark:bg-[#006050]/10"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-1",
                  reportType === 'statistical' ? "bg-[#006050] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  <BarChart3 size={20} />
                </div>
                <span className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">Rapport statistique</span>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">Analyses consolidées, graphiques de flux et indicateurs de performance.</p>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Période du Rapport</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Du</label>
                <input
                  type="date"
                  value={reportConfig.startDate}
                  onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#006050]/20 focus:border-[#006050] transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Au</label>
                <input
                  type="date"
                  value={reportConfig.endDate}
                  onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#006050]/20 focus:border-[#006050] transition-all outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
              <div className={cn(
                "text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full",
                filteredData.deceased.length > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
              )}>
                {filteredData.deceased.length} dossier(s) trouvé(s)
              </div>
              <button 
                onClick={() => setReportConfig({ startDate: '', endDate: '' })}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </section>

          <button 
            onClick={() => setView('exploration')}
            className="w-full py-5 bg-[#006050] dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#006050]/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            Prévisualiser / Explorer
            <ArrowRightLeft size={16} />
          </button>
        </div>
      )}

      {view === 'exploration' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-[#006050] dark:text-emerald-400">
                {reportType === 'statistical' ? <BarChart3 size={20} /> : <Table size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                  {reportType === 'statistical' ? 'Aperçu Statistique' : 'Aperçu du Registre'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  Période : {reportConfig.startDate || 'Origine'} au {reportConfig.endDate || 'Ce jour'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setView('selection')}
                className="flex-1 sm:flex-none px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Modifier Filtres
              </button>
              <button 
                onClick={() => handleDownloadReport('pdf')}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#006050]/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <FileDown size={14} />
                Télécharger PDF
              </button>
            </div>
          </div>

          {/* Simple preview list if register, or statistics if statistical */}
          {reportType === 'full_register' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Référence</th>
                      <th className="px-6 py-4 text-left">Nom Complet</th>
                      <th className="px-6 py-4 text-left">Date Adm.</th>
                      <th className="px-6 py-4 text-left">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredData.deceased.map((d: DeceasedRecord) => {
                      const admDate = safeDate(d.admissionDate);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-100">#{d.refNumber}</td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">{d.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {admDate ? format(admDate, 'dd/MM/yyyy') : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${d.status === 'released' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                              {d.status === 'released' ? 'Sorti' : 'Admis'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredData.deceased.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun dossier trouvé.</div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center shadow-sm">
              <TrendingUp size={48} className="mx-auto mb-4 text-[#006050] opacity-20" />
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Analyse Statistique Générée</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                L'aperçu statistique complet est disponible via l'exportation PDF. Vous pouvez également consulter le Dashboard interactif pour explorer ces données en temps réel.
              </p>
              <button 
                onClick={() => onNavigate('statistics')}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Aller aux Statistiques
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
