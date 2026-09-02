import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, FileDown, Calendar, Menu, MoreVertical, User, LogOut, ArrowRightLeft, Settings2, BarChart3, ArrowLeft, Table, ChevronRight } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, safeDate } from '../lib/utils';
import { useRef, useState, useMemo } from 'react';
import { generateStatisticsPDF, generateDossiersPDF } from '../utils/pdf';
import { ReportConfig, DeceasedRecord } from '../types';

interface StatisticsProps {
  data: any;
  onNavigate: (screen: string) => void;
}

export function Statistics({ data, onNavigate }: StatisticsProps) {
  const { deceased = [], amputees = [] } = data || {};
  const chartsRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'dashboard' | 'selection' | 'exploration'>('dashboard');
  const [reportType, setReportType] = useState<'statistical' | 'full_register'>('statistical');

  // Report Configuration State
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    startDate: '',
    endDate: '',
  });

  // Filtered Data for Report
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
      fridge: data?.fridge || []
    };
  }, [deceased, amputees, reportConfig.startDate, reportConfig.endDate, data?.fridge]);

  const inFacilityCount = deceased.filter((d: any) => d.status === 'in_facility').length;
  const unknownCount = deceased.filter((d: any) => d.isUnknown).length;
  const amputeesCount = amputees.length;

  const releasedRecords = deceased.filter((d: any) => d.status === 'released' || d.isHistorical);
  const releasedCount = releasedRecords.length;

  const foetusCount = deceased.filter((d: any) => d.caseType === 'FŒTUS').length;
  const mortNeCount = deceased.filter((d: any) => d.caseType === 'MORT_NÉ').length;
  const enfantCount = deceased.filter((d: any) => d.caseType === 'ENFANT_MOINS_1_AN').length;
  const membreAmputeTotalCount = deceased.filter((d: any) => d.caseType === 'MEMBRE_AMPUTÉ').length + amputees.length;
  const frigo12OccupiedCount = (data.fridge || []).filter((p: any) => p.fridgeNumber === 12 && p.status === 'occupied').length;

  const pieData = [
    { name: 'Actifs', value: inFacilityCount, color: '#10b981' },
    { name: 'Inconnus', value: unknownCount, color: '#f59e0b' },
    { name: 'Identifiés', value: inFacilityCount - unknownCount, color: '#3b82f6' },
    { name: 'Libérés', value: releasedCount, color: '#cbd5e1' }
  ];

  const priseFamilleCount = releasedRecords.filter((d: any) => d.takingChargeType === 'Famille').length;
  const priseAutreCount = releasedCount - priseFamilleCount; // Includes everything not Famille
  
  const priseEnChargeData = [
    { name: 'Famille', value: priseFamilleCount, color: '#006050' },
    { name: 'Autre (Association...)', value: priseAutreCount, color: '#64748b' }
  ];

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    return {
      name: format(d, 'EEE', { locale: fr }),
      admissions: deceased.filter((rec: any) => {
        const dDate = safeDate(rec.admissionDate);
        return dDate && dDate.toDateString() === dateStr;
      }).length,
      sorties: deceased.filter((rec: any) => {
        const eDate = safeDate(rec.exitDate);
        return eDate && eDate.toDateString() === dateStr;
      }).length,
    };
  }).reverse();

  const handleDownloadReport = async (reportFormat: 'csv' | 'pdf') => {
    const dataToUse = view === 'exploration' ? filteredData : data;
    const configToUse = view === 'exploration' ? reportConfig : undefined;

    if (reportFormat === 'pdf') {
      if (reportType === 'statistical') {
        generateStatisticsPDF(dataToUse, configToUse);
      } else {
        // Full Register Report
        // Note: generateDossiersPDF currently takes (records, users)
        // I need to filter records if in exploration view
        const records = view === 'exploration' ? filteredData.deceased : deceased;
        generateDossiersPDF(records, data.users);
      }
      return;
    }

    // CSV logic
    const recordsForCsv = view === 'exploration' ? filteredData.deceased : deceased;
    const headers = ["Réf", "Nom Complet", "Date Admission", "État", "Position Frigo", "Cause"];
    const rows = recordsForCsv.map((d: any) => {
      const dDate = safeDate(d.admissionDate);
      return [
        d.refNumber,
        d.name,
        dDate ? format(dDate, 'dd/MM/yyyy HH:mm') : '—',
        d.status === 'in_facility' ? 'Présent' : 'Sorti',
        d.fridgePosition || 'N/A',
        d.cause || 'Non spécifiée'
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rapport_afy_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-[#006050]/20 p-2 rounded-xl text-[#006050] dark:text-emerald-400">
            <Menu size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              {view === 'dashboard' ? 'Statistiques' : 'Rapports'}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Analyse Institutionnelle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {view !== 'dashboard' && (
            <button
              onClick={() => setView('dashboard')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={14} className="inline mr-2" />
              Retour
            </button>
          )}
          {view === 'dashboard' && (
            <button
              onClick={() => setView('selection')}
              className="px-5 py-2.5 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#006050]/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileDown size={14} className="inline mr-2" />
              Explorer un rapport
            </button>
          )}
        </div>
      </div>

      {view === 'selection' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Sélection du Type */}
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

          {/* Sélection de la Période */}
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
                filteredData.deceased.length + filteredData.amputees.length > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
              )}>
                {filteredData.deceased.length + filteredData.amputees.length} dossier(s) trouvé(s) sur cette période
              </div>
              <button 
                onClick={() => setReportConfig({ startDate: '', endDate: '' })}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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

          {reportType === 'statistical' ? (
            <DashboardContent 
              deceased={filteredData.deceased} 
              amputees={filteredData.amputees} 
              data={data}
              onNavigate={onNavigate}
              isExploration
            />
          ) : (
            <RegisterContent 
              records={filteredData.deceased} 
              onSelectDeceased={(id) => { setView('dashboard'); onNavigate('deceased-detail'); }} 
            />
          )}
        </div>
      )}

      {view === 'dashboard' && (
        <DashboardContent 
          deceased={deceased} 
          amputees={amputees} 
          data={data}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

interface DashboardContentProps {
  deceased: any[];
  amputees: any[];
  data: any;
  onNavigate: (screen: string) => void;
  isExploration?: boolean;
}

function DashboardContent({ deceased, amputees, data, onNavigate, isExploration }: DashboardContentProps) {
  const inFacilityCount = deceased.filter((d: any) => d.status === 'in_facility').length;
  const unknownCount = deceased.filter((d: any) => d.isUnknown).length;
  const amputeesCount = amputees.length;

  const releasedRecords = deceased.filter((d: any) => d.status === 'released' || d.isHistorical);
  const releasedCount = releasedRecords.length;

  const foetusCount = deceased.filter((d: any) => d.caseType === 'FŒTUS').length;
  const mortNeCount = deceased.filter((d: any) => d.caseType === 'MORT_NÉ').length;
  const enfantCount = deceased.filter((d: any) => d.caseType === 'ENFANT_MOINS_1_AN').length;
  const membreAmputeTotalCount = deceased.filter((d: any) => d.caseType === 'MEMBRE_AMPUTÉ').length + amputees.length;
  const frigo12OccupiedCount = (data.fridge || []).filter((p: any) => p.fridgeNumber === 12 && p.status === 'occupied').length;

  const pieData = [
    { name: 'Actifs', value: inFacilityCount, color: '#10b981' },
    { name: 'Inconnus', value: unknownCount, color: '#f59e0b' },
    { name: 'Identifiés', value: inFacilityCount - unknownCount, color: '#3b82f6' },
    { name: 'Libérés', value: releasedCount, color: '#cbd5e1' }
  ];

  const priseFamilleCount = releasedRecords.filter((d: any) => d.takingChargeType === 'Famille').length;
  const priseAutreCount = releasedCount - priseFamilleCount;
  
  const priseEnChargeData = [
    { name: 'Famille', value: priseFamilleCount, color: '#006050' },
    { name: 'Autre (Association...)', value: priseAutreCount, color: '#64748b' }
  ];

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    return {
      name: format(d, 'EEE', { locale: fr }),
      admissions: deceased.filter((rec: any) => {
        const dDate = safeDate(rec.admissionDate);
        return dDate && dDate.toDateString() === dateStr;
      }).length,
      sorties: deceased.filter((rec: any) => {
        const eDate = safeDate(rec.exitDate);
        return eDate && eDate.toDateString() === dateStr;
      }).length,
    };
  }).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#006050] dark:bg-emerald-600 rounded-2xl p-8 text-white shadow-xl shadow-[#006050]/20 dark:shadow-emerald-900/20 relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Admissions ({isExploration ? 'Période' : 'Total'})</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-5xl font-black tracking-tighter leading-none">{deceased.length}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Actifs</p>
                <p className="text-xl font-black">{inFacilityCount}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Inconnus</p>
                <p className="text-xl font-black">{unknownCount}</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
            <TrendingUp size={200} />
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Sorties ({isExploration ? 'Période' : 'Total'})</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-5xl font-black tracking-tighter leading-none">{releasedCount}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Famille</p>
                <p className="text-xl font-black">{priseFamilleCount}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Autre</p>
                <p className="text-xl font-black">{priseAutreCount}</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
            <LogOut size={200} />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('frigo')}
          className="bg-emerald-700 dark:bg-emerald-800 rounded-2xl p-8 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-emerald-600 dark:hover:bg-emerald-700 group"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Amputés ({isExploration ? 'Période' : 'Total'})</p>
            <h2 className="text-5xl font-black tracking-tighter leading-none">{amputeesCount}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-4 flex items-center gap-2">
              Membres enregistrés <ArrowRightLeft size={12} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
            <User size={200} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Cas Spéciaux & Frigo 12</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fœtus</p>
            <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{foetusCount}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mort-nés</p>
            <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{mortNeCount}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enfants &lt; 1 an</p>
            <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{enfantCount}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membres Amputés</p>
            <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{membreAmputeTotalCount}</p>
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Frigo 12 — Frigo Spécial</span>
          <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 bg-emerald-200/50 dark:bg-emerald-800 px-3 py-1 rounded-full">{frigo12OccupiedCount} / 15 places occupées</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Flux d'Activité</h3>
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar size={12} /> 7 Derniers Jours
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: 'currentColor' }} 
                  className="text-slate-400 dark:text-slate-600"
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: 'currentColor' }} 
                  className="text-slate-400 dark:text-slate-600"
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tooltip-bg)' }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Bar dataKey="admissions" fill="#006050" radius={[6, 6, 0, 0]} barSize={24} className="fill-[#006050] dark:fill-emerald-600" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-8">Répartition par État</h3>
          <div className="flex items-center">
            <div className="h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 pl-8 space-y-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {deceased.length > 0 ? Math.round((item.value / deceased.length) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RegisterContentProps {
  records: DeceasedRecord[];
  onSelectDeceased: (id: string) => void;
}

function RegisterContent({ records, onSelectDeceased }: RegisterContentProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Registre Filtré</h3>
        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {records.length} dossier(s)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 text-left">Référence</th>
              <th className="px-6 py-4 text-left">Nom Complet</th>
              <th className="px-6 py-4 text-left">Position</th>
              <th className="px-6 py-4 text-left">Date Adm.</th>
              <th className="px-6 py-4 text-left">État</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((d: DeceasedRecord) => {
              const admDate = safeDate(d.admissionDate);
              return (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-100">#{d.refNumber}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">{d.name}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {d.isHistorical || d.fridgePosition === 999 || d.fridgePosition === 'X' ? 'X' : d.fridgePosition && d.fridgePosition !== -1 
                      ? `FRIGO-${d.fridgePosition.toString().padStart(2, '0')}` 
                      : 'Frigo Inconnu'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {admDate ? format(admDate, 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${d.status === 'released' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                      {d.status === 'released' ? 'Sorti' : 'Admis'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onSelectDeceased(d.id)}
                      className="p-2 text-slate-400 hover:text-[#006050] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {records.length === 0 && (
        <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aucun dossier trouvé pour cette période.</div>
      )}
    </div>
  );
}
