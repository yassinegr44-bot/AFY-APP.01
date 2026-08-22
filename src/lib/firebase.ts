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
export const auth = getAuth(app);

const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager({})
    }),
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch (e) {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    }, dbId);
  } catch (err) {
    firestoreDb = getFirestore(app, dbId);
  }
}
export const db = firestoreDb;



