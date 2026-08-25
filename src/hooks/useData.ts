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
      if (snapshot.empty || snapshot.size < 35) {
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
    const fridgeSnapshot = await getDocs(collection(db, 'fridge'));
    const existingIds = new Set(fridgeSnapshot.docs.map(d => d.id));

    // 1. Ensure all positions exist (Normal, Medico-Legal, Neonat)
    // Frigos 1 to 10
    for (let i = 1; i <= 10; i++) {
      const id = `pos_${i}`;
      if (!existingIds.has(id)) {
        await setDoc(doc(db, 'fridge', id), {
          position: i,
          fridgeNumber: i,
          type: 'normal',
          status: 'available'
        });
      }
    }
    // Frigo 11
    for (let i = 1; i <= 10; i++) {
      const id = `pos_11_${i}`;
      if (!existingIds.has(id)) {
        await setDoc(doc(db, 'fridge', id), {
          position: i,
          fridgeNumber: 11,
          type: 'medico_legal',
          status: 'available'
        });
      }
    }
    // Frigo 12
    for (let i = 1; i <= 15; i++) {
      const id = `pos_12_${i}`;
      if (!existingIds.has(id)) {
        await setDoc(doc(db, 'fridge', id), {
          position: i,
          fridgeNumber: 12,
          type: 'neonat',
          status: 'available'
        });
      }
    }

    // 2. Sync occupied status from records to handle any previous data resets
    const deceasedSnapshot = await getDocs(query(collection(db, 'deceased'), where('status', '==', 'in_facility')));
    const amputeesSnapshot = await getDocs(query(collection(db, 'amputees'), where('status', '==', 'in_facility')));

    const records = [
      ...deceasedSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      ...amputeesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    ];

    for (const record of records) {
      const r = record as any;
      if (r.fridgeNumber && r.fridgePosition) {
        let fridgeId = '';
        if (r.fridgeNumber === 11) fridgeId = `pos_11_${r.fridgePosition}`;
        else if (r.fridgeNumber === 12) fridgeId = `pos_12_${r.fridgePosition}`;
        else if (r.fridgeNumber >= 1 && r.fridgeNumber <= 10) fridgeId = `pos_${r.fridgeNumber}`;

        if (fridgeId) {
          await updateDoc(doc(db, 'fridge', fridgeId), {
            status: 'occupied',
            deceasedId: r.id
          });
        }
      }
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
    const currentYear = new Date().getFullYear();

    let finalCaseType = data.caseType || 'DÉCÈS';
    let fridgePos = data.fridgePosition;
    let fridgeDocId = '';
    let fridgeNum = 1;

    const fridgeSnapshot = await getDocs(collection(db, 'fridge'));
    const fridgePositions = fridgeSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (finalCaseType === 'FŒTUS' || finalCaseType === 'MORT_NÉ' || finalCaseType === 'ENFANT_MOINS_1_AN') {
      const neonatPositions = fridgePositions
        .filter(p => p.fridgeNumber === 12 && p.status === 'available')
        .sort((a, b) => a.position - b.position);

      if (neonatPositions.length === 0) {
        throw new Error("⚠️ Unité Néonatale (Frigo 12) est complète\nCapacité maximale : 15/15\nAucune nouvelle affectation automatique possible.");
      }
      fridgePos = neonatPositions[0].position;
      fridgeDocId = neonatPositions[0].id;
      fridgeNum = 12;
    } else if (finalCaseType === 'MEMBRE_AMPUTÉ') {
      const medicoLegalPositions = fridgePositions
        .filter(p => p.fridgeNumber === 11 && p.status === 'available')
        .sort((a, b) => a.position - b.position);

      if (medicoLegalPositions.length === 0) {
        throw new Error("⚠️ Unité Médico-Légale (Frigo 11) est complète\nCapacité maximale : 10/10\nAucune nouvelle affectation possible.");
      }
      fridgePos = medicoLegalPositions[0].position;
      fridgeDocId = medicoLegalPositions[0].id;
      fridgeNum = 11;
    } else {
      if (!fridgePos || fridgePos === 0) {
        throw new Error("Veuillez sélectionner une position dans les Frigos 1 à 10.");
      }
      const normalPos = fridgePositions.find(p => p.fridgeNumber === Number(fridgePos) && p.status === 'available');
      if (!normalPos) {
        throw new Error(`⚠️ La position Frigo ${fridgePos} est déjà occupée ou indisponible.`);
      }
      fridgeDocId = normalPos.id;
      fridgeNum = Number(fridgePos);
    }

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
      caseType: finalCaseType,
      fridgePosition: fridgePos,
      fridgeNumber: fridgeNum,
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
        description: `Entrée enregistrée (${finalCaseType}) à la position Frigo ${fridgeNum === 12 ? '12 (Unité Néonatale)' : fridgeNum === 11 ? '11 (Unité Médico-Légale)' : fridgeNum} — Position ${fridgePos.toString().padStart(2, '0')}`,
        timestamp: serverTimestamp(),
        createdBy: operatorIdentity,
        operatorUid,
        operatorRole,
        operatorName
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'deceased'), record);
    
    // Update fridge status
    if (fridgeDocId) {
      await updateDoc(doc(db, 'fridge', fridgeDocId), {
        status: 'occupied',
        deceasedId: docRef.id
      });
    }
    return docRef.id;
  };

  const registerAmputee = async (data: Omit<AmputeeRecord, 'id' | 'refNumber' | 'createdAt'>) => {
    const currentYear = new Date().getFullYear();
    const fridgeSnapshot = await getDocs(collection(db, 'fridge'));
    const fridgePositions = fridgeSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const medicoLegalPositions = fridgePositions
      .filter(p => p.fridgeNumber === 11 && p.status === 'available')
      .sort((a, b) => a.position - b.position);

    if (medicoLegalPositions.length === 0) {
      throw new Error("⚠️ Unité Médico-Légale (Frigo 11) est complète\nCapacité maximale : 10/10\nAucune nouvelle affectation possible.");
    }
    const fridgePos = medicoLegalPositions[0].position;
    const fridgeDocId = medicoLegalPositions[0].id;

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
      fridgePosition: fridgePos,
      fridgeNumber: 11,
      createdBy: operatorIdentity,
      createdByUid: currentUser?.id || '',
      createdByRole: currentUser?.role || 'staff',
      createdByName: currentUser?.name || '',
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'amputees'), record);

    if (fridgeDocId) {
      await updateDoc(doc(db, 'fridge', fridgeDocId), {
        status: 'occupied',
        deceasedId: docRef.id
      });
    }

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
      timestamp: serverTimestamp(),
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
      updatedAt: serverTimestamp()
    });

    // Free up fridge
    if (deceasedRecord?.fridgePosition && deceasedRecord?.fridgeNumber) {
      const fridgeId = deceasedRecord.fridgeNumber === 12 
        ? `pos_12_${deceasedRecord.fridgePosition}` 
        : deceasedRecord.fridgeNumber === 11
          ? `pos_11_${deceasedRecord.fridgePosition}`
          : `pos_${deceasedRecord.fridgeNumber}`;
      
      await updateDoc(doc(db, 'fridge', fridgeId), {
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
        timestamp: serverTimestamp(),
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
