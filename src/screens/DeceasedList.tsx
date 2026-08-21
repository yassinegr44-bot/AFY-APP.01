import { useState } from 'react';
import { Search, Refrigerator, Calendar, Clock, MoreVertical, Menu, AlertCircle, User, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';
import { DeceasedRecord } from '../types';
import { differenceInDays, format, differenceInYears } from 'date-fns';
import { cn } from '../lib/utils';

interface DeceasedListProps {
  data: any;
  onSelectDeceased: (id: string) => void;
  onNavigate: (screen: string) => void;
}

export function DeceasedList({ data, onSelectDeceased, onNavigate }: DeceasedListProps) {
  const { deceased, settings } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_facility' | 'released' | 'urgent'>('all');

  const filtered = deceased.filter((d: DeceasedRecord) => {
    const matchesSearch = 
      d.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filter === 'in_facility') matchesFilter = d.status === 'in_facility';
    if (filter === 'released') matchesFilter = d.status === 'released';
    if (filter === 'urgent') {
      const diff = differenceInDays(new Date(), d.admissionDate.toDate());
      matchesFilter = d.status === 'in_facility' && (diff >= settings.alertThresholdDays || d.isUnknown);
    }
    
    return matchesSearch && matchesFilter;
  });

  const calculateAge = (dob: any, dateOfDeath: any) => {
    if (!dob) return '—';
    try {
      const birth = dob.toDate ? dob.toDate() : new Date(dob);
      const death = dateOfDeath ? (dateOfDeath.toDate ? dateOfDeath.toDate() : new Date(dateOfDeath)) : new Date();
      return `${differenceInYears(death, birth)} ans`;
    } catch (e) {
      return '—';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-[#006050]/20 p-2 rounded-xl text-[#006050] dark:text-emerald-400">
            <Menu size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Décès</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registre Général</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou référence"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#f1f5f9] dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-[#006050]/20 transition-all text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>Tous</FilterTab>
        <FilterTab active={filter === 'in_facility'} onClick={() => setFilter('in_facility')}>Actifs</FilterTab>
        <FilterTab active={filter === 'released'} onClick={() => setFilter('released')}>Libérés</FilterTab>
        <FilterTab active={filter === 'urgent'} onClick={() => setFilter('urgent')}>Urgent</FilterTab>
      </div>

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Menu size={14} className="rotate-90" /> Trier par date d'admission
      </p>

      {/* Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-colors duration-300">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Dossier</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identité du Défunt</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Âge</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Heure</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">État</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <User size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aucun dossier trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((record: DeceasedRecord) => {
                const diff = differenceInDays(new Date(), record.admissionDate.toDate());
                const isUrgent = record.status === 'in_facility' && (diff >= settings.alertThresholdDays || record.isUnknown);
                const isApproaching = record.status === 'in_facility' && !isUrgent && diff >= settings.alertThresholdDays - 3;

                return (
                  <tr 
                    key={record.id} 
                    onClick={() => onSelectDeceased(record.id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-950 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <span className={cn(
                        "text-xs font-black px-3 py-1 rounded-lg border",
                        isUrgent ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" : 
                        isApproaching ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                        "text-[#006050] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100/50 dark:border-emerald-900/30"
                      )}>
                        {record.refNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isUrgent ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : 
                          isApproaching ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" : 
                          "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          {isUrgent ? <AlertCircle size={14} /> : <User size={14} />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-black tracking-tight leading-tight transition-colors",
                              record.isUnknown ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"
                            )}>
                              {record.name || 'Identité Inconnue'}
                            </span>
                            {record.isUnknown && (
                              <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
                                Inconnu
                              </span>
                            )}
                            {isApproaching && !record.isUnknown && (
                              <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
                                Approche Seuil
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {record.gender === 'M' ? 'Masculin' : record.gender === 'F' ? 'Féminin' : 'Indéterminé'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-slate-600 dark:text-slate-400">
                        {calculateAge(record.dob, record.dateOfDeath)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {format(record.admissionDate.toDate(), 'dd/MM/yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-xs">
                        <Clock size={12} className="text-slate-300 dark:text-slate-700" />
                        {record.admissionTime}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black",
                        isUrgent ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30" : 
                        isApproaching ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30" :
                        "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                      )}>
                        <Refrigerator size={12} />
                        FRIGO-{record.fridgePosition.toString().padStart(2, '0')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest",
                          record.status === 'in_facility' ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        )}>
                          {record.status === 'in_facility' ? 'En Facilité' : 'Libéré'}
                        </span>
                        {isUrgent && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Alerte de seuil dépassé" />
                        )}
                        {isApproaching && (
                          <div className="w-2 h-2 bg-amber-500 rounded-full" title="Approche du seuil" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-[#006050] dark:group-hover:bg-emerald-600 group-hover:text-white transition-all text-slate-300 dark:text-slate-700">
                        <ChevronRight size={18} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterTab({ children, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
        active 
          ? "bg-[#006050] dark:bg-emerald-600 text-white border-[#006050] dark:border-emerald-600 shadow-lg shadow-[#006050]/10" 
          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800"
      )}
    >
      {children}
    </button>
  );
}

