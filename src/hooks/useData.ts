import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  setDoc, 
  Timestamp, 
  serverTimestamp,
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
  const isInitializingRef = useRef(false);

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
      // Expecting 10 (normal) + 10 (legal) + 15 (neonat) = 35 positions
      if (snapshot.size < 35) {
        initializeFridge();
      }
      setFridge(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FridgePosition)));
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
    // Prevent concurrent initialization attempts
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      const fridgeSnapshot = await getDocs(collection(db, 'fridge'));
      const existingIds = new Set(fridgeSnapshot.docs.map(d => d.id));
      
      // If we already have 35 or more on the server, we don't need to initialize
      if (existingIds.size >= 35) {
        isInitializingRef.current = false;
        return;
      }

      const batch = writeBatch(db);
      let needsBatch = false;

      // 1. Ensure all positions exist (Normal, Medico-Legal, Neonat)
      // Frigos 1 to 10
      for (let i = 1; i <= 10; i++) {
        const id = `pos_${i}`;
        if (!existingIds.has(id)) {
          batch.set(doc(db, 'fridge', id), {
            position: i,
            fridgeNumber: i,
            type: 'normal',
            status: 'available'
          });
          needsBatch = true;
        }
      }
      // Frigo 11
      for (let i = 1; i <= 10; i++) {
        const id = `pos_11_${i}`;
        if (!existingIds.has(id)) {
          batch.set(doc(db, 'fridge', id), {
            position: i,
            fridgeNumber: 11,
            type: 'medico_legal',
            status: 'available'
          });
          needsBatch = true;
        }
      }
      // Frigo 12
      for (let i = 1; i <= 15; i++) {
        const id = `pos_12_${i}`;
        if (!existingIds.has(id)) {
          batch.set(doc(db, 'fridge', id), {
            position: i,
            fridgeNumber: 12,
            type: 'neonat',
            status: 'available'
          });
          needsBatch = true;
        }
      }

      if (needsBatch) {
        await batch.commit();
      }

      // 2. Sync occupied status from records to handle any previous data resets
      // Note: We use writeBatch here too for the healing process
      const syncBatch = writeBatch(db);
      let needsSync = false;

      const deceasedSnapshot = await getDocs(query(collection(db, 'deceased'), where('status', '==', 'in_facility')));
      const amputeesSnapshot = await getDocs(query(collection(db, 'amputees'), where('status', '==', 'in_facility')));

      const records = [
        ...deceasedSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
        ...amputeesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      ];

      for (const record of records) {
        const r = record as any;
        if (r.fridgeNumber && r.fridgePosition) {
          const fridgeId = getFridgeDocId(r.fridgeNumber, r.fridgePosition);
          if (fridgeId) {
            syncBatch.update(doc(db, 'fridge', fridgeId), {
              status: 'occupied',
              deceasedId: r.id
            });
            needsSync = true;
          }
        }
      }

      if (needsSync) {
        await syncBatch.commit();
      }
    } catch (err) {
      console.warn("Notice: Fridge initialization skipped or delayed (offline):", err);
    } finally {
      isInitializingRef.current = false;
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

  const registerDeceased = async (data: any) => {
    let finalCaseType = data.caseType || 'DÉCÈS';
    let fridgePos = data.fridgePosition;
    let fridgeNum = 1;

    // Use local fridge state instead of getDocs for offline-first
    const fridgePositions = fridge;
    let selectedPosition: FridgePosition | undefined;

    if (finalCaseType === 'FŒTUS' || finalCaseType === 'MORT_NÉ' || finalCaseType === 'ENFANT_MOINS_1_AN') {
      const neonatPositions = fridgePositions
        .filter(p => p.fridgeNumber === 12 && p.status === 'available')
        .sort((a, b) => a.position - b.position);

      if (neonatPositions.length === 0) {
        throw new Error("⚠️ Unité Néonatale (Frigo 12) est complète\nCapacité maximale : 15/15\nAucune nouvelle affectation automatique possible.");
      }
      selectedPosition = neonatPositions[0];
      fridgePos = selectedPosition.position;
      fridgeNum = 12;
    } else if (finalCaseType === 'MEMBRE_AMPUTÉ') {
      const medicoLegalPositions = fridgePositions
        .filter(p => p.fridgeNumber === 11 && p.status === 'available')
        .sort((a, b) => a.position - b.position);

      if (medicoLegalPositions.length === 0) {
        throw new Error("⚠️ Unité Médico-Légale (Frigo 11) est complète\nCapacité maximale : 10/10\nAucune nouvelle affectation possible.");
      }
      selectedPosition = medicoLegalPositions[0];
      fridgePos = selectedPosition.position;
      fridgeNum = 11;
    } else {
      if (!fridgePos || fridgePos === 0) {
        throw new Error("Veuillez sélectionner une position dans les Frigos 1 à 10.");
      }
      selectedPosition = fridgePositions.find(p => p.fridgeNumber === Number(fridgePos) && p.status === 'available');
      if (!selectedPosition) {
        throw new Error(`⚠️ La position Frigo ${fridgePos} est déjà occupée ou indisponible.`);
      }
      fridgeNum = Number(fridgePos);
    }

    const fridgeDocId = getFridgeDocId(fridgeNum, fridgePos);
    if (!fridgeDocId) throw new Error("Erreur de détermination de l'emplacement du frigo.");

    const operatorIdentity = getActiveOperatorIdentity();
    const operatorUid = currentUser?.id || '';
    const operatorRole = currentUser?.role || 'staff';
    const operatorName = currentUser?.name || '';

    const record = {
      ...data,
      caseType: finalCaseType,
      fridgePosition: fridgePos,
      fridgeNumber: fridgeNum,
      syncStatus: 'pending',
      status: 'in_facility',
      createdBy: operatorIdentity,
      createdByUid: operatorUid,
      createdByRole: operatorRole,
      createdByName: operatorName,
      timeline: [{
        id: crypto.randomUUID(),
        type: 'admission',
        title: 'Admission au centre',
        description: `Entrée enregistrée (${finalCaseType}) à la position Frigo ${fridgeNum === 12 ? '12 (Unité Néonatale)' : fridgeNum === 11 ? '11 (Unité Médico-Légale)' : fridgeNum} — Position ${fridgePos.toString().padStart(2, '0')}`,
        timestamp: Timestamp.now(),
        createdBy: operatorIdentity,
        operatorUid,
        operatorRole,
        operatorName
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // USE WRITE BATCH FOR ATOMICITY
    const batch = writeBatch(db);
    const deceasedRef = doc(collection(db, 'deceased'));
    batch.set(deceasedRef, record);
    
    batch.update(doc(db, 'fridge', fridgeDocId), {
      status: 'occupied',
      deceasedId: deceasedRef.id
    });

    await batch.commit();
    return deceasedRef.id;
  };

  const registerAmputee = async (data: Omit<AmputeeRecord, 'id' | 'refNumber' | 'createdAt'>) => {
    // Use local fridge state
    const fridgePositions = fridge;
    const medicoLegalPositions = fridgePositions
      .filter(p => p.fridgeNumber === 11 && p.status === 'available')
      .sort((a, b) => a.position - b.position);

    if (medicoLegalPositions.length === 0) {
      throw new Error("⚠️ Unité Médico-Légale (Frigo 11) est complète\nCapacité maximale : 10/10\nAucune nouvelle affectation possible.");
    }
    const fridgePos = medicoLegalPositions[0].position;
    const fridgeDocId = getFridgeDocId(11, fridgePos);
    if (!fridgeDocId) throw new Error("Erreur de détermination de l'emplacement du frigo.");

    const operatorIdentity = getActiveOperatorIdentity();

    const record = {
      ...data,
      syncStatus: 'pending',
      fridgePosition: fridgePos,
      fridgeNumber: 11,
      status: 'in_facility',
      createdBy: operatorIdentity,
      createdByUid: currentUser?.id || '',
      createdByRole: currentUser?.role || 'staff',
      createdByName: currentUser?.name || '',
      createdAt: serverTimestamp()
    };

    const batch = writeBatch(db);
    const amputeeRef = doc(collection(db, 'amputees'));
    batch.set(amputeeRef, record);

    batch.update(doc(db, 'fridge', fridgeDocId), {
      status: 'occupied',
      deceasedId: amputeeRef.id
    });

    await batch.commit();
    return amputeeRef.id;
  };

  const getFridgeDocId = (fridgeNumber: number, fridgePosition: number) => {
    if (fridgeNumber === 12) return `pos_12_${fridgePosition}`;
    if (fridgeNumber === 11) return `pos_11_${fridgePosition}`;
    if (fridgeNumber >= 1 && fridgeNumber <= 10) return `pos_${fridgeNumber}`;
    return null;
  };

  const deleteDeceasedRecord = async (id: string) => {
    const record = deceased.find(d => d.id === id);
    if (!record) return;

    const batch = writeBatch(db);

    // 1. Delete deceased document
    batch.delete(doc(db, 'deceased', id));

    // 2. Free up fridge if record was in facility
    if (record.status === 'in_facility' && record.fridgeNumber && record.fridgePosition) {
      const fridgeId = getFridgeDocId(record.fridgeNumber, record.fridgePosition);
      if (fridgeId) {
        batch.update(doc(db, 'fridge', fridgeId), {
          status: 'available',
          deceasedId: null
        });
      }
    }

    await batch.commit();
  };

  const deleteAmputeeRecord = async (id: string) => {
    const record = amputees.find(a => a.id === id);
    if (!record) return;

    const batch = writeBatch(db);

    // 1. Delete amputee document
    batch.delete(doc(db, 'amputees', id));

    // 2. Free up fridge (amputees are always in Frigo 11 if active)
    if (record.status === 'in_facility' && record.fridgeNumber && record.fridgePosition) {
      const fridgeId = getFridgeDocId(record.fridgeNumber, record.fridgePosition);
      if (fridgeId) {
        batch.update(doc(db, 'fridge', fridgeId), {
          status: 'available',
          deceasedId: null
        });
      }
    }

    await batch.commit();
  };

  const registerExit = async (id: string, exitData: any) => {
    const deceasedRecord = deceased.find(d => d.id === id);
    if (!deceasedRecord) return;

    const recordRef = doc(db, 'deceased', id);
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
    
    const batch = writeBatch(db);

    batch.update(recordRef, {
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
      updatedAt: serverTimestamp()
    });

    // Free up fridge
    if (deceasedRecord?.fridgePosition && deceasedRecord?.fridgeNumber) {
      const fridgeId = getFridgeDocId(deceasedRecord.fridgeNumber, deceasedRecord.fridgePosition);
      if (fridgeId) {
        batch.update(doc(db, 'fridge', fridgeId), {
          status: 'available',
          deceasedId: null
        });
      }
    }

    await batch.commit();
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
        updatedAt: serverTimestamp(),
        timeline: arrayUnion(identityEvent)
      });
      return true;
    } catch (err) {
      console.error("Error updating identity:", err);
      throw err;
    }
  };

  const registerHistoricalDeceased = async (data: Omit<DeceasedRecord, 'id' | 'createdAt' | 'updatedAt' | 'isHistorical'>) => {
    const operatorIdentity = getActiveOperatorIdentity();
    const operatorUid = currentUser?.id || '';
    const operatorRole = currentUser?.role || 'staff';
    const operatorName = currentUser?.name || '';

    const record = {
      ...data,
      isHistorical: true,
      createdBy: operatorIdentity,
      createdByUid: operatorUid,
      createdByRole: operatorRole,
      createdByName: operatorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'deceased'), record);
    return docRef.id;
  };

  const cleanupAllHistoricalData = async () => {
    const [snapshotDeceased, snapshotAmputees, snapshotFridge] = await Promise.all([
      getDocs(collection(db, 'deceased')),
      getDocs(collection(db, 'amputees')),
      getDocs(collection(db, 'fridge'))
    ]);

    const deletePromises = [
      ...snapshotDeceased.docs.map(doc => deleteDoc(doc.ref)),
      ...snapshotAmputees.docs.map(doc => deleteDoc(doc.ref))
    ];

    const resetFridgePromises = snapshotFridge.docs.map(doc => updateDoc(doc.ref, {
      status: 'available',
      deceasedId: null
    }));

    await Promise.all([...deletePromises, ...resetFridgePromises]);
    return deletePromises.length;
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
    updateDeceasedIdentity,
    deleteDeceasedRecord,
    deleteAmputeeRecord,
    cleanupAllHistoricalData
  };
}
