import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperatorProfileModal({ isOpen, onClose }: OperatorProfileModalProps) {
  const { user, updateUserName } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isFirstTime = !user?.isNameConfigured || !user?.name;

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez entrer votre nom complet officiel.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateUserName(name.trim());
      onClose();
    } catch (err: any) {
      setError('Impossible d\'enregistrer le nom. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-[#006050] dark:text-emerald-400">
              <UserCheck size={24} />
            </div>
            {!isFirstTime && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Profil Opérateur AFY
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 mb-6 leading-relaxed">
            Veuillez entrer votre <strong>Nom complet</strong> officiel. Ce nom sera associé à votre profil AFY et utilisé comme signature d'opérateur pour toutes vos actions.
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="Ex : Yassine El Amrani"
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                Nom officiel indépendant de votre compte Google.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full bg-[#006050] hover:bg-[#004d40] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? 'Enregistrement...' : 'Continuer'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
