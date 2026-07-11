import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, Product, Invoice, UserProfile, Quotation, Category, TrashItem } from './types';
import ProfileTab from './components/ProfileTab';
import ProductsTab from './components/ProductsTab';
import NewBillTab from './components/NewBillTab';
import RecordsTab from './components/RecordsTab';
import QuotationsTab from './components/QuotationsTab';
import AdminPortalTab from './components/AdminPortalTab';
import AnalyticsTab from './components/AnalyticsTab';
import RecycleBinTab from './components/RecycleBinTab';
import AuthScreen from './components/AuthScreen';
import PublicStorefront from './components/PublicStorefront';
import InvoiceDocument from './components/InvoiceDocument';
import MobileA4ScaledPreview from './components/MobileA4ScaledPreview';
import { downloadInvoiceAsPdf } from './utils/pdfGenerator';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType, createAuthUserForStaff, syncAuthUserCredentialsForStaff, deleteAuthUserForStaff } from './lib/firebase';
import { onAuthStateChanged, signOut, updatePassword, getRedirectResult } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { 
  ReceiptText, 
  Store, 
  ShoppingBag, 
  History, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  Download, 
  Printer, 
  ExternalLink,
  ChevronLeft,
  BarChart3,
  Sun,
  Moon,
  FileSignature,
  Trash2
} from 'lucide-react';

