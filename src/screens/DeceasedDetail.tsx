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
  Plus,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../lib/utils';
import { DeceasedRecord, TimelineEvent, AppUser } from '../types';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { generateSingleDossierPDF } from '../utils/pdf';
import { formatOperatorName } from '../utils/userUtils';
import { useAuth } from '../context/AuthContext';

interface DeceasedDetailProps {
  record: DeceasedRecord;
  users?: AppUser[];
  onBack: () => void;
  onExit: (data: any) => Promise<void>;
  onUpdateIdentity?: (data: Partial<DeceasedRecord>) => Promise<void>;
}

export function DeceasedDetail({ record, users, onBack, onExit, onUpdateIdentity }: DeceasedDetailProps) {
  const { user: currentUser } = useAuth();
  const activeOperatorName = currentUser?.name || 'Opérateur';
  const [showExitForm, setShowExitForm] = useState(false);
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [identityData, setIdentityData] = useState({
    cin: record.cin || "",
    name: '',
    gender: record.gender || 'Masculin',
    otherGender: record.otherGender || '',
    nationality: record.nationality || '',
    origin: record.origin || 'Marocain',
    originDetail: record.originDetail || ''
  });
  const [exitData, setExitData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitTime: new Date().toTimeString().slice(0, 5),
    exitNotes: '',
    transportMethod: '',
    ambulanceNumber: '',
    takingChargeType: '',
    takingChargeResponsibleName: '',
    takingChargeRelation: '',
    takingChargePhone: '',
    takingChargeAssociationName: '',
    takingChargeOtherDescription: '',
    destinationType: '',
    destinationCityOrCommune: '',
    destinationPrecise: '',
    destinationRegion: '',
    transferType: ''
  });
  const [loading, setLoading] = useState(false);

  const handleExitSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onExit({
        exitDate: new Date(exitData.exitDate),
        exitTime: exitData.exitTime,
        exitNotes: exitData.exitNotes,
        transportMethod: exitData.transportMethod as any,
        ambulanceNumber: exitData.ambulanceNumber,
        takingChargeType: exitData.takingChargeType as any,
        takingChargeResponsibleName: exitData.takingChargeResponsibleName,
        takingChargeRelation: exitData.takingChargeRelation,
        takingChargePhone: exitData.takingChargePhone,
        takingChargeAssociationName: exitData.takingChargeAssociationName,
        takingChargeOtherDescription: exitData.takingChargeOtherDescription,
        destinationType: exitData.destinationType as any,
        destinationCityOrCommune: exitData.destinationCityOrCommune,
        destinationPrecise: exitData.destinationPrecise,
        destinationRegion: exitData.destinationRegion,
        transferType: exitData.transferType as any,
        createdBy: activeOperatorName
      });
      setShowExitForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sortie.");
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async (e: any) => {
    e.preventDefault();
    if (!identityData.name || !onUpdateIdentity) return;
    setLoading(true);
    try {
      await onUpdateIdentity(identityData);
      setShowIdentityForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de l'identité.");
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
        <div className="flex items-center gap-2">
          {record.isUnknown && !isReleased && (
            <button 
              onClick={() => setShowIdentityForm(true)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all border border-amber-200 dark:border-amber-900/50"
            >
              <User size={15} />
              <span className="hidden sm:inline">Mettre à jour l'identité</span>
            </button>
          )}
          <button 
            onClick={() => generateSingleDossierPDF(record, users)}
            className="bg-[#006050] hover:bg-[#004d40] text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            title="Télécharger ce dossier en PDF"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exporter PDF</span>
          </button>
        </div>
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
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{record.gender === 'Masculin' ? 'Sexe Masculin' : record.gender === 'Féminin' ? 'Sexe Féminin' : `Sexe : ${record.otherGender || 'Autre'}`}</p>
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
        <StatCard label="Position" value={record.fridgePosition && record.fridgePosition !== -1 ? `Frigo ${record.fridgePosition.toString().padStart(2, '0')}` : 'Frigo Inconnu'} icon={Refrigerator} color="emerald" />
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
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(event.timestamp.toDate(), 'dd MMMM yyyy', { locale: fr })}</p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Opérateur : {formatOperatorName(event.createdBy, users, activeOperatorName)}
                    </p>
                  </div>
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
          <DetailRow label="Sexe / Genre" value={record.gender === 'Masculin' ? 'Masculin' : record.gender === 'Féminin' ? 'Féminin' : `Autre (${record.otherGender || ''})`} />
          <DetailRow label="Référence Unique" value={record.refNumber} highlight />
          <DetailRow label="Opérateur de l'entrée" value={formatOperatorName(record.createdBy, users, activeOperatorName)} />
          {isReleased && (
            <DetailRow label="Opérateur de la sortie" value={formatOperatorName((record as any).releasedByOperator || record.timeline?.find(e => e.type === 'exit')?.createdBy, users, activeOperatorName)} highlight />
          )}
        </DetailSection>

        <DetailSection title="Informations Médicales" icon={Activity}>
          <DetailRow label="Parties corporelles absentes / amputées" value={
            record.missingBodyParts && record.missingBodyParts.length > 0
              ? record.missingBodyParts.join(', ') + (record.otherMissingBodyPartsDescription ? ` (${record.otherMissingBodyPartsDescription})` : '')
              : 'Aucune'
          } />
        </DetailSection>
        
        <DetailSection title="Circonstances" icon={Stethoscope}>
          <DetailRow label="Cause suspectée" value={record.cause || 'Non spécifiée'} />
          <DetailRow label="Lieu / Origine" value={record.origin || 'Non renseigné'} />
          <DetailRow label="Date de décès" value={format(record.dateOfDeath.toDate(), 'dd/MM/yyyy')} />
          <DetailRow label="Heure" value={record.timeOfDeath} />
        </DetailSection>

        <DetailSection title="Logistique Morgue" icon={Refrigerator}>
          <DetailRow label="Position Frigo" value={record.fridgePosition && record.fridgePosition !== -1 ? `FRIGO-${record.fridgePosition.toString().padStart(2, '0')}` : 'Frigo Inconnu'} highlight />
          <DetailRow label="Date Admission" value={format(record.admissionDate.toDate(), 'dd/MM/yyyy HH:mm')} />
          {isReleased && record.exitDate && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <DetailRow label="Date de Sortie" value={format(record.exitDate.toDate(), 'dd/MM/yyyy HH:mm')} highlight />
              {record.transportMethod && <DetailRow label="Moyen de transport" value={record.transportMethod} />}
              {record.ambulanceNumber && <DetailRow label="N° Ambulance" value={record.ambulanceNumber} />}
              {record.takingChargeType && <DetailRow label="Prise en charge" value={record.takingChargeType} />}
              {record.takingChargeResponsibleName && <DetailRow label="Responsable" value={record.takingChargeResponsibleName} />}
              {record.destinationType && <DetailRow label="Destination (Kénitra?)" value={record.destinationType === 'Kenitra' ? 'Oui' : 'Non'} />}
              {record.destinationPrecise && <DetailRow label="Lieu précis" value={record.destinationPrecise} />}
            </div>
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
            onClick={() => {
              if (record.isUnknown) {
                alert("Vous ne pouvez pas procéder à la sortie d'un dossier dont l'identité est encore inconnue. Veuillez d'abord mettre à jour l'identité du défunt.");
              } else {
                setShowExitForm(true);
              }
            }}
            className="w-full bg-[#006050] dark:bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-[#006050]/20 dark:shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <LogOut size={24} /> Sortie de la Morgue
          </button>
        </div>
      )}

      {/* Identity Edit Modal */}

      <AnimatePresence>

        {showIdentityForm && (

          <>

            <motion.div

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"

              onClick={() => setShowIdentityForm(false)}

            />

            <motion.div

              initial={{ y: "100%" }}

              animate={{ y: 0 }}

              exit={{ y: "100%" }}

              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[40px] p-8 z-[60] shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto"

            >

              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-8" />

              <div className="flex justify-between items-center mb-6">

                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Mettre à jour l'identité</h3>

                <button onClick={() => setShowIdentityForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">

                  <CheckCircle2 size={28} className="rotate-45" />

                </button>

              </div>

              <form onSubmit={handleIdentitySubmit} className="space-y-6">

                <div className="grid grid-cols-1 gap-4">

                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Nom Complet</label>

                  <input required placeholder="Saisir le nom complet identifié..." className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050] text-sm font-semibold" value={identityData.name} onChange={e => setIdentityData({...identityData, name: e.target.value})} />

                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Numéro CIN (Optionnel)</label>
                  <input placeholder="Ex: AB123456" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050] text-sm font-semibold" value={identityData.cin} onChange={e => setIdentityData({...identityData, cin: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Sexe</label>

                    <select className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold" value={identityData.gender} onChange={e => setIdentityData({...identityData, gender: e.target.value as any})}>

                      <option value="Masculin">Masculin</option>

                      <option value="Féminin">Féminin</option>

                      <option value="Autre">Autre</option>

                    </select>

                  </div>

                  <div>

                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Nationalité</label>

                    <input placeholder="Ex: Marocaine" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold" value={identityData.nationality} onChange={e => setIdentityData({...identityData, nationality: e.target.value})} />

                  </div>

                </div>

                <button

                  type="submit"

                  disabled={loading || !identityData.name}

                  className="w-full bg-[#006050] dark:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20 disabled:opacity-50 mt-4"

                >

                  {loading ? "Enregistrement..." : "Confirmer l'identité"}

                </button>

              </form>

            </motion.div>

          </>

        )}

      </AnimatePresence>


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
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[40px] p-8 z-[60] shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Finaliser la Sortie</h3>
                <button onClick={() => setShowExitForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <CheckCircle2 size={28} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleExitSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Numéro CIN (Optionnel)</label>
                  <input placeholder="Ex: AB123456" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050] text-sm font-semibold" value={identityData.cin} onChange={e => setIdentityData({...identityData, cin: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DetailInput label="Date de Sortie" type="date" value={exitData.exitDate} onChange={(v: string) => setExitData({...exitData, exitDate: v})} />
                  <DetailInput label="Heure de Sortie" type="time" value={exitData.exitTime} onChange={(v: string) => setExitData({...exitData, exitTime: v})} />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Moyen de transport</label>
                  <select className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.transportMethod} onChange={e => setExitData({...exitData, transportMethod: e.target.value})}>
                    <option value="">Sélectionnez...</option>
                    <option value="Ambulance">Ambulance</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {exitData.transportMethod === 'Ambulance' && <input placeholder="Numéro de l'ambulance" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.ambulanceNumber} onChange={e => setExitData({...exitData, ambulanceNumber: e.target.value})} />}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Prise en charge</label>
                  <select className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargeType} onChange={e => setExitData({...exitData, takingChargeType: e.target.value})}>
                    <option value="">Sélectionnez...</option>
                    <option value="Famille">La famille</option>
                    <option value="Autre">Autre (Association...)</option>
                  </select>

                  {exitData.takingChargeType === 'Famille' && (
                    <>
                        <input placeholder="Nom complet responsable" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargeResponsibleName} onChange={e => setExitData({...exitData, takingChargeResponsibleName: e.target.value})} />
                        <input placeholder="Lien avec le défunt" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargeRelation} onChange={e => setExitData({...exitData, takingChargeRelation: e.target.value})} />
                        <input placeholder="Téléphone" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargePhone} onChange={e => setExitData({...exitData, takingChargePhone: e.target.value})} />
                    </>
                  )}

                  {exitData.takingChargeType === 'Autre' && (
                    <>
                        <input placeholder="Organisme / Association / Nom" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargeResponsibleName} onChange={e => setExitData({...exitData, takingChargeResponsibleName: e.target.value})} />
                        <input placeholder="Téléphone" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargePhone} onChange={e => setExitData({...exitData, takingChargePhone: e.target.value})} />
                        <textarea placeholder="Précision (Optionnel)" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.takingChargeOtherDescription} onChange={e => setExitData({...exitData, takingChargeOtherDescription: e.target.value})} />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Destination dans la région de Kénitra ?</label>
                  <div className='flex gap-4'>
                      <button type="button" onClick={() => setExitData({...exitData, destinationType: 'Kenitra', transferType: 'Intra_regional'})} className={`p-4 rounded-xl flex-1 ${exitData.destinationType === 'Kenitra' ? 'bg-[#006050] text-white' : 'bg-slate-100'}`}>Oui</button>
                      <button type="button" onClick={() => setExitData({...exitData, destinationType: 'Hors_region', transferType: 'Extra_regional'})} className={`p-4 rounded-xl flex-1 ${exitData.destinationType === 'Hors_region' ? 'bg-[#006050] text-white' : 'bg-slate-100'}`}>Non</button>
                  </div>
                  {exitData.destinationType === 'Kenitra' && (
                      <>
                        <input placeholder="Ville / Commune" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.destinationCityOrCommune} onChange={e => setExitData({...exitData, destinationCityOrCommune: e.target.value})} />
                        <input placeholder="Destination précise" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.destinationPrecise} onChange={e => setExitData({...exitData, destinationPrecise: e.target.value})} />
                      </>
                  )}
                  {exitData.destinationType === 'Hors_region' && (
                      <>
                        <input placeholder="Région de destination" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.destinationRegion} onChange={e => setExitData({...exitData, destinationRegion: e.target.value})} />
                        <input placeholder="Ville" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.destinationCityOrCommune} onChange={e => setExitData({...exitData, destinationCityOrCommune: e.target.value})} />
                        <input placeholder="Destination précise" className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800" value={exitData.destinationPrecise} onChange={e => setExitData({...exitData, destinationPrecise: e.target.value})} />
                      </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Notes supplémentaires</label>
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
