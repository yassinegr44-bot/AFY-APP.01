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
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeceasedRecord, AmputeeRecord, FridgePosition, AppSettings, AppUser } from '../types';
import { formatOperatorIdentity, formatEmailToName } from '../utils/userUtils';

export function useData(currentUser: AppUser | null | undefined) {
  const [deceased, setDeceased] = useState<DeceasedRecord[]>([]);
  const [historicalDeceased, setHistoricalDeceased] = useState<DeceasedRecord[]>([]);
  const [amputees, setAmputees] = useState<AmputeeRecord[]>([]);
  const [fridge, setFridge] = useState<FridgePosition[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ alertThresholdDays: 15 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const qDeceased = query(collection(db, 'deceased'), orderBy('createdAt', 'desc'));
    const unsubDeceased = onSnapshot(qDeceased, (snapshot) => {
      const allDeceased = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeceasedRecord));
      setDeceased(allDeceased);
      setHistoricalDeceased(allDeceased.filter(d => d.isHistorical === true));
    }, (err) => {
      console.warn("Snapshot subscription notice (deceased):", err.message);
    });

    const qAmputees = query(collection(db, 'amputees'), orderBy('createdAt', 'desc'));
    const unsubAmputees = onSnapshot(qAmputees, (snapshot) => {
      setAmputees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AmputeeRecord)));
    }, (err) => {
      console.warn("Snapshot subscription notice (amputees):", err.message);
    });

    const qFridge = query(collection(db, 'fridge'), orderBy('position', 'asc'));
    const unsubFridge = onSnapshot(qFridge, (snapshot) => {
      if (snapshot.empty) {
        initializeFridge();
      } else {
        setFridge(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FridgePosition)));
      }
    }, (err) => {
      console.warn("Snapshot subscription notice (fridge):", err.message);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
    }, (err) => {
      console.warn("Snapshot subscription notice (users):", err.message);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as AppSettings);
      }
    }, (err) => {
      console.warn("Snapshot subscription notice (settings):", err.message);
    });

    setLoading(false);
    return () => {
      unsubDeceased();
      unsubAmputees();
      unsubFridge();
      unsubUsers();
      unsubSettings();
    };
  }, [currentUser?.id]);

  const initializeFridge = async () => {
    for (let i = 1; i <= 12; i++) {
      await setDoc(doc(db, 'fridge', `pos_${i}`), {
        position: i,
        status: 'available'
      });
    }
  };

  const getActiveOperatorIdentity = () => {
    if (currentUser?.name && currentUser.name.trim().length > 0 && currentUser.name !== 'Utilisateur' && currentUser.name !== 'Opérateur') {
      return formatOperatorIdentity(currentUser.role, currentUser.name);
    }
    if (currentUser?.email) {
      const nameFromEmail = formatEmailToName(currentUser.email);
      return formatOperatorIdentity(currentUser.role, nameFromEmail);
    }
    return 'Opérateur';
  };

  const registerDeceased = async (data: Omit<DeceasedRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'timeline'>) => {
    const currentYear = new Date().getFullYear();
    const q = query(
      collection(db, 'deceased'),
      where('createdAt', '>=', Timestamp.fromDate(new Date(currentYear, 0, 1))),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const nonHistoricalDocs = snapshot.docs.filter(doc => !doc.data().isHistorical);
    const count = nonHistoricalDocs.length + 1;
    const refNumber = `AFY ${currentYear} ${count.toString().padStart(4, '0')}`;

    const operatorIdentity = getActiveOperatorIdentity();
    const operatorUid = currentUser?.id || '';
    const operatorRole = currentUser?.role || 'staff';
    const operatorName = currentUser?.name || '';

    const record = {
      ...data,
      refNumber,
      status: 'in_facility',
      createdBy: operatorIdentity,
      createdByUid: operatorUid,
      createdByRole: operatorRole,
      createdByName: operatorName,
      timeline: [{
        id: crypto.randomUUID(),
        type: 'admission',
        title: 'Admission au centre',
        description: `Entrée enregistrée dans la morgue à la position FRIGO-${data.fridgePosition.toString().padStart(2, '0')}`,
        timestamp: Timestamp.now(),
        createdBy: operatorIdentity,
        operatorUid,
        operatorRole,
        operatorName
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

  const registerAmputee = async (data: Omit<AmputeeRecord, 'id' | 'refNumber' | 'createdAt'>) => {
    const currentYear = new Date().getFullYear();
    const q = query(
      collection(db, 'amputees'),
      where('createdAt', '>=', Timestamp.fromDate(new Date(currentYear, 0, 1))),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    const refNumber = `AMP-${currentYear}-${count.toString().padStart(4, '0')}`;

    const operatorIdentity = getActiveOperatorIdentity();

    const record = {
      ...data,
      refNumber,
      createdBy: operatorIdentity,
      createdByUid: currentUser?.id || '',
      createdByRole: currentUser?.role || 'staff',
      createdByName: currentUser?.name || '',
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, 'amputees'), record);
    return docRef.id;
  };

  const registerExit = async (id: string, exitData: any) => {
    const recordRef = doc(db, 'deceased', id);
    const deceasedRecord = deceased.find(d => d.id === id);
    if (!deceasedRecord) return;

    const operatorIdentity = getActiveOperatorIdentity();
    const operatorUid = currentUser?.id || '';
    const operatorRole = currentUser?.role || 'staff';
    const operatorName = currentUser?.name || '';

    const exitEvent = {
      id: crypto.randomUUID(),
      type: 'exit',
      title: 'Sortie du centre',
      description: `Le corps a été libéré.${exitData.exitNotes ? ` (${exitData.exitNotes})` : ''}`,
      timestamp: Timestamp.now(),
      createdBy: operatorIdentity,
      operatorUid,
      operatorRole,
      operatorName
    };
    
    await updateDoc(recordRef, {
      status: 'released',
      exitDate: Timestamp.fromDate(exitData.exitDate),
      exitTime: exitData.exitTime || '',
      exitNotes: exitData.exitNotes || '',
      transportMethod: exitData.transportMethod || '',
      ambulanceNumber: exitData.ambulanceNumber || '',
      takingChargeType: exitData.takingChargeType || '',
      takingChargeResponsibleName: exitData.takingChargeResponsibleName || '',
      takingChargeRelation: exitData.takingChargeRelation || '',
      takingChargePhone: exitData.takingChargePhone || '',
      takingChargeAssociationName: exitData.takingChargeAssociationName || '',
      takingChargeOtherDescription: exitData.takingChargeOtherDescription || '',
      destinationType: exitData.destinationType || '',
      destinationCityOrCommune: exitData.destinationCityOrCommune || '',
      destinationPrecise: exitData.destinationPrecise || '',
      destinationRegion: exitData.destinationRegion || '',
      transferType: exitData.transferType || '',
      releasedByOperator: operatorIdentity,
      releasedByUid: operatorUid,
      releasedByRole: operatorRole,
      releasedByName: operatorName,
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

  const updateDeceasedIdentity = async (id: string, newIdentityData: Partial<DeceasedRecord>) => {
    try {
      const recordRef = doc(db, 'deceased', id);
      
      const identityEvent = {
        id: crypto.randomUUID(),
        type: 'note' as const,
        title: 'Mise à jour de l\'identité',
        description: `L'identité a été mise à jour par l'opérateur.`,
        timestamp: Timestamp.now(),
        createdBy: 'Opérateur',
      };

      await updateDoc(recordRef, {
        ...newIdentityData,
        isUnknown: false,
        updatedAt: Timestamp.now(),
        timeline: arrayUnion(identityEvent)
      });
      return true;
    } catch (err) {
      console.error("Error updating identity:", err);
      throw err;
    }
  };

  const registerHistoricalDeceased = async (data: Omit<DeceasedRecord, 'id' | 'refNumber' | 'createdAt' | 'updatedAt' | 'isHistorical'>) => {
    const year = data.dateOfDeath ? data.dateOfDeath.toDate().getFullYear() : new Date().getFullYear();
    const historicalCount = deceased.filter(d => d.isHistorical).length;
    const count = historicalCount + 1;
    const refNumber = `HIST ${year} ${count.toString().padStart(4, '0')}`;

    const operatorIdentity = getActiveOperatorIdentity();
    const operatorUid = currentUser?.id || '';
    const operatorRole = currentUser?.role || 'staff';
    const operatorName = currentUser?.name || '';

    const record = {
      ...data,
      refNumber,
      isHistorical: true,
      createdBy: operatorIdentity,
      createdByUid: operatorUid,
      createdByRole: operatorRole,
      createdByName: operatorName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'deceased'), record);
    return docRef.id;
  };

  return { 
    deceased: deceased || [], 
    historicalDeceased: historicalDeceased || [], 
    amputees: amputees || [], 
    fridge: fridge || [], 
    users: users || [], 
    settings: settings || { alertThresholdDays: 15 }, 
    loading, 
    registerDeceased, 
    registerHistoricalDeceased, 
    registerAmputee, 
    registerExit, 
    updateDeceasedIdentity 
  };
}
