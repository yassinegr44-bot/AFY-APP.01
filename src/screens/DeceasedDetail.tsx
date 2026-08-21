import React, { useState } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Activity, 
  FileText, 
  LogOut, 
  CheckCircle2,
  AlertTriangle,
  Refrigerator,
  MoreVertical,
  Scale,
  Heart,
  Stethoscope,
  History,
  ArrowRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';
import { DeceasedRecord, TimelineEvent } from '../types';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface DeceasedDetailProps {
  record: DeceasedRecord;
  onBack: () => void;
  onExit: (data: { exitDate: Date, exitTime: string, exitNotes: string }) => Promise<void>;
}

export function DeceasedDetail({ record, onBack, onExit }: DeceasedDetailProps) {
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitData, setExitData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitTime: new Date().toTimeString().slice(0, 5),
    exitNotes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleExitSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onExit({
        exitDate: new Date(exitData.exitDate),
        exitTime: exitData.exitTime,
        exitNotes: exitData.exitNotes
      });
      setShowExitForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sortie.");
    } finally {
      setLoading(false);
    }
  };

  const isReleased = record.status === 'released';
  const admissionDate = record.admissionDate.toDate();
  const exitDate = isReleased && record.exitDate ? record.exitDate.toDate() : new Date();
  const diff = differenceInDays(exitDate, admissionDate);
  const durationText = formatDistanceToNow(admissionDate, { locale: fr, addSuffix: false });
  
  // Use a fixed 15-day threshold for consistent UI or pass from data
  const threshold = 15; 
  const isUrgent = !isReleased && (diff >= threshold || record.isUnknown);
  const isApproaching = !isReleased && !isUrgent && diff >= threshold - 3;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Dossier Médical</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-black uppercase",
                !isReleased ? (isUrgent ? "bg-red-600 text-white" : isApproaching ? "bg-amber-50 text-white" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400") : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                {!isReleased ? (isUrgent ? 'URGENT' : isApproaching ? 'APPROCHE' : 'ACTIF') : 'LIBÉRÉ'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{record.refNumber}</span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Main Name Card */}
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border p-8 shadow-sm text-center transition-colors duration-300",
        isUrgent ? "border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/10" : isApproaching ? "border-amber-100 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-900/10" : "border-slate-100 dark:border-slate-800"
      )}>
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
          isUrgent ? "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400" : isApproaching ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" : "bg-[#006050]/5 dark:bg-emerald-900/20 text-[#006050] dark:text-emerald-400"
        )}>
          {isUrgent ? <AlertTriangle size={40} /> : <User size={40} />}
        </div>
        <h2 className={cn(
          "text-2xl font-black tracking-tight mb-1",
          record.isUnknown ? "text-amber-600 dark:text-amber-400" : isUrgent ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"
        )}>
          {record.name || 'Identité Inconnue'}
        </h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{record.gender === 'M' ? 'Sexe Masculin' : record.gender === 'F' ? 'Sexe Féminin' : 'Sexe Indéterminé'}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-slate-400" />
            <p className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-tighter">Présent depuis {durationText}</p>
          </div>
          {isUrgent && (
            <span className={cn(
              "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border",
              record.isUnknown ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/30"
            )}>
              {record.isUnknown ? "Alerte : Identité Non Confirmée" : "Alerte : Seuil de 15j Dépassé"}
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Admission" value={format(record.admissionDate.toDate(), 'dd MMM')} icon={Calendar} color="blue" />
        <StatCard label="Position" value={`Frigo ${record.fridgePosition.toString().padStart(2, '0')}`} icon={Refrigerator} color="emerald" />
        <StatCard label="Durée Totale" value={`${diff} Jours`} icon={Clock} color={isUrgent ? "red" : isApproaching ? "orange" : "blue"} />
      </div>

      {/* Timeline Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><History size={14} /></div>
          Chronologie du Dossier
        </h3>
        
        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
          {(record.timeline || []).length > 0 ? (
            record.timeline.map((event: TimelineEvent, idx: number) => (
              <div key={event.id} className="relative pl-8 group">
                <div className={cn(
                  "absolute left-0 top-1 w-[22px] h-[22px] rounded-full border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center transition-colors",
                  event.type === 'admission' ? "bg-emerald-500" : 
                  event.type === 'exit' ? "bg-slate-400" : "bg-blue-400"
                )}>
                  {event.type === 'admission' && <Plus size={8} className="text-white" />}
                  {event.type === 'exit' && <ArrowRight size={8} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{event.title}</p>
                    <time className="text-[10px] font-bold text-slate-400">{format(event.timestamp.toDate(), 'HH:mm', { locale: fr })}</time>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{event.description}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">{format(event.timestamp.toDate(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-xs font-bold text-slate-400 italic">Aucun événement enregistré.</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Sections */}
      <div className="space-y-4">
        <DetailSection title="Informations Personnelles" icon={User}>
          <DetailRow label="Nom complet" value={record.name || '—'} />
          <DetailRow label="Sexe / Genre" value={record.gender === 'M' ? 'Masculin' : record.gender === 'F' ? 'Féminin' : 'Inconnu'} />
          <DetailRow label="Référence Unique" value={record.refNumber} highlight />
        </DetailSection>

        <DetailSection title="Circonstances" icon={Stethoscope}>
          <DetailRow label="Cause suspectée" value={record.cause || 'Non spécifiée'} />
          <DetailRow label="Lieu / Origine" value={record.origin || 'Non renseigné'} />
          <DetailRow label="Date de décès" value={format(record.dateOfDeath.toDate(), 'dd/MM/yyyy')} />
          <DetailRow label="Heure" value={record.timeOfDeath} />
        </DetailSection>

        <DetailSection title="Logistique Morgue" icon={Refrigerator}>
          <DetailRow label="Position Frigo" value={`FRIGO-${record.fridgePosition.toString().padStart(2, '0')}`} highlight />
          <DetailRow label="Date Admission" value={format(record.admissionDate.toDate(), 'dd/MM/yyyy HH:mm')} />
          {isReleased && record.exitDate && (
            <DetailRow label="Date de Sortie" value={format(record.exitDate.toDate(), 'dd/MM/yyyy HH:mm')} highlight />
          )}
        </DetailSection>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FileText size={16} /> Observations
        </h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          {record.notes || 'Aucune remarque particulière pour ce dossier.'}
        </p>
      </div>

      {/* Footer Actions */}
      {!isReleased && (
        <div className="fixed bottom-24 left-6 right-6 z-40">
          <button 
            onClick={() => setShowExitForm(true)}
            className="w-full bg-[#006050] dark:bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-[#006050]/20 dark:shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <LogOut size={24} /> Sortie de la Morgue
          </button>
        </div>
      )}

      {/* Exit Modal */}
      <AnimatePresence>
        {showExitForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
              onClick={() => setShowExitForm(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[40px] p-8 z-[60] shadow-2xl transition-colors duration-300"
            >
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Finaliser la Sortie</h3>
                <button onClick={() => setShowExitForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <CheckCircle2 size={28} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleExitSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <DetailInput label="Date de Sortie" type="date" value={exitData.exitDate} onChange={(v: string) => setExitData({...exitData, exitDate: v})} />
                  <DetailInput label="Heure de Sortie" type="time" value={exitData.exitTime} onChange={(v: string) => setExitData({...exitData, exitTime: v})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Raison de la sortie / Destinataire</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-h-[120px]"
                    placeholder="Précisez le destinataire (famille, pompes funèbres...)"
                    value={exitData.exitNotes}
                    onChange={(e) => setExitData({...exitData, exitNotes: e.target.value})}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-4 mb-2">
                  <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-normal">
                    Attention : Cette action est irréversible. La position FRIGO-{record.fridgePosition.toString().padStart(2, '0')} sera libérée immédiatement.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#006050] dark:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20 disabled:opacity-50"
                >
                  {loading ? 'Traitement...' : 'Confirmer Libération'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30",
    orange: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
  };
  
  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col items-center gap-2 transition-colors duration-300", colors[color as keyof typeof colors])}>
      <Icon size={18} strokeWidth={2.5} />
      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
        <p className="text-sm font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 transition-colors duration-300">
      <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-3">
        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><Icon size={14} /></div>
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn(
        "text-sm font-black tracking-tight transition-colors",
        highlight ? "text-[#006050] dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"
      )}>{value}</span>
    </div>
  );
}

function DetailInput({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <input 
        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 transition-all text-sm font-black text-slate-800 dark:text-slate-100"
        {...props}
        onChange={e => props.onChange && props.onChange(e.target.value)}
      />
    </div>
  );
}
