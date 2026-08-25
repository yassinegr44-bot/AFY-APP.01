import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Activity, 
  FileText, 
  Filter, 
  Edit,
  MapPin,
  X,
  Eye,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cin: '',
    firstName: '',
    isUnknown: false,
    gender: 'Masculin' as 'Masculin' | 'Féminin' | 'Autre',
    otherGender: '',
    dob: '',
    dateOfDeath: '',
    timeOfDeath: '12:00',
    admissionDate: '',
    admissionTime: '12:00',
    exitDate: '',
    exitTime: '',
    takingChargeType: '',
    takingChargeResponsibleName: '',
    takingChargeResponsibleRelation: '',
    takingChargeResponsibleContact: '',
    transportType: 'Ambulance de la commune',
    transportDetails: '',
    destination: '',
    cause: '',
    origin: 'Marocain' as 'Marocain' | 'Étranger',
    nationality: '',
    originDetail: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filtered List
  const filteredRecords = historicalDeceased.filter((rec: DeceasedRecord) => {
    // Search filter
    const matchesSearch = 
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rec.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.cause && rec.cause.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date range filter
    if (startDate || endDate) {
      const recDate = rec.dateOfDeath?.toDate ? rec.dateOfDeath.toDate() : (rec.dateOfDeath && typeof rec.dateOfDeath !== 'object' ? new Date(rec.dateOfDeath) : null);
      if (recDate) {
        const recDateStr = recDate.toISOString().split('T')[0];
        
        if (startDate && recDateStr < startDate) return false;
        if (endDate && recDateStr > endDate) return false;
      }
    }

    return matchesSearch;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      firstName: '',
      isUnknown: false,
      gender: 'Masculin',
      otherGender: '',
      dob: '',
      dateOfDeath: new Date().toISOString().split('T')[0],
      timeOfDeath: '12:00',
      admissionDate: new Date().toISOString().split('T')[0],
      admissionTime: '12:00',
      exitDate: '',
      exitTime: '',
      takingChargeType: '',
    takingChargeResponsibleName: '',
      takingChargeResponsibleRelation: '',
      takingChargeResponsibleContact: '',
      transportType: 'Ambulance de la commune',
      transportDetails: '',
      destination: '',
      cause: '',
      origin: 'Marocain',
      nationality: '',
      originDetail: '',
      notes: ''
    });
    setViewState('create');
    setSuccess(false);
  };

  const handleOpenDetail = (record: DeceasedRecord) => {
    setSelectedRecord(record);
    setViewState('detail');
  };

  const handleOpenEdit = (record: DeceasedRecord) => {
    setSelectedRecord(record);
    setFormData({
      name: record.name.split(' ')[1] || record.name,
      firstName: record.name.split(' ')[0] || '',
      isUnknown: record.isUnknown || false,
      gender: record.gender || 'Masculin',
      otherGender: record.otherGender || '',
      dob: record.dob?.toDate ? record.dob.toDate().toISOString().split('T')[0] : (typeof record.dob === 'string' ? record.dob : ''),
      dateOfDeath: record.dateOfDeath?.toDate ? record.dateOfDeath.toDate().toISOString().split('T')[0] : (typeof record.dateOfDeath === 'string' ? record.dateOfDeath : ''),
      timeOfDeath: record.timeOfDeath || '12:00',
      admissionDate: record.admissionDate?.toDate ? record.admissionDate.toDate().toISOString().split('T')[0] : (typeof record.admissionDate === 'string' ? record.admissionDate : ''),
      admissionTime: record.admissionTime || '12:00',
      exitDate: record.exitDate?.toDate ? record.exitDate.toDate().toISOString().split('T')[0] : (typeof record.exitDate === 'string' ? record.exitDate : ''),
      exitTime: record.exitTime || '',
      takingChargeResponsibleName: record.takingChargeResponsibleName || '',
      takingChargeResponsibleRelation: record.takingChargeResponsibleRelation || '',
      takingChargeResponsibleContact: record.takingChargeResponsibleContact || '',
      transportType: record.transportType || 'Ambulance de la commune',
      transportDetails: record.transportDetails || '',
      destination: record.destination || '',
      cause: record.cause || '',
      origin: record.origin || 'Marocain',
      nationality: record.nationality || '',
      originDetail: record.originDetail || '',
      notes: record.notes || ''
    });
    setViewState('edit');
  };

  const handleCreateSubmit = async () => {
    if (!formData.isUnknown && !formData.name) {
      alert("Veuillez renseigner le nom.");
      return;
    }
    if (!formData.dateOfDeath || !formData.admissionDate) {
      alert("Veuillez renseigner les dates obligatoires (décès et admission).");
      return;
    }

    setLoading(true);
    try {
      const fullName = formData.isUnknown 
        ? "X fils de X (Inconnu)" 
        : `${formData.firstName} ${formData.name}`.trim();
      const recordPayload: any = {
        name: fullName,
        cin: formData.cin,
        isUnknown: formData.isUnknown,
        gender: formData.gender,
        otherGender: formData.otherGender,
        dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
        dateOfDeath: Timestamp.fromDate(new Date(`${formData.dateOfDeath}T12:00:00`)),
        timeOfDeath: formData.timeOfDeath,
        admissionDate: Timestamp.fromDate(new Date(`${formData.admissionDate}T${formData.admissionTime || '12:00'}:00`)),
        admissionTime: formData.admissionTime,
        cause: formData.cause || 'Non spécifiée',
        origin: formData.origin,
        nationality: formData.nationality,
        originDetail: formData.originDetail,
        notes: formData.notes,
        fridgePosition: -1, // No fridge assigned
        status: formData.exitDate ? 'released' : 'in_facility',
        timeline: []
      };

      if (formData.exitDate) {
        recordPayload.exitDate = Timestamp.fromDate(new Date(`${formData.exitDate}T${formData.exitTime || '12:00'}:00`));
        recordPayload.exitTime = formData.exitTime || '12:00';
        recordPayload.takingChargeType = null;
        recordPayload.takingChargeResponsibleName = formData.takingChargeResponsibleName;
        recordPayload.takingChargeResponsibleRelation = formData.takingChargeResponsibleRelation;
        recordPayload.takingChargeResponsibleContact = formData.takingChargeResponsibleContact;
        recordPayload.transportType = formData.transportType;
        recordPayload.transportDetails = formData.transportDetails;
        recordPayload.destination = formData.destination;
      }

      await registerHistoricalDeceased(recordPayload);
      setSuccess(true);
      setTimeout(() => {
        setViewState('list');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du dossier historique.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRecord) return;
    if (!formData.isUnknown && !formData.name) {
      alert("Veuillez renseigner le nom.");
      return;
    }

    setLoading(true);
    try {
      const fullName = formData.isUnknown 
        ? "X fils de X (Inconnu)" 
        : `${formData.firstName} ${formData.name}`.trim();

      const recordPayload: any = {
        name: fullName,
        cin: formData.cin,
        gender: formData.gender,
        otherGender: formData.otherGender,
        dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
        dateOfDeath: Timestamp.fromDate(new Date(`${formData.dateOfDeath}T12:00:00`)),
        timeOfDeath: formData.timeOfDeath,
        admissionDate: Timestamp.fromDate(new Date(`${formData.admissionDate}T${formData.admissionTime || '12:00'}:00`)),
        admissionTime: formData.admissionTime,
        cause: formData.cause || 'Non spécifiée',
        origin: formData.origin,
        nationality: formData.nationality,
        originDetail: formData.originDetail,
        notes: formData.notes,
        status: formData.exitDate ? 'released' : 'in_facility',
        updatedAt: serverTimestamp()
      };

      if (formData.exitDate) {
        recordPayload.exitDate = Timestamp.fromDate(new Date(`${formData.exitDate}T${formData.exitTime || '12:00'}:00`));
        recordPayload.exitTime = formData.exitTime || '12:00';
        recordPayload.takingChargeType = formData.takingChargeType;
        recordPayload.takingChargeResponsibleName = formData.takingChargeResponsibleName;
        recordPayload.takingChargeResponsibleRelation = formData.takingChargeResponsibleRelation;
        recordPayload.takingChargeResponsibleContact = formData.takingChargeResponsibleContact;
        recordPayload.transportType = formData.transportType;
        recordPayload.transportDetails = formData.transportDetails;
        recordPayload.destination = formData.destination;
      } else {
        recordPayload.exitDate = null;
        recordPayload.exitTime = '';
        recordPayload.takingChargeType = null;
        recordPayload.takingChargeResponsibleName = null;
        recordPayload.takingChargeResponsibleRelation = null;
        recordPayload.takingChargeResponsibleContact = null;
        recordPayload.transportType = null;
        recordPayload.transportDetails = null;
        recordPayload.destination = null;
      }

      if (!selectedRecord?.id) return;
      await updateDoc(doc(db, 'deceased', selectedRecord.id), recordPayload);
      
      // Update local state copy to render detail screen correctly
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
      alert("Erreur lors de la modification du dossier historique.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier historique ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, 'deceased', id));
        setViewState('list');
        setSelectedRecord(null);
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 transition-colors duration-300">
      
      {/* 1. LIST VIEW */}
      {viewState === 'list' && (
        <div className="space-y-6">
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                <ArrowLeft className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" size={18} onClick={() => onNavigate('dashboard')} />
                <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">📂 Dossiers Historiques</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold uppercase tracking-wider">
                Total : {historicalDeceased.length} dossier{historicalDeceased.length > 1 ? 's' : ''} enregistré{historicalDeceased.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <button 
              onClick={handleOpenCreate}
              className="bg-[#006050] hover:bg-[#004d40] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-[#006050]/10 dark:shadow-emerald-900/10 transition-all w-full sm:w-auto justify-center"
            >
              <Plus size={16} strokeWidth={3} />
              Ajouter un ancien dossier
            </button>
          </section>

          {/* Search and Filters */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher nom, référence..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/20 text-sm font-medium text-slate-700 dark:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="date"
                  placeholder="Du (Décès)"
                  className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-xs font-bold uppercase text-slate-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-slate-400 font-bold text-xs uppercase shrink-0">Au</span>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="date"
                  placeholder="Au (Décès)"
                  className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-xs font-bold uppercase text-slate-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate || searchTerm) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200"
                  title="Réinitialiser les filtres"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </section>

          {/* List Display */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-300">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
                <Search size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
                Aucun dossier historique trouvé
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((rec: DeceasedRecord) => {
                  const deathDate = rec.dateOfDeath?.toDate();
                  const deathDateStr = deathDate ? deathDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
                  
                  return (
                    <div 
                      key={rec.id} 
                      onClick={() => handleOpenDetail(rec)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-[#006050] dark:group-hover:text-emerald-400 transition-colors">
                            {rec.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              #{rec.refNumber}
                            </span>
                            <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold">•</span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              Décès : {deathDateStr} à {rec.timeOfDeath || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                          rec.status === 'released' 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" 
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        )}>
                          {rec.status === 'released' ? 'Sorti' : 'Admis'}
                        </span>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FORM VIEW (CREATE OR EDIT) */}
      {(viewState === 'create' || viewState === 'edit') && (
        <div className="space-y-6">
          <section className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setViewState(viewState === 'create' ? 'list' : 'detail')}
              className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={16} /> Retour
            </button>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              {viewState === 'create' ? "➕ Enregistrer un Dossier Historique" : "✏️ Modifier le Dossier Historique"}
            </h1>
            <div className="w-16" /> {/* Spacer */}
          </section>

          {success ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-[#006050] dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={44} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
                Dossier Enregistré !
              </h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Le dossier historique a été synchronisé avec succès.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Block */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm transition-colors duration-300">
                <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <User size={16} /> Identification Civile
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="isUnknownHist"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#006050] focus:ring-[#006050]"
                    checked={formData.isUnknown}
                    onChange={e => setFormData({...formData, isUnknown: e.target.checked, name: e.target.checked ? "X fils de X (Inconnu)" : ""})}
                  />
                  <label htmlFor="isUnknownHist" className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest cursor-pointer">
                    Identité inconnue (X fils de X)
                  </label>
                </div>

                {!formData.isUnknown && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Numéro CIN (Optionnel)</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-semibold"
                        placeholder="Ex: AB123456"
                        value={formData.cin}
                        onChange={e => setFormData({...formData, cin: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prénom</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-semibold"
                        placeholder="Prénom"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nom de famille</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 text-sm font-semibold"
                        placeholder="Nom"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sexe / Genre</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    >
                      <option value="Masculin">Masculin</option>
                      <option value="Féminin">Féminin</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date Naissance (Optionnelle)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Death details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm transition-colors duration-300">
                <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Activity size={16} /> Décès & Cause
                </h3>

                <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">

                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de Prise en charge</label>

                        <select 
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          value={formData.takingChargeType}
                          onChange={e => setFormData({...formData, takingChargeType: e.target.value})}
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="Famille">La famille</option>
                          <option value="Autre">Autre (Association...)</option>
                        </select>
                      </div>


                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date du Décès</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.dateOfDeath}
                      onChange={e => setFormData({...formData, dateOfDeath: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Heure du Décès</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.timeOfDeath}
                      onChange={e => setFormData({...formData, timeOfDeath: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">

                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de Prise en charge</label>

                        <select 
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          value={formData.takingChargeType}
                          onChange={e => setFormData({...formData, takingChargeType: e.target.value})}
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="Famille">La famille</option>
                          <option value="Autre">Autre (Association...)</option>
                        </select>
                      </div>


                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nationalité</label>
                    <select 
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value as any})}
                    >
                      <option value="Marocain">Marocain</option>
                      <option value="Étranger">Étranger</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Précision Origine (Lieu)</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      placeholder="Ex: Domicile, Route N1, etc."
                      value={formData.originDetail}
                      onChange={e => setFormData({...formData, originDetail: e.target.value})}
                    />
                  </div>
                </div>

                {formData.origin === 'Étranger' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nationalité Précise</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      placeholder="Saisir la nationalité..."
                      value={formData.nationality}
                      onChange={e => setFormData({...formData, nationality: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cause de la Mort</label>
                  <select 
                    className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                    value={formData.cause}
                    onChange={e => setFormData({...formData, cause: e.target.value})}
                  >
                    <option value="">Sélectionner une cause...</option>
                    <option value="Mort naturelle">Mort naturelle</option>
                    <option value="Accident de la route">Accident de la route</option>
                    <option value="Arrêt cardiaque">Arrêt cardiaque</option>
                    <option value="Inconnue">Inconnue</option>
                    <option value="Autre / Suspicieux">Autre / Suspicieux</option>
                  </select>
                </div>
              </div>

              {/* Chronologie Saisies Manuelles (Entrée & Sortie) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm transition-colors duration-300">
                <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Clock size={16} /> Admission & Sortie Historiques (Manuel)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">

                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de Prise en charge</label>

                        <select 
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          value={formData.takingChargeType}
                          onChange={e => setFormData({...formData, takingChargeType: e.target.value})}
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="Famille">La famille</option>
                          <option value="Autre">Autre (Association...)</option>
                        </select>
                      </div>


                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date d'Entrée</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.admissionDate}
                      onChange={e => setFormData({...formData, admissionDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Heure d'Entrée</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.admissionTime}
                      onChange={e => setFormData({...formData, admissionTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date de Sortie (Optionnel)</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.exitDate}
                      onChange={e => setFormData({...formData, exitDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Heure de Sortie (Optionnel)</label>
                    <input 
                      type="time"
                      className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                      value={formData.exitTime}
                      onChange={e => setFormData({...formData, exitTime: e.target.value})}
                    />
                  </div>
                </div>

                {formData.exitDate && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3">Informations de sortie</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">

                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de Prise en charge</label>

                        <select 
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          value={formData.takingChargeType}
                          onChange={e => setFormData({...formData, takingChargeType: e.target.value})}
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="Famille">La famille</option>
                          <option value="Autre">Autre (Association...)</option>
                        </select>
                      </div>


                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Responsable de la prise en charge</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          placeholder="Nom complet"
                          value={formData.takingChargeResponsibleName}
                          onChange={e => setFormData({...formData, takingChargeResponsibleName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lien de parenté / Qualité</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          placeholder="Ex: Fils, Frère, Employé Pompes Funèbres"
                          value={formData.takingChargeResponsibleRelation}
                          onChange={e => setFormData({...formData, takingChargeResponsibleRelation: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contact du responsable</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          placeholder="Téléphone / CIN"
                          value={formData.takingChargeResponsibleContact}
                          onChange={e => setFormData({...formData, takingChargeResponsibleContact: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Moyen de transport</label>
                        <select 
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          value={formData.transportType}
                          onChange={e => setFormData({...formData, transportType: e.target.value})}
                        >
                          <option value="Ambulance de la commune">Ambulance de la commune</option>
                          <option value="Ambulance privée">Ambulance privée</option>
                          <option value="Transport familial">Transport familial</option>
                          <option value="Pompes funèbres">Pompes funèbres</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Détails transport (Immatriculation)</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          placeholder="Ex: 1234-A-50, Nom de la société..."
                          value={formData.transportDetails}
                          onChange={e => setFormData({...formData, transportDetails: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Destination de la dépouille</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold"
                          placeholder="Ex: Cimetière Chouhada, Domicile familial..."
                          value={formData.destination}
                          onChange={e => setFormData({...formData, destination: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-tight text-amber-800 dark:text-amber-400 leading-relaxed">
                    ⚠️ FRIGO : Non applicable. Ce dossier a pour valeur: "Frigo Inconnu".
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors duration-300">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observations / Notes Additionnelles</label>
                <textarea 
                  className="w-full px-4 py-3 bg-[#f8faff] dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none text-sm font-semibold min-h-[100px]"
                  placeholder="Écrire des détails sur le dossier papier d'origine..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Buttons */}
              <button 
                onClick={viewState === 'create' ? handleCreateSubmit : handleEditSubmit}
                disabled={loading}
                className="w-full py-4 bg-[#006050] dark:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Traitement en cours...' : viewState === 'create' ? '💾 Enregistrer Dossier Historique' : '💾 Mettre à jour'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DETAIL VIEW */}
      {viewState === 'detail' && selectedRecord && (
        <div className="space-y-6">
          <section className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => { setViewState('list'); setSelectedRecord(null); }}
              className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={16} /> Liste
            </button>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              Dossier Historique #{selectedRecord.refNumber}
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={() => handleOpenEdit(selectedRecord)}
                className="p-2 text-slate-400 hover:text-[#006050] rounded-xl hover:bg-slate-50 transition-colors"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => selectedRecord?.id && handleDelete(selectedRecord.id)}
                  className="p-2 text-red-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Supprimer définitivement"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </section>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {selectedRecord.name}
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Enregistré par {selectedRecord.createdBy || 'Système'}
                </p>
              </div>
            </div>

            {/* Structured view rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
              <DetailRow label="Référence" value={selectedRecord.refNumber} />
              <DetailRow label="Numéro CIN" value={selectedRecord.cin || "Non renseigné"} />
              <DetailRow label="Sexe" value={selectedRecord.gender} />
              <DetailRow label="Date de naissance" value={selectedRecord.dob ? selectedRecord.dob.toDate().toLocaleDateString('fr-FR') : 'Non renseignée'} />
              <DetailRow label="Nationalité / Origine" value={`${selectedRecord.origin} ${selectedRecord.nationality ? `(${selectedRecord.nationality})` : ''}`} />
              <DetailRow label="Précision Origine (Lieu)" value={selectedRecord.originDetail || 'N/A'} />
              <DetailRow label="Cause de décès" value={selectedRecord.cause || 'N/A'} />
              <DetailRow label="Date du Décès" value={selectedRecord.dateOfDeath ? selectedRecord.dateOfDeath.toDate().toLocaleDateString('fr-FR') : 'N/A'} />
              <DetailRow label="Heure du Décès" value={selectedRecord.timeOfDeath || 'N/A'} />
              <DetailRow label="Date d'Admission" value={selectedRecord.admissionDate ? selectedRecord.admissionDate.toDate().toLocaleDateString('fr-FR') : 'N/A'} />
              <DetailRow label="Heure d'Admission" value={selectedRecord.admissionTime || 'N/A'} />
              
              {selectedRecord.exitDate ? (
                <>
                  <DetailRow label="Date de Sortie" value={selectedRecord.exitDate.toDate().toLocaleDateString('fr-FR')} />
                  <DetailRow label="Heure de Sortie" value={selectedRecord.exitTime || 'N/A'} />
                  
                  <div className="pt-4 pb-2 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest mb-2">Logistique de Sortie</h4>
                  </div>
                  <DetailRow label="Responsable" value={`${selectedRecord.takingChargeResponsibleName || 'Non renseigné'} ${selectedRecord.takingChargeResponsibleRelation ? `(${selectedRecord.takingChargeResponsibleRelation})` : ''}`} />
                  <DetailRow label="Contact Responsable" value={selectedRecord.takingChargeResponsibleContact || 'Non renseigné'} />
                  <DetailRow label="Moyen de Transport" value={selectedRecord.transportType || 'Non renseigné'} />
                  <DetailRow label="Détails Transport" value={selectedRecord.transportDetails || 'Non renseigné'} />
                  <DetailRow label="Destination" value={selectedRecord.destination || 'Non renseignée'} />
                </>
              ) : (
                <DetailRow label="Date de Sortie" value="Non applicable (Toujours inscrit)" />
              )}

              <DetailRow label="Casier / Frigo" value="Frigo Inconnu (Dossier Historique)" valueClassName="text-amber-600 font-bold" />
            </div>

            {selectedRecord.notes && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Remarques</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed whitespace-pre-line">{selectedRecord.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function DetailRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between items-center py-3.5">
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs font-black text-slate-800 dark:text-slate-200 text-right", valueClassName)}>{value}</span>
    </div>
  );
}
