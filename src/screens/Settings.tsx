import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, LogOut, Save, ChevronRight, User, Menu, MoreVertical, BadgeCheck, Moon, Sun, CheckCircle } from 'lucide-react';
import { doc, updateDoc, collection, query, getDocs, deleteDoc, Timestamp, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DataCleanupModal } from '../components/modals/DataCleanupModal';
import { AppUser } from '../types';

interface SettingsProps {
  data: any;
  onNavigate: (screen: string) => void;
  onOpenProfile?: () => void;
}

export function Settings({ data, onNavigate, onOpenProfile }: SettingsProps) {
  const { settings } = data;
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [threshold, setThreshold] = useState(settings.alertThresholdDays);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchUsers = async () => {
        const snapshot = await getDocs(collection(db, 'users'));
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
      };
      fetchUsers();
    }
  }, [user]);

  const promoteToAdmin = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), { role: 'admin' });
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
  };

  const demoteToAgent = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), { role: 'agent' });
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'agent' } : u));
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      // 1. Delete Firestore user document directly
      await deleteDoc(doc(db, 'users', userToDelete.id));

      // 2. Call backend API to clean up Auth
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userToDelete.id })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      alert("Le compte utilisateur a été supprimé définitivement.");
    } catch (err: any) {
      console.error(err);
      alert(`Erreur : ${err.message || 'Impossible de supprimer l\'utilisateur'}`);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'settings', 'config'), {
        alertThresholdDays: Number(threshold)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCleanupConfirm = async () => {
    const [snapshotDeceased, snapshotAmputees] = await Promise.all([
      getDocs(collection(db, 'deceased')),
      getDocs(collection(db, 'amputees'))
    ]);

    const deletePromises = [
      ...snapshotDeceased.docs.map(doc => deleteDoc(doc.ref)),
      ...snapshotAmputees.docs.map(doc => deleteDoc(doc.ref))
    ];

    await Promise.all(deletePromises);
    const totalCount = deletePromises.length;
    alert(`${totalCount} enregistrements historiques (décès et amputés) ont été supprimés avec succès.`);
  };

  return (
    <div className="space-y-6 pb-24 theme-bg-app transition-colors duration-300">
      <DataCleanupModal 
        isOpen={isCleanupModalOpen} 
        onClose={() => setIsCleanupModalOpen(false)} 
        onConfirm={handleCleanupConfirm}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="bg-emerald-50 dark:bg-[#006050]/20 p-2 rounded-xl text-[#006050] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-[#006050]/30 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Paramètres</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuration Système</p>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Appearance Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Moon size={14} /> Apparence
        </h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-[#006050] dark:text-emerald-400 shadow-sm">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Mode Sombre</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Adapté aux environnements peu éclairés</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={cn(
              "relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
              theme === 'dark' ? "bg-emerald-600 focus:ring-emerald-500" : "bg-slate-300 focus:ring-slate-400"
            )}
            aria-label="Toggle Dark Mode"
          >
            <motion.div 
              animate={{ x: theme === 'dark' ? 28 : 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center text-[10px]"
            >
              {theme === 'dark' ? <Moon size={10} className="text-emerald-600" /> : <Sun size={10} className="text-slate-400" />}
            </motion.div>
          </motion.button>
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> Profil & Sécurité
          </h3>
          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            Niveau : {user?.role === 'admin' ? 'Total' : 'Limité'}
          </span>
        </div>
        
        <div 
          onClick={onOpenProfile}
          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl mb-6 transition-colors duration-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-center text-[#006050] dark:text-emerald-400 shadow-sm relative">
              <User size={28} />
              {user?.role === 'admin' && (
                <div className="absolute -top-1 -right-1 bg-purple-600 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900">
                  <BadgeCheck size={12} />
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{user?.role === 'admin' ? 'Administrateur Système' : 'Agent de Santé'}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Cliquez pour modifier votre nom d'opérateur</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </div>

        <div className="space-y-2">
          <SettingsItem 
            icon={User} 
            title="Mon Profil & Signature" 
            subtitle="Modifier mon nom d'opérateur officiel" 
            color="emerald"
            onClick={onOpenProfile}
          />
          <SettingsItem 
            icon={Shield} 
            title="Mot de Passe" 
            subtitle="Sécurité & Authentification" 
            color="emerald"
          />
        </div>
      </section>

      {/* Configuration Section - Admin Only */}
      {user?.role === 'admin' ? (
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <h3 className="text-xs font-black text-[#006050] dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Bell size={14} /> Alertes & Seuils
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Seuil d'attention (Jours)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006050]/10 font-black text-lg text-slate-800 dark:text-slate-100"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-[#006050] text-white p-4 rounded-xl shadow-lg shadow-[#006050]/10 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {saved ? <CheckCircleIcon size={24} /> : <Save size={24} />}
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-tight">
                  Définit le nombre de jours après lequel un corps est marqué comme "Urgent" dans le registre.
                </p>
              </div>
            </div>
          </section>

          {/* Admin Data Management Section */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm transition-colors duration-300">
            <h3 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Shield size={14} /> Administration - Gestion des utilisateurs
            </h3>
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.name || 'Sans nom'} {u.id === user?.uid && '(Vous)'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{u.email} - <span className="uppercase font-bold">{u.role}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.role !== 'admin' ? (
                      <button 
                        onClick={() => promoteToAdmin(u.id)}
                        className="text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Promouvoir
                      </button>
                    ) : u.id !== user?.uid && (
                      <button 
                        onClick={() => demoteToAgent(u.id)}
                        className="text-[10px] font-black uppercase tracking-wider bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        Rétrograder
                      </button>
                    )}
                    {u.id !== user?.uid && (
                      <button 
                        onClick={() => setUserToDelete(u)}
                        className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                        title="Supprimer définitivement le compte"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Modal for User Deletion */}
            {userToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-red-200 dark:border-red-900/40 shadow-2xl"
                >
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 text-center mb-2">
                    Suppression définitive du compte
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-6 leading-relaxed">
                    Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong className="text-slate-800 dark:text-slate-200">{userToDelete.name || userToDelete.email}</strong> ? 
                    <br /><br />
                    Cette action supprimera ses accès et son compte Firebase Auth. Les dossiers de décès et données créées par cet agent resteront intactes.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={deletingUser}
                      onClick={() => setUserToDelete(null)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={deletingUser}
                      onClick={handleDeleteUserConfirm}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deletingUser ? 'Suppression...' : 'Confirmer la suppression'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <h3 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest mt-8 mb-6 flex items-center gap-2">
              <Shield size={14} /> Administration - Gestion des données
            </h3>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  console.log('Cleanup button clicked');
                  setIsCleanupModalOpen(true);
                }}
                className="w-full text-left p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-between"
              >
                <span>Clear All Historical Data</span>
                <span className="text-xs opacity-75">Nettoyer toutes les données historiques</span>
              </button>
            </div>
          </section>
        </div>
      ) : (
        <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-dashed border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center gap-3 text-slate-400">
            <Shield size={20} />
            <p className="text-xs font-bold uppercase tracking-widest">Configuration Restreinte</p>
          </div>
          <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
            Seuls les administrateurs peuvent modifier les seuils d'alerte et les paramètres système.
          </p>
        </section>
      )}

      {/* App Info & Logout */}
      <div className="space-y-3">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-colors duration-300">
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h3 className="font-black tracking-tight">AFY Clinical v1.0.0</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Plateforme de Gestion de Morgue</p>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
            <SettingsIcon size={120} />
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-red-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <LogOut size={20} /> Fermer la Session
        </button>
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, title, subtitle, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-[#006050]/20 text-[#006050] dark:text-emerald-400 rounded-xl flex items-center justify-center">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{title}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 group-hover:text-[#006050] dark:group-hover:text-emerald-400 transition-colors" />
    </div>
  );
}

function CheckCircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
