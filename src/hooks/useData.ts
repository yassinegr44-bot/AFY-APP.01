import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  Timestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeceasedRecord, FridgePosition, AppSettings } from '../types';

export function useData(userId: string | undefined) {
  const [deceased, setDeceased] = useState<DeceasedRecord[]>([]);
  const [fridge, setFridge] = useState<FridgePosition[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ alertThresholdDays: 15 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const qDeceased = query(collection(db, 'deceased'), orderBy('createdAt', 'desc'));
    const unsubDeceased = onSnapshot(qDeceased, (snapshot) => {
      setDeceased(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeceasedRecord)));
    });

    const qFridge = query(collection(db, 'fridge'), orderBy('position', 'asc'));
    const unsubFridge = onSnapshot(qFridge, (snapshot) => {
      if (snapshot.empty) {
        // Initialize fridge if empty (12 positions)
        initializeFridge();
      } else {
        setFridge(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FridgePosition)));
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as AppSettings);
      }
    });

    setLoading(false);
    return () => {
      unsubDeceased();
      unsubFridge();
      unsubSettings();
    };
  }, [userId]);

  const initializeFridge = async () => {
    for (let i = 1; i <= 12; i++) {
      await setDoc(doc(db, 'fridge', `pos_${i}`), {
        position: i,
        status: 'available'
      });
    }
  };

  const registerDeceased = async (data: Omit<DeceasedRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'timeline'>) => {
    const currentYear = new Date().getFullYear();
    const q = query(
      collection(db, 'deceased'),
      where('createdAt', '>=', Timestamp.fromDate(new Date(currentYear, 0, 1))),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    const refNumber = `AFY ${currentYear} ${count.toString().padStart(4, '0')}`;

    const record = {
      ...data,
      refNumber,
      status: 'in_facility',
      timeline: [{
        id: crypto.randomUUID(),
        type: 'admission',
        title: 'Admission au centre',
        description: `Entrée enregistrée dans la morgue à la position FRIGO-${data.fridgePosition.toString().padStart(2, '0')}`,
        timestamp: Timestamp.now(),
        createdBy: data.createdBy
      }],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'deceased'), record);
    
    // Update fridge status
    if (data.fridgePosition) {
      await updateDoc(doc(db, 'fridge', `pos_${data.fridgePosition}`), {
        status: 'occupied',
        deceasedId: docRef.id
      });
    }
    return docRef.id;
  };

  const registerExit = async (id: string, exitData: { exitDate: Date, exitTime: string, exitNotes: string }) => {
    const recordRef = doc(db, 'deceased', id);
    const deceasedRecord = deceased.find(d => d.id === id);
    if (!deceasedRecord) return;

    const exitEvent = {
      id: crypto.randomUUID(),
      type: 'exit',
      title: 'Sortie du centre',
      description: `Le corps a été libéré. Note: ${exitData.exitNotes || 'Aucune note'}`,
      timestamp: Timestamp.now(),
      createdBy: userId || 'anonymous'
    };
    
    await updateDoc(recordRef, {
      ...exitData,
      exitDate: Timestamp.fromDate(exitData.exitDate),
      status: 'released',
      timeline: [...(deceasedRecord.timeline || []), exitEvent],
      updatedAt: Timestamp.now()
    });

    // Free up fridge
    if (deceasedRecord?.fridgePosition) {
      await updateDoc(doc(db, 'fridge', `pos_${deceasedRecord.fridgePosition}`), {
        status: 'available',
        deceasedId: null
      });
    }
  };

  return { deceased, fridge, settings, loading, registerDeceased, registerExit };
}
