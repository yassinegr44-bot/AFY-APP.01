import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle, X, Check } from 'lucide-react';

interface DataCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'archive' | 'delete', period: string) => void;
}

export function DataCleanupModal({ isOpen, onClose, onConfirm }: DataCleanupModalProps) {
  const months = React.useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const yearNum = date.getFullYear();
      const value = `${monthNum}-${yearNum}`;
      const label = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      list.push({ value, label: capitalizedLabel });
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState(months[0]?.value || '08-2026');
  const [step, setStep] = useState(1);
  const [selectedAction, setSelectedAction] = useState<'archive' | 'delete'>('archive');
  
  React.useEffect(() => {
    console.log('DataCleanupModal rendered, isOpen:', isOpen);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl"
          >
            {step === 1 && (
              <>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield size={16} /> Gestion des Données
                </h3>
                <div className="mb-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Période à nettoyer</label>
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setSelectedAction('archive'); setStep(2); }} className="flex-1 bg-amber-500 text-white p-3 rounded-xl font-bold">Archiver</button>
                  <button onClick={() => { setSelectedAction('delete'); setStep(2); }} className="flex-1 bg-red-600 text-white p-3 rounded-xl font-bold">Supprimer</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> Confirmation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Cette action est irréversible. Êtes-vous sûr de vouloir {selectedAction === 'archive' ? 'archiver' : 'supprimer'} les données pour {selectedPeriod}?
                </p>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-bold">Annuler</button>
                  <button onClick={() => { onConfirm(selectedAction, selectedPeriod); onClose(); }} className="flex-1 bg-red-600 text-white p-3 rounded-xl font-bold">Confirmer</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
