import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, Plus, Mail, Lock } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || 'Utilisateur',
          email: user.email,
          role: 'agent',
          createdAt: new Date()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError('Erreur lors de la connexion Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: email.split('@')[0],
          email: email,
          role: 'agent',
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(isRegistering ? 'Erreur lors de l\'inscription.' : 'Erreur de connexion : Vérifiez votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-app flex flex-col items-center justify-center p-6 transition-colors duration-300">
      {/* Brand Logo & Title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 bg-[#1a1a1a] dark:bg-black rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 border-2 border-[#00d4aa] rounded-md flex items-center justify-center">
                <Plus size={14} className="text-[#00d4aa]" strokeWidth={4} />
              </div>
              <span className="text-[#00d4aa] text-xl font-black tracking-tighter">AFY</span>
            </div>
            <div className="mt-2 w-2 h-2 bg-[#00d4aa] rounded-full opacity-50" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-[#006050] dark:text-emerald-400 tracking-tight mb-1">AFY</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Gestion de Décès & Morgue</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-8 transition-colors"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">
          {isRegistering ? 'Inscription' : 'Connexion'}
        </h2>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg mb-6">
            {error}
          </p>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? (isRegistering ? 'Inscription...' : 'Connexion...') : (isRegistering ? 'S\'inscrire' : 'Se connecter')}
          </button>
        </form>

        <div className="text-center text-sm mt-4">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            {isRegistering ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-card)] px-2 text-slate-400">Ou</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.5 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.3 3.5v2.9h3.7c2.2-2 3.6-5 3.6-8.5z" fill="#4285F4"/>
            <path d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.6 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.3H1.1v3.1C3.1 21.2 7.3 24 12 24z" fill="#34A853"/>
            <path d="M4.9 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V6.8H1.1C.4 8.2 0 9.9 0 12s.4 3.8 1.1 5.2l3.8-3.1z" fill="#FBBC05"/>
            <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.1 2.8 1.1 6.8l3.8 3.1c1-3.1 3.8-5.1 7.1-5.1z" fill="#EA4335"/>
          </svg>
          {loading ? 'Connexion...' : 'Se connecter avec Google'}
        </button>
      </motion.div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          MINISTÈRE DE LA SANTÉ // DIRECTION LOGISTIQUE
          <br />
          v1.0.0
        </p>
      </div>
    </div>
  );
}

