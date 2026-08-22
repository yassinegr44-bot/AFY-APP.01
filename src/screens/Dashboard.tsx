import { useState, useEffect } from 'react';
import { Users, LogIn, LogOut, Refrigerator, AlertTriangle, Plus, ArrowRightLeft, Clock, Info, MoreVertical, Shield, User, Settings2, Check, X, Eye, EyeOff, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeceasedRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface DashboardProps {
  data: any;
  onNavigate: (screen: string) => void;
  onSelectDeceased: (id: string) => void;
}

export function Dashboard({ data, onNavigate, onSelectDeceased }: DashboardProps) {
  const { deceased, historicalDeceased = [], fridge, settings } = data;
  const { user } = useAuth();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [visibleCards, setVisibleCards] = useState<string[]>(() => {
    const saved = localStorage.getItem('afy_dashboard_visible_cards');
    return saved ? JSON.parse(saved) : ['in_facility', 'admissions', 'exits', 'alerts', 'approaching', 'unknown', 'historical'];
  });

  useEffect(() => {
    localStorage.setItem('afy_dashboard_visible_cards', JSON.stringify(visibleCards));
  }, [visibleCards]);

  const toggleCard = (id: string) => {
    setVisibleCards(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };
  
  const inFacility = deceased.filter((d: DeceasedRecord) => d.status === 'in_facility');
  const todayAdmissions = deceased.filter((d: DeceasedRecord) => {
    const dDate = d.admissionDate.toDate();
    const today = new Date();
    return dDate.toDateString() === today.toDateString();
  });
  const todayExits = deceased.filter((d: DeceasedRecord) => {
    if (!d.exitDate) return false;
    const eDate = d.exitDate.toDate();
    const today = new Date();
    return eDate.toDateString() === today.toDateString();
  });

  const occupiedCount = fridge.filter((p: any) => p.status === 'occupied').length;
  const availableCount = fridge.filter((p: any) => p.status === 'available').length;
  const occupancyRate = (occupiedCount / 12) * 100;

  const criticalAlerts = inFacility.filter((d: DeceasedRecord) => {
    const diff = differenceInDays(new Date(), d.admissionDate.toDate());
    return diff >= settings.alertThresholdDays || d.isUnknown;
  });

  const approachingAlerts = inFacility.filter((d: DeceasedRecord) => {
    const diff = differenceInDays(new Date(), d.admissionDate.toDate());
    return diff >= settings.alertThresholdDays - 3 && diff < settings.alertThresholdDays && !d.isUnknown;
  });

  const unknownCount = inFacility.filter((d: DeceasedRecord) => d.isUnknown).length;

  // Recent activity (dummy sorting for now, ideally by timestamp)
  const recentActivity = [...deceased]
    .sort((a, b) => b.admissionDate.seconds - a.admissionDate.seconds)
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-300">
      {/* Header Info */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#006050] dark:bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#006050]/20 dark:shadow-emerald-900/20 transition-colors">
            {user?.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{user?.name || 'Utilisateur'}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {user?.role === 'admin' ? 'Administrateur' : 'Agent'}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">Gérez vos opérations aujourd'hui.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-all",
              isCustomizing ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title="Personnaliser le tableau de bord"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <MoreVertical size={24} />
          </button>
        </div>
      </section>

      {/* Customizer Panel */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={12} /> Configuration de l'Affichage
                </h2>
                <button 
                  onClick={() => setIsCustomizing(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'in_facility', label: 'Présents', icon: Refrigerator },
                  { id: 'admissions', label: 'Admissions', icon: LogIn },
                  { id: 'exits', label: 'Sorties', icon: LogOut },
                  { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
                  { id: 'approaching', label: 'Approche', icon: Clock },
                  { id: 'unknown', label: 'Inconnus', icon: Users },
                  { id: 'historical', label: 'Historiques', icon: Folder },
                ].map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      visibleCards.includes(card.id)
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400"
                    )}
                  >
                    <card.icon size={16} className={visibleCards.includes(card.id) ? "opacity-100" : "opacity-40"} />
                    <span className="text-[10px] font-black uppercase tracking-tight flex-1">{card.label}</span>
                    {visibleCards.includes(card.id) ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 gap-3">
        {visibleCards.includes('in_facility') && (
          <KpiCard 
            label="Présents" 
            value={`${inFacility.length} / 12`}
            icon={Refrigerator}
            color="teal"
            onClick={() => onNavigate('deceased')}
          />
        )}
        {visibleCards.includes('admissions') && (
          <KpiCard 
            label="Admissions" 
            value={todayAdmissions.length}
            subtitle="Aujourd'hui"
            icon={LogIn}
            color="emerald"
            onClick={() => onNavigate('deceased')}
          />
        )}
        {visibleCards.includes('exits') && (
          <KpiCard 
            label="Sorties" 
            value={todayExits.length}
            subtitle="Aujourd'hui"
            icon={LogOut}
            color="slate"
            onClick={() => onNavigate('deceased')}
          />
        )}
        {visibleCards.includes('alerts') && (
          <KpiCard 
            label="Alertes" 
            value={criticalAlerts.length}
            subtitle={`Critique / Urgence`}
            icon={AlertTriangle}
            color="red"
            onClick={() => onNavigate('deceased')}
            urgent={criticalAlerts.length > 0}
          />
        )}
        {visibleCards.includes('approaching') && (
          <KpiCard 
            label="Approche" 
            value={approachingAlerts.length}
            subtitle={`Seuil ${settings.alertThresholdDays}j`}
            icon={Clock}
            color="orange"
            onClick={() => onNavigate('deceased')}
            warning={approachingAlerts.length > 0}
          />
        )}
        {visibleCards.includes('unknown') && (
          <KpiCard 
            label="Inconnus" 
            value={unknownCount}
            subtitle="X fils de X"
            icon={Users}
            color="slate"
            onClick={() => onNavigate('deceased')}
            urgent={unknownCount > 0}
          />
        )}
        {visibleCards.includes('historical') && (
          <KpiCard 
            label="Historiques" 
            value={historicalDeceased.length}
            subtitle="Anciens dossiers"
            icon={Folder}
            color="slate"
            onClick={() => onNavigate('historical-deceased')}
          />
        )}
      </section>

      {/* Alerts Center Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Centre d'Alertes Actives</h2>
          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Temps réel</span>
        </div>
        
        {(criticalAlerts.length === 0 && approachingAlerts.length === 0) ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aucune alerte active</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...criticalAlerts, ...approachingAlerts].slice(0, 5).map((record) => {
              const diff = differenceInDays(new Date(), record.admissionDate.toDate());
              const isCritical = diff >= settings.alertThresholdDays || record.isUnknown;
              
              return (
                <button
                  key={record.id}
                  onClick={() => onSelectDeceased(record.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.99]",
                    isCritical 
                      ? "bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/30" 
                      : "bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isCritical ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                  )}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{record.name}</p>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest",
                        isCritical ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                      )}>
                        {isCritical ? 'Critique' : 'Approche'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                      {record.isUnknown ? 'Identité Inconnue' : `Présence : ${diff} Jours`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cavier</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">#{record.fridgePosition}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Fridge Occupancy Card */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Occupation des Frigos</h3>
          <span className="text-xs font-bold text-slate-400">{Math.round(occupancyRate)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
          <div 
            className="bg-[#006050] h-full rounded-full transition-all duration-500"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#006050] rounded-full" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{occupiedCount} Occupés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{availableCount} Disponibles</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('new')}
            className="bg-[#006050] dark:bg-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20 active:scale-95 transition-all text-xs"
          >
            <Plus size={16} strokeWidth={3} /> Nouvelle Admission
          </button>
          <button 
            onClick={() => onNavigate('new-amputee')}
            className="bg-[#006050] dark:bg-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20 active:scale-95 transition-all text-xs"
          >
            <Plus size={16} strokeWidth={3} /> Membre amputé
          </button>
          <button 
            onClick={() => onNavigate('frigo')}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 py-3 rounded-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-xs"
          >
            <ArrowRightLeft size={16} /> Libérer Position
          </button>
          <button 
            onClick={() => onNavigate('historical-deceased')}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-xs"
          >
            <Folder size={16} /> Dossier Historique
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activité Récente</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Info size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Aucune activité récente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentActivity.map((record) => (
                <div key={record.id} className="p-4 flex items-start gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl">
                    <LogIn size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Admission : Dossier #{record.refNumber}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDistanceToNow(record.admissionDate.toDate(), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {record.name} - Affecté au Frigo {record.fridgePosition}
                    </p>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => onNavigate('deceased')}
                className="w-full py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors border-t border-slate-50 dark:border-slate-800"
              >
                Voir tout l'historique
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, subtitle, icon: Icon, color, onClick, urgent, warning }: any) {
  let cardStyles = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300";
  if (urgent) cardStyles = "bg-red-100 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 transition-colors duration-300";
  else if (warning) cardStyles = "bg-amber-100 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30 transition-colors duration-300";
  
  const iconColors: any = {
    teal: "bg-[#006050] dark:bg-emerald-600 text-white",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    slate: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    orange: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-xl border flex flex-col justify-between h-32 cursor-pointer transition-all ${cardStyles}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${iconColors[color]}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className={cn(
          "text-xs font-bold uppercase tracking-tighter mb-1",
          urgent ? "text-red-800 dark:text-red-300" : warning ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"
        )}>{label}</p>
        <div className="flex items-baseline gap-1.5">
          <p className={cn(
            "text-2xl font-black leading-none",
            urgent ? "text-red-600 dark:text-red-400" : warning ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"
          )}>{value}</p>
          {subtitle && (
            <p className={cn(
              "text-[10px] font-bold",
              urgent ? "text-red-400 dark:text-red-500" : warning ? "text-amber-400 dark:text-amber-500" : "text-slate-400 dark:text-slate-500"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
