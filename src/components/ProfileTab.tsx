import React, { useState } from 'react';
import { CompanyProfile, ExtraDetail, UserProfile, Product, Invoice, Quotation, Category } from '../types';
import { 
  Plus, 
  Trash, 
  Upload, 
  Save, 
  HelpCircle, 
  CheckCircle2, 
  RefreshCw, 
  KeyRound, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock, 
  ShieldCheck,
  Cloud,
  Database,
  Edit2,
  Download
} from 'lucide-react';

interface ProfileTabProps {
  profile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => void;
  currentUser: UserProfile;
  onUpdateCurrentUser: (updatedUser: UserProfile) => void;
  isFirebaseConfigured?: boolean;
  onForceCloudSync?: () => Promise<void>;
  localUsers?: UserProfile[];
  onMigrateLocalData?: (localUid: string) => Promise<void>;
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  categories: Category[];
  onRestoreBackup: (data: { profile: CompanyProfile; products: Product[]; invoices: Invoice[]; quotations: Quotation[]; categories: Category[] }) => Promise<void>;
}

export default function ProfileTab({ 
  profile, 
  onSave, 
  currentUser, 
  onUpdateCurrentUser,
  isFirebaseConfigured = false,
  onForceCloudSync,
  localUsers = [],
  onMigrateLocalData,
  products,
  invoices,
  quotations,
  categories,
  onRestoreBackup
}: ProfileTabProps) {
  const DEFAULT_INVOICE_CONFIG = {
    title: 'INVOICE',
    showLogo: true,
    showPhone: true,
    showEmail: true,
    showSignature: true,
    showTerms: true,
    showAcceptance: false,
    showDescriptionOfWork: false,
    defaultNotes: 'Payment is due within 14 days of invoice date. Thank you for your business!',
    preparedByTitle: 'Prepared By',
    accentColor: '#4f46e5',
  };

  const DEFAULT_QUOTATION_CONFIG = {
    title: 'QUOTATION',
    showLogo: true,
    showPhone: true,
    showEmail: true,
    showSignature: true,
    showTerms: true,
    showAcceptance: true,
    showDescriptionOfWork: true,
    defaultNotes: 'This quotation is valid for 30 days from the date of issue. Please accept and return to proceed.',
    preparedByTitle: 'Authorized Rep',
    accentColor: '#0f172a',
  };

  const [name, setName] = useState(profile.name);
  const [logo, setLogo] = useState(profile.logo);
  const [phone, setPhone] = useState(profile.phone);
  const [invoicePrefix, setInvoicePrefix] = useState(profile.invoicePrefix || 'INV');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(profile.nextInvoiceNumber || 1);
  const [quotationPrefix, setQuotationPrefix] = useState(profile.quotationPrefix || 'QT');
  const [nextQuotationNumber, setNextQuotationNumber] = useState<number>(profile.nextQuotationNumber || 1);
  const [extraDetails, setExtraDetails] = useState<ExtraDetail[]>(profile.extraDetails);
  const [signature, setSignature] = useState(profile.signature || '');
  const [signatureTitle, setSignatureTitle] = useState(profile.signatureTitle || 'Authorized Signatory');
  const [defaultTermsAndConditions, setDefaultTermsAndConditions] = useState(profile.defaultTermsAndConditions || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Invoice format customization states
  const [invTitle, setInvTitle] = useState(profile.invoiceFormatConfig?.title || DEFAULT_INVOICE_CONFIG.title);
  const [invShowLogo, setInvShowLogo] = useState(profile.invoiceFormatConfig?.showLogo !== false);
  const [invShowPhone, setInvShowPhone] = useState(profile.invoiceFormatConfig?.showPhone !== false);
  const [invShowEmail, setInvShowEmail] = useState(profile.invoiceFormatConfig?.showEmail !== false);
  const [invShowSignature, setInvShowSignature] = useState(profile.invoiceFormatConfig?.showSignature !== false);
  const [invShowTerms, setInvShowTerms] = useState(profile.invoiceFormatConfig?.showTerms !== false);
  const [invShowAcceptance, setInvShowAcceptance] = useState(profile.invoiceFormatConfig?.showAcceptance || false);
  const [invShowDescriptionOfWork, setInvShowDescriptionOfWork] = useState(profile.invoiceFormatConfig?.showDescriptionOfWork || false);
  const [invDefaultNotes, setInvDefaultNotes] = useState(profile.invoiceFormatConfig?.defaultNotes || DEFAULT_INVOICE_CONFIG.defaultNotes);
  const [invPreparedByTitle, setInvPreparedByTitle] = useState(profile.invoiceFormatConfig?.preparedByTitle || DEFAULT_INVOICE_CONFIG.preparedByTitle);
  const [invAccentColor, setInvAccentColor] = useState(profile.invoiceFormatConfig?.accentColor || DEFAULT_INVOICE_CONFIG.accentColor);

  const [invConstantFields, setInvConstantFields] = useState<ExtraDetail[]>(profile.invoiceFormatConfig?.constantFields || []);
  const [invShowPaymentMethod, setInvShowPaymentMethod] = useState(profile.invoiceFormatConfig?.showPaymentMethod || false);
  const [invPaymentBankName, setInvPaymentBankName] = useState(profile.invoiceFormatConfig?.paymentBankName || '');
  const [invPaymentAccountNo, setInvPaymentAccountNo] = useState(profile.invoiceFormatConfig?.paymentAccountNo || '');
  const [invPaymentAccountName, setInvPaymentAccountName] = useState(profile.invoiceFormatConfig?.paymentAccountName || '');
  const [invPaymentBranch, setInvPaymentBranch] = useState(profile.invoiceFormatConfig?.paymentBranch || '');
  const [invTaxRegistrationNo, setInvTaxRegistrationNo] = useState(profile.invoiceFormatConfig?.taxRegistrationNo || '');
  const [invBusinessRegNo, setInvBusinessRegNo] = useState(profile.invoiceFormatConfig?.businessRegNo || '');
  const [invWebsiteUrl, setInvWebsiteUrl] = useState(profile.invoiceFormatConfig?.websiteUrl || '');
  const [invColumnNameItem, setInvColumnNameItem] = useState(profile.invoiceFormatConfig?.columnNameItem || 'Itemized Costs');
  const [invColumnNameQty, setInvColumnNameQty] = useState(profile.invoiceFormatConfig?.columnNameQty || 'Qty');
  const [invColumnNamePrice, setInvColumnNamePrice] = useState(profile.invoiceFormatConfig?.columnNamePrice || 'Unit Price');
  const [invColumnNameAmount, setInvColumnNameAmount] = useState(profile.invoiceFormatConfig?.columnNameAmount || 'Amount');

  // Quotation format customization states
  const [qTitle, setQTitle] = useState(profile.quotationFormatConfig?.title || DEFAULT_QUOTATION_CONFIG.title);
  const [qShowLogo, setQShowLogo] = useState(profile.quotationFormatConfig?.showLogo !== false);
  const [qShowPhone, setQShowPhone] = useState(profile.quotationFormatConfig?.showPhone !== false);
  const [qShowEmail, setQShowEmail] = useState(profile.quotationFormatConfig?.showEmail !== false);
  const [qShowSignature, setQShowSignature] = useState(profile.quotationFormatConfig?.showSignature !== false);
  const [qShowTerms, setQShowTerms] = useState(profile.quotationFormatConfig?.showTerms !== false);
  const [qShowAcceptance, setQShowAcceptance] = useState(profile.quotationFormatConfig?.showAcceptance !== false);
  const [qShowDescriptionOfWork, setQShowDescriptionOfWork] = useState(profile.quotationFormatConfig?.showDescriptionOfWork !== false);
  const [qDefaultNotes, setQDefaultNotes] = useState(profile.quotationFormatConfig?.defaultNotes || DEFAULT_QUOTATION_CONFIG.defaultNotes);
  const [qPreparedByTitle, setQPreparedByTitle] = useState(profile.quotationFormatConfig?.preparedByTitle || DEFAULT_QUOTATION_CONFIG.preparedByTitle);
  const [qAccentColor, setQAccentColor] = useState(profile.quotationFormatConfig?.accentColor || DEFAULT_QUOTATION_CONFIG.accentColor);

  const [qConstantFields, setQConstantFields] = useState<ExtraDetail[]>(profile.quotationFormatConfig?.constantFields || []);
  const [qShowPaymentMethod, setQShowPaymentMethod] = useState(profile.quotationFormatConfig?.showPaymentMethod || false);
  const [qPaymentBankName, setQPaymentBankName] = useState(profile.quotationFormatConfig?.paymentBankName || '');
  const [qPaymentAccountNo, setQPaymentAccountNo] = useState(profile.quotationFormatConfig?.paymentAccountNo || '');
  const [qPaymentAccountName, setQPaymentAccountName] = useState(profile.quotationFormatConfig?.paymentAccountName || '');
  const [qPaymentBranch, setQPaymentBranch] = useState(profile.quotationFormatConfig?.paymentBranch || '');
  const [qTaxRegistrationNo, setQTaxRegistrationNo] = useState(profile.quotationFormatConfig?.taxRegistrationNo || '');
  const [qBusinessRegNo, setQBusinessRegNo] = useState(profile.quotationFormatConfig?.businessRegNo || '');
  const [qWebsiteUrl, setQWebsiteUrl] = useState(profile.quotationFormatConfig?.websiteUrl || '');
  const [qColumnNameItem, setQColumnNameItem] = useState(profile.quotationFormatConfig?.columnNameItem || 'Itemized Costs');
  const [qColumnNameQty, setQColumnNameQty] = useState(profile.quotationFormatConfig?.columnNameQty || 'Qty');
  const [qColumnNamePrice, setQColumnNamePrice] = useState(profile.quotationFormatConfig?.columnNamePrice || 'Unit Price');
  const [qColumnNameAmount, setQColumnNameAmount] = useState(profile.quotationFormatConfig?.columnNameAmount || 'Amount');

  const [newInvConstKey, setNewInvConstKey] = useState('');
  const [newInvConstVal, setNewInvConstVal] = useState('');
  const [newQConstKey, setNewQConstKey] = useState('');
  const [newQConstVal, setNewQConstVal] = useState('');

  const [activeFormatTab, setActiveFormatTab] = useState<'invoice' | 'quotation'>('invoice');

  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    setBackupLoading(true);
    try {
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        profile,
        products,
        invoices,
        quotations,
        categories
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `billing_system_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to create backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: Restoring from a backup will overwrite your current settings, products, invoices, quotations, and categories. Do you wish to proceed?")) {
      e.target.value = '';
      return;
    }

    setRestoreLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const backupData = JSON.parse(text);
        if (!backupData.profile || !Array.isArray(backupData.products)) {
          alert("Invalid backup file format. Must contain profile and product data.");
          return;
        }

        await onRestoreBackup({
          profile: backupData.profile,
          products: backupData.products,
          invoices: backupData.invoices || [],
          quotations: backupData.quotations || [],
          categories: backupData.categories || []
        });

        alert("System restore completed successfully! All database collections updated.");
      } catch (err) {
        console.error(err);
        alert("Failed to restore backup. Ensure it is a valid backup JSON file.");
      } finally {
        setRestoreLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Password alteration states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Dynamic input support for "+" more details
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Editing state for extraDetails
  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  // Cloud Synchronization States
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [selectedLocalUid, setSelectedLocalUid] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateSuccess, setMigrateSuccess] = useState(false);
  const [migrateError, setMigrateError] = useState<string | null>(null);

  const handleSyncClick = async () => {
    if (!onForceCloudSync) return;
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      await onForceCloudSync();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (e: any) {
      setSyncError(e.message || "Unknown synchronization error");
    } finally {
      setSyncing(false);
    }
  };

  const handleMigrateClick = async () => {
    if (!onMigrateLocalData || !selectedLocalUid) return;
    setMigrating(true);
    setMigrateError(null);
    setMigrateSuccess(false);
    try {
      await onMigrateLocalData(selectedLocalUid);
      setMigrateSuccess(true);
      setSelectedLocalUid('');
      setTimeout(() => setMigrateSuccess(false), 5000);
    } catch (e: any) {
      setMigrateError(e.message || "Unknown migration error");
    } finally {
      setMigrating(false);
    }
  };

  // Handle Logo Upload to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Signature Upload to Base64
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSignature(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const newDetail: ExtraDetail = {
      id: crypto.randomUUID(),
      key: newKey.trim(),
      value: newValue.trim(),
    };

    setExtraDetails([...extraDetails, newDetail]);
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveDetail = (id: string) => {
    setExtraDetails(extraDetails.filter(detail => detail.id !== id));
  };

  const handleSaveEdit = (id: string) => {
    if (!editKey.trim() || !editValue.trim()) return;
    setExtraDetails(extraDetails.map(detail => 
      detail.id === id ? { ...detail, key: editKey.trim(), value: editValue.trim() } : detail
    ));
    setEditingDetailId(null);
  };

  const handleSave = () => {
    onSave({
      name,
      logo,
      phone,
      extraDetails,
      invoicePrefix,
      nextInvoiceNumber,
      signature,
      signatureTitle,
      quotationPrefix,
      nextQuotationNumber,
      defaultTermsAndConditions,
      invoiceFormatConfig: {
        title: invTitle,
        showLogo: invShowLogo,
        showPhone: invShowPhone,
        showEmail: invShowEmail,
        showSignature: invShowSignature,
        showTerms: invShowTerms,
        showAcceptance: invShowAcceptance,
        showDescriptionOfWork: invShowDescriptionOfWork,
        defaultNotes: invDefaultNotes,
        preparedByTitle: invPreparedByTitle,
        accentColor: invAccentColor,
        constantFields: invConstantFields,
        showPaymentMethod: invShowPaymentMethod,
        paymentBankName: invPaymentBankName,
        paymentAccountNo: invPaymentAccountNo,
        paymentAccountName: invPaymentAccountName,
        paymentBranch: invPaymentBranch,
        taxRegistrationNo: invTaxRegistrationNo,
        businessRegNo: invBusinessRegNo,
        websiteUrl: invWebsiteUrl,
        columnNameItem: invColumnNameItem,
        columnNameQty: invColumnNameQty,
        columnNamePrice: invColumnNamePrice,
        columnNameAmount: invColumnNameAmount,
      },
      quotationFormatConfig: {
        title: qTitle,
        showLogo: qShowLogo,
        showPhone: qShowPhone,
        showEmail: qShowEmail,
        showSignature: qShowSignature,
        showTerms: qShowTerms,
        showAcceptance: qShowAcceptance,
        showDescriptionOfWork: qShowDescriptionOfWork,
        defaultNotes: qDefaultNotes,
        preparedByTitle: qPreparedByTitle,
        accentColor: qAccentColor,
        constantFields: qConstantFields,
        showPaymentMethod: qShowPaymentMethod,
        paymentBankName: qPaymentBankName,
        paymentAccountNo: qPaymentAccountNo,
        paymentAccountName: qPaymentAccountName,
        paymentBranch: qPaymentBranch,
        taxRegistrationNo: qTaxRegistrationNo,
        businessRegNo: qBusinessRegNo,
        websiteUrl: qWebsiteUrl,
        columnNameItem: qColumnNameItem,
        columnNameQty: qColumnNameQty,
        columnNamePrice: qColumnNamePrice,
        columnNameAmount: qColumnNameAmount,
      }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Normalize actual current password check
    const actualCurrentPassword = currentUser.password || 'Admin@123';
    
    if (currentPassword !== actualCurrentPassword) {
      setPasswordError('Authentication failed: The CURRENT password you entered is incorrect.');
      return;
    }

    const trimmedNew = newPassword.trim();
    if (!trimmedNew) {
      setPasswordError('Input mismatch: New password cannot be empty or whitespaces.');
      return;
    }

    if (trimmedNew.length < 5) {
      setPasswordError('Complexity check failed: New password must be at least 5 characters long.');
      return;
    }

    if (trimmedNew !== confirmPassword) {
      setPasswordError('Input mismatch: The confirmed password does not match your new password.');
      return;
    }

    // Call callback to commit changes to Firestore collection & Local state
    onUpdateCurrentUser({
      ...currentUser,
      password: trimmedNew
    });

    setPasswordSuccess('Success! Your account credentials have been updated.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900">Store Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Configure company header details printed directly onto generated invoices.</p>
        </div>
        <button
          onClick={handleSave}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-medium transition duration-200 premium-shadow text-sm cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 size={16} className="animate-bounce" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Editing Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6 premium-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Business / Company Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Electro Store"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>

            {/* Store Telephone Number Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Telephone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +94 11 234 5678"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Invoice Prefix Input */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Auto Invoice Prefix
                </label>
              </div>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                placeholder="e.g. INV"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>

            {/* Next Seed Invoice Number Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Next Active Invoice Sequence #
              </label>
              <input
                type="number"
                min="1"
                value={nextInvoiceNumber}
                onChange={(e) => setNextInvoiceNumber(Math.max(1, Number(e.target.value)))}
                placeholder="e.g. 1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Quotation Prefix Input */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Auto Quotation Prefix
                </label>
              </div>
              <input
                type="text"
                value={quotationPrefix}
                onChange={(e) => setQuotationPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. QT"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>

            {/* Next Seed Quotation Number Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Next Active Quotation Sequence #
              </label>
              <input
                type="number"
                min="1"
                value={nextQuotationNumber}
                onChange={(e) => setNextQuotationNumber(Math.max(1, Number(e.target.value)))}
                placeholder="e.g. 1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
              />
            </div>
          </div>

          {/* Logo Upload Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Store logo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              {logo ? (
                <div className="relative group shrink-0">
                  <img
                    src={logo}
                    alt="Store Logo Preview"
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-contain bg-white border border-slate-100 p-2"
                  />
                  <button
                    onClick={() => setLogo('')}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition shadow cursor-pointer"
                    title="Remove custom logo"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex flex-col items-center justify-center shrink-0">
                  <Upload size={24} className="stroke-[1.5]" />
                  <span className="text-[10px] uppercase font-bold mt-1 text-indigo-600">No Logo</span>
                </div>
              )}

              <div className="text-center sm:text-left flex-1 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Upload high-res company logo image</p>
                <p className="text-xs text-slate-400">Supported formats: JPEG, PNG, SVG or WebP. Stored locally.</p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition shadow-sm hover:shadow-md">
                  <Upload size={14} />
                  <span>Choose file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Signature Upload & Title Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Digital Signature / Stamp Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Signature Designation/Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Signature Label / Designation
                </label>
                <input
                  type="text"
                  value={signatureTitle}
                  onChange={(e) => setSignatureTitle(e.target.value)}
                  placeholder="e.g. Authorized Signatory, Manager, Cashier"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
                />
              </div>

              {/* Signature Image Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Signature Image / Stamp Upload
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  {signature ? (
                    <div className="relative group shrink-0">
                      <img
                        src={signature}
                        alt="Signature Preview"
                        className="h-12 w-28 rounded-xl object-contain bg-white border border-slate-100 p-1"
                      />
                      <button
                        onClick={() => setSignature('')}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition shadow cursor-pointer scale-75"
                        title="Remove signature image"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-12 w-28 rounded-xl bg-amber-50 border border-amber-100 text-amber-650 font-bold uppercase text-[9px] tracking-wider flex items-center justify-center shrink-0">
                      No Signature
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Store Signature Image</p>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-white bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold rounded-lg cursor-pointer transition shadow-sm">
                      <Upload size={12} />
                      <span>Upload Sign</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Default Terms & Conditions */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Default Terms & Conditions
            </label>
            <textarea
              value={defaultTermsAndConditions}
              onChange={(e) => setDefaultTermsAndConditions(e.target.value)}
              placeholder="e.g. 1. Payments are due within 14 days. 2. Goods sold are not returnable/exchangeable."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 resize-y"
            />
            <p className="text-[11px] text-slate-400">
              These terms and conditions will be automatically appended to both invoices and quotations.
            </p>
          </div>

          {/* Additional details list */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Custom / Additional Business Details</h3>
            
            {extraDetails.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No additional business details defined. Add some below (e.g. Email, Tax ID, Address).</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {extraDetails.map((detail) => (
                  <div key={detail.id} className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    {editingDetailId === detail.id ? (
                      <div className="flex flex-col gap-2 w-full mr-2">
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg text-xs font-bold text-indigo-650 outline-none w-full uppercase tracking-wider"
                          placeholder="Label (e.g. EMAIL)"
                        />
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg text-xs text-slate-800 outline-none w-full font-medium"
                          placeholder="Value"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{detail.key}</span>
                        <span className="text-sm font-medium text-slate-700 truncate" title={detail.value}>{detail.value}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {editingDetailId === detail.id ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(detail.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold tracking-wider uppercase transition cursor-pointer"
                            title="Save Changes"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDetailId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-bold tracking-wider uppercase transition cursor-pointer"
                            title="Cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDetailId(detail.id);
                              setEditKey(detail.key);
                              setEditValue(detail.value);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title={`Edit ${detail.key}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(detail.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Remove metadata for ${detail.key}`}
                          >
                            <Trash size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Form: "+" symbol representing add more details */}
            <form onSubmit={handleAddDetail} className="mt-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Add More Details Key-Value
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Detail Label (e.g. Email)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl text-slate-800 text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="Detail Value (e.g. hello@apex.lk)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl text-slate-800 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Detail</span>
                </button>
              </div>
            </form>
          </div>

          {/* Document Format Customization Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6 premium-shadow">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-800">Document Layout & Format Settings</h3>
              <p className="text-xs text-slate-500 mt-1">Configure layout options, headers, accent colors, and custom sections that stay consistent across all documents.</p>
            </div>

            {/* Sub Tabs: Invoice Format vs Quotation Format */}
            <div className="flex border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveFormatTab('invoice')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition ${
                  activeFormatTab === 'invoice'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Invoice Format
              </button>
              <button
                type="button"
                onClick={() => setActiveFormatTab('quotation')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition ${
                  activeFormatTab === 'quotation'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Quotation Format
              </button>
            </div>

            {activeFormatTab === 'invoice' ? (
              <div className="space-y-6 animate-fade-in">
                {/* Invoice Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Document Title Heading
                    </label>
                    <input
                      type="text"
                      value={invTitle}
                      onChange={(e) => setInvTitle(e.target.value)}
                      placeholder="e.g. INVOICE, TAX INVOICE"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Prepared By Label
                    </label>
                    <input
                      type="text"
                      value={invPreparedByTitle}
                      onChange={(e) => setInvPreparedByTitle(e.target.value)}
                      placeholder="e.g. Prepared By, Authorized Agent"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Theme Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={invAccentColor}
                        onChange={(e) => setInvAccentColor(e.target.value)}
                        className="h-10 w-12 rounded-xl border border-slate-200 cursor-pointer p-1 bg-slate-50 shrink-0"
                      />
                      <input
                        type="text"
                        value={invAccentColor}
                        onChange={(e) => setInvAccentColor(e.target.value)}
                        placeholder="#4f46e5"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Show/Hide Toggles */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Layout Elements Visibility</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowLogo}
                        onChange={(e) => setInvShowLogo(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Brand Logo</span>
                        <span className="text-[10px] text-slate-400">Shows company logo on top left</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowPhone}
                        onChange={(e) => setInvShowPhone(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Business Phone</span>
                        <span className="text-[10px] text-slate-400">Shows primary telephone number</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowEmail}
                        onChange={(e) => setInvShowEmail(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Brand Custom Details</span>
                        <span className="text-[10px] text-slate-400">Shows email, fax, custom address details</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowSignature}
                        onChange={(e) => setInvShowSignature(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Authorized Signature Block</span>
                        <span className="text-[10px] text-slate-400">Shows digital stamp & manager sign line</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowAcceptance}
                        onChange={(e) => setInvShowAcceptance(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Customer Acceptance Box</span>
                        <span className="text-[10px] text-slate-400">Shows customer physical signature field block</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={invShowDescriptionOfWork}
                        onChange={(e) => setInvShowDescriptionOfWork(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Scope/Description of Work</span>
                        <span className="text-[10px] text-slate-400">Shows detailed instructions or description table block</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Default Terms & Conditions */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Default Constant Terms & Notes (Same for all Invoices unless overwritten)
                  </label>
                  <textarea
                    rows={3}
                    value={invDefaultNotes}
                    onChange={(e) => setInvDefaultNotes(e.target.value)}
                    placeholder="e.g. Terms, bank details, return policy..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition"
                  />
                </div>

                {/* Custom Column Labels */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Custom Table Column Labels</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Item Description Header
                      </label>
                      <input
                        type="text"
                        value={invColumnNameItem}
                        onChange={(e) => setInvColumnNameItem(e.target.value)}
                        placeholder="e.g. Itemized Costs"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Quantity Header
                      </label>
                      <input
                        type="text"
                        value={invColumnNameQty}
                        onChange={(e) => setInvColumnNameQty(e.target.value)}
                        placeholder="e.g. Qty"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Unit Price Header
                      </label>
                      <input
                        type="text"
                        value={invColumnNamePrice}
                        onChange={(e) => setInvColumnNamePrice(e.target.value)}
                        placeholder="e.g. Unit Price"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Line Amount Header
                      </label>
                      <input
                        type="text"
                        value={invColumnNameAmount}
                        onChange={(e) => setInvColumnNameAmount(e.target.value)}
                        placeholder="e.g. Amount"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Numbers & Links */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Business & Legal Identifiers</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Business Registration No. (BRN)
                      </label>
                      <input
                        type="text"
                        value={invBusinessRegNo}
                        onChange={(e) => setInvBusinessRegNo(e.target.value)}
                        placeholder="e.g. PV-123456"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Tax / VAT Registration No.
                      </label>
                      <input
                        type="text"
                        value={invTaxRegistrationNo}
                        onChange={(e) => setInvTaxRegistrationNo(e.target.value)}
                        placeholder="e.g. 102938475-7000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Corporate Website Link
                      </label>
                      <input
                        type="text"
                        value={invWebsiteUrl}
                        onChange={(e) => setInvWebsiteUrl(e.target.value)}
                        placeholder="e.g. https://apex.lk"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank / Payment details */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Bank Payment Account Details</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invShowPaymentMethod}
                        onChange={(e) => setInvShowPaymentMethod(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-600">Print Bank Box</span>
                    </label>
                  </div>
                  {invShowPaymentMethod && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={invPaymentBankName}
                          onChange={(e) => setInvPaymentBankName(e.target.value)}
                          placeholder="e.g. Commercial Bank"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Number</label>
                        <input
                          type="text"
                          value={invPaymentAccountNo}
                          onChange={(e) => setInvPaymentAccountNo(e.target.value)}
                          placeholder="e.g. 1092837465"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-mono font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          value={invPaymentAccountName}
                          onChange={(e) => setInvPaymentAccountName(e.target.value)}
                          placeholder="e.g. Apex Electro Ltd"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch / Code</label>
                        <input
                          type="text"
                          value={invPaymentBranch}
                          onChange={(e) => setInvPaymentBranch(e.target.value)}
                          placeholder="e.g. Colombo 03"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Constant custom details/tabs section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Constant Custom Document Fields</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">These static details (like registration, guarantee statements, etc.) will render on all printed invoices automatically.</p>
                  </div>
                  
                  {invConstantFields.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {invConstantFields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                          <div>
                            <span className="font-bold text-indigo-600 uppercase text-[9px] block tracking-wider">{field.key}</span>
                            <span className="text-slate-700 font-semibold text-[11px]">{field.value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInvConstantFields(invConstantFields.filter(f => f.id !== field.id))}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <input
                      type="text"
                      placeholder="Label (e.g. Warranty)"
                      value={newInvConstKey}
                      onChange={(e) => setNewInvConstKey(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 5 Years Motherboard)"
                      value={newInvConstVal}
                      onChange={(e) => setNewInvConstVal(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newInvConstKey.trim() || !newInvConstVal.trim()) return;
                        setInvConstantFields([...invConstantFields, {
                          id: crypto.randomUUID(),
                          key: newInvConstKey.trim(),
                          value: newInvConstVal.trim()
                        }]);
                        setNewInvConstKey('');
                        setNewInvConstVal('');
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Quotation Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Document Title Heading
                    </label>
                    <input
                      type="text"
                      value={qTitle}
                      onChange={(e) => setQTitle(e.target.value)}
                      placeholder="e.g. QUOTATION, PRICE ESTIMATE"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Prepared By Label
                    </label>
                    <input
                      type="text"
                      value={qPreparedByTitle}
                      onChange={(e) => setQPreparedByTitle(e.target.value)}
                      placeholder="e.g. Sales Representative, Authorized Estimator"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Theme Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={qAccentColor}
                        onChange={(e) => setQAccentColor(e.target.value)}
                        className="h-10 w-12 rounded-xl border border-slate-200 cursor-pointer p-1 bg-slate-50 shrink-0"
                      />
                      <input
                        type="text"
                        value={qAccentColor}
                        onChange={(e) => setQAccentColor(e.target.value)}
                        placeholder="#0f172a"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Show/Hide Toggles */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Layout Elements Visibility</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowLogo}
                        onChange={(e) => setQShowLogo(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Brand Logo</span>
                        <span className="text-[10px] text-slate-400">Shows company logo on top left</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowPhone}
                        onChange={(e) => setQShowPhone(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Business Phone</span>
                        <span className="text-[10px] text-slate-400">Shows primary telephone number</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowEmail}
                        onChange={(e) => setQShowEmail(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Display Brand Custom Details</span>
                        <span className="text-[10px] text-slate-400">Shows email, fax, custom address details</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowSignature}
                        onChange={(e) => setQShowSignature(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Authorized Signature Block</span>
                        <span className="text-[10px] text-slate-400">Shows digital stamp & manager sign line</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowAcceptance}
                        onChange={(e) => setQShowAcceptance(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Customer Acceptance Box</span>
                        <span className="text-[10px] text-slate-400">Shows customer physical signature field block</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={qShowDescriptionOfWork}
                        onChange={(e) => setQShowDescriptionOfWork(e.target.checked)}
                        className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-700">Scope/Description of Work</span>
                        <span className="text-[10px] text-slate-400">Shows detailed instructions or description table block</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Default Terms & Conditions */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Default Constant Terms & Notes (Same for all Quotations unless overwritten)
                  </label>
                  <textarea
                    rows={3}
                    value={qDefaultNotes}
                    onChange={(e) => setQDefaultNotes(e.target.value)}
                    placeholder="e.g. Validity period, payment milestones, exclusions..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition"
                  />
                </div>

                {/* Custom Column Labels */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Custom Table Column Labels</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Item Description Header
                      </label>
                      <input
                        type="text"
                        value={qColumnNameItem}
                        onChange={(e) => setQColumnNameItem(e.target.value)}
                        placeholder="e.g. Itemized Costs"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Quantity Header
                      </label>
                      <input
                        type="text"
                        value={qColumnNameQty}
                        onChange={(e) => setQColumnNameQty(e.target.value)}
                        placeholder="e.g. Qty"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Unit Price Header
                      </label>
                      <input
                        type="text"
                        value={qColumnNamePrice}
                        onChange={(e) => setQColumnNamePrice(e.target.value)}
                        placeholder="e.g. Unit Price"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Line Amount Header
                      </label>
                      <input
                        type="text"
                        value={qColumnNameAmount}
                        onChange={(e) => setQColumnNameAmount(e.target.value)}
                        placeholder="e.g. Amount"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Numbers & Links */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Business & Legal Identifiers</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Business Registration No. (BRN)
                      </label>
                      <input
                        type="text"
                        value={qBusinessRegNo}
                        onChange={(e) => setQBusinessRegNo(e.target.value)}
                        placeholder="e.g. PV-123456"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Tax / VAT Registration No.
                      </label>
                      <input
                        type="text"
                        value={qTaxRegistrationNo}
                        onChange={(e) => setQTaxRegistrationNo(e.target.value)}
                        placeholder="e.g. 102938475-7000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Corporate Website Link
                      </label>
                      <input
                        type="text"
                        value={qWebsiteUrl}
                        onChange={(e) => setQWebsiteUrl(e.target.value)}
                        placeholder="e.g. https://apex.lk"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank / Payment details */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Bank Payment Account Details</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qShowPaymentMethod}
                        onChange={(e) => setQShowPaymentMethod(e.target.checked)}
                        className="h-3.5 w-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-600">Print Bank Box</span>
                    </label>
                  </div>
                  {qShowPaymentMethod && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-fade-in">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={qPaymentBankName}
                          onChange={(e) => setQPaymentBankName(e.target.value)}
                          placeholder="e.g. Commercial Bank"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Number</label>
                        <input
                          type="text"
                          value={qPaymentAccountNo}
                          onChange={(e) => setQPaymentAccountNo(e.target.value)}
                          placeholder="e.g. 1092837465"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-mono font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          value={qPaymentAccountName}
                          onChange={(e) => setQPaymentAccountName(e.target.value)}
                          placeholder="e.g. Apex Electro Ltd"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Branch / Code</label>
                        <input
                          type="text"
                          value={qPaymentBranch}
                          onChange={(e) => setQPaymentBranch(e.target.value)}
                          placeholder="e.g. Colombo 03"
                          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Constant custom details/tabs section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-450">Constant Custom Document Fields</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">These static details will render on all printed quotations automatically.</p>
                  </div>
                  
                  {qConstantFields.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qConstantFields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                          <div>
                            <span className="font-bold text-indigo-600 uppercase text-[9px] block tracking-wider">{field.key}</span>
                            <span className="text-slate-700 font-semibold text-[11px]">{field.value}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQConstantFields(qConstantFields.filter(f => f.id !== field.id))}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <input
                      type="text"
                      placeholder="Label (e.g. Validity)"
                      value={newQConstKey}
                      onChange={(e) => setNewQConstKey(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 60 Days Guaranteed)"
                      value={newQConstVal}
                      onChange={(e) => setNewQConstVal(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newQConstKey.trim() || !newQConstVal.trim()) return;
                        setQConstantFields([...qConstantFields, {
                          id: crypto.randomUUID(),
                          key: newQConstKey.trim(),
                          value: newQConstVal.trim()
                        }]);
                        setNewQConstKey('');
                        setNewQConstVal('');
                      }}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Security / Change Password Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-6 premium-shadow">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Lock size={15} />
              </span>
              <div>
                <h3 className="text-sm font-display font-bold text-slate-800">Operator Account Security</h3>
                <p className="text-[11px] text-slate-400">Manage password and credentials for session authorization.</p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-850 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-indigo-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      placeholder="At least 5 chars"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-indigo-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      placeholder="Retype new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-indigo-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <ShieldCheck size={13} className="text-indigo-500 shrink-0" />
                  <span>Authorized Account: <strong className="uppercase bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">{currentUser.role}</strong></span>
                </div>
                
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right side panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cloud Database & Sync Center */}
          {isFirebaseConfigured && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in no-print">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <Cloud size={16} />
                  </span>
                  <div>
                    <h3 className="text-xs font-display font-black text-slate-800 uppercase tracking-wide">Sync Center</h3>
                    <p className="text-[9px] text-slate-400 font-semibold tracking-wider font-mono">Real-time ledger</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </div>

              {/* Account summary info */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-0">
                  <span className="text-slate-500 font-semibold truncate shrink-0 mr-1">Cloud Operator:</span>
                  <span className="font-mono text-indigo-700 font-extrabold truncate max-w-[130px]" title={currentUser.email}>
                    {currentUser.email}
                  </span>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 font-semibold">Device Connection</span>
                  <span className="text-emerald-600 font-black font-mono">ONLINE</span>
                </div>
              </div>

              {/* Actions panel */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sync Operations</p>
                
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={syncing}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-xs transition duration-200 cursor-pointer text-center disabled:opacity-50"
                  title="Pushes all device modifications to Cloud Firestore database"
                >
                  <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                  <span>{syncing ? "Syncing storage..." : "Force Cloud Backup Sync"}</span>
                </button>

                {syncSuccess && (
                  <p className="text-[10px] text-emerald-600 text-center font-bold animate-pulse">
                    ✓ All cached invoices, custom products & bills synced to Firestore!
                  </p>
                )}
                {syncError && (
                  <p className="text-[10px] text-rose-600 text-center font-bold">
                    Error during cloud sync: {syncError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* JSON Backup & Restore Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in no-print">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                <Database size={16} />
              </span>
              <div>
                <h3 className="text-xs font-display font-black text-slate-800 dark:text-slate-150 uppercase tracking-wide">System Portability</h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider font-mono">JSON Backups</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Export your entire store (settings, product catalog, categories, invoices, quotations) to a single JSON backup. You can restore this file at any time to replicate your full setup.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
              >
                <Download size={13} />
                <span>Export System JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                disabled={restoreLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
              >
                <Upload size={13} />
                <span>Restore from JSON Backup</span>
              </button>

              <input
                type="file"
                ref={jsonFileInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Live Visual Preview Card */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <HelpCircle size={14} />
                <span>Live Header Preview</span>
              </div>
              
              <div className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm text-center">
                {logo ? (
                  <img 
                    src={logo} 
                    alt="Store Logo" 
                    className="mx-auto h-12 w-auto object-contain mb-3"
                    referrerPolicy="no-referrer"
                />
                ) : (
                  <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-xl font-bold text-lg mb-2">
                    {name ? name.charAt(0).toUpperCase() : 'B'}
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-800 font-display truncate">{name || "Store Name"}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{phone || "+94 7X XXX XXXX"}</p>
                
                {extraDetails.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 text-left">
                    {extraDetails.slice(0, 3).map((detail) => (
                      <div key={detail.id} className="flex justify-between items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-400 capitalize truncate max-w-[80px]">{detail.key}:</span>
                        <span className="text-slate-600 truncate max-w-[130px] font-mono">{detail.value}</span>
                      </div>
                    ))}
                    {extraDetails.length > 3 && (
                      <p className="text-[10px] text-indigo-500 text-center font-semibold pt-1">+{extraDetails.length - 3} more fields will be printed</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-400 leading-relaxed mt-6 bg-indigo-55 py-3 px-4 rounded-xl border border-indigo-100/30">
                <strong className="text-indigo-900 block mb-1">💡 Realtime Auto-Save</strong>
                These settings form the blueprint of every newly constructed invoice. Hit "Save Changes" to store the values so they remain safe even if you refresh your browser.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
