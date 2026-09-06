import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { getFirestore, Firestore, doc, getDocFromServer } from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentAuth?: any
) {
  const errMsg = error instanceof Error ? error.message : String(error);

  // If the client is offline, unavailable, or network failed, handle gracefully without throwing
  if (
    errMsg.includes("client is offline") ||
    errMsg.includes("offline") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("network-request-failed")
  ) {
    console.warn(`[Firestore Offline Cache Notice - ${operationType} on ${path}]:`, errMsg);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo:
        currentAuth?.currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn("[Firestore Notice]:", JSON.stringify(errInfo));
}

// Check for config from environment or default project
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDW0bCX79heiAHHF10hUu9nk_ksVqGqW4w",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "reij-83c6f.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "reij-83c6f",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "reij-83c6f.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "654994418664",
  appId: env.VITE_FIREBASE_APP_ID || "1:654994418664:web:b39f64f9f3b131cfd0d25d",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isConfigured = false;

try {
  // Check if apiKey exists to initialize real Firebase SDK
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  }
} catch (e) {
  console.warn("[Firebase] Initialization notice:", e);
}

export { app, db, auth, isConfigured };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Helper to test connection as required by firebase skill
export async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
