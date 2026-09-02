import { safeDate } from '../lib/utils';
import { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, ArrowLeft, CheckCircle2, ChevronRight, User, FileText, Edit, MapPin, Eye, Trash2, Activity, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeceasedRecord } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface HistoricalDeceasedProps {
  data: any;
  onNavigate: (screen: string) => void;
}

export function HistoricalDeceased({ data, onNavigate }: HistoricalDeceasedProps) {
  const { historicalDeceased = [], registerHistoricalDeceased } = data || {};
  const { user } = useAuth();
  
  const [viewState, setViewState] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
  const [selectedRecord, setSelectedRecord] = useState<DeceasedRecord | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Form steps
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    isUnknown: false,
    cin: '',
    refNumber: '',
    gender: 'Indéterminé',
    age: '',
    ageUnit: 'Années' as 'Années' | 'Mois' | 'Semaines' | 'Jours' | 'Heures',
    dateOfDeath: '',
    natureOfDeath: 'Normal',
    cause: 'Naturelle',
    admissionDate: '',
    exitDate: '',
    exitType: 'Inhumation',
    takingChargeType: '',
    takingChargeCin: '',
    takingChargeResponsibleName: '',
    takingChargeAssociationName: '',
    ambulanceNumber: '',
    ambulanceDriverName: '',
    ambulanceDriverPhone: ''
  });

  // Filtered List
  const filteredRecords = historicalDeceased.filter((rec: DeceasedRecord) => {
    const matchesSearch = 
      (rec.name && rec.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (rec.refNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.cause && rec.cause.toLowerCase().includes(searchTerm.toLowerCase()));

    if (startDate || endDate) {
      const recDate = safeDate(rec.dateOfDeath);
      if (recDate) {
        const recDateStr = recDate.toISOString().split('T')[0];
        if (startDate && recDateStr < startDate) return false;
        if (endDate && recDateStr > endDate) return false;
      }
    }
    return matchesSearch;
  });

  // Handle natureOfDeath conditional logic based on age
  useEffect(() => {
    if (formData.age !== '') {
      const ageNum = parseInt(formData.age, 10);
      if (!isNaN(ageNum)) {
        if (formData.ageUnit === 'Années' && ageNum >= 1) {
          setFormData(prev => ({ ...prev, natureOfDeath: 'Normal' }));
        } else if (formData.ageUnit === 'Années' && ageNum < 1) {
          setFormData(prev => {
            if (prev.natureOfDeath === 'Normal') {
              return { ...prev, natureOfDeath: 'Fœtus' };
            }
            return prev;
          });
        }
      }
    }
  }, [formData.age, formData.ageUnit]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      firstName: '',
      isUnknown: false,
      cin: '',
      refNumber: '',
      gender: 'Indéterminé',
      age: '',
      ageUnit: 'Années',
      dateOfDeath: '',
      natureOfDeath: 'Normal',
      cause: 'Naturelle',
      admissionDate: '',
      exitDate: '',
      exitType: 'Inhumation',
      takingChargeType: '',
      takingChargeCin: '',
      takingChargeResponsibleName: '',
      takingChargeAssociationName: '',
      ambulanceNumber: '',
      ambulanceDriverName: '',
      ambulanceDriverPhone: ''
    });
    setCurrentStep(1);
    setViewState('create');
    setSuccess(false);
  };

  const handleOpenEdit = (record: DeceasedRecord) => {
    setSelectedRecord(record);
    setFormData({
      name: record.name || '',
      firstName: record.firstName || '',
      isUnknown: record.isUnknown || record.name === 'X fils de X (Inconnu)' || false,
      cin: record.cin || '',
      refNumber: record.refNumber || '',
      gender: record.gender || 'Indéterminé',
      age: record.age?.toString() || '',
      ageUnit: record.ageUnit || 'Années',
      dateOfDeath: safeDate(record.dateOfDeath)?.toISOString().split('T')[0] || '',
      natureOfDeath: record.natureOfDeath || 'Normal',
      cause: record.cause || 'Naturelle',
      admissionDate: safeDate(record.admissionDate)?.toISOString().split('T')[0] || '',
      exitDate: safeDate(record.exitDate)?.toISOString().split('T')[0] || '',
      exitType: record.exitType || 'Inhumation',
      takingChargeType: record.takingChargeType || '',
      takingChargeCin: record.takingChargeCin || '',
      takingChargeResponsibleName: record.takingChargeResponsibleName || '',
      takingChargeAssociationName: record.takingChargeAssociationName || '',
      ambulanceNumber: record.ambulanceNumber || '',
      ambulanceDriverName: record.ambulanceDriverName || '',
      ambulanceDriverPhone: record.ambulanceDriverPhone || ''
    });
    setCurrentStep(1);
    setViewState('edit');
  };

  const handleCreateSubmit = async () => {
    if (!formData.isUnknown && (!formData.name || !formData.firstName)) {
      alert("Veuillez renseigner le nom et le prénom ou cocher l'identité inconnue.");
      return;
    }
    setLoading(true);

    try {
      const recordPayload: any = {
        name: formData.name,
        firstName: formData.firstName,
        isUnknown: formData.isUnknown,
        cin: formData.cin,
        refNumber: formData.refNumber,
        gender: formData.gender,
        age: formData.age !== '' ? parseInt(formData.age, 10) : null,
        ageUnit: formData.ageUnit,
        dateOfDeath: formData.dateOfDeath ? Timestamp.fromDate(new Date(`${formData.dateOfDeath}T12:00:00`)) : null,
        natureOfDeath: formData.natureOfDeath,
        cause: formData.cause,
        admissionDate: formData.admissionDate ? Timestamp.fromDate(new Date(`${formData.admissionDate}T12:00:00`)) : null,
        exitDate: formData.exitDate ? Timestamp.fromDate(new Date(`${formData.exitDate}T12:00:00`)) : null,
        exitType: formData.exitType,
        takingChargeType: formData.takingChargeType,
        takingChargeCin: formData.takingChargeType === 'Famille' ? formData.takingChargeCin : null,
        takingChargeResponsibleName: formData.takingChargeType === 'Famille' ? formData.takingChargeResponsibleName : null,
        takingChargeAssociationName: formData.takingChargeType === 'Association' ? formData.takingChargeAssociationName : null,
        ambulanceNumber: formData.ambulanceNumber,
        ambulanceDriverName: formData.ambulanceDriverName,
        ambulanceDriverPhone: formData.ambulanceDriverPhone,
        
        status: 'released', // Always released for history
        origin: 'Marocain', // Safe default mapping
        admissionTime: 'X',
        timeOfDeath: 'X',
        fridgePosition: 'X' // Placeholder
      };

      await registerHistoricalDeceased(recordPayload);
      setSuccess(true);
      setTimeout(() => {
        setViewState('list');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRecord) return;
    if (!formData.isUnknown && (!formData.name || !formData.firstName)) {
      alert("Veuillez renseigner le nom et le prénom ou cocher l'identité inconnue.");
      return;
    }
    setLoading(true);

    try {
      const recordPayload: any = {
        name: formData.name,
        firstName: formData.firstName,
        isUnknown: formData.isUnknown,
        cin: formData.cin,
        refNumber: formData.refNumber,
        gender: formData.gender,
        age: formData.age !== '' ? parseInt(formData.age, 10) : null,
        ageUnit: formData.ageUnit,
        dateOfDeath: formData.dateOfDeath ? Timestamp.fromDate(new Date(`${formData.dateOfDeath}T12:00:00`)) : null,
        natureOfDeath: formData.natureOfDeath,
        cause: formData.cause,
        admissionDate: formData.admissionDate ? Timestamp.fromDate(new Date(`${formData.admissionDate}T12:00:00`)) : null,
        exitDate: formData.exitDate ? Timestamp.fromDate(new Date(`${formData.exitDate}T12:00:00`)) : null,
        exitType: formData.exitType,
        takingChargeType: formData.takingChargeType,
        takingChargeCin: formData.takingChargeType === 'Famille' ? formData.takingChargeCin : null,
        takingChargeResponsibleName: formData.takingChargeType === 'Famille' ? formData.takingChargeResponsibleName : null,
        takingChargeAssociationName: formData.takingChargeType === 'Association' ? formData.takingChargeAssociationName : null,
        ambulanceNumber: formData.ambulanceNumber,
        ambulanceDriverName: formData.ambulanceDriverName,
        ambulanceDriverPhone: formData.ambulanceDriverPhone,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'deceased', selectedRecord.id), recordPayload);
      
      setSelectedRecord({
        ...selectedRecord,
        ...recordPayload
      });
      
      setSuccess(true);
      setTimeout(() => {
        setViewState('detail');
        setSuccess(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier historique ?")) {
      try {
        await data.deleteDeceasedRecord(id);
        setViewState('list');
        setSelectedRecord(null);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const ageNum = parseInt(formData.age, 10);
  const isInfant = !isNaN(ageNum) && (formData.ageUnit !== 'Années' || ageNum < 1);

  return (
    <div className="space-y-6 pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Dossier Historique</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Gérez les anciens dossiers</p>
          </div>
        </div>
        
        {viewState === 'list' && (
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Dossier</span>
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher (Nom, Numéro, Cause)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input 
                type="date"
                className="px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <input 
                type="date"
                className="px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">N° Dossier</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom & Prénom</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Décès</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cause</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredRecords.length > 0 ? filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{record.refNumber || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {record.name ? record.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{record.firstName} {record.name}</p>
                            <p className="text-xs font-semibold text-slate-400">{record.cin || 'Sans CIN'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {(() => {
                            const dDate = safeDate(record.dateOfDeath);
                            return dDate ? dDate.toLocaleDateString('fr-FR') : '-';
                          })()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                          {record.cause || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => { setSelectedRecord(record); setViewState('detail'); }} className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-semibold">Aucun dossier historique trouvé.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {(viewState === 'create' || viewState === 'edit') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <button 
            onClick={() => setViewState(viewState === 'create' ? 'list' : 'detail')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                {viewState === 'create' ? "Nouveau Dossier Historique" : "Modifier le Dossier"}
              </h2>

              <div className="flex gap-2 mt-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex-1">
                    <div className={cn("h-1.5 rounded-full transition-colors", currentStep >= step ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2", currentStep >= step ? "text-indigo-600" : "text-slate-400")}>
                      {step === 1 ? 'Identification' : step === 2 ? 'Décès' : 'Admission & Sortie'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 md:p-8">
              {success ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Opération Réussie</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Les données ont été enregistrées avec succès.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                        <input 
                          type="checkbox" 
                          id="isUnknownHistorical"
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                          checked={formData.isUnknown}
                          onChange={e => setFormData({
                            ...formData, 
                            isUnknown: e.target.checked, 
                            name: e.target.checked ? "X fils de X (Inconnu)" : "",
                            firstName: e.target.checked ? "" : formData.firstName
                          })}
                        />
                        <label htmlFor="isUnknownHistorical" className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest cursor-pointer">
                          Identité inconnue (X fils de X)
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom *</label>
                          <input type="text" className={cn("w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold", formData.isUnknown && "text-slate-400 bg-slate-100/50 dark:bg-slate-900/50")} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value, isUnknown: false})} disabled={formData.isUnknown} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prénom *</label>
                          <input type="text" className={cn("w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold", formData.isUnknown && "text-slate-400 bg-slate-100/50 dark:bg-slate-900/50")} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value, isUnknown: false})} disabled={formData.isUnknown} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CNI</label>
                          <input type="text" className={cn("w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold", formData.isUnknown && "text-slate-400 bg-slate-100/50 dark:bg-slate-900/50")} value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} disabled={formData.isUnknown} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Numéro de dossier</label>
                          <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.refNumber} onChange={e => setFormData({...formData, refNumber: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sexe</label>
                          <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                            <option value="Indéterminé">Indéterminé</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Âge</label>
                          <div className="flex gap-2">
                            <input type="number" min="0" className="w-1/2 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="Ex: 2" />
                            <select className="w-1/2 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.ageUnit} onChange={e => setFormData({...formData, ageUnit: e.target.value as any})}>
                              <option value="Années">Années</option>
                              <option value="Mois">Mois</option>
                              <option value="Semaines">Semaines</option>
                              <option value="Jours">Jours</option>
                              <option value="Heures">Heures</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date de décès</label>
                          <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-600" value={formData.dateOfDeath} onChange={e => setFormData({...formData, dateOfDeath: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nature du décès</label>
                          <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.natureOfDeath} onChange={e => setFormData({...formData, natureOfDeath: e.target.value})}>
                            <option value="Normal">Normal</option>
                            {isInfant && <option value="Fœtus">Fœtus</option>}
                            {isInfant && <option value="Mort-né">Mort-né</option>}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cause du décès</label>
                          <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.cause} onChange={e => setFormData({...formData, cause: e.target.value})}>
                            <option value="Naturelle">Naturelle</option>
                            <option value="AVP">AVP</option>
                            <option value="Non naturelle">Non naturelle</option>
                            <option value="Arrivé décédé">Arrivé décédé</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date d'admission</label>
                          <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-600" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date de sortie</label>
                          <input type="date" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-600" value={formData.exitDate} onChange={e => setFormData({...formData, exitDate: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de sortie</label>
                          <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.exitType} onChange={e => setFormData({...formData, exitType: e.target.value})}>
                            <option value="Inhumation">Inhumation</option>
                            <option value="Transfert">Transfert</option>
                            <option value="Morgue externe">Morgue externe</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Type de Prise en Charge</h4>
                        <select className="w-full mb-4 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.takingChargeType} onChange={e => setFormData({...formData, takingChargeType: e.target.value})}>
                          <option value="">Sélectionnez...</option>
                          <option value="Famille">Famille</option>
                          <option value="Association">Association</option>
                        </select>

                        {formData.takingChargeType === 'Famille' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CNI du récepteur</label>
                              <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.takingChargeCin} onChange={e => setFormData({...formData, takingChargeCin: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom du récepteur</label>
                              <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.takingChargeResponsibleName} onChange={e => setFormData({...formData, takingChargeResponsibleName: e.target.value})} />
                            </div>
                          </div>
                        )}

                        {formData.takingChargeType === 'Association' && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom de l'association</label>
                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.takingChargeAssociationName} onChange={e => setFormData({...formData, takingChargeAssociationName: e.target.value})} />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ambulance de prise en charge</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Numéro d'ambulance</label>
                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.ambulanceNumber} onChange={e => setFormData({...formData, ambulanceNumber: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom de l'ambulancier</label>
                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.ambulanceDriverName} onChange={e => setFormData({...formData, ambulanceDriverName: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">N° de téléphone</label>
                            <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold" value={formData.ambulanceDriverPhone} onChange={e => setFormData({...formData, ambulanceDriverPhone: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-8 flex justify-between">
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      className={cn("px-6 py-3 font-bold rounded-xl transition-colors", currentStep === 1 ? "opacity-0 pointer-events-none" : "text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300")}
                    >
                      Précédent
                    </button>

                    {currentStep < 3 ? (
                      <button 
                        type="button" 
                        onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2"
                      >
                        Suivant <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={viewState === 'create' ? handleCreateSubmit : handleEditSubmit}
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold rounded-xl flex items-center gap-2"
                      >
                        {loading ? 'Traitement...' : '💾 Enregistrer'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {viewState === 'detail' && selectedRecord && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <button onClick={() => setViewState('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex gap-2 w-full md:w-auto">
              {user?.role === 'admin' && (
                <button onClick={() => handleDelete(selectedRecord.id)} className="flex-1 md:flex-none px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Supprimer</span>
                </button>
              )}
              <button onClick={() => handleOpenEdit(selectedRecord)} className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" /> <span>Modifier</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Détails du Dossier</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <User className="w-4 h-4" /> Identification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <DetailRow label="Nom" value={selectedRecord.name} />
                  <DetailRow label="Prénom" value={selectedRecord.firstName} />
                  <DetailRow label="CNI" value={selectedRecord.cin} />
                  <DetailRow label="N° Dossier" value={selectedRecord.refNumber} />
                  <DetailRow label="Sexe" value={selectedRecord.gender} />
                  <DetailRow label="Âge" value={selectedRecord.age !== undefined && selectedRecord.age !== null ? `${selectedRecord.age} ${selectedRecord.ageUnit || 'Années'}` : undefined} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Activity className="w-4 h-4" /> Décès
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <DetailRow label="Date de décès" value={(() => {
                    const d = safeDate(selectedRecord.dateOfDeath);
                    return d ? d.toLocaleDateString('fr-FR') : undefined;
                  })()} />
                  <DetailRow label="Nature du décès" value={selectedRecord.natureOfDeath} />
                  <DetailRow label="Cause du décès" value={selectedRecord.cause} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <MapPin className="w-4 h-4" /> Admission & Sortie
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <DetailRow label="Date d'admission" value={(() => {
                    const d = safeDate(selectedRecord.admissionDate);
                    return d ? d.toLocaleDateString('fr-FR') : undefined;
                  })()} />
                  <DetailRow label="Date de sortie" value={(() => {
                    const d = safeDate(selectedRecord.exitDate);
                    return d ? d.toLocaleDateString('fr-FR') : undefined;
                  })()} />
                  <DetailRow label="Type de sortie" value={selectedRecord.exitType} />
                </div>
                
                {selectedRecord.takingChargeType && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prise en charge ({selectedRecord.takingChargeType})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRecord.takingChargeType === 'Famille' ? (
                        <>
                          <DetailRow label="CNI Récepteur" value={selectedRecord.takingChargeCin} />
                          <DetailRow label="Nom Récepteur" value={selectedRecord.takingChargeResponsibleName} />
                        </>
                      ) : (
                        <DetailRow label="Nom de l'Association" value={selectedRecord.takingChargeAssociationName} />
                      )}
                    </div>
                  </div>
                )}

                {(selectedRecord.ambulanceNumber || selectedRecord.ambulanceDriverName) && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Truck className="w-3 h-3" /> Ambulance de prise en charge
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <DetailRow label="Numéro" value={selectedRecord.ambulanceNumber} />
                      <DetailRow label="Ambulancier" value={selectedRecord.ambulanceDriverName} />
                      <DetailRow label="Téléphone" value={selectedRecord.ambulanceDriverPhone} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DetailRow({ label, value, valueClassName }: { label: string; value?: string | null; valueClassName?: string }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={cn("text-sm font-bold text-slate-800 dark:text-white", valueClassName, !value && "text-slate-300 dark:text-slate-600 font-medium italic")}>
        {value || 'Non renseigné'}
      </p>
    </div>
  );
}
