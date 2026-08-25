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
import { TrendingUp, FileDown, Calendar, Menu, MoreVertical, User, LogOut, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useRef } from 'react';
import { generateStatisticsPDF } from '../utils/pdf';

interface StatisticsProps {
  data: any;
  onNavigate: (screen: string) => void;
}

export function Statistics({ data, onNavigate }: StatisticsProps) {
  const { deceased = [], amputees = [] } = data || {};
  const chartsRef = useRef<HTMLDivElement>(null);

  const inFacilityCount = deceased.filter((d: any) => d.status === 'in_facility').length;
  const releasedCount = deceased.filter((d: any) => d.status === 'released').length;
  const unknownCount = deceased.filter((d: any) => d.isUnknown).length;
  const amputeesCount = amputees.length;

  const foetusCount = deceased.filter((d: any) => d.caseType === 'FŒTUS').length;
  const mortNeCount = deceased.filter((d: any) => d.caseType === 'MORT_NÉ').length;
  const enfantCount = deceased.filter((d: any) => d.caseType === 'ENFANT_MOINS_1_AN').length;
  const membreAmputeTotalCount = deceased.filter((d: any) => d.caseType === 'MEMBRE_AMPUTÉ').length + amputees.length;
  const frigo12OccupiedCount = (data.fridge || []).filter((p: any) => p.position >= 1 && p.position <= 15 && p.status === 'occupied').length;

  const pieData = [
    { name: 'Actifs', value: inFacilityCount, color: '#10b981' },
    { name: 'Inconnus', value: unknownCount, color: '#f59e0b' },
    { name: 'Identifiés', value: inFacilityCount - unknownCount, color: '#3b82f6' },
    { name: 'Libérés', value: releasedCount, color: '#cbd5e1' }
  ];

  const releasedRecords = deceased.filter((d: any) => d.status === 'released' || d.isHistorical);
  const priseFamilleCount = releasedRecords.filter((d: any) => d.takingChargeType === 'Famille').length;
  const priseAutreCount = releasedRecords.filter((d: any) => d.takingChargeType && d.takingChargeType !== 'Famille').length; // Includes Association and Autre
  
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
      admissions: deceased.filter((rec: any) => rec.admissionDate.toDate().toDateString() === dateStr).length,
      sorties: deceased.filter((rec: any) => rec.exitDate?.toDate().toDateString() === dateStr).length,
    };
  }).reverse();

  const handleDownloadReport = async (type: 'csv' | 'pdf') => {
    if (type === 'pdf') {
      generateStatisticsPDF(data);
      return;
    }

    // CSV logic
    const headers = ["Réf", "Nom Complet", "Date Admission", "État", "Position Frigo", "Cause"];
    const rows = deceased.map((d: any) => [
      d.refNumber,
      d.name,
      format(d.admissionDate.toDate(), 'dd/MM/yyyy HH:mm'),
      d.status === 'in_facility' ? 'Présent' : 'Sorti',
      d.fridgePosition || 'N/A',
      d.cause || 'Non spécifiée'
    ]);

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
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Statistiques</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Analyse Institutionnelle</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <MoreVertical size={24} />
        </button>
      </div>

      <div ref={chartsRef} className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Main KPI Summary */}
          <div className="bg-[#006050] dark:bg-emerald-600 rounded-2xl p-8 text-white shadow-xl shadow-[#006050]/20 dark:shadow-emerald-900/20 relative overflow-hidden transition-colors duration-300">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Admissions</p>
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

          {/* Sorties KPI Summary */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden transition-colors duration-300">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Sorties Totales</p>
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

          {/* Amputee KPI Summary */}
          <div 
            onClick={() => onNavigate('frigo')}
            className="bg-emerald-700 dark:bg-emerald-800 rounded-2xl p-8 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-emerald-600 dark:hover:bg-emerald-700 group"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Total Amputés</p>
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

        {/* Special Cases & Frigo 12 Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Cas Spéciaux & Frigo 12</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Fœtus</p>
              <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{foetusCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Mort-nés</p>
              <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{mortNeCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Enfants &lt; 1 an</p>
              <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{enfantCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Membres Amputés</p>
              <p className="text-xl font-black text-[#006050] dark:text-emerald-400 mt-1">{membreAmputeTotalCount}</p>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Frigo 12 — Frigo Spécial</span>
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 bg-emerald-200/50 dark:bg-emerald-800 px-3 py-1 rounded-full">{frigo12OccupiedCount} / 15 places occupées</span>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
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

        {/* Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
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

        {/* Distribution Prise en Charge */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none">Prise en Charge</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Analyse des Sorties</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total :</span>
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{releasedCount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-32 w-32 flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priseEnChargeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {priseEnChargeData.map((entry, index) => (
                      <Cell key={`cell-prise-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-base font-black text-slate-900 dark:text-white leading-none">{releasedCount}</span>
              </div>
            </div>
            
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              {priseEnChargeData.map((item, index) => {
                const percentage = releasedRecords.length > 0 ? Math.round((item.value / releasedRecords.length) * 100) : 0;
                const color = index === 0 ? 'bg-emerald-500' : 'bg-indigo-500';
                const textColor = index === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400';
                
                return (
                  <div key={item.name} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("w-2 h-2 rounded-full", color)} />
                      <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.name === 'Famille' ? 'Famille' : 'Assoc.'}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{item.value}</span>
                      <span className={cn("text-sm font-black italic", textColor)}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", color)} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


      {/* Report Action Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-[#006050] dark:text-emerald-400 p-3 rounded-xl">
            <FileDown size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Générer Rapport</h3>
            <p className="text-xs font-medium text-slate-400">Exportez les données complètes de l'institution au format CSV ou PDF pour analyse externe.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleDownloadReport('pdf')}
            className="flex-1 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
          >
            Exporter PDF
          </button>
          <button 
            onClick={() => handleDownloadReport('csv')}
            className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
          >
            Exporter CSV
          </button>
        </div>
      </div>
    </div>
  );
}
