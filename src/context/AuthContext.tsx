import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userRef = doc(db, 'users', fUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            const isConfigured = userData.isNameConfigured === true && !!userData.name && userData.name.trim().length > 0 && userData.name !== 'Utilisateur';

            if (!isConfigured) {
              setShowNameModal(true);
            } else {
              setShowNameModal(false);
            }

            setUser({ id: fUser.uid, ...userData });
          } else {
            // Premier enregistrement de l'utilisateur : initialiser le profil AFY
            const newUserDoc: Omit<AppUser, 'id'> = {
              email: fUser.email || '',
              role: 'staff',
              name: '',
              isNameConfigured: false
            };
            await setDoc(userRef, { ...newUserDoc, createdAt: new Date() });
            setUser({ id: fUser.uid, ...newUserDoc } as AppUser);
            
            // Obliger la saisie du nom officiel AFY
            setShowNameModal(true);
          }
        } catch (err) {
          console.warn("Notice: Auth user document retrieval offline or retryable:", err);
          setUser({
            id: fUser.uid,
            email: fUser.email || '',
            role: 'staff',
            name: fUser.displayName || 'Opérateur',
            isNameConfigured: true
          });
        }
      } else {
        setUser(null);
        setShowNameModal(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