const DEFAULT_PROFILE: CompanyProfile = {
  name: "Apex Electronics Hub",
  logo: "", // base64 empty by default, displays sleek monogram avatar
  phone: "+94 11 234 5678",
  extraDetails: [
    { id: "1", key: "Email", value: "orders@apexhub.lk" },
    { id: "2", key: "Showroom", value: "102, Galle Road, Colombo 03" },
    { id: "3", key: "Reg No", value: "PV-89402" }
  ],
  invoicePrefix: "INV",
  nextInvoiceNumber: 1,
  quotationPrefix: "QT",
  nextQuotationNumber: 1,
  customProductAttributes: [
    { id: "ca1", name: "Brand" },
    { id: "ca2", name: "Model" },
    { id: "ca3", name: "Warranty" },
    { id: "ca4", name: "Material" },
    { id: "ca5", name: "Size" },
    { id: "ca6", name: "Weight" },
    { id: "ca7", name: "Made In" }
  ],
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Apex Pro Matte Laptop Sleeve",
    code: "APX-SLV-13",
    price: 4500,
    colors: ["Tan Premium", "Midnight Onyx", "Cavalry Brown"],
    customFields: [
      { id: "pf1", name: "Warranty", value: "1 Year Limited Warranty" },
      { id: "pf2", name: "Fabric Type", value: "Full-Grain Leather" }
    ]
  },
  {
    id: "p2",
    name: "High-Speed Qi Air Charging Pad",
    code: "WCP-FAST-15",
    price: 3200,
    colors: ["Polar White", "Matte Black"],
    customFields: [
      { id: "pf3", name: "Power Out", value: "15W Fast Charge" },
      { id: "pf4", name: "Warranty", value: "6 Months Replacement" }
    ]
  },
  {
    id: "p3",
    name: "Studio ANC Over-Ear Headphones",
    code: "ANC-HP-700",
    price: 18500,
    colors: ["Space Gray", "Alabaster White"],
    customFields: [
      { id: "pf5", name: "ANC Depth", value: "Up to 40dB Noise Reduction" },
      { id: "pf6", name: "Warranty", value: "2 Years Premium" }
    ]
  }
];

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: "admin-krypton",
    email: "kryptontechlk@gmail.com",
    displayName: "Krypton Tech Admin",
    role: "admin",
    status: "active",
    password: "Sathaya@Tewala2000",
    subscriptionPlan: "enterprise",
    subscriptionStatus: "active",
    subscriptionExpiresAt: "2030-12-31"
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Computers & Accessories' },
  { id: 'cat-3', name: 'Mobile Phones' },
  { id: 'cat-4', name: 'Audio & Speakers' },
  { id: 'cat-5', name: 'Home Appliances' },
  { id: 'cat-6', name: 'Cables & Adapters' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'new-bill' | 'products' | 'profile' | 'records' | 'admin-portal' | 'analytics' | 'recycle-bin'>('new-bill');

  // Global Dark Mode state & tracking
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Core Persistent States
  const [profile, setProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  
  // Current logged in operator
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // Public Storefront states
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [publicStoreProfile, setPublicStoreProfile] = useState<CompanyProfile>(DEFAULT_PROFILE);
  const [publicStoreProducts, setPublicStoreProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [publicMerchantUid, setPublicMerchantUid] = useState<string>('staff-seed');

  // Load public storefront custom data dynamically
  useEffect(() => {
    if (!currentUser) {
      // Find the first registered admin or staff user UID
      const merchant = users.find(u => u.role === 'staff' || u.role === 'admin');
      const merchantUid = merchant?.uid || 'staff-seed';
      setPublicMerchantUid(merchantUid);

      const savedProfile = localStorage.getItem(`invoice_profile_${merchantUid}`);
      const savedProducts = localStorage.getItem(`invoice_products_${merchantUid}`);

      if (savedProfile) {
        try { setPublicStoreProfile(JSON.parse(savedProfile)); } catch(e) {}
      } else {
        setPublicStoreProfile(DEFAULT_PROFILE);
      }

      if (savedProducts) {
        try { setPublicStoreProducts(JSON.parse(savedProducts)); } catch(e) {}
      } else {
        setPublicStoreProducts(DEFAULT_PRODUCTS);
      }
    }
  }, [currentUser, users]);

  // Dynamically compute cloud connection status based on active actual authenticated Firebase user session
  useEffect(() => {
    const isLive = !!(isFirebaseConfigured && currentUser && firebaseUser && firebaseUser.uid === currentUser.uid);
    setIsCloudConnected(isLive);
  }, [currentUser, firebaseUser, isFirebaseConfigured]);

  // Draft invoice holder for billing bench
  const [activeDraft, setActiveDraft] = useState<Invoice | null>(null);

  const canWriteFirestore = () => {
    return !!(isFirebaseConfigured && currentUser && auth?.currentUser && auth.currentUser.uid === currentUser.uid);
  };

  // Public Online Viewing Mode
  const [publicInvoiceId, setPublicInvoiceId] = useState<string | null>(null);
  const [publicOwnerId, setPublicOwnerId] = useState<string | null>(null);
  const [publicInvoice, setPublicInvoice] = useState<Invoice | null>(null);
  const [publicProfile, setPublicProfile] = useState<CompanyProfile | null>(null);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Parse URL Parameters on Init to detect open share links (?invoice=ID&owner=UID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invId = params.get('invoice');
    const ownId = params.get('owner');
    if (invId) {
      setPublicInvoiceId(invId);
      if (ownId) {
        setPublicOwnerId(ownId);
      }
    }
  }, []);

  // Fetch Public Invoice Document (either from Firestore or localStorage Fallback)
  useEffect(() => {
    if (!publicInvoiceId) return;

    const loadPublicDoc = async () => {
      if (isFirebaseConfigured) {
        try {
          const docRef = publicOwnerId
            ? doc(db, 'users', publicOwnerId, 'invoices', publicInvoiceId)
            : doc(db, 'invoices', publicInvoiceId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const invoiceData = snap.data() as Invoice;
            setPublicInvoice(invoiceData);

            // Dynamically load issuing business profile
            const activeOwnerId = publicOwnerId || invoiceData.ownerId;
            if (activeOwnerId) {
              const profileRef = doc(db, 'users', activeOwnerId, 'profile', 'store_details');
              const profileSnap = await getDoc(profileRef);
              if (profileSnap.exists()) {
                setPublicProfile(profileSnap.data() as CompanyProfile);
              }
            }
          } else {
            console.warn("Public invoice not found in remote database.");
          }
        } catch (e) {
          console.error("Failed to fetch public document", e);
        }
      } else {
        // Fallback local lookup
        const localInv = localStorage.getItem('invoice_records');
        if (localInv) {
          try {
            const records: Invoice[] = JSON.parse(localInv);
            const matched = records.find(r => r.id === publicInvoiceId);
            if (matched) {
              setPublicInvoice(matched);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    loadPublicDoc();
  }, [publicInvoiceId, publicOwnerId]);

  // Load state on mount for Local Database (Core Operator catalog listing)
  useEffect(() => {
    const savedUsers = localStorage.getItem('invoice_users');

    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Error decoding users list", e);
      }
    } else {
      localStorage.setItem('invoice_users', JSON.stringify(DEFAULT_USERS));
    }

    const savedAuthType = localStorage.getItem('invoice_auth_type');
    const hasFirebaseAuth = !!(firebaseUser && currentUser && firebaseUser.uid === currentUser.uid);
    const isRealAuth = savedAuthType === 'google' || savedAuthType === 'email';

    if (isFirebaseConfigured && currentUser && hasFirebaseAuth && isRealAuth) {
      // Subscribing to the entire users collection ensures that when any user signs up or changes are made on another device, they sync instantly
      const unsubUsers = onSnapshot(collection(db, 'users'), async (snapshot) => {
        const cloudList: UserProfile[] = [];
        snapshot.forEach((d) => {
          const u = d.data() as UserProfile;
          if (!u.uid) u.uid = d.id;
          cloudList.push(u);
        });

        if (cloudList.length > 0) {
          // Smart Reconciliation/Merge of Local-Only Operators to Firestore
          // ONLY triggers if we are currently online with Google Auth as Admin
          if (isRealAuth && hasFirebaseAuth && currentUser.role === 'admin') {
            const localSaved = localStorage.getItem('invoice_users');
            if (localSaved) {
              try {
                const localList: UserProfile[] = JSON.parse(localSaved);
                const localOnlyUsers = localList.filter(
                  (localUser) => !cloudList.some((cloudUser) => cloudUser.email.toLowerCase() === localUser.email.toLowerCase())
                );

                if (localOnlyUsers.length > 0) {
                  console.log("Auto-merging local-only registered operators to cloud...", localOnlyUsers);
                  for (const userToUpload of localOnlyUsers) {
                    try {
                      await setDoc(doc(db, 'users', userToUpload.uid), {
                        ...userToUpload,
                        updatedAt: new Date().toISOString()
                      });
                    } catch (uploadErr) {
                      console.error(`Auto-upload of local operator ${userToUpload.email} failed:`, uploadErr);
                    }
                  }
                  // Let the newly written docs re-trigger the listener
                  return;
                }
              } catch (parseErr) {
                console.error("Local operators JSON parse error during reconciliation:", parseErr);
              }
            }
          }

          // --- AUTOMATIC DATABASE DEDUPLICATION ENGINE ---
          const uniqueByEmail = new Map<string, UserProfile>();
          const docsToDelete: string[] = [];

          // Group users by email
          const groups: { [email: string]: UserProfile[] } = {};
          cloudList.forEach((user) => {
            const emailLower = (user.email || '').toLowerCase().trim();
            if (!emailLower) return;
            if (!groups[emailLower]) {
              groups[emailLower] = [];
            }
            groups[emailLower].push(user);
          });

          // Process duplication groups
          Object.keys(groups).forEach((emailKey) => {
            const group = groups[emailKey];
            if (group.length === 1) {
              uniqueByEmail.set(emailKey, group[0]);
              return;
            }

            console.log(`Duplicate Firestore document records detected for email ${emailKey}. Resolving...`);

            // Choose the champion document:
            // 1. Current user if matches
            let champion = group.find(u => auth?.currentUser && u.uid === auth.currentUser.uid);

            // 2. Real auth UID (non-seed)
            if (!champion) {
              champion = group.find(u => !u.uid.startsWith('admin-') && !u.uid.startsWith('staff-') && !u.uid.startsWith('inactive-'));
            }

            // 3. Most recently updated
            if (!champion) {
              champion = [...group].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA;
              })[0];
            }

            if (!champion) champion = group[0];

            // Build a merged champion profile to preserve edits under any duplicate document IDs
            const mergedChampion = { ...champion };
            group.forEach((u) => {
              if (u.uid !== mergedChampion.uid) {
                if (u.displayName && (!mergedChampion.displayName || mergedChampion.displayName.startsWith('Primary Admin') || mergedChampion.displayName.startsWith('Kosala Admin'))) {
                  mergedChampion.displayName = u.displayName;
                }
                if (u.password && (!mergedChampion.password || mergedChampion.password === 'Admin@123' || mergedChampion.password === 'Staff@123')) {
                  mergedChampion.password = u.password;
                }
                if (u.role === 'admin' && mergedChampion.role !== 'admin') {
                  mergedChampion.role = 'admin';
                }
                if (u.status === 'active' && mergedChampion.status !== 'active') {
                  mergedChampion.status = 'active';
                }
                if (u.subscriptionPlan === 'enterprise' || u.subscriptionPlan === 'premium') {
                  mergedChampion.subscriptionPlan = u.subscriptionPlan;
                  mergedChampion.subscriptionStatus = u.subscriptionStatus;
                  mergedChampion.subscriptionExpiresAt = u.subscriptionExpiresAt;
                }
              }
            });

            uniqueByEmail.set(emailKey, mergedChampion);

            // Mark other UIDs as duplicates to be deleted from Firestore
            group.forEach((u) => {
              if (u.uid !== champion.uid) {
                docsToDelete.push(u.uid);
              }
            });
          });

          const deduplicatedList = Array.from(uniqueByEmail.values());

          // Perform cleanup in Firestore asynchronously (requires admin permissions)
          if (docsToDelete.length > 0 && currentUser?.role === 'admin') {
            console.log(`Self-Healing database: Deleting ${docsToDelete.length} redundant duplicate records from Firestore...`, docsToDelete);
            for (const docId of docsToDelete) {
              try {
                await deleteDoc(doc(db, 'users', docId));
                console.log(`Self-Healing: Deleted redundant record for ID: ${docId}`);
              } catch (delErr) {
                console.warn(`Self-Healing: Could not delete duplicate record ${docId}:`, delErr);
              }
            }
          }

          setUsers(deduplicatedList);
          localStorage.setItem('invoice_users', JSON.stringify(deduplicatedList));
        }
      }, (error) => {
        console.warn("Global users sync:", error);
        try {
          handleFirestoreError(error, OperationType.GET, 'users');
        } catch (e) {
          console.error("Global users sync failed security gate check:", e);
        }
      });
      return () => unsubUsers();
    }
  }, [isFirebaseConfigured, currentUser, firebaseUser]);

  // Sync isolated user state whenever currentUser changes (Zero-Trust Privacy Alignment)
  useEffect(() => {
    if (!currentUser) {
      setProfile(DEFAULT_PROFILE);
      setProducts(DEFAULT_PRODUCTS);
      setInvoices([]);
      return;
    }

    // Admins do not handle business data
    if (currentUser.role === 'admin') {
      setProfile(DEFAULT_PROFILE);
      setProducts([]);
      setInvoices([]);
      return;
    }

    const userUid = currentUser.uid;
    const savedProfile = localStorage.getItem(`invoice_profile_${userUid}`);
    const savedProducts = localStorage.getItem(`invoice_products_${userUid}`);
    const savedInvoices = localStorage.getItem(`invoice_records_${userUid}`);
    const savedQuotations = localStorage.getItem(`quotation_records_${userUid}`);

    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error decoding profile data", e);
        setProfile(DEFAULT_PROFILE);
      }
    } else {
      const defaultBizName = currentUser.displayName 
        ? `${currentUser.displayName}'s Enterprise` 
        : `${currentUser.email.split('@')[0]}'s Store`;
      
      const initialProfile: CompanyProfile = {
        ...DEFAULT_PROFILE,
        name: defaultBizName,
        nextInvoiceNumber: 1
      };
      setProfile(initialProfile);
    }

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Error decoding products catalog", e);
        setProducts(DEFAULT_PRODUCTS);
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
    }

    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (e) {
        console.error("Error decoding invoice directory", e);
        setInvoices([]);
      }
    } else {
      setInvoices([]);
    }

    if (savedQuotations) {
      try {
        setQuotations(JSON.parse(savedQuotations));
      } catch (e) {
        console.error("Error decoding quotation directory", e);
        setQuotations([]);
      }
    } else {
      setQuotations([]);
    }

    const savedCategories = localStorage.getItem(`invoice_categories_${userUid}`);
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error("Error decoding categories catalog", e);
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    const savedTrash = localStorage.getItem(`invoice_trash_${userUid}`);
    if (savedTrash) {
      try {
        setTrashItems(JSON.parse(savedTrash));
      } catch (e) {
        console.error("Error decoding trash items", e);
        setTrashItems([]);
      }
    } else {
      setTrashItems([]);
    }
  }, [currentUser]);

  // Adjust active tab automatically based on roles on login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveTab('admin-portal');
      } else if (activeTab === 'admin-portal') {
        setActiveTab('new-bill');
      }
    }
  }, [currentUser]);

  // Refactored: Users lists are now synced globally on load for all operators across any connected devices.

  // Sync Manual/Offline Auth Session if Firebase is not active or user is manual operator
  useEffect(() => {
    const savedAuthType = localStorage.getItem('invoice_auth_type');
    
    if (!isFirebaseConfigured || savedAuthType === 'manual') {
      const cachedSession = localStorage.getItem('invoice_active_session');
      if (cachedSession) {
        try {
          const profileData = JSON.parse(cachedSession);
          // Sync with existing users directory to capture live deactivations/subscription expirations
          const matchedCatalogUser = users.find(u => u.email.toLowerCase() === profileData.email.toLowerCase());
          if (matchedCatalogUser) {
            const statusLower = (matchedCatalogUser.status || '').toLowerCase();
            const subLower = (matchedCatalogUser.subscriptionStatus || '').toLowerCase();
            if (
              statusLower === 'inactive' || 
              statusLower === 'disabled' || 
              statusLower === 'suspended' ||
              subLower === 'expired' || 
              subLower === 'inactive' || 
              subLower === 'disabled' || 
              subLower === 'unpaid'
            ) {
              localStorage.removeItem('invoice_active_session');
              localStorage.removeItem('invoice_auth_type');
              setCurrentUser(null);
              alert("Your account/subscription is inactive. Please contact the administrator.");
            } else {
              if (!currentUser || 
                  currentUser.uid !== matchedCatalogUser.uid || 
                  currentUser.status !== matchedCatalogUser.status || 
                  currentUser.subscriptionStatus !== matchedCatalogUser.subscriptionStatus || 
                  currentUser.role !== matchedCatalogUser.role ||
                  currentUser.displayName !== matchedCatalogUser.displayName) {
                setCurrentUser(matchedCatalogUser);
              }
            }
          } else {
            if (!currentUser || currentUser.uid !== profileData.uid) {
              setCurrentUser(profileData);
            }
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        if (currentUser) {
          setCurrentUser(null);
        }
      }
      setAuthInitialized(true);
    }
  }, [isFirebaseConfigured, users, currentUser]);

  // Sync Live Firebase Auth Session
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthInitialized(true);
      return;
    }

    // Process any inbound Google redirects (essential for mobile Chrome/Safari, where popups are blocked by default)
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log("Successfully resolved Google Auth redirect for user:", result.user.email);
          // onAuthStateChanged will trigger next and finalize session state
        }
      })
      .catch((err) => {
        console.warn("Error resolving Google Auth redirect credential alert:", err);
        setRedirectError(err.code || err.message || "Google Redirect Auth failed.");
      });

    // Subscribe to Firebase Authentication triggers
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      const savedAuthType = localStorage.getItem('invoice_auth_type');
      setFirebaseUser(firebaseUser);
      if (!firebaseUser || !firebaseUser.email) {
        if (savedAuthType !== 'manual') {
          setCurrentUser(null);
        }
        setAuthInitialized(true);
        return;
      }

      if (savedAuthType === 'manual') {
        setAuthInitialized(true);
        return;
      }

      const emailLower = firebaseUser.email.toLowerCase();
      const isBootstrappedAdmin = emailLower === 'kryptontechlk@gmail.com';

      try {
        // Query users catalog in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        const isGoogleProvider = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
        const authType = isGoogleProvider ? 'google' : 'email';

        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          const statusLower = (profileData.status || '').toLowerCase();
          const subLower = (profileData.subscriptionStatus || '').toLowerCase();
          if (
            statusLower === 'inactive' || 
            statusLower === 'disabled' || 
            statusLower === 'suspended' ||
            subLower === 'expired' || 
            subLower === 'inactive' || 
            subLower === 'disabled' || 
            subLower === 'unpaid'
          ) {
            await signOut(auth);
            setCurrentUser(null);
            alert("Your account/subscription is inactive. Please contact the administrator.");
          } else {
            if (!currentUser || 
                currentUser.uid !== profileData.uid || 
                currentUser.status !== profileData.status || 
                currentUser.subscriptionStatus !== profileData.subscriptionStatus || 
                currentUser.role !== profileData.role ||
                currentUser.displayName !== profileData.displayName) {
              setCurrentUser(profileData);
              localStorage.setItem('invoice_auth_type', authType);
              localStorage.setItem('invoice_active_session', JSON.stringify(profileData));
            }

            // Securely synchronize the Firebase Auth credential password with database record on Google sign-in
            if (isGoogleProvider && profileData.password && auth.currentUser) {
              try {
                await updatePassword(auth.currentUser, profileData.password);
                console.log("Firebase Auth password aligned with database profile during dynamic mount check.");
              } catch (passErr) {
                // Suppress requires-recent-login errors on app re-mounts
              }
            }
          }
        } else if (isBootstrappedAdmin) {
          // Initialize active profile for the bootstrapped master admin instantly
          const newAdminProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: emailLower,
            displayName: firebaseUser.displayName || "Krypton Tech Admin",
            role: "admin",
            status: "active",
            subscriptionPlan: "enterprise",
            subscriptionStatus: "active",
            subscriptionExpiresAt: "2030-12-31",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userRef, newAdminProfile);
          setCurrentUser(newAdminProfile);
          localStorage.setItem('invoice_auth_type', authType);
          localStorage.setItem('invoice_active_session', JSON.stringify(newAdminProfile));
        } else {
          // Check if there is a pre-registered profile by email in the database
          const q = query(collection(db, 'users'), where('email', '==', emailLower));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const oldDoc = qSnap.docs[0];
            const preRegisteredProfile = oldDoc.data() as UserProfile;
            const migratedProfile: UserProfile = {
              ...preRegisteredProfile,
              uid: firebaseUser.uid,
              updatedAt: new Date().toISOString()
            };

            // Setup the master user record FIRST so that the Firestore security rules can successfully
            // verify the authenticated user matches the pre-registered email before reading subcollections.
            await setDoc(userRef, migratedProfile);
            setCurrentUser(migratedProfile);
            localStorage.setItem('invoice_auth_type', authType);
            localStorage.setItem('invoice_active_session', JSON.stringify(migratedProfile));

            if (oldDoc.id !== firebaseUser.uid) {
              // 1. Migrate profile details
              try {
                const oldProfileRef = doc(db, 'users', oldDoc.id, 'profile', 'store_details');
                const oldProfileSnap = await getDoc(oldProfileRef);
                if (oldProfileSnap.exists()) {
                  await setDoc(doc(db, 'users', firebaseUser.uid, 'profile', 'store_details'), oldProfileSnap.data());
                  await deleteDoc(oldProfileRef);
                }
              } catch (subErr) {
                console.error("Profile subcollection migration on mount failed gracefully:", subErr);
              }

              // 2. Migrate products catalog
              try {
                const oldProductsSnap = await getDocs(collection(db, 'users', oldDoc.id, 'products'));
                for (const pSnapDoc of oldProductsSnap.docs) {
                  const productData = pSnapDoc.data();
                  const updatedProduct = { ...productData, ownerId: firebaseUser.uid };
                  await setDoc(doc(db, 'users', firebaseUser.uid, 'products', pSnapDoc.id), updatedProduct);
                  await deleteDoc(doc(db, 'users', oldDoc.id, 'products', pSnapDoc.id));
                }
              } catch (subErr) {
                console.error("Products subcollection migration on mount failed gracefully:", subErr);
              }

              // 3. Migrate invoices records
              try {
                const oldInvoicesSnap = await getDocs(collection(db, 'users', oldDoc.id, 'invoices'));
                for (const iSnapDoc of oldInvoicesSnap.docs) {
                  const invoiceData = iSnapDoc.data();
                  const updatedInvoice = { ...invoiceData, ownerId: firebaseUser.uid };
                  await setDoc(doc(db, 'users', firebaseUser.uid, 'invoices', iSnapDoc.id), updatedInvoice);
                  await deleteDoc(doc(db, 'users', oldDoc.id, 'invoices', iSnapDoc.id));
                }
              } catch (subErr) {
                console.error("Invoices subcollection migration on mount failed gracefully:", subErr);
              }

              // Finally delete the old user master doc record safely
              try {
                await deleteDoc(doc(db, 'users', oldDoc.id));
              } catch (delErr) {
                console.warn("Could not delete obsolete master record on mount:", delErr);
              }
            }
          } else {
            // Standard auto-provisioning is disabled. Reject login for unregistered Gmails
            await signOut(auth);
            setCurrentUser(null);
            alert(`Access Denied: The Google account "${emailLower}" has not been pre-registered. Please contact the administrator to register this email.`);
          }
        }
      } catch (err) {
        console.error("Firestore user checking failed:", err);
        // Fallback checks
        if (isBootstrappedAdmin) {
          const fallbackAdmin: UserProfile = {
            uid: firebaseUser.uid,
            email: emailLower,
            displayName: firebaseUser.displayName || "Admin",
            role: "admin",
            status: "active",
            subscriptionPlan: "enterprise",
            subscriptionStatus: "active",
            subscriptionExpiresAt: "2030-12-31"
          };
          if (!currentUser || currentUser.uid !== fallbackAdmin.uid) {
            setCurrentUser(fallbackAdmin);
          }
        } else {
          setCurrentUser(null);
        }
      } finally {
        setAuthInitialized(true);
      }
    });

    return () => unsubscribeAuth();
  }, [isFirebaseConfigured]);

  // Real-Time Firebase Synchronizer Subscriptions for Authenticated Operators
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;

    const savedAuthType = localStorage.getItem('invoice_auth_type');
    const hasFirebaseAuth = !!(firebaseUser && currentUser && firebaseUser.uid === currentUser.uid);
    const isRealAuth = savedAuthType === 'google' || savedAuthType === 'email';

    // We MUST have a real, validated Firebase authenticated user to connect and sync to Firestore.
    // If we do not have a Firebase user, we cannot sync or register listeners without getting and causing Permission Denied.
    if (!isRealAuth || !hasFirebaseAuth) {
      return;
    }

    // Subscribe Invoices subcollection under users
    const unsubInvoices = onSnapshot(collection(db, 'users', currentUser.uid, 'invoices'), (snapshot) => {
      const records: Invoice[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as Invoice);
      });
      records.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
      setInvoices(records);
      localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(records));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'invoices');
      } catch (e) {
         console.warn("Invoices sync bypass lock check", e);
      }
    });

    // Subscribe Quotations subcollection under users
    const unsubQuotations = onSnapshot(collection(db, 'users', currentUser.uid, 'quotations'), (snapshot) => {
      const records: Quotation[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as Quotation);
      });
      records.sort((a, b) => b.quotationNumber.localeCompare(a.quotationNumber));
      setQuotations(records);
      localStorage.setItem(`quotation_records_${currentUser.uid}`, JSON.stringify(records));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'quotations');
      } catch (e) {
         console.warn("Quotations sync bypass lock check", e);
      }
    });

    // Subscribe Products subcollection under users
    const unsubProducts = onSnapshot(collection(db, 'users', currentUser.uid, 'products'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default template products for this user's account to avoid starting blank
        DEFAULT_PRODUCTS.forEach(async (p) => {
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'products', `${currentUser.uid}_${p.id}`), {
              ...p,
              id: `${currentUser.uid}_${p.id}`,
              ownerId: currentUser.uid
            });
          } catch (e) {
            console.error("Failed to seed default product for user:", e);
          }
        });
      } else {
        const items: Product[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Product);
        });
        setProducts(items);
        localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(items));
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'products');
      } catch (e) {
        console.warn("Products sync bypass check", e);
      }
    });

    // Subscribe Company profile settings subcollection under users
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), (docSnap) => {
      if (docSnap.exists()) {
        const prof = docSnap.data() as CompanyProfile;
        setProfile(prof);
        localStorage.setItem(`invoice_profile_${currentUser.uid}`, JSON.stringify(prof));
      } else {
        // Automatically initialize a separate company profile for this brand-new business
        const defaultBizName = currentUser.displayName 
          ? `${currentUser.displayName}'s Enterprise` 
          : `${currentUser.email.split('@')[0]}'s Store`;
        
        const initialProfile: CompanyProfile = {
          ...DEFAULT_PROFILE,
          name: defaultBizName,
          nextInvoiceNumber: 1
        };
        
        setDoc(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), initialProfile)
          .catch((err) => console.error("Failed to auto-create user business profile:", err));
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'profile');
      } catch (e) {
        console.warn("Profile sync bypass check", e);
      }
    });

    // Subscribe Categories subcollection under users
    const unsubCategories = onSnapshot(collection(db, 'users', currentUser.uid, 'categories'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default categories
        DEFAULT_CATEGORIES.forEach(async (cat) => {
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'categories', cat.id), {
              ...cat,
              ownerId: currentUser.uid
            });
          } catch (e) {
            console.error("Failed to seed default category:", e);
          }
        });
      } else {
        const list: Category[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Category);
        });
        setCategories(list);
        localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(list));
      }
    }, (error) => {
      console.warn("Categories sync bypass check", error);
    });

    // Subscribe Trash items subcollection under users
    const unsubTrash = onSnapshot(collection(db, 'users', currentUser.uid, 'trash'), (snapshot) => {
      const list: TrashItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TrashItem);
      });
      setTrashItems(list);
      localStorage.setItem(`invoice_trash_${currentUser.uid}`, JSON.stringify(list));
    }, (error) => {
      console.warn("Trash sync bypass check", error);
    });

    return () => {
      unsubInvoices();
      unsubQuotations();
      unsubProducts();
      unsubProfile();
      unsubCategories();
      unsubTrash();
    };
  }, [currentUser, firebaseUser]);

  // Session login trigger
  const handleLoginSuccess = async (profileData: UserProfile) => {
    let authType = 'manual';
    if (isFirebaseConfigured && auth?.currentUser) {
      // Force match security UID to avoid local/cloud key misalignment
      profileData.uid = auth.currentUser.uid;
      setFirebaseUser(auth.currentUser);
      const isGoogleProvider = auth?.currentUser?.providerData?.some(p => p.providerId === 'google.com');
      authType = isGoogleProvider ? 'google' : 'email';

      // --- AUTOMATIC OFFLINE/SIMULATED SESSION DATA MIGRATION ---
      // Check if there was an offline manual session and automatically migrate/sync its data to the secure cloud UID
      const cachedSessionStr = localStorage.getItem('invoice_active_session');
      if (cachedSessionStr) {
        try {
          const oldProfile = JSON.parse(cachedSessionStr);
          const oldUid = oldProfile.uid;
          const newUid = auth.currentUser.uid;
          
          if (oldUid && newUid && oldUid !== newUid && oldProfile.email?.toLowerCase() === profileData.email?.toLowerCase()) {
            console.log(`Auto-migrating offline local state for ${oldProfile.email} from ${oldUid} to ${newUid}`);
            
            // 1. Migrate Company Profile
            const oldProfileData = localStorage.getItem(`invoice_profile_${oldUid}`);
            if (oldProfileData) {
              localStorage.setItem(`invoice_profile_${newUid}`, oldProfileData);
              try {
                const parsedProfile = JSON.parse(oldProfileData);
                await setDoc(doc(db, 'users', newUid, 'profile', 'store_details'), parsedProfile);
                setProfile(parsedProfile);
              } catch (err) {
                console.error("Auto-migrate profile push error:", err);
              }
            }
            
            // 2. Migrate Products catalog
            const oldProductsData = localStorage.getItem(`invoice_products_${oldUid}`);
            if (oldProductsData) {
              localStorage.setItem(`invoice_products_${newUid}`, oldProductsData);
              try {
                const parsedProducts = JSON.parse(oldProductsData) as Product[];
                setProducts(parsedProducts);
                for (const p of parsedProducts) {
                  const productWithOwner = { ...p, ownerId: newUid };
                  await setDoc(doc(db, 'users', newUid, 'products', p.id), productWithOwner);
                }
              } catch (err) {
                console.error("Auto-migrate products push error:", err);
              }
            }
            
            // 3. Migrate Invoices records
            const oldInvoicesData = localStorage.getItem(`invoice_records_${oldUid}`);
            if (oldInvoicesData) {
              localStorage.setItem(`invoice_records_${newUid}`, oldInvoicesData);
              try {
                const parsedInvoices = JSON.parse(oldInvoicesData) as Invoice[];
                setInvoices(parsedInvoices);
                for (const inv of parsedInvoices) {
                  const invoiceWithOwner = { ...inv, ownerId: newUid, lastSyncedAt: new Date().toISOString() };
                  await setDoc(doc(db, 'users', newUid, 'invoices', inv.id), invoiceWithOwner);
                }
              } catch (err) {
                console.error("Auto-migrate invoices push error:", err);
              }
            }
          }
        } catch (e) {
          console.error("Auto-migration during user login aborted or failed:", e);
        }
      }
    }
    setCurrentUser(profileData);
    localStorage.setItem('invoice_auth_type', authType);
    localStorage.setItem('invoice_active_session', JSON.stringify(profileData));
  };

  // Logout session trigger
  const handleSignOut = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
    }
    setFirebaseUser(null);
    setCurrentUser(null);
    localStorage.removeItem('invoice_active_session');
    localStorage.removeItem('invoice_auth_type');
    setActiveTab('new-bill');
  };

  // Save/Update user operators from the Admin portal controls
  const handleAddUser = async (newUser: UserProfile) => {
    let finalUser = { ...newUser };

    if (isFirebaseConfigured) {
      try {
        // Authenticate new operator in Firebase Auth using the separated secondary system
        const realUid = await createAuthUserForStaff(newUser.email, newUser.password || 'Admin@123');
        finalUser.uid = realUid;
      } catch (authErr: any) {
        console.warn("Could not register user in Firebase Authentication:", authErr);
        if (authErr && authErr.code === 'auth/email-already-in-use') {
          alert(`Notice: The email address "${newUser.email}" is already registered in Firebase Authentication.\n\nWe have created their record in the directory. They can sign in using their existing Firebase Authentication credentials immediately.`);
          
          const existingUserByEmail = users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
          if (existingUserByEmail && !existingUserByEmail.uid.startsWith('admin-') && !existingUserByEmail.uid.startsWith('staff-') && !existingUserByEmail.uid.startsWith('inactive-') && existingUserByEmail.uid.length > 15) {
            finalUser.uid = existingUserByEmail.uid;
          } else {
            // Attempt to dynamically sync and resolve their authentic Firebase UID
            try {
              const syncedUid = await syncAuthUserCredentialsForStaff(newUser.email, 'Admin@123', newUser.password || 'Admin@123');
              if (syncedUid) {
                finalUser.uid = syncedUid;
              }
            } catch (syncErr) {
              console.warn("Could not sync UID during duplicate prevention:", syncErr);
            }
          }
        } else if (authErr && authErr.code === 'auth/operation-not-allowed') {
          alert("Error: Firebase Email/Password Sign-In is not enabled on your Firebase project.\n\nPlease go to your Firebase Console -> Authentication -> Sign-in Method, and click 'Enable' under 'Email/Password' provider, otherwise operators won't be able to log in with passwords.");
        } else if (authErr && authErr.code === 'auth/weak-password') {
          alert(`Weak Password Error: ${authErr.message || "The password must be at least 6 characters long."}\n\nThe user's credentials were not saved in Firebase. Please recreate with a stronger password.`);
          return; // Avoid writing a failed credential to Firestore
        } else {
          alert(`Firebase Authentication Error: ${authErr.message || "Failed to register credentials."}\n\nThe user's record has been saved locally, but they might not be able to log in until configuration is corrected.`);
        }
      }
    }

    const updated = [...users.filter(u => u.email !== finalUser.email), finalUser];
    setUsers(updated);
    localStorage.setItem('invoice_users', JSON.stringify(updated));

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', finalUser.uid), finalUser);
      } catch (e) {
        console.error("Firestore save operator failed:", e);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    // Keep credentials synchronized in Firebase Auth if there's any update
    const oldUser = users.find(u => u.uid === updatedUser.uid);
    const oldPassword = oldUser ? (oldUser.password || 'Admin@123') : 'Admin@123';
    const newPassword = updatedUser.password || 'Admin@123';

    const updated = users.map(u => u.uid === updatedUser.uid ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('invoice_users', JSON.stringify(updated));

    if (canWriteFirestore()) {
      try {
        // Sync Firebase Auth if password changed
        if (oldPassword !== newPassword) {
          console.log(`Password changed, syncing credentials to Firebase Auth for: ${updatedUser.email}`);
          await syncAuthUserCredentialsForStaff(updatedUser.email, oldPassword, newPassword);
        }
        await setDoc(doc(db, 'users', updatedUser.uid), updatedUser);
      } catch (e) {
        console.error("Firestore edit operator failed:", e);
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    const oldUser = users.find(u => u.uid === uid);
    const updated = users.filter(u => u.uid !== uid);
    setUsers(updated);
    localStorage.setItem('invoice_users', JSON.stringify(updated));

    if (canWriteFirestore()) {
      try {
        if (oldUser) {
          console.log(`Deleting corresponding Firebase Auth user account for: ${oldUser.email}`);
          await deleteAuthUserForStaff(oldUser.email, oldUser.password || 'Admin@123');
        }
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.error("Firestore delete operator failed:", e);
      }
    }
  };

  const handleUpdateCurrentUser = async (updatedUser: UserProfile) => {
    // Update the database and user lists state
    await handleUpdateUser(updatedUser);
    // Explicitly update current active login operator state
    setCurrentUser(updatedUser);
    // Refresh session details cache
    localStorage.setItem('invoice_active_session', JSON.stringify(updatedUser));
  };

  // Master Catalog State Updates
  const handleUpdateProfile = async (updated: CompanyProfile) => {
    setProfile(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_profile_${currentUser.uid}`, JSON.stringify(updated));
    }
    
    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), updated);
      } catch (e) {
        console.error("Firestore save profile error", e);
      }
    }
  };

  const handleForceCloudSync = async () => {
    if (!canWriteFirestore() || !currentUser) {
      throw new Error("No active authenticated cloud session available.");
    }
    try {
      // 1. Sync Profile settings
      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), profile);

      // 2. Sync Products catalog
      for (const p of products) {
        const productWithOwner = {
          ...p,
          ownerId: currentUser.uid
        };
        await setDoc(doc(db, 'users', currentUser.uid, 'products', p.id), productWithOwner);
      }

      // 3. Sync Invoices (Records)
      for (const inv of invoices) {
        const invoiceWithOwner = {
          ...inv,
          ownerId: currentUser.uid,
          lastSyncedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', currentUser.uid, 'invoices', inv.id), invoiceWithOwner);
      }
      console.log("Forced cloud synchronization finished successfully.");
    } catch (e: any) {
      console.error("Failed to run forced cloud sync:", e);
      throw new Error(e.message || "Failed to synchronize. Secure rules or connection rejected the push.");
    }
  };

  const handleMigrateLocalData = async (localUid: string) => {
    if (!canWriteFirestore() || !currentUser) {
      throw new Error("Log in with Google or your email/password credentials to migrate data into your secure cloud profile.");
    }
    if (localUid === currentUser.uid) {
      throw new Error("Cannot migrate data from active matching account.");
    }

    try {
      // Retrieve target accounts data from localStorage
      const localProfileStr = localStorage.getItem(`invoice_profile_${localUid}`);
      const localProductsStr = localStorage.getItem(`invoice_products_${localUid}`);
      const localInvoicesStr = localStorage.getItem(`invoice_records_${localUid}`);

      let localProfile: CompanyProfile | null = null;
      let localProducts: Product[] = [];
      let localInvoices: Invoice[] = [];

      if (localProfileStr) {
        try {
          localProfile = JSON.parse(localProfileStr);
        } catch (err) {}
      }
      if (localProductsStr) {
        try {
          localProducts = JSON.parse(localProductsStr);
        } catch (err) {}
      }
      if (localInvoicesStr) {
        try {
          localInvoices = JSON.parse(localInvoicesStr);
        } catch (err) {}
      }

      // 1. If profile settings exist, merge/upload them
      if (localProfile) {
        const mergedProfile = { ...profile, ...localProfile };
        setProfile(mergedProfile);
        localStorage.setItem(`invoice_profile_${currentUser.uid}`, JSON.stringify(mergedProfile));
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), mergedProfile);
      }

      // 2. Merge local products catalog
      const updatedProducts = [...products];
      for (const lp of localProducts) {
        if (!updatedProducts.some(p => p.id === lp.id || p.name.toLowerCase().trim() === lp.name.toLowerCase().trim())) {
          updatedProducts.push(lp);
          const lpWithOwner = { ...lp, ownerId: currentUser.uid };
          await setDoc(doc(db, 'users', currentUser.uid, 'products', lp.id), lpWithOwner);
        }
      }
      setProducts(updatedProducts);
      localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(updatedProducts));

      // 3. Merge local invoices (records)
      const updatedInvoices = [...invoices];
      for (const linv of localInvoices) {
        if (!updatedInvoices.some(inv => inv.id === linv.id || inv.invoiceNumber === linv.invoiceNumber)) {
          updatedInvoices.push(linv);
          const linvWithOwner = { ...linv, ownerId: currentUser.uid, lastSyncedAt: new Date().toISOString() };
          await setDoc(doc(db, 'users', currentUser.uid, 'invoices', linv.id), linvWithOwner);
        }
      }
      setInvoices(updatedInvoices);
      localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(updatedInvoices));

      console.log(`Successfully migrated and merged manual staff user: "${localUid}" records.`);
    } catch (e: any) {
      console.error("Migration error exception:", e);
      throw new Error(e.message || "Failed to merge data. Access denied or storage read failed.");
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    const productWithOwner = { ...newProduct, ownerId: currentUser?.uid || 'default' };
    const updated = [productWithOwner, ...products];
    setProducts(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'products', newProduct.id), productWithOwner);
      } catch (e) {
        console.error("Firestore add product error", e);
      }
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const productWithOwner = { ...updatedProduct, ownerId: currentUser?.uid || 'default' };
    const updated = products.map(p => p.id === updatedProduct.id ? productWithOwner : p);
    setProducts(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'products', updatedProduct.id), productWithOwner);
      } catch (e) {
        console.error("Firestore update product error", e);
      }
    }
  };

  const moveItemToTrash = async (originalId: string, type: 'product' | 'invoice' | 'quotation' | 'category', data: any) => {
    const trashItem: TrashItem = {
      id: crypto.randomUUID(),
      type,
      itemData: data,
      deletedAt: new Date().toISOString(),
      ownerId: currentUser?.uid || 'default'
    };

    const updatedTrash = [trashItem, ...trashItems];
    setTrashItems(updatedTrash);
    if (currentUser) {
      localStorage.setItem(`invoice_trash_${currentUser.uid}`, JSON.stringify(updatedTrash));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'trash', trashItem.id), trashItem);
      } catch (e) {
        console.error("Firestore trash write error:", e);
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      await moveItemToTrash(id, 'product', productToDelete);
    }

    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'products', id));
      } catch (e) {
        console.error("Firestore delete product error", e);
      }
    }
  };

  // Invoice directory State Updates
  const handleSaveInvoice = async (newInvoice: Invoice) => {
    const invoiceWithOwner = { ...newInvoice, ownerId: currentUser?.uid || 'default' };
    const exists = invoices.some(inv => inv.id === newInvoice.id);
    const updated = exists
      ? invoices.map(inv => inv.id === newInvoice.id ? invoiceWithOwner : inv)
      : [invoiceWithOwner, ...invoices];
    setInvoices(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(updated));
    }

    // Async push to Firestore
    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'invoices', newInvoice.id), invoiceWithOwner);
      } catch (e) {
        console.error("Firestore save invoice error", e);
      }
    }

    // Sequenced Number Progress on Finalize
    const currentSequentialNumber = `${profile.invoicePrefix || 'INV'}-${String(profile.nextInvoiceNumber || 1).padStart(4, '0')}`;
    if (newInvoice.status === 'final' && newInvoice.invoiceNumber === currentSequentialNumber) {
      const nextNum = (profile.nextInvoiceNumber || 1) + 1;
      const updatedProfile = {
        ...profile,
        invoicePrefix: profile.invoicePrefix || 'INV',
        nextInvoiceNumber: nextNum,
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (invoiceToDelete) {
      await moveItemToTrash(id, 'invoice', invoiceToDelete);
    }

    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(updated));
    }
    
    if (activeDraft?.id === id) {
      setActiveDraft(null);
    }

    if (canWriteFirestore()) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'invoices', id));
      } catch (e) {
        console.error("Firestore delete invoice error", e);
      }
    }
  };

  const handleClearAllInvoices = async () => {
    setInvoices([]);
    if (currentUser) {
      localStorage.removeItem(`invoice_records_${currentUser.uid}`);
    }
    setActiveDraft(null);

    if (canWriteFirestore()) {
      try {
        // Safe iterate deletes
        for (const inv of invoices) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'invoices', inv.id));
        }
      } catch (e) {
        console.error("Firestore wipe error", e);
      }
    }
  };

  // Quotation directory State Updates
  const handleSaveQuotation = async (newQuotation: Quotation) => {
    const quotationWithOwner = { ...newQuotation, ownerId: currentUser?.uid || 'default' };
    const exists = quotations.some(q => q.id === newQuotation.id);
    const updated = exists
      ? quotations.map(q => q.id === newQuotation.id ? quotationWithOwner : q)
      : [quotationWithOwner, ...quotations];
    setQuotations(updated);
    if (currentUser) {
      localStorage.setItem(`quotation_records_${currentUser.uid}`, JSON.stringify(updated));
    }

    // Async push to Firestore
    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'quotations', newQuotation.id), quotationWithOwner);
      } catch (e) {
        console.error("Firestore save quotation error", e);
      }
    }

    // Sequenced Number Progress on Finalize
    const currentSequentialNumber = `${profile.quotationPrefix || 'QT'}-${String(profile.nextQuotationNumber || 1).padStart(4, '0')}`;
    if (newQuotation.status === 'final' && newQuotation.quotationNumber === currentSequentialNumber) {
      const nextNum = (profile.nextQuotationNumber || 1) + 1;
      const updatedProfile = {
        ...profile,
        quotationPrefix: profile.quotationPrefix || 'QT',
        nextQuotationNumber: nextNum,
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    const quotationToDelete = quotations.find(q => q.id === id);
    if (quotationToDelete) {
      await moveItemToTrash(id, 'quotation', quotationToDelete);
    }

    const updated = quotations.filter(q => q.id !== id);
    setQuotations(updated);
    if (currentUser) {
      localStorage.setItem(`quotation_records_${currentUser.uid}`, JSON.stringify(updated));
    }
    
    if (activeDraft?.id === id) {
      setActiveDraft(null);
    }

    if (canWriteFirestore()) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'quotations', id));
      } catch (e) {
        console.error("Firestore delete quotation error", e);
      }
    }
  };

  const handleClearAllQuotations = async () => {
    setQuotations([]);
    if (currentUser) {
      localStorage.removeItem(`quotation_records_${currentUser.uid}`);
    }
    setActiveDraft(null);

    if (canWriteFirestore()) {
      try {
        for (const q of quotations) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'quotations', q.id));
        }
      } catch (e) {
        console.error("Firestore clear all quotations error", e);
      }
    }
  };

  const handleAddCategory = async (newCategory: Category) => {
    const categoryWithOwner = { ...newCategory, ownerId: currentUser?.uid || 'default' };
    const updated = [...categories, categoryWithOwner];
    setCategories(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', newCategory.id), categoryWithOwner);
      } catch (e) {
        console.error("Firestore add category error", e);
      }
    }
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    const categoryWithOwner = { ...updatedCategory, ownerId: currentUser?.uid || 'default' };
    const updated = categories.map(c => c.id === updatedCategory.id ? categoryWithOwner : c);
    setCategories(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', updatedCategory.id), categoryWithOwner);
      } catch (e) {
        console.error("Firestore update category error", e);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete) {
      await moveItemToTrash(id, 'category', categoryToDelete);
    }
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    if (currentUser) {
      localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(updated));
    }

    if (canWriteFirestore()) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', id));
      } catch (e) {
        console.error("Firestore delete category error", e);
      }
    }
  };

  const handleRestoreTrashItem = async (item: TrashItem) => {
    const data = item.itemData;
    if (item.type === 'product') {
      const updated = [data, ...products];
      setProducts(updated);
      if (currentUser) {
        localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(updated));
      }
      if (canWriteFirestore()) {
        await setDoc(doc(db, 'users', currentUser.uid, 'products', data.id), data);
      }
    } else if (item.type === 'invoice') {
      const updated = [data, ...invoices];
      setInvoices(updated);
      if (currentUser) {
        localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(updated));
      }
      if (canWriteFirestore()) {
        await setDoc(doc(db, 'users', currentUser.uid, 'invoices', data.id), data);
      }
    } else if (item.type === 'quotation') {
      const updated = [data, ...quotations];
      setQuotations(updated);
      if (currentUser) {
        localStorage.setItem(`quotation_records_${currentUser.uid}`, JSON.stringify(updated));
      }
      if (canWriteFirestore()) {
        await setDoc(doc(db, 'users', currentUser.uid, 'quotations', data.id), data);
      }
    } else if (item.type === 'category') {
      const updated = [...categories, data];
      setCategories(updated);
      if (currentUser) {
        localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(updated));
      }
      if (canWriteFirestore()) {
        await setDoc(doc(db, 'users', currentUser.uid, 'categories', data.id), data);
      }
    }

    const updatedTrash = trashItems.filter(t => t.id !== item.id);
    setTrashItems(updatedTrash);
    if (currentUser) {
      localStorage.setItem(`invoice_trash_${currentUser.uid}`, JSON.stringify(updatedTrash));
    }
    if (canWriteFirestore()) {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'trash', item.id));
    }
  };

  const handleDeleteTrashItemPermanently = async (id: string) => {
    const updatedTrash = trashItems.filter(t => t.id !== id);
    setTrashItems(updatedTrash);
    if (currentUser) {
      localStorage.setItem(`invoice_trash_${currentUser.uid}`, JSON.stringify(updatedTrash));
    }
    if (canWriteFirestore()) {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'trash', id));
    }
  };

  const handleClearTrash = async () => {
    setTrashItems([]);
    if (currentUser) {
      localStorage.setItem(`invoice_trash_${currentUser.uid}`, JSON.stringify([]));
    }
    if (canWriteFirestore()) {
      for (const item of trashItems) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'trash', item.id));
      }
    }
  };

  const handleRestoreBackup = async (data: { profile: CompanyProfile; products: Product[]; invoices: Invoice[]; quotations: Quotation[]; categories: Category[] }) => {
    setProfile(data.profile);
    setProducts(data.products);
    setInvoices(data.invoices);
    setQuotations(data.quotations);
    setCategories(data.categories);

    if (currentUser) {
      localStorage.setItem(`invoice_profile_${currentUser.uid}`, JSON.stringify(data.profile));
      localStorage.setItem(`invoice_products_${currentUser.uid}`, JSON.stringify(data.products));
      localStorage.setItem(`invoice_records_${currentUser.uid}`, JSON.stringify(data.invoices));
      localStorage.setItem(`quotation_records_${currentUser.uid}`, JSON.stringify(data.quotations));
      localStorage.setItem(`invoice_categories_${currentUser.uid}`, JSON.stringify(data.categories));
    }

    if (canWriteFirestore()) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'store_details'), data.profile);
        for (const p of data.products) {
          await setDoc(doc(db, 'users', currentUser.uid, 'products', p.id), { ...p, ownerId: currentUser.uid });
        }
        for (const inv of data.invoices) {
          await setDoc(doc(db, 'users', currentUser.uid, 'invoices', inv.id), { ...inv, ownerId: currentUser.uid });
        }
        for (const q of data.quotations) {
          await setDoc(doc(db, 'users', currentUser.uid, 'quotations', q.id), { ...q, ownerId: currentUser.uid });
        }
        for (const cat of data.categories) {
          await setDoc(doc(db, 'users', currentUser.uid, 'categories', cat.id), { ...cat, ownerId: currentUser.uid });
        }
      } catch (e) {
        console.error("Firestore restore error:", e);
      }
    }
  };

  const handleConvertQuotationToInvoice = (quotation: Quotation) => {
    const nextInvoiceSeq = `${profile.invoicePrefix || 'INV'}-${String(profile.nextInvoiceNumber || 1).padStart(4, '0')}`;
    const invoiceDraft: Invoice = {
      ...quotation,
      id: crypto.randomUUID(),
      invoiceNumber: nextInvoiceSeq,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
    };
    setActiveDraft(invoiceDraft);
    setActiveTab('new-bill');
  };

  // --- RENDERING ROUTER FLOW CASES ---

  // 1. PUBLIC LINK STANDALONE CUSTOMER INVOICE VIEWPORT (?invoice=ID)
  if (publicInvoiceId) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased flex flex-col print:bg-white print:p-0">
        <header className="bg-white border-b border-slate-150 py-3.5 sticky top-0 z-40 premium-shadow no-print">
          <div className="w-full max-w-4xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-xs">
                <ReceiptText size={16} />
              </div>
              <div>
                <span className="font-display font-black text-slate-900 leading-tight block text-sm">
                  {publicInvoice ? publicInvoice.invoiceNumber : "Customer Gateway"}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                  Online Bill Verification
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {publicInvoice && (
                <>
                  <button
                    onClick={async () => {
                      setIsPdfDownloading(true);
                      await downloadInvoiceAsPdf(publicInvoice, 'invoice-document');
                      setIsPdfDownloading(false);
                    }}
                    disabled={isPdfDownloading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8"
                  >
                    <Download size={12} />
                    <span>{isPdfDownloading ? "Wait..." : "PDF"}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8"
                  >
                    <Printer size={12} />
                    <span>Print Bill</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  window.location.search = ''; // Break out of viewing mode back to portal login
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8"
              >
                <ChevronLeft size={12} />
                <span>Portal Login</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 print:p-0">
          {publicInvoice ? (
            <div className="space-y-4">
              <InvoiceDocument 
                invoice={publicInvoice} 
                profile={publicProfile || profile} 
              />
              <div className="text-center text-[10px] text-slate-400 py-2 no-print">
                This invoice has been securely verified directly through company cloud ledger channels.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center premium-shadow max-w-lg mx-auto mt-10">
              <ShieldCheck className="text-rose-500 mx-auto mb-4" size={40} />
              <h2 className="text-lg font-bold text-slate-900">Unable to Fetch Invoice</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The transaction verification ID does not map to any active register entry in local or synchronized databases. Please verify your custom URL query parameter.
              </p>
              <button
                onClick={() => { window.location.search = ''; }}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Go to Portal Login
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Waiting authentication initialized status
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center animate-spin mb-4 shadow-sm">
          <ReceiptText size={20} />
        </div>
        <span className="text-xs text-slate-400 uppercase font-mono font-bold tracking-widest animate-pulse">
          Validating Security Session...
        </span>
      </div>
    );
  }

  // 2. UNAUTHENTICATED PUBLIC STOREFRONT & LOGIN GATEWAY
  if (!currentUser) {
    if (showLogin) {
      return (
        <div className="relative">
          <button
            onClick={() => setShowLogin(false)}
            className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition duration-150 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Back to Storefront</span>
          </button>
          <AuthScreen 
            onLoginSuccess={(profile) => {
              handleLoginSuccess(profile);
              setShowLogin(false);
            }} 
            users={users} 
            initialError={redirectError}
          />
        </div>
      );
    }

    return (
      <PublicStorefront
        profile={publicStoreProfile}
        products={publicStoreProducts}
        merchantUid={publicMerchantUid}
        onOpenLogin={() => setShowLogin(true)}
        onSubmitQuote={async (quotation) => {
          // Save quotation locally to the merchant's list
          const savedQuotations = localStorage.getItem(`quotation_records_${publicMerchantUid}`);
          let records: Quotation[] = [];
          if (savedQuotations) {
            try {
              records = JSON.parse(savedQuotations);
            } catch (e) {}
          }
          const updated = [quotation, ...records];
          localStorage.setItem(`quotation_records_${publicMerchantUid}`, JSON.stringify(updated));

          // Also save to live cloud Firestore if configured
          if (isFirebaseConfigured) {
            try {
              await setDoc(doc(db, 'users', publicMerchantUid, 'quotations', quotation.id), {
                ...quotation,
                ownerId: publicMerchantUid
              });
              console.log("Live saved public quotation to Firestore:", quotation.id);
            } catch (e) {
              console.error("Failed to save public quotation to Firestore:", e);
            }
          }
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // 3. SECURE AUTHENTICATED SYSTEM PORTAL (ADMIN & STAFF ROLES)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased flex flex-col print:bg-white print:p-0">
      
      {/* Top Navigation Header Panel */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 no-print sticky top-0 z-40 premium-shadow">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Brand Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-100/50 dark:shadow-none shrink-0">
                <ReceiptText size={20} className="stroke-[2]" />
              </div>
              <div className="hidden sm:flex flex-col items-start select-none">
                <span className="font-display font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg text-left block leading-tight">
                  Invoice Generator
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase font-mono block">
                    Store Billing Hub
                  </span>
                  {isFirebaseConfigured && (
                    <span 
                      className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider font-mono shrink-0 ${
                        isCloudConnected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                      }`}
                      title={isCloudConnected ? "Continuous real-time cloud data synchronization is active." : "Local mode: metadata exists only on this device. Log out and sign in using Google or email/password credentials to link your dashboard to Firebase."}
                    >
                      <span className={`h-1 w-1 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{isCloudConnected ? "Cloud Live" : "local"}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs List */}
            <nav className="flex space-x-1 sm:space-x-2 relative z-0 overflow-x-auto no-scrollbar max-w-full sm:max-w-none py-1 select-none flex-nowrap">
              <>
                <button
                  onClick={() => setActiveTab('new-bill')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'new-bill' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'new-bill' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <CreditCard size={14} />
                    <span className="hidden sm:inline">New Bill</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'products' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'products' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <ShoppingBag size={14} />
                    <span className="hidden sm:inline">Products</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'profile' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'profile' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Store size={14} />
                    <span className="hidden sm:inline">Store Profile & Settings</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('records')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'records' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'records' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <History size={14} />
                    <span className="hidden sm:inline">Records</span>
                    {invoices.length > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                        activeTab === 'records' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {invoices.length}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('quotations')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'quotations' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'quotations' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <FileSignature size={14} />
                    <span className="hidden sm:inline">Quotations</span>
                    {quotations.length > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                        activeTab === 'quotations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {quotations.length}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'analytics' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'analytics' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <BarChart3 size={14} />
                    <span className="hidden sm:inline">Analytics</span>
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('recycle-bin')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'recycle-bin' 
                      ? 'text-white' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {activeTab === 'recycle-bin' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Recycle Bin</span>
                    {trashItems.length > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                        activeTab === 'recycle-bin' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-650 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {trashItems.length}
                      </span>
                    )}
                  </span>
                </button>
              </>

              {/* Admin Portal Tab Trigger (Only Visible to Admin Operators) */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin-portal')}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    activeTab === 'admin-portal' 
                      ? 'text-white' 
                      : 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                  }`}
                >
                  {activeTab === 'admin-portal' && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs z-0" 
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span className="hidden sm:inline">Admin Portal</span>
                  </span>
                </button>
              )}
            </nav>

            {/* Quick Profile monograms, Dark Mode toggle & Disconnect Logout Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-150 dark:border-slate-800">
              
              {/* Dark/Light Mode Interactive Switch */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-450 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={15} className="stroke-[2.5]" /> : <Moon size={15} className="stroke-[2.5]" />}
              </button>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.displayName}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono capitalize tracking-wider font-extrabold">{currentUser.role} session</span>
              </div>
              
              <button 
                onClick={handleSignOut}
                className="p-2 text-slate-405 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Disconnect operator session (Log Out)"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {isFirebaseConfigured && !isCloudConnected && (
        <div className="bg-amber-500 border-b border-amber-600 text-white px-4 py-2.5 text-center text-xs font-semibold flex flex-wrap items-center justify-center gap-2.5 no-print animate-fadeIn">
          <span>⚠️ <strong>Simulated Offline Mode:</strong> Changes are only saved in this browser. To sync invoices & operators across your phone and laptop in real-time, please sign out and sign in using Google or your registered email/password credentials.</span>
          <button 
            onClick={handleSignOut}
            className="bg-white hover:bg-slate-100 text-amber-700 font-bold px-3 py-1 rounded-xl text-[10px] transition duration-200 shadow-sm cursor-pointer border-none"
          >
            Sign Out to Authenticate
          </button>
        </div>
      )}

      {/* Main viewport Container frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 animate-fadeIn">
        <div className="print:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.16, ease: "easeInOut" }}
            >
              {activeTab === 'new-bill' && (
                <NewBillTab 
                  profile={profile} 
                  products={products} 
                  onSaveInvoice={handleSaveInvoice} 
                  onSaveQuotation={handleSaveQuotation}
                  activeDraft={activeDraft}
                  onClearActiveDraft={() => setActiveDraft(null)}
                />
              )}

              {activeTab === 'products' && (
                <ProductsTab 
                  products={products} 
                  onAddProduct={handleAddProduct} 
                  onUpdateProduct={handleUpdateProduct} 
                  onDeleteProduct={handleDeleteProduct} 
                  profile={profile}
                  onUpdateProfile={handleUpdateProfile}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {activeTab === 'profile' && currentUser && (
                <ProfileTab 
                  profile={profile} 
                  onSave={handleUpdateProfile} 
                  currentUser={currentUser}
                  onUpdateCurrentUser={handleUpdateCurrentUser}
                  isFirebaseConfigured={isFirebaseConfigured}
                  onForceCloudSync={handleForceCloudSync}
                  localUsers={users}
                  onMigrateLocalData={handleMigrateLocalData}
                  products={products}
                  invoices={invoices}
                  quotations={quotations}
                  categories={categories}
                  onRestoreBackup={handleRestoreBackup}
                />
              )}

              {activeTab === 'records' && (
                <RecordsTab 
                  invoices={invoices} 
                  profile={profile} 
                  onDeleteInvoice={handleDeleteInvoice} 
                  onClearAllInvoices={handleClearAllInvoices} 
                  onLoadDraft={(draft) => {
                    setActiveDraft(draft);
                    setActiveTab('new-bill');
                  }}
                />
              )}

              {activeTab === 'quotations' && (
                <QuotationsTab 
                  quotations={quotations} 
                  profile={profile} 
                  onDeleteQuotation={handleDeleteQuotation} 
                  onClearAllQuotations={handleClearAllQuotations} 
                  onConvertToInvoice={handleConvertQuotationToInvoice}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsTab 
                  invoices={invoices} 
                  products={products} 
                />
              )}

              {activeTab === 'recycle-bin' && (
                <RecycleBinTab 
                  trashItems={trashItems}
                  onRestore={handleRestoreTrashItem}
                  onDeletePermanently={handleDeleteTrashItemPermanently}
                  onClearAll={handleClearTrash}
                />
              )}

              {activeTab === 'admin-portal' && currentUser.role === 'admin' && (
                <AdminPortalTab
                  users={users}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  profile={profile}
                  onUpdateProfile={handleUpdateProfile}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Aesthetic layout footer */}
      <footer className="py-6 border-t border-slate-150 text-center text-xs text-slate-400 no-print">
        <p>© 2026 Invoice Generator. Active Session: <strong className="font-mono text-slate-500 font-bold">{currentUser.email}</strong> as {currentUser.role}.</p>
      </footer>

    </div>
  );
}
