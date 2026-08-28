import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentSingleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Standard auth initialization (uses browserLocalPersistence by default)
export const auth = getAuth(app);

const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

let firestoreDb;
try {
  // Use initializeFirestore with explicit settings
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager({})
    }),
    experimentalForceLongPolling: true,
  }, dbId);
} catch (e: any) {
  // If already initialized, get existing instance
  if (e.code === 'failed-precondition' || e.message?.includes('already been initialized')) {
    firestoreDb = getFirestore(app, dbId);
  } else {
    // Fallback for other errors
    firestoreDb = getFirestore(app, dbId);
  }
}

export const db = firestoreDb;



