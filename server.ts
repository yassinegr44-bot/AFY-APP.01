import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json";

const adminAny = admin as any;

// Initialize firebase-admin safely
const existingApps = adminAny.apps || adminAny.default?.apps;
if (!existingApps || existingApps.length === 0) {
  try {
    const initApp = adminAny.initializeApp || adminAny.default?.initializeApp;
    if (initApp) {
      initApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
    }
  } catch (e) {
    console.warn("Firebase Admin init error:", e);
  }
}

const getAdminAuth = () => {
  const authFn = adminAny.auth || adminAny.default?.auth;
  return authFn ? authFn() : null;
};

const getAdminFirestore = () => {
  const fsFn = adminAny.firestore || adminAny.default?.firestore;
  return fsFn ? fsFn() : null;
};

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to delete user from Firebase Auth & Firestore
app.post("/api/admin/delete-user", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "Missing uid" });
    }

    let firestoreDeleted = false;

    // 1. Delete user document from Firestore first
    try {
      const firestore = getAdminFirestore();
      if (firestore) {
        await firestore.collection('users').doc(uid).delete();
        firestoreDeleted = true;
      }
    } catch (fsErr: any) {
      console.warn("Warning deleting Firestore user doc via admin:", fsErr.message);
    }

    // 2. Delete from Firebase Auth
    try {
      const auth = getAdminAuth();
      if (auth) {
        try {
          await auth.deleteUser(uid);
        } catch (delErr: any) {
          console.warn("Auth delete user error (trying disable):", delErr.message);
          await auth.updateUser(uid, { disabled: true });
        }
      }
    } catch (authErr: any) {
      console.warn("Warning managing auth user:", authErr.message);
    }

    res.json({ success: true, message: "User deleted permanently" });
  } catch (err: any) {
    console.error("Error in /api/admin/delete-user:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// --- AUTOMATIC REFERENCE ATTRIBUTION ENGINE ---
const setupAttributionEngine = () => {
  const db = getAdminFirestore();
  if (!db) {
    console.error("[Sync Engine] Firestore Admin not available");
    return;
  }

  const assignRefNumber = async (docId: string, collectionName: 'deceased' | 'amputees') => {
    const docRef = db.collection(collectionName).doc(docId);
    
    try {
      await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) return;
        
        const data = docSnap.data();
        // IDEMPOTENCE: Only assign if syncStatus is 'pending' and refNumber is missing
        if (data?.syncStatus !== 'pending' || data?.refNumber) return;

        const createdAt = data?.createdAt?.toDate() || new Date();
        const year = createdAt.getFullYear();
        const counterId = `${collectionName}_${year}`;
        const counterRef = db.collection('settings').doc('counters').collection('years').doc(counterId);
        
        const counterSnap = await transaction.get(counterRef);
        const nextNumber = (counterSnap.data()?.lastNumber || 0) + 1;

        const prefix = collectionName === 'amputees' ? 'AMP' : 'AFY';
        // Format: "AFY 2026 0001" or "AMP-2026-0001"
        const formattedRef = collectionName === 'amputees' 
          ? `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`
          : `${prefix} ${year} ${nextNumber.toString().padStart(4, '0')}`;

        // Atomic Transaction Update
        transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
        transaction.update(docRef, {
          refNumber: formattedRef,
          syncStatus: 'synced',
          updatedAt: (admin as any).firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Sync Engine] Assigned ${formattedRef} to ${collectionName}/${docId}`);
      });
    } catch (error) {
      console.error(`[Sync Engine Error] Failed to assign ref to ${collectionName}/${docId}:`, error);
    }
  };

  // Listen for pending deceased records
  db.collection('deceased')
    .where('syncStatus', '==', 'pending')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          assignRefNumber(change.doc.id, 'deceased');
        }
      });
    }, err => console.error("[Sync Engine] Deceased listener error:", err));

  // Listen for pending amputee records
  db.collection('amputees')
    .where('syncStatus', '==', 'pending')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          assignRefNumber(change.doc.id, 'amputees');
        }
      });
    }, err => console.error("[Sync Engine] Amputees listener error:", err));
    
  console.log("[Sync Engine] Automatic attribution engine started");
};

// Start the engine
setupAttributionEngine();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
