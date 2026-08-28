import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  firebaseUser: User | null;
  updateUserName: (name: string) => Promise<void>;
  showNameModal: boolean;
  setShowNameModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  firebaseUser: null,
  updateUserName: async () => {},
  showNameModal: false,
  setShowNameModal: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      setFirebaseUser(fUser);
      
      if (fUser) {
        const userRef = doc(db, 'users', fUser.uid);
        
        // Use onSnapshot with includeMetadataChanges: false to handle cache-first correctly
        // This ensures we get the cached version immediately when offline
        unsubscribeUser = onSnapshot(userRef, { includeMetadataChanges: true }, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            
            // AUTO-ELEVATION for the main admin account
            const isAdminEmail = fUser.email?.toLowerCase() === 'yassinegr44@gmail.com';
            let needsUpdate = false;
            const updates: Partial<AppUser> = {};

            if (isAdminEmail && userData.role !== 'admin') {
              updates.role = 'admin';
              needsUpdate = true;
              userData.role = 'admin';
            } else if (userData.role === 'agent') {
              // Migrate legacy 'agent' role to 'staff'
              updates.role = 'staff';
              needsUpdate = true;
              userData.role = 'staff';
            }

            if (needsUpdate) {
              updateDoc(userRef, updates).catch((err) => {
                console.error("Erreur mise a jour role:", err);
              });
            }

            const isConfigured = userData.isNameConfigured === true && !!userData.name && userData.name.trim().length > 0 && userData.name !== 'Utilisateur';

            if (!isConfigured) {
              setShowNameModal(true);
            } else {
              setShowNameModal(false);
            }

            setUser({ id: fUser.uid, ...userData });
          } else {
            // Premier enregistrement de l'utilisateur : initialiser le profil AFY
            const isAdmin = fUser.email?.toLowerCase() === 'yassinegr44@gmail.com';
            const newUserDoc: Omit<AppUser, 'id'> = {
              email: fUser.email || '',
              role: isAdmin ? 'admin' : 'staff', // Uniform terminology: staff
              name: '',
              isNameConfigured: false
            };
            // On ne bloque pas sur le setDoc pour le offline
            setDoc(userRef, { ...newUserDoc, createdAt: new Date() }).catch(err => {
              console.warn("Notice: setDoc for new user failed or queued offline:", err);
            });
            setUser({ id: fUser.uid, ...newUserDoc } as AppUser);
            setShowNameModal(true);
          }
          setLoading(false);
        }, (err) => {
          console.warn("Notice: User document listener error (might be offline):", err);
          // Fallback if listener fails completely but we have a firebaseUser
          if (!user) {
            const isAdmin = fUser.email?.toLowerCase() === 'yassinegr44@gmail.com';
            setUser({
              id: fUser.uid,
              email: fUser.email || '',
              role: isAdmin ? 'admin' : 'staff',
              name: fUser.displayName || 'Opérateur',
              isNameConfigured: true
            });
          }
          setLoading(false);
        });
      } else {
        // If fUser is null, we are definitely logged out
        setUser(null);
        setShowNameModal(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const updateUserName = async (newName: string) => {
    if (!firebaseUser || !user) return;
    const cleanName = newName.trim();
    if (!cleanName) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, { 
        name: cleanName,
        isNameConfigured: true
      });
      
      try {
        await updateProfile(firebaseUser, { displayName: cleanName });
      } catch (e) {
        // Optionnel updateProfile local
      }

      setUser(prev => prev ? { ...prev, name: cleanName, isNameConfigured: true } : null);
      setShowNameModal(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du nom:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser, updateUserName, showNameModal, setShowNameModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
