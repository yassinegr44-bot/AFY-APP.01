import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  User, 
  FileText, 
  Refrigerator, 
  Activity,
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface NewDeceasedProps {
  data: any;
  onComplete: () => void;
}

export function NewDeceased({ data, onComplete }: NewDeceasedProps) {
  const { registerDeceased, fridge } = data;
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    refNumber: 'AUTO',
    name: '',
    cin: '',
    isUnknown: false,
    gender: 'Masculin',
    otherGender: '',
    dob: '',
    caseType: 'DÉCÈS',
    dateOfDeath: new Date().toISOString().split('T')[0],
    timeOfDeath: '12:00',
    cause: '',
    origin: 'Marocain',
    nationality: '',
    originDetail: '',
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: new Date().toTimeString().slice(0, 5),
    fridgePosition: 0,
    missingBodyParts: [],
    otherMissingBodyPartsDescription: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const availablePositions = fridge.filter((p: any) => p.status === 'available' && p.type === 'normal');

  const bodyPartOptions = [
    "Main gauche", "Main droite", "Bras gauche", "Bras droit", 
    "Jambe gauche", "Jambe droite", "Pied gauche", "Pied droit", 
    "Avant-bras gauche", "Avant-bras droit", "Partie de la jambe gauche", 
    "Partie de la jambe droite"
  ];

  const handleBodyPartChange = (part: string) => {
    setFormData(prev => {
      const parts = prev.missingBodyParts.includes(part)
        ? prev.missingBodyParts.filter(p => p !== part)
        : [...prev.missingBodyParts, part];
      return { ...prev, missingBodyParts: parts };
    });
  };

  const isSpecialCase = formData.caseType !== 'DÉCÈS';

  const handleNext = () => {
    if (!formData.isUnknown && !formData.name && formData.caseType !== 'MEMBRE_AMPUTÉ') {
      alert("Veuillez entrer le nom complet ou cocher 'Identité inconnue'.");
      return;
    }
    if (!isSpecialCase && formData.fridgePosition === 0) {
      alert("Veuillez sélectionner une position dans le frigo.");
      return;
    }
    setStep(2);
  };
  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalName = formData.isUnknown ? "X fils de X (Inconnu)" : formData.name || (formData.caseType === 'MEMBRE_AMPUTÉ' ? "Membre Amputé" : "Dossier Spécial");
      
      await registerDeceased({
        ...formData,
        name: finalName,
        dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
        dateOfDeath: Timestamp.fromDate(new Date(`${formData.dateOfDeath}T12:00:00`)),
        admissionDate: Timestamp.fromDate(new Date(`${formData.admissionDate}T${formData.admissionTime || '00:00'}:00`)),
        status: 'in_facility'
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-[#006050] dark:text-emerald-400 rounded-full flex items-center justify-center mb-8"
        >
          <CheckCircle2 size={56} strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Admission Réussie</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-12">Le dossier a été enregistré avec succès.</p>
        <button 
          onClick={onComplete}
          className="w-full py-4 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-[#006050]/10"
        >
          Continuer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Nouveau décès</h1>

      {/* Steps Stepper */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between mb-6 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-colors",
            step >= 1 ? "bg-[#006050] dark:bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          )}>1</div>
          <span className={cn("text-xs font-bold", step >= 1 ? "text-slate-800 dark:text-slate-100" : "text-slate-400")}>Saisie</span>
        </div>
        <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 mx-4" />
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-colors",
            step >= 2 ? "bg-[#006050] dark:bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          )}>2</div>
          <span className={cn("text-xs font-bold", step >= 2 ? "text-slate-800 dark:text-slate-100" : "text-slate-400")}>Confirmation</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Identification */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <User size={16} /> Identification
              </h3>
              <FormInput label="Numéro de référence" value="Génération automatique" readOnly className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-black italic" />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Type de Cas</label>
                <select 
                  className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300 font-black text-[#006050] dark:text-emerald-400"
                  value={formData.caseType}
                  onChange={e => setFormData({...formData, caseType: e.target.value})}
                >
                  <option value="DÉCÈS">Décès (Standard)</option>
                  <option value="FŒTUS">Fœtus</option>
                  <option value="MORT_NÉ">Mort-né</option>
                  <option value="ENFANT_MOINS_1_AN">Enfant (Fils/Fille de)</option>
                  <option value="MEMBRE_AMPUTÉ">Membre amputé</option>
                </select>
              </div>

              {isSpecialCase && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">Cas spécial détecté</p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">Affectation automatique : Frigo 12 — Frigo Spécial (Capacité 15 places)</p>
                  </div>
                </div>
              )}

              {formData.caseType !== 'MEMBRE_AMPUTÉ' && (
                <>
                  <FormInput 
                    label="Nom complet / Identité" 
                    placeholder="Entrez le nom complet" 
                    value={formData.name} 
                    onChange={(v: string) => setFormData({...formData, name: v, isUnknown: false})} 
                    disabled={formData.isUnknown}
                    className={formData.isUnknown ? "bg-slate-50 dark:bg-slate-950 text-slate-400" : ""}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="isUnknown"
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#006050] focus:ring-[#006050]"
                      checked={formData.isUnknown}
                      onChange={e => setFormData({...formData, isUnknown: e.target.checked, name: e.target.checked ? "X fils de X (Inconnu)" : ""})}
                    />
                    <label htmlFor="isUnknown" className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest cursor-pointer">
                      Identité inconnue (X fils de X)
                    </label>
                  </div>
                </>
              )}
              <FormInput 
                label="Numéro CIN (Optionnel)" 
                placeholder="Ex: AB123456" 
                value={formData.cin} 
                onChange={(v: string) => setFormData({...formData, cin: v})} 
                disabled={formData.isUnknown}
                className={formData.isUnknown ? "bg-slate-50 dark:bg-slate-950 text-slate-400" : ""}
              />
              <FormInput 
                label="Date de naissance" 
                type="date" 
                value={formData.dob} 
                onChange={v => setFormData({...formData, dob: v})} 
                icon={Calendar}
              />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sexe</label>
                <select 
                    className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as any})}
                >
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                    <option value="Autre">Autre</option>
                </select>
                {formData.gender === 'Autre' && (
                    <input 
                        className="w-full px-4 py-3 mt-2 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                        placeholder="Précisez..."
                        value={formData.otherGender}
                        onChange={e => setFormData({...formData, otherGender: e.target.value})}
                    />
                )}
              </div>
            </div>

            {/* Parties corporelles */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <Activity size={16} /> Parties corporelles absentes / amputées
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFormData(prev => ({ ...prev, missingBodyParts: [] }))}
                    className={cn("px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors", formData.missingBodyParts.length === 0 ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-600")}
                >
                    Aucun
                </button>
                {bodyPartOptions.map(part => (
                    <button 
                        key={part}
                        onClick={() => handleBodyPartChange(part)}
                        className={cn("px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors", formData.missingBodyParts.includes(part) ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-slate-100 border-slate-200 text-slate-600")}
                    >
                        {part}
                    </button>
                ))}
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.missingBodyParts.includes('Autre')}
                        onChange={() => handleBodyPartChange('Autre')}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#006050]"
                    />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Autre</span>
                </label>
                {formData.missingBodyParts.includes('Autre') && (
                    <input 
                        className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                        placeholder="Précisez..."
                        value={formData.otherMissingBodyPartsDescription}
                        onChange={e => setFormData({...formData, otherMissingBodyPartsDescription: e.target.value})}
                    />
                )}
              </div>
            </div>

            {/* Informations de décès */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <Activity size={16} /> Informations de décès
              </h3>
              <FormInput 
                label="Date du décès" 
                type="date" 
                value={formData.dateOfDeath} 
                onChange={v => setFormData({...formData, dateOfDeath: v})} 
                icon={Calendar}
              />
              <FormInput 
                label="Heure du décès" 
                type="time" 
                value={formData.timeOfDeath} 
                onChange={v => setFormData({...formData, timeOfDeath: v})} 
                icon={Clock}
              />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Origine</label>
                <select 
                    className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                    value={formData.origin}
                    onChange={e => setFormData({...formData, origin: e.target.value as any})}
                >
                    <option value="Marocain">Marocain</option>
                    <option value="Étranger">Étranger</option>
                </select>
                {formData.origin === 'Étranger' && (
                    <input 
                        className="w-full px-4 py-3 mt-2 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                        placeholder="Nationalité..."
                        value={formData.nationality}
                        onChange={e => setFormData({...formData, nationality: e.target.value})}
                    />
                )}
              </div>
              <FormInput 
                label="Lieu d'origine (précision)" 
                placeholder="Ex: Hôpital Central" 
                value={formData.originDetail} 
                onChange={v => setFormData({...formData, originDetail: v})} 
                icon={MapPin}
              />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cause / Circonstance</label>
                <select 
                  className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                  value={formData.cause}
                  onChange={e => setFormData({...formData, cause: e.target.value})}
                >
                  <option value="">Sélectionnez une cause</option>
                  <option value="Mort naturelle">Mort naturelle</option>
                  <option value="Accident de la route">Accident de la route</option>
                  <option value="Arrêt cardiaque">Arrêt cardiaque</option>
                  <option value="Inconnue">Inconnue</option>
                  <option value="Autre / Suspicieux">Autre / Suspicieux</option>
                </select>
              </div>
            </div>

            {/* Admission & Frigo */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <Refrigerator size={16} /> Admission & Frigo
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormInput 
                  label="Date d'admission" 
                  type="date" 
                  value={formData.admissionDate} 
                  onChange={v => setFormData({...formData, admissionDate: v})} 
                />
                <FormInput 
                  label="Heure d'admission" 
                  type="time" 
                  value={formData.admissionTime} 
                  onChange={v => setFormData({...formData, admissionTime: v})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assigner un Frigo (1 à 10)</label>
                {isSpecialCase ? (
                  <div className="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>Frigo 12 — Frigo Spécial</span>
                    <span className="bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full uppercase text-[10px]">Affectation automatique (Pos. 1-15)</span>
                  </div>
                ) : (
                  <select 
                    className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300"
                    value={formData.fridgePosition}
                    onChange={e => setFormData({...formData, fridgePosition: parseInt(e.target.value)})}
                  >
                    <option value="0">Sélectionner un frigo libre</option>
                    {availablePositions.sort((a: any, b: any) => a.fridgeNumber - b.fridgeNumber).map((p: any) => (
                      <option key={p.id} value={p.fridgeNumber}>Frigo {p.fridgeNumber.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Remarques */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <FileText size={16} /> Remarques
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes opérationnelles</label>
                <textarea 
                  className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300 min-h-[100px]"
                  placeholder="Ajoutez des observations ou instructions spécifiques..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="w-full py-4 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20"
            >
              Étape suivante: Confirmer <ChevronRight size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-sm font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 mb-4">Récapitulatif des données</h3>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                <ReviewRow label="Référence" value="Sera générée (AFY 2026 XXXX)" />
                <ReviewRow label="Nom" value={formData.name || 'Identité Inconnue'} />
                <ReviewRow label="Sexe" value={formData.gender === 'Autre' ? `Autre (${formData.otherGender})` : formData.gender} />
                <ReviewRow label="Date Naissance" value={formData.dob || 'Non renseignée'} />
                <ReviewRow label="Affectation" value={formData.caseType === 'MEMBRE_AMPUTÉ' ? 'Frigo 11 (Légal)' : isSpecialCase ? 'Frigo 12 (Néonat)' : `FRIGO-${formData.fridgePosition.toString().padStart(2, '0')}`} />
                <ReviewRow label="Admission" value={`${formData.admissionDate} à ${formData.admissionTime}`} />
                <ReviewRow label="Origine" value={`${formData.origin}${formData.origin === 'Étranger' ? ` (${formData.nationality})` : ''}`} />
                <ReviewRow label="Détail Origine" value={formData.originDetail || 'Non renseigné'} />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleBack}
                className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} /> Retour
              </button>
              <button 
                disabled={loading}
                onClick={handleSubmit}
                className="flex-[2] py-4 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/20 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Finaliser Admission'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormInput({ label, icon: Icon, className, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="relative">
        <input 
          className={cn(
            "w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all",
            Icon && "pr-10",
            className
          )}
          {...props}
          onChange={e => props.onChange && props.onChange(e.target.value)}
        />
        {Icon && <Icon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700" />}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-3">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}
