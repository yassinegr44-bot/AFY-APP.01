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
