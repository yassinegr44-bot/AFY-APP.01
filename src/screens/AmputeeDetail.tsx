import { AmputeeRecord, AppUser } from '../types';
import { ArrowLeft, User, Activity, AlertCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatOperatorName } from '../utils/userUtils';

interface AmputeeDetailProps {
  record: AmputeeRecord;
  users?: AppUser[];
  onBack: () => void;
}

export function AmputeeDetail({ record, users, onBack }: AmputeeDetailProps) {
  return (
    <div className="space-y-6 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#006050] text-white rounded-2xl flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black">{record.firstName} {record.name}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">#{record.refNumber}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-black text-[#006050] flex items-center gap-2"><Activity size={16} /> Détails de l'amputation</h3>
            <p><strong>Parties corporelles:</strong> {record.bodyParts ? record.bodyParts.join(', ') : 'Non renseigné'}</p>
            <p><strong>Date & Heure:</strong> {record.amputationDateTime ? format(record.amputationDateTime.toDate(), 'PPP à HH:mm', { locale: fr }) : 'Non renseigné'}</p>
            <p><strong>Dossier créé par:</strong> {formatOperatorName(record.createdBy, users, 'Opérateur')}</p>
          </div>
          <div className="space-y-4">
            <h3 className="font-black text-[#006050] flex items-center gap-2"><AlertCircle size={16} /> Circonstances</h3>
            <p><strong>Cause:</strong> {record.cause || 'Non renseigné'}</p>
            <p><strong>Lieu de l'événement:</strong> {record.eventLocation || 'Non renseigné'}</p>
            {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
