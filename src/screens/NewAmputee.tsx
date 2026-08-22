import { useState } from 'react';
import { AppData } from '../types';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';

interface NewAmputeeProps {
  data: AppData;
  onComplete: () => void;
}

const BODY_PARTS = [
  'Main gauche', 'Main droite', 'Bras gauche', 'Bras droit', 'Avant-bras gauche', 'Avant-bras droit',
  'Jambe gauche', 'Jambe droite', 'Cuisse gauche', 'Cuisse droite', 'Pied gauche', 'Pied droit', 'Plusieurs membres'
];

const CAUSES = ['Accident', 'Accident de travail', 'Intervention chirurgicale', 'Maladie', 'Autre'];

export function NewAmputee({ data, onComplete }: NewAmputeeProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    dob: '',
    cin: '',
    bodyParts: [] as string[],
    cause: 'Accident',
    otherCauseDescription: '',
    amputationDate: '',
    amputationTime: '',
    eventLocation: '',
    notes: ''
  });

  const toggleBodyPart = (part: string) => {
    setFormData(prev => ({
      ...prev,
      bodyParts: prev.bodyParts.includes(part) ? prev.bodyParts.filter(p => p !== part) : [...prev.bodyParts, part]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.firstName || formData.bodyParts.length === 0 || !formData.amputationDate || !formData.amputationTime) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }
    
    const dateTime = new Date(`${formData.amputationDate}T${formData.amputationTime}`);
    
    await (data as any).registerAmputee({
        ...formData,
        dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
        amputationDateTime: Timestamp.fromDate(dateTime),
        createdBy: user?.name || user?.email || 'Opérateur'
    });
    onComplete();
  };

  return (
    <div className="space-y-6 pb-24 px-4">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Nouveau Membre Amputé</h1>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">Informations Personnelles</h2>
        <input placeholder="Nom" className="w-full p-3 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input placeholder="Prénom" className="w-full p-3 border rounded-xl" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        <input type="date" placeholder="Date de naissance (optionnel)" className="w-full p-3 border rounded-xl" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
        <input placeholder="CIN (optionnel)" className="w-full p-3 border rounded-xl" value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} />

        <h2 className="font-bold text-slate-800 dark:text-slate-100 mt-6">Quel membre a été amputé ?</h2>
        <div className="grid grid-cols-2 gap-2">
            {BODY_PARTS.map(part => (
                <button key={part} onClick={() => toggleBodyPart(part)} className={`p-2 rounded-lg text-sm ${formData.bodyParts.includes(part) ? 'bg-[#006050] text-white' : 'bg-slate-100'}`}>
                    {part}
                </button>
            ))}
        </div>

        <h2 className="font-bold text-slate-800 dark:text-slate-100 mt-6">Quelle est la cause ?</h2>
        <select className="w-full p-3 border rounded-xl" value={formData.cause} onChange={e => setFormData({...formData, cause: e.target.value})}>
            {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {formData.cause === 'Autre' && <input placeholder="Précisez la cause" className="w-full p-3 border rounded-xl" value={formData.otherCauseDescription} onChange={e => setFormData({...formData, otherCauseDescription: e.target.value})} />}

        <h2 className="font-bold text-slate-800 dark:text-slate-100 mt-6">Date et Heure</h2>
        <div className='flex gap-2'>
            <input type="date" className="w-full p-3 border rounded-xl" value={formData.amputationDate} onChange={e => setFormData({...formData, amputationDate: e.target.value})} />
            <input type="time" className="w-full p-3 border rounded-xl" value={formData.amputationTime} onChange={e => setFormData({...formData, amputationTime: e.target.value})} />
        </div>
        
        <input placeholder="Lieu (optionnel)" className="w-full p-3 border rounded-xl" value={formData.eventLocation} onChange={e => setFormData({...formData, eventLocation: e.target.value})} />
        <textarea placeholder="Notes (optionnel)" className="w-full p-3 border rounded-xl" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        
        <button onClick={handleSubmit} className="w-full bg-[#006050] text-white py-3 rounded-xl font-bold">Enregistrer le membre amputé</button>
      </div>
    </div>
  );
}
