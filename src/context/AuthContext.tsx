import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  firebaseUser: User | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, firebaseUser: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userRef = doc(db, 'users', fUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUser({ id: fUser.uid, ...userDoc.data() } as AppUser);
        } else {
          // Persist the fallback user to Firestore so security rules work
          const newUser: Omit<AppUser, 'id'> = {
            email: fUser.email || '',
            role: 'staff',
            name: fUser.displayName || 'Utilisateur'
          };
          await setDoc(userRef, { ...newUser, createdAt: new Date() });
          setUser({ id: fUser.uid, ...newUser } as AppUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
