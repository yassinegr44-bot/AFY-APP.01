import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with settings optimized for offline persistence and auto-detecting transport
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({})
  }),
  experimentalAutoDetectLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Validate connection to Firestore as per Firebase skill guidance
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore running in offline cache mode.");
    }
  }
}
testConnection();

