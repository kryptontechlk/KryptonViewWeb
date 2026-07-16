import React, { useState } from 'react';
import { UserProfile, Product, CompanyProfile, Service, Category, ExpenseRecord, Invoice } from '../types';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  Shield, 
  Trash2, 
  Edit3, 
  Mail, 
  Check, 
  X, 
  CreditCard, 
  ChevronRight, 
  Users, 
  ShoppingBag, 
  Globe, 
  Plus, 
  Sparkles, 
  Briefcase, 
  MapPin, 
  Phone, 
  FileText, 
  Info,
  Sliders,
  CheckCircle,
  AlertCircle,
  Receipt,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wrench,
  Calendar,
  Tag,
  Percent
} from 'lucide-react';
import ProductsTab from './ProductsTab';

interface AdminPortalTabProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
  
  // Extended props for product and storefront management
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => void;
  categories: Category[];
  onAddCategory: (category: Category) => Promise<void>;
  onUpdateCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;

  // Financial and expense tracking props
  expenses?: ExpenseRecord[];
  onAddExpense?: (newExpense: ExpenseRecord) => void;
  onDeleteExpense?: (id: string) => void;
  invoices?: Invoice[];
}

export default function AdminPortalTab({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  profile,
  onUpdateProfile,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  expenses = [],
  onAddExpense = () => {},
  onDeleteExpense = () => {},
  invoices = [],
}: AdminPortalTabProps) {
  // Admin sub-tab state: 'operators' | 'products' | 'storefront' | 'finance'
  const [adminSubTab, setAdminSubTab] = useState<'operators' | 'products' | 'storefront' | 'finance'>('operators');

  // OPERATORS FORM STATE
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // User deletion secure verification modal states
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // EXPENSES AND FINANCIALS TAB STATES
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Utilities');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  // Form states for operator creation
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('basic');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'expired' | 'trialing' | 'unpaid'>('active');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('2027-12-31');

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'staff'>('staff');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPlan, setEditPlan] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('free');
  const [editSubscriptionStatus, setEditSubscriptionStatus] = useState<'active' | 'expired' | 'trialing' | 'unpaid'>('active');
  const [editExpiresAt, setEditExpiresAt] = useState('');

  // STOREFRONT DESIGNER STATE
  const [compName, setCompName] = useState(profile.name || '');
  const [compSlogan, setCompSlogan] = useState(profile.slogan || '');
  const [compAddress, setCompAddress] = useState(profile.address || '');
  const [compPhone, setCompPhone] = useState(profile.phone || '');
  const [compEmail, setCompEmail] = useState(profile.email || '');
  const [compWeb, setCompWeb] = useState(profile.website || '');
  const [compIntro, setCompIntro] = useState(profile.introduction || '');
  const [compVision, setCompVision] = useState(profile.vision || '');
  const [compMission, setCompMission] = useState(profile.mission || '');
  const [compExperience, setCompExperience] = useState(profile.experience || '');
  const [compWhatsApp, setCompWhatsApp] = useState(profile.whatsappNumber || '');
  
  // Custom Services management state
  const [services, setServices] = useState<Service[]>(profile.servicesList || []);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Settings');

  const [storefrontSavedMsg, setStorefrontSavedMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;

    const emailLower = email.trim().toLowerCase();
    
    // Check duplication
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      alert("A user with this email address already exists.");
      return;
    }

    const newUser: UserProfile = {
      uid: crypto.randomUUID(),
      email: emailLower,
      displayName: displayName.trim(),
      role,
      status,
      password: password.trim() || 'Admin@123',
      subscriptionPlan,
      subscriptionStatus,
      subscriptionExpiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddUser(newUser);

    // Reset Form
    setEmail('');
    setDisplayName('');
    setPassword('');
    setRole('staff');
    setStatus('active');
    setSubscriptionPlan('basic');
    setSubscriptionStatus('active');
    setSubscriptionExpiresAt('2027-12-31');
    setIsAdding(false);
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.uid);
    setEditName(user.displayName);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditPlan(user.subscriptionPlan || 'free');
    setEditSubscriptionStatus(user.subscriptionStatus || 'active');
    setEditExpiresAt(user.subscriptionExpiresAt || '');
  };

  const handleSaveEdit = (user: UserProfile) => {
    if (!editName.trim()) return;

    onUpdateUser({
      ...user,
      displayName: editName.trim(),
      password: editPassword.trim(),
      role: editRole,
      status: editStatus,
      subscriptionPlan: editPlan,
      subscriptionStatus: editSubscriptionStatus,
      subscriptionExpiresAt: editExpiresAt,
      updatedAt: new Date().toISOString()
    });

    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetUser) return;
    const activeAdminPassword = currentUser?.password || 'Admin@123';
    if (deletePassword === activeAdminPassword) {
      onDeleteUser(deleteTargetUser.uid);
      setDeleteTargetUser(null);
      setDeletePassword('');
      setDeleteError(null);
      setShowDeletePassword(false);
    } else {
      setDeleteError('Incorrect password: The administration password you provided does not match your active logged-in credentials.');
    }
  };

  // STOREFRONT SAVING
  const handleSaveStorefront = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedProfile: CompanyProfile = {
      ...profile,
      name: compName.trim(),
      slogan: compSlogan.trim(),
      address: compAddress.trim(),
      phone: compPhone.trim(),
      email: compEmail.trim(),
      website: compWeb.trim(),
      introduction: compIntro.trim(),
      vision: compVision.trim(),
      mission: compMission.trim(),
      experience: compExperience.trim(),
      whatsappNumber: compWhatsApp.trim(),
      servicesList: services
    };

    onUpdateProfile(updatedProfile);
    setStorefrontSavedMsg('Storefront parameters saved successfully!');
    setTimeout(() => setStorefrontSavedMsg(''), 4000);
  };

  // Dynamic Service item creation
  const handleAddService = () => {
    if (!newServiceTitle.trim()) return;
    
    const newService: Service = {
      id: crypto.randomUUID(),
      title: newServiceTitle.trim(),
      description: newServiceDesc.trim(),
      iconName: newServiceIcon,
      priceInfo: newServicePrice.trim() || undefined
    };

    const updatedServices = [...services, newService];
    setServices(updatedServices);
    
    // Clear inputs
    setNewServiceTitle('');
    setNewServiceDesc('');
    setNewServicePrice('');
    setNewServiceIcon('Settings');
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title Section */}
      <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-indigo-600 shrink-0" size={24} />
            <span>Operator & Website Control Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage operator permissions, product catalogs, and public website metadata.</p>
        </div>
      </div>

      {/* Admin sub-tabs switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 scrollbar-none overflow-x-auto pb-px">
        <button
          onClick={() => setAdminSubTab('operators')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminSubTab === 'operators'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          <Users size={14} />
          <span>Operator Credentials</span>
        </button>

        <button
          onClick={() => setAdminSubTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminSubTab === 'products'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          <ShoppingBag size={14} />
          <span>Product Catalog</span>
        </button>

        <button
          onClick={() => setAdminSubTab('storefront')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminSubTab === 'storefront'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          <Globe size={14} />
          <span>Public Website Slogan & Services</span>
        </button>

        <button
          onClick={() => setAdminSubTab('finance')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            adminSubTab === 'finance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
          }`}
        >
          <CreditCard size={14} />
          <span>Finance & Expenses</span>
        </button>
      </div>

      {/* Sub-tab Renders */}
      {adminSubTab === 'operators' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">Operator Accounts & Governance</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Manage staff access levels, reset security passwords, and track clearance.</p>
            </div>
            
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Register Operator</span>
              </button>
            )}
          </div>

          {/* Register User Drawer Form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/40 premium-shadow space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">Register New Business Operator</h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Operator Display Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjeewa Perera"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Gmail Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. operator@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  />
                </div>

                {/* Security Password */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Security Password
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pass@123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none font-mono transition"
                  />
                </div>

                {/* Privilege Level */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Privilege Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  >
                    <option value="staff">Staff Operator</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                {/* Activation Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Default Clearance
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  >
                    <option value="active">Active (Can Use App)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {/* Subscription Plan */}
                <div>
                  <label className="block text-[10px] font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-1.5">
                    Subscription Plan
                  </label>
                  <select
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  >
                    <option value="free">Free Plan</option>
                    <option value="basic">Basic Plan</option>
                    <option value="premium">Premium Pro</option>
                    <option value="enterprise">Enterprise tier</option>
                  </select>
                </div>

                {/* Subscription Status */}
                <div>
                  <label className="block text-[10px] font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-1.5">
                    Subscription Status Override
                  </label>
                  <select
                    value={subscriptionStatus}
                    onChange={(e) => setSubscriptionStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="trialing">Trialing</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>

                {/* Subscription Expiration Date */}
                <div>
                  <label className="block text-[10px] font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-1.5">
                    Subscription Expiry Date
                  </label>
                  <input
                    type="date"
                    value={subscriptionExpiresAt}
                    onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none font-mono transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-lg text-xs font-bold transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer border-none"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Operator List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden premium-shadow">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                Active Registered Credentials ({users.length})
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-black italic">
                Zero-Trust Protected
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-850 overflow-x-auto">
              {users.length === 0 ? (
                <div className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No registered operators. Create your first operator account to lock and manage access.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50/20 dark:bg-slate-800/10 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Operator Name & Email</th>
                      <th className="px-6 py-3.5">System Privilege</th>
                      <th className="px-6 py-3.5">Subscription Plan</th>
                      <th className="px-6 py-3.5">Subscription Status & Expiry</th>
                      <th className="px-6 py-3.5">Clearance Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900">
                    {users.map((user) => {
                      const isEditing = editingId === user.uid;
                      const isSelf = currentUser?.uid === user.uid || (currentUser?.email === user.email && user.email !== '');
                      const isBootstrapped = user.email.toLowerCase() === '19ict001@seu.ac.lk' || user.email.toLowerCase() === 'kosala0432@gmail.com';

                      return (
                        <tr key={user.uid} className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors ${isBootstrapped ? 'bg-indigo-50/10 dark:bg-indigo-950/10' : ''}`}>
                          {/* Name and Email */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="space-y-1.5 w-48">
                                <div>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase block mb-0.5">Operator Name</span>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold block w-full"
                                    placeholder="Display Name"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9px] text-indigo-550 dark:text-indigo-400 font-bold uppercase block mb-0.5">Operator Password</span>
                                  <input
                                    type="text"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 font-bold font-mono block w-full"
                                    placeholder="Password"
                                  />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">{user.email}</div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <div className={`h-8 w-8 rounded-full ${isBootstrapped ? 'bg-indigo-600' : 'bg-slate-250 dark:bg-slate-800'} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                                    <span>{user.displayName}</span>
                                    {isSelf && (
                                      <span className="text-[8px] bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-90">
                                        You
                                      </span>
                                    )}
                                    {isBootstrapped && (
                                      <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-90">
                                        Primary Admin
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {user.email}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded font-mono mt-0.5 inline-block">
                                    Pass: <strong className="font-bold">{user.password || 'Admin@123'}</strong>
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Privilege */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editRole}
                                disabled={isBootstrapped}
                                onChange={(e) => setEditRole(e.target.value as 'admin' | 'staff')}
                                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              >
                                <option value="staff">Staff Operator</option>
                                <option value="admin">System Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                user.role === 'admin' 
                                  ? 'bg-indigo-150 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' 
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              }`}>
                                <Shield size={10} />
                                <span>{user.role}</span>
                              </span>
                            )}
                          </td>

                          {/* Subscription Plan */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editPlan}
                                onChange={(e) => setEditPlan(e.target.value as any)}
                                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              >
                                <option value="free">Free Plan</option>
                                <option value="basic">Basic Plan</option>
                                <option value="premium">Premium Pro</option>
                                <option value="enterprise">Enterprise Tier</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                user.subscriptionPlan === 'enterprise' 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50' 
                                  : user.subscriptionPlan === 'premium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 font-extrabold dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                                  : user.subscriptionPlan === 'basic'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}>
                                {user.subscriptionPlan || 'free'}
                              </span>
                            )}
                          </td>

                          {/* Subscription Status & Expiry */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="space-y-1">
                                <select
                                  value={editSubscriptionStatus}
                                  onChange={(e) => setEditSubscriptionStatus(e.target.value as any)}
                                  className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 block w-full"
                                >
                                  <option value="active">Active</option>
                                  <option value="expired">Expired</option>
                                  <option value="trialing">Trialing</option>
                                  <option value="unpaid">Unpaid</option>
                                </select>
                                <input
                                  type="date"
                                  value={editExpiresAt}
                                  onChange={(e) => setEditExpiresAt(e.target.value)}
                                  className="px-2 py-0.5 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono block w-full"
                                />
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/40'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40'
                                }`}>
                                  {user.subscriptionStatus || 'expired'}
                                </span>
                                {user.subscriptionExpiresAt && (
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-none">
                                    Expire: {user.subscriptionExpiresAt}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Clearance Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                disabled={isBootstrapped}
                                onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                                className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            ) : (
                              <button
                                disabled={isSelf || isBootstrapped}
                                onClick={() => {
                                  onUpdateUser({
                                    ...user,
                                    status: user.status === 'active' ? 'inactive' : 'active',
                                    updatedAt: new Date().toISOString()
                                  });
                                }}
                                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider select-none outline-none ${
                                  user.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-150 hover:text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-150 hover:text-rose-900 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer'
                                } border-none disabled:opacity-75 disabled:cursor-not-allowed`}
                                title={isSelf ? "You cannot suspend your own credentials." : "Toggle Operator Clearance"}
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <UserCheck size={10} />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX size={10} />
                                    <span>Inactive</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Record Operations */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                            {isEditing ? (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleSaveEdit(user)}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[10px] flex items-center gap-1 cursor-pointer border-none"
                                  title="Commit change"
                                >
                                  <Check size={12} />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-lg transition text-[10px] flex items-center gap-1 cursor-pointer border-none"
                                  title="Discard"
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2.5">
                                <button
                                  onClick={() => startEdit(user)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none"
                                  title="Edit Details"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  disabled={isSelf || isBootstrapped}
                                  onClick={() => {
                                    setDeleteTargetUser(user);
                                    setDeletePassword('');
                                    setDeleteError(null);
                                    setShowDeletePassword(false);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800/85 transition border-none disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer"
                                  title={isSelf ? "You cannot delete your own session." : isBootstrapped ? "Master primary creator is immortal." : "Delete Operator Credentials"}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Dynamic URL Deployment Helper */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/60 p-5 rounded-2xl border border-indigo-100/50 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <CreditCard className="text-indigo-600" size={18} />
              <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Multi-User Link Deployment</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your operators can securely connect and access this billing application using their designated device browser or credentials via the application URL.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1.5 items-stretch sm:items-center">
              <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 flex justify-between items-center text-xs font-mono select-all truncate text-slate-800 dark:text-slate-350">
                {window.location.origin}
                <ChevronRight size={14} className="text-slate-400 shrink-0 select-none ml-2" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(window.location.origin);
                      setCopyStatus("Copied!");
                      setTimeout(() => setCopyStatus(null), 3000);
                    } catch (err) {
                      setCopyStatus("Manual copy required");
                      setTimeout(() => setCopyStatus(null), 4000);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-xs font-bold transition shadow-xs cursor-pointer text-center whitespace-nowrap"
                >
                  Copy App Link
                </button>
                {copyStatus && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                    copyStatus === "Copied!" ? "bg-emerald-55 text-emerald-700 font-mono animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {copyStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminSubTab === 'products' && (
        <div className="animate-fade-in bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-150 dark:border-slate-850">
          <ProductsTab
            products={products}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            categories={categories}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </div>
      )}

      {adminSubTab === 'storefront' && (
        <form onSubmit={handleSaveStorefront} className="space-y-6 animate-fade-in">
          
          {storefrontSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle size={15} />
              <span>{storefrontSavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: General Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl space-y-4 premium-shadow text-left">
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                <Briefcase size={15} className="text-indigo-600" />
                <span>General Storefront Identity</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Company / Slogan Name</label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="e.g. Biyanka Computers"
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Business Display Slogan</label>
                  <input
                    type="text"
                    value={compSlogan}
                    onChange={(e) => setCompSlogan(e.target.value)}
                    placeholder="e.g. Your premium hardware vendor in Sri Lanka"
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">WhatsApp Direct Number (No spaces)</label>
                  <input
                    type="text"
                    value={compWhatsApp}
                    onChange={(e) => setCompWhatsApp(e.target.value)}
                    placeholder="e.g. 94771234567"
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-mono outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Include country code without + or spaces. Example: 94771234567</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Hotline Phone</label>
                    <input
                      type="text"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="e.g. +94 11 234 5678"
                      className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Public Email</label>
                    <input
                      type="text"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="e.g. info@biyanka.com"
                      className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Address / Showroom location</label>
                  <input
                    type="text"
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    placeholder="e.g. No 25, Galle Road, Colombo 03"
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right: Vision, Mission & Brand Narrative */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl space-y-4 premium-shadow text-left">
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                <Sparkles size={15} className="text-indigo-600" />
                <span>Narrative & Vision Core</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Short Company Introduction</label>
                  <textarea
                    value={compIntro}
                    onChange={(e) => setCompIntro(e.target.value)}
                    placeholder="Describe your company history and experience..."
                    rows={2}
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Company Vision</label>
                  <textarea
                    value={compVision}
                    onChange={(e) => setCompVision(e.target.value)}
                    placeholder="To become Sri Lanka's leading..."
                    rows={2}
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Company Mission</label>
                  <textarea
                    value={compMission}
                    onChange={(e) => setCompMission(e.target.value)}
                    placeholder="To deliver uncompromising quality hardware..."
                    rows={2}
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience Statement</label>
                  <input
                    type="text"
                    value={compExperience}
                    onChange={(e) => setCompExperience(e.target.value)}
                    placeholder="e.g. Over 15+ years of trusted hardware sales and services"
                    className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Manage Services list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl premium-shadow space-y-4 text-left">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
              <Sliders size={15} className="text-indigo-600" />
              <span>Public Services Directory Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Add service form */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Add New Service</span>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Service Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop Repair & Upgrade"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Detail the service process, tools used, and deliverables..."
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    rows={2}
                    className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Price / Starting Guide</label>
                    <input
                      type="text"
                      placeholder="e.g. Starts from LKR 2,500"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 text-xs outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Visual Icon</label>
                    <select
                      value={newServiceIcon}
                      onChange={(e) => setNewServiceIcon(e.target.value)}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-800 dark:text-slate-100 text-xs outline-none"
                    >
                      <option value="Settings">Gear/Repair</option>
                      <option value="Briefcase">Laptop Bag</option>
                      <option value="MapPin">Location marker</option>
                      <option value="Sliders">Adjustment Controls</option>
                      <option value="Shield">Secured Shield</option>
                      <option value="Users">Multi-User</option>
                      <option value="Mail">Letter Envelope</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddService}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border-none mt-2"
                >
                  <Plus size={13} />
                  <span>Insert Service</span>
                </button>
              </div>

              {/* Services list display */}
              <div className="md:col-span-7 bg-slate-50/50 dark:bg-slate-800/10 p-4 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 max-h-72 overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Service Directory Registry ({services.length})</span>
                
                {services.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No services have been configured yet. Add services to display on your public webpage.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                            <strong className="font-bold text-slate-850 dark:text-slate-200">{service.title}</strong>
                            {service.priceInfo && (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold leading-none">
                                {service.priceInfo}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">{service.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition border-none cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm cursor-pointer border-none font-display font-bold"
            >
              Commit Web Customizations
            </button>
          </div>
        </form>
      )}

      {adminSubTab === 'finance' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Financial Summary KPI Cards */}
          {(() => {
            const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
            
            const getItemCost = (item: any) => {
              const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
              return p ? (p.purchasePrice || 0) : 0;
            };

            const totalCOGS = invoices.reduce((acc, inv) => {
              const cogs = inv.items.reduce((sum, item) => sum + (getItemCost(item) * item.quantity), 0);
              return acc + cogs;
            }, 0);

            const grossProfit = totalRevenue - totalCOGS;
            const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
            const netProfit = grossProfit - totalExpenses;
            const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
            const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Revenue Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl premium-shadow flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue</span>
                      <strong className="block text-sm font-mono font-extrabold text-slate-850 dark:text-white">
                        LKR {totalRevenue.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* COGS Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl premium-shadow flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-400">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estimated COGS</span>
                      <strong className="block text-sm font-mono font-extrabold text-slate-850 dark:text-white">
                        LKR {totalCOGS.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Gross Profit Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl premium-shadow flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gross Profit ({grossMarginPct.toFixed(1)}%)</span>
                      <strong className="block text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        LKR {grossProfit.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Operating Expenses Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl premium-shadow flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400">
                      <TrendingDown size={20} />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">General Expenses</span>
                      <strong className="block text-sm font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        LKR {totalExpenses.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Net Profit Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl premium-shadow flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-650 text-white">
                      <Shield size={20} />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-indigo-200 dark:text-indigo-450 tracking-wider">Net Business Profit ({netMarginPct.toFixed(1)}%)</span>
                      <strong className={`block text-sm font-mono font-extrabold ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                        LKR {netProfit.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Form to log new expenses */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl premium-shadow space-y-4">
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                      <Plus size={15} className="text-indigo-600" />
                      <span>Log Business Expense</span>
                    </h3>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const amt = parseFloat(expenseAmount);
                      if (!amt || isNaN(amt)) return;
                      onAddExpense({
                        id: `exp_${Date.now()}`,
                        date: expenseDate,
                        category: expenseCategory,
                        amount: amt,
                        description: expenseDescription
                      });
                      setExpenseAmount('');
                      setExpenseDescription('');
                    }} className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Expense Date *</label>
                        <div className="relative">
                          <input 
                            type="date"
                            required
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-xl bg-slate-50/10 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-400 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Category *</label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-xl bg-slate-50/10 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-400 transition"
                        >
                          <option value="Rent">Office / Workspace Rent</option>
                          <option value="Salary">Staff Salary / Compensation</option>
                          <option value="Utilities">Electricity / Water / Internet</option>
                          <option value="Marketing">Marketing & Advertising</option>
                          <option value="Software">SaaS / Subscriptions</option>
                          <option value="Logistics">Logistics & Transportation</option>
                          <option value="Equipment">Hardware / Tools / Spares</option>
                          <option value="Other">Other Expenses</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Amount (LKR) *</label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="e.g. 15000"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-xl bg-slate-50/10 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-400 transition font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Brief Description *</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="e.g. Dialogue monthly business connection"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-xl bg-slate-50/10 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-400 transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer border-none flex items-center justify-center gap-1.5"
                      >
                        <Plus size={13} />
                        <span>Log Expense Record</span>
                      </button>
                    </form>
                  </div>

                  {/* Middle Column: Expense List & Filters */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl premium-shadow space-y-4 lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                      <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Receipt size={15} className="text-indigo-600" />
                        <span>Operating Expenses Ledger ({expenses.length})</span>
                      </h3>
                      
                      {/* Search & Category Filter */}
                      <div className="flex gap-2">
                        <select
                          value={expenseCategoryFilter}
                          onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                          className="px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-750 outline-none rounded-lg bg-slate-50/50 dark:bg-slate-800 dark:text-slate-200 transition"
                        >
                          <option value="ALL">All Categories</option>
                          <option value="Rent">Rent</option>
                          <option value="Salary">Salary</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Software">Software</option>
                          <option value="Logistics">Logistics</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Expense Registry Grid List */}
                    {(() => {
                      const filtered = expenses.filter(exp => {
                        const matchCat = expenseCategoryFilter === 'ALL' || exp.category === expenseCategoryFilter;
                        const matchDesc = exp.description.toLowerCase().includes(expenseSearch.toLowerCase()) || exp.category.toLowerCase().includes(expenseSearch.toLowerCase());
                        return matchCat && matchDesc;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-1.5">
                            <Info size={28} className="mx-auto opacity-30 text-indigo-500" />
                            <p className="text-xs font-semibold">No general expenses found.</p>
                            <p className="text-[10px]">Add or modify parameters above.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                          {filtered.map(exp => (
                            <div key={exp.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 rounded-xl flex justify-between items-center gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase">
                                    {exp.category}
                                  </span>
                                  <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                    <Calendar size={9} /> {exp.date}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-750 dark:text-slate-300 mt-1 leading-snug">{exp.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                                  LKR {exp.amount.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense(exp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition border-none cursor-pointer"
                                  title="Delete expense"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Sales Profitability Breakdown Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-2xl premium-shadow text-left">
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                    <TrendingUp size={15} className="text-emerald-500" />
                    <span>Real-Time Sales Profitability Breakdown (Invoices Ledger)</span>
                  </h3>

                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-xs">No transactions logged in the system yet. Once invoices are generated, profitability calculations appear here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-450 uppercase tracking-wider font-extrabold text-[9px]">
                            <th className="py-2.5 px-3">Invoice Code</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3 text-right">Invoiced Revenue</th>
                            <th className="py-2.5 px-3 text-right">Direct Cost (COGS)</th>
                            <th className="py-2.5 px-3 text-right">Net Margin Profit</th>
                            <th className="py-2.5 px-3 text-right">Gross Margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {invoices.map(inv => {
                            const rev = inv.total || 0;
                            const cost = inv.items.reduce((sum, item) => sum + (getItemCost(item) * item.quantity), 0);
                            const profit = rev - cost;
                            const margin = rev > 0 ? (profit / rev) * 100 : 0;

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="py-3 px-3 font-mono font-bold text-slate-850 dark:text-slate-200">{inv.invoiceNumber}</td>
                                <td className="py-3 px-3 font-medium text-slate-650 dark:text-slate-300">{inv.customerName}</td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-350">LKR {rev.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">LKR {cost.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  LKR {profit.toLocaleString()}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold ${margin >= 40 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : margin >= 15 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30'}`}>
                                    {margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* SECURE OPERATOR REMOVAL MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all animate-scale-up text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <Trash2 size={16} />
                <h3 className="text-xs uppercase tracking-wider font-bold">Secure Deletion Authorisation</h3>
              </div>
              <button 
                onClick={() => {
                  setDeleteTargetUser(null);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-400 space-y-1.5">
                <p className="text-xs font-bold flex items-center gap-1.5">
                  ⚠️ Permanent Operator Purge
                </p>
                <p className="text-[11px] leading-relaxed font-sans">
                  You are about to permanently delete the operator account for <strong className="font-bold">"{deleteTargetUser.displayName}"</strong> ({deleteTargetUser.email}). Once deleted, they will be restricted from accessing this business system immediately. This action is irreversible.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Confirm Admin Password to Authorise:
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmDelete();
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 outline-none rounded-xl font-mono focus:border-rose-400 transition bg-slate-50/10 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Enter your current Admin password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 select-none bg-transparent border-none cursor-pointer"
                  >
                    {showDeletePassword ? "Hide" : "Show"}
                  </button>
                </div>
                {deleteError && (
                  <p className="text-[11px] text-rose-600 font-medium leading-relaxed mt-1 animate-pulse">
                    ❌ {deleteError}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetUser(null);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!deletePassword}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 border-none"
              >
                <Trash2 size={13} />
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
