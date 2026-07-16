import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updatePassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Construct config using static JSON config as default with VITE_ environment variable overrides for custom deployments
const metaEnv = (import.meta as any).env || {};
export const activeFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || "",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId || "",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "(default)"
};

// Detect whether the user has fully configured/accepted Firebase rules and holds real credentials
export const isFirebaseConfigured = !!(
  activeFirebaseConfig.apiKey &&
  activeFirebaseConfig.projectId
);

let firebaseApp;
let firebaseDb: any;
let firebaseAuth: any;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApp();
    // In custom user Firebase setups, the database ID is typically (default).
    // Let's pass the active configured database id appropriately.
    firebaseDb = getFirestore(firebaseApp, activeFirebaseConfig.firestoreDatabaseId === "(default)" ? undefined : activeFirebaseConfig.firestoreDatabaseId);
    firebaseAuth = getAuth(firebaseApp);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const db = firebaseDb;
export const auth = firebaseAuth;

// --- FIRESTORE SECURE ERROR HANDLER (MANDATORY SKILL REQ) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively cleans any object/array by removing all undefined fields
 * so that they can be safely written to Firestore.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }

  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = cleanUndefined(val);
    }
  }
  return cleaned as T;
}

// --- SUPER ADMIN GOVERNANCE BACKEND FUNCTIONS (CRUD) ---

/**
 * Creates a corresponding Firebase Auth user account for a registered staff operator.
 * Uses a secondary Firebase App instance to avoid logging out the currently authenticated admin.
 */
export async function createAuthUserForStaff(email: string, password: string): Promise<string> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not fully configured.");
  }

  const secondaryAppName = "SecondaryAuthApp";
  let secondaryApp;
  try {
    secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(activeFirebaseConfig, secondaryAppName);
  } catch (err) {
    secondaryApp = initializeApp(activeFirebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), password.trim());
    const uid = userCredential.user.uid;
    // Clean up the login session in the secondary auth instance immediately
    await signOut(secondaryAuth);
    return uid;
  } catch (error: any) {
    if (error && error.code === 'auth/email-already-in-use') {
      console.warn("Secondary Auth email already registered (handled gracefully):", error.message || error);
    } else {
      console.warn("Secondary Auth registration info note:", error.message || error);
    }
    throw error;
  }
}

/**
 * Synchronizes email/password credential changes from the Admin Portal into Firebase Authentication.
 * If the account doesn't exist, it creates it.
 * If the account exists, it signs in temporarily on the secondary app and updates the password of the staff member.
 */
export async function syncAuthUserCredentialsForStaff(email: string, oldPassword: string, newPassword: string): Promise<string | null> {
  if (!isFirebaseConfigured) return null;

  const secondaryAppName = "SecondaryAuthApp";
  let secondaryApp;
  try {
    secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(activeFirebaseConfig, secondaryAppName);
  } catch (err) {
    secondaryApp = initializeApp(activeFirebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  // 1. Try to create the user account first (in case it wasn't created yet or was offline)
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), newPassword.trim());
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    console.log(`Successfully created new Firebase Auth account for staff: ${email}`);
    return uid;
  } catch (createErr: any) {
    if (createErr.code === 'auth/email-already-in-use') {
      // 2. If already in use, then try to log in with the OLD password and update it to the NEW password
      if (oldPassword && oldPassword !== newPassword) {
        try {
          const userCredential = await signInWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), oldPassword.trim());
          if (secondaryAuth.currentUser) {
            await updatePassword(secondaryAuth.currentUser, newPassword.trim());
            console.log(`Successfully updated Firebase Auth password for staff: ${email}`);
          }
          await signOut(secondaryAuth);
          return userCredential.user.uid;
        } catch (loginErr: any) {
          console.warn(`Credential sync warning: Could not sign in with old password to update it for ${email}:`, loginErr);
          
          // Try signing in with the NEW password to check if they are already in sync!
          try {
            const userCredential2 = await signInWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), newPassword.trim());
            console.log(`Credentials are already in sync for ${email}.`);
            const uid2 = userCredential2.user.uid;
            await signOut(secondaryAuth);
            return uid2;
          } catch (newPassErr) {
            console.warn(`Credential sync warning: Password mismatch and cannot sync for ${email}:`, newPassErr);
          }
        }
      } else {
        // If password is the same, try to grab the UID by logging in with current password
        try {
          const userCredential = await signInWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), newPassword.trim());
          const uid = userCredential.user.uid;
          await signOut(secondaryAuth);
          return uid;
        } catch (loginErr) {
          console.warn(`Could not fetch UID for existing user ${email}:`, loginErr);
        }
      }
    } else {
      console.warn("Staff credentials sync creation warning:", createErr);
    }
  }
  return null;
}

/**
 * Deletes a corresponding Auth user from Firebase Authentication.
 * Signs in temporarily on the secondary app to delete the user.
 */
export async function deleteAuthUserForStaff(email: string, currentPassword: string): Promise<boolean> {
  if (!isFirebaseConfigured || !email || !currentPassword) return false;

  const secondaryAppName = "SecondaryAuthApp";
  let secondaryApp;
  try {
    secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(activeFirebaseConfig, secondaryAppName);
  } catch (err) {
    secondaryApp = initializeApp(activeFirebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await signInWithEmailAndPassword(secondaryAuth, email.toLowerCase().trim(), currentPassword.trim());
    if (secondaryAuth.currentUser) {
      await deleteUser(secondaryAuth.currentUser);
      console.log(`Successfully deleted Firebase Auth user: ${email}`);
      return true;
    }
  } catch (err) {
    console.warn(`Could not sign in and delete Firebase Auth user for ${email}:`, err);
  }
  return false;
}

/**
 * Creates a brand-new user operator in Firestore with a default active status.
 */
export async function createNewBusinessUser(email: string, password: string, businessName: string, phone?: string) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not fully configured.");
  }
  const uid = 'admin-created-' + Math.random().toString(36).substring(2, 11);
  const userRef = doc(db, 'users', uid);
  const newUser = {
    uid,
    email: email.toLowerCase().trim(),
    displayName: businessName.trim(),
    phone: phone || '',
    role: 'staff',
    status: 'active',
    password: password.trim() || 'Admin@123',
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(userRef, newUser);
  return newUser;
}

/**
 * Updates a user operator's active/inactive status in Firestore.
 */
export async function toggleUserStatus(targetUid: string, newStatus: 'active' | 'inactive') {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not fully configured.");
  }
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Updates a user operator's subscriptionStatus (active vs expired) in Firestore.
 */
export async function toggleSubscription(targetUid: string, isSubscribed: boolean) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not fully configured.");
  }
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    subscriptionStatus: isSubscribed ? 'active' : 'expired',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Updates a user operator's password in Firestore securely.
 */
export async function adminResetUserPassword(targetUid: string, newPassword: string) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not fully configured.");
  }
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    password: newPassword,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Changes the currently logged-in operator's own password in Firestore.
 */
export async function changeUserPassword(passwordValue: string) {
  if (!isFirebaseConfigured || !auth?.currentUser) {
    throw new Error("Credentials invalid: User is not authenticated.");
  }
  const userRef = doc(db, 'users', auth.currentUser.uid);
  await updateDoc(userRef, {
    password: passwordValue,
    updatedAt: new Date().toISOString()
  });
}
