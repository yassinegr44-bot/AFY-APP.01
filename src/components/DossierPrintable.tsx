import { safeDate } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeceasedRecord, AppUser } from '../types';
import { formatOperatorName } from '../utils/userUtils';
import moroccoCoatOfArms from '../assets/images/morocco_coat_of_arms_1787413407773.jpg';
import afyLogo from '../assets/images/afy_app_logo_badge_1787413982578.jpg';

interface DossierPrintableProps {
  record: DeceasedRecord;
  users?: AppUser[];
}

export function DossierPrintable({ record, users }: DossierPrintableProps) {
  const isReleased = record.status === 'released';

  return (
    <div id={`dossier-${record.id}`} className="p-8 border-b-2 border-slate-200 dark:border-slate-800 page-break-after-always bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Official Header Container */}
      <div className="mb-6 pb-4 border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 p-4 rounded-xl shadow-xs relative overflow-hidden">
        {/* Top Accent Stripe (Emerald + Gold) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006050] via-[#c59b27] to-[#006050]" />

        <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 pt-1">
          {/* 1. Upper Left Multi-line French Text */}
          <div className="leading-relaxed font-semibold text-slate-800 dark:text-slate-200 text-left">
            <p className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs md:text-[13px]">ROYAUME DU MAROC</p>
            <p className="text-slate-700 dark:text-slate-300 text-[11px] md:text-[12px] font-medium">Ministère de la santé et de la protection sociale</p>
            <p className="text-slate-600 dark:text-slate-400 text-[10.5px] md:text-[11.5px] font-medium">Direction Régionale R.S.K, Rabat- Salé-Kenitra</p>
            <p className="text-slate-600 dark:text-slate-400 text-[10.5px] md:text-[11.5px] font-medium">Délégation de Kénitra</p>
            <p className="font-extrabold text-[#006050] dark:text-emerald-400 mt-1 text-xs md:text-[13px]">Centre Hospitalier Azzamouri</p>
          </div>

          {/* 2. CENTER: Official Royal Coat of Arms of Morocco */}
          <div className="flex flex-col items-center justify-center my-2 md:my-0">
            <img 
              src={moroccoCoatOfArms} 
              alt="Armoiries du Royaume du Maroc" 
              className="w-20 h-20 object-contain drop-shadow-xs" 
            />
            <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mt-1">
              Royaume du Maroc
            </span>
          </div>

          {/* 3. Upper Right: AFY Logo + System Text */}
          <div className="flex flex-col items-start md:items-end text-left md:text-right">
            <img 
              src={afyLogo} 
              alt="Logo AFY" 
              className="w-12 h-12 object-contain mb-1 rounded-lg shadow-xs" 
            />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              SYSTÈME DE GESTION DE LA MORT
            </p>
            <p className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-wide">
              MORGUE HOSPITALIÈRE (AFY Kénitra)
            </p>
          </div>
        </div>

        {/* Separator Accent Bar */}
        <div className="my-3 h-[2px] bg-gradient-to-r from-[#006050] via-slate-300 dark:via-slate-700 to-[#006050]" />

        {/* Absolute Center Banner / Title on its own line */}
        <div className="text-center pt-1">
          <h1 className="text-sm md:text-base font-black text-[#003366] dark:text-blue-400 uppercase tracking-wide">
            RAPPORT : RAPPORT DE REGISTRE COMPLET DES DOSSIERS DE DÉCÈS
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 gap-2 px-2">
            <span className="bg-slate-200/60 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-800 dark:text-slate-200 font-mono">
              RÉF. DOSSIER : #{record.refNumber}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              TRAÇABILITÉ NUMÉRIQUE ET CONFORMITÉ OFFICIELLE
            </span>
            <span className={`px-3 py-1 rounded-lg font-black text-[11px] uppercase tracking-wider border ${
              isReleased 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' 
                : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
            }`}>
              {isReleased ? 'LIBÉRÉ (SORTI)' : 'ADMIS (PRÉSENT)'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Informations Personnelles & Circonstances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">1. Informations Personnelles</h2>
          <div className="space-y-1.5 text-sm">
            <p><strong className="text-slate-900 dark:text-white">Nom complet :</strong> <span className="text-slate-800 dark:text-slate-200">{record.name || 'Identité Inconnue'}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Sexe / Genre :</strong> <span className="text-slate-800 dark:text-slate-200">{record.gender === 'Autre' ? `Autre (${record.otherGender})` : (record.gender || 'Non renseigné')}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Identité :</strong> <span className="text-slate-800 dark:text-slate-200">{record.isUnknown ? 'Inconnue (X)' : 'Identifiée'}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Origine :</strong> <span className="text-slate-800 dark:text-slate-200">{record.origin || 'Non renseignée'}{record.nationality ? ` (${record.nationality})` : ''}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Entrée effectuée par :</strong> <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatOperatorName(record.createdBy, users, 'Opérateur')}</span></p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">2. Circonstances du Décès</h2>
          <div className="space-y-1.5 text-sm">
            <p><strong className="text-slate-900 dark:text-white">Cause suspectée :</strong> <span className="text-slate-800 dark:text-slate-200">{record.cause || 'Non spécifiée'}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Date de décès :</strong> <span className="text-slate-800 dark:text-slate-200">
              {(() => {
                const d = safeDate(record.dateOfDeath);
                return d ? format(d, 'dd/MM/yyyy', { locale: fr }) : 'Non renseignée';
              })()}
            </span></p>
            <p><strong className="text-slate-900 dark:text-white">Heure de décès :</strong> <span className="text-slate-800 dark:text-slate-200">{record.timeOfDeath || 'Non renseignée'}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Détail origine :</strong> <span className="text-slate-800 dark:text-slate-200">{record.originDetail || 'Aucun'}</span></p>
          </div>
        </div>
      </div>

      {/* Grid Logistique & Prise en Charge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">3. Logistique Morgue</h2>
          <div className="space-y-1.5 text-sm">
            <p><strong className="text-slate-900 dark:text-white">Affectation Frigo :</strong> <span className="font-bold text-[#006050] dark:text-emerald-400">
              {record.fridgeNumber === 12 
                ? `Frigo 12 (Néonat) — Pos ${record.fridgePosition.toString().padStart(2, '0')}` 
                : record.fridgeNumber === 11
                  ? 'Frigo 11 (Médico-Légal)'
                  : `Frigo ${(record.fridgeNumber || record.fridgePosition).toString().padStart(2, '0')}`}
            </span></p>
            <p><strong className="text-slate-900 dark:text-white">Date Admission :</strong> <span className="text-slate-800 dark:text-slate-200">
              {(() => {
                const d = safeDate(record.admissionDate);
                return d ? format(d, 'dd/MM/yyyy', { locale: fr }) : '—';
              })()} {record.admissionTime}
            </span></p>
            {isReleased && record.exitDate && (
              <p><strong className="text-slate-900 dark:text-white">Date de Sortie :</strong> <span className="text-slate-800 dark:text-slate-200">
                {(() => {
                  const d = safeDate(record.exitDate);
                  return d ? format(d, 'dd/MM/yyyy', { locale: fr }) : 'Non renseignée';
                })()} {record.exitTime}
              </span></p>
            )}
            <p><strong className="text-slate-900 dark:text-white">Statut Actuel :</strong> <span className="text-slate-800 dark:text-slate-200">{isReleased ? 'Libéré' : 'En établissement'}</span></p>
            {isReleased && (
              <p><strong className="text-slate-900 dark:text-white">Sortie effectuée par :</strong> <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatOperatorName((record as any).releasedByOperator || record.timeline?.find(e => e.type === 'exit')?.createdBy, users, 'Opérateur')}</span></p>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">4. Prise en Charge & Transport</h2>
          <div className="space-y-1.5 text-sm">
            <p><strong className="text-slate-900 dark:text-white">Responsable :</strong> <span className="text-slate-800 dark:text-slate-200">{record.takingChargeResponsibleName || 'Non renseigné'}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Transport / Ambulance :</strong> <span className="text-slate-800 dark:text-slate-200">{record.transportMethod || 'N/A'}{record.ambulanceNumber ? ` (N° ${record.ambulanceNumber})` : ''}</span></p>
            <p><strong className="text-slate-900 dark:text-white">Destination :</strong> <span className="text-slate-800 dark:text-slate-200">{record.destinationType ? `[${record.destinationType}] ` : ''}{record.destinationPrecise || record.destinationCityOrCommune || 'Non renseigné'}</span></p>
          </div>
        </div>
      </div>

      {/* Chronologie */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">5. Chronologie des Événements</h2>
        <div className="space-y-2 text-sm">
          {record.timeline && record.timeline.length > 0 ? (
            record.timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 last:border-0 last:pb-0">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[130px]">
                  {(() => {
                    const d = safeDate(event.timestamp);
                    return d ? format(d, 'dd/MM/yyyy HH:mm', { locale: fr }) : '—';
                  })()}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{event.title}</span>
                {event.description && <span className="text-slate-700 dark:text-slate-300">— {event.description}</span>}
                <span className="ml-auto text-xs text-slate-500 font-medium">
                  ({formatOperatorName(event.createdBy, users, 'Opérateur')})
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-xs">Aucun événement spécifique enregistré.</p>
          )}
        </div>
      </div>

      {/* Observations */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">6. Observations Médicales & Remarques</h2>
        <p className="text-sm text-slate-800 dark:text-slate-200">{record.notes || 'Aucune observation enregistrée.'}</p>
        {record.exitNotes && (
          <p className="text-sm text-slate-800 dark:text-slate-200 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <strong>Notes de sortie :</strong> {record.exitNotes}
          </p>
        )}
      </div>
    </div>
  );
}
