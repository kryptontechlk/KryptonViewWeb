import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CompanyProfile, Product, Invoice, InvoiceItem, InvoiceCustomField, ProductCustomField, CustomCharge, Quotation } from '../types';
import InvoiceDocument from './InvoiceDocument';
import MobileA4ScaledPreview from './MobileA4ScaledPreview';
import { downloadInvoiceAsPdf, getInvoicePdfFile } from '../utils/pdfGenerator';
import { getGmailComposeLink, formatInvoiceMessage, getWhatsAppLink, cleanSriLankanPhoneNumber } from '../utils/mailHelper';
import { 
  Plus, 
  Trash, 
  Search, 
  DollarSign, 
  Percent, 
  Truck, 
  Printer, 
  Save, 
  Undo2, 
  ShoppingCart, 
  UserPlus, 
  FileSignature, 
  FileText,
  ChevronDown, 
  Eye, 
  X, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  MessageSquare, // Share bill via WhatsApp
  CalendarRange,
  ShieldCheck
} from 'lucide-react';

interface NewBillTabProps {
  profile: CompanyProfile;
  products: Product[];
  onSaveInvoice: (invoice: Invoice) => void;
  onSaveQuotation: (quotation: Quotation) => void;
  activeDraft?: Invoice | Quotation | null;
  onClearActiveDraft?: () => void;
}

export default function NewBillTab({ 
  profile, 
  products, 
  onSaveInvoice, 
  onSaveQuotation,
  activeDraft, 
  onClearActiveDraft 
}: NewBillTabProps) {
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Unique session draft identifier
  const [currentInvoiceId, setCurrentInvoiceId] = useState('');

  // Auto-save Status States
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCustomFields, setCustomerCustomFields] = useState<InvoiceCustomField[]>([]);
  const [custFieldKey, setCustFieldKey] = useState('');
  const [custFieldValue, setCustFieldValue] = useState('');
  const [notes, setNotes] = useState('');

  // Added Billing Items list snapshotted
  const [billingItems, setBillingItems] = useState<InvoiceItem[]>([]);

  // Selected item configuration (to insert)
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Modifiers inside chosen inventory item
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [useDiscount, setUseDiscount] = useState<boolean>(false);
  const [tempCustomFields, setTempCustomFields] = useState<ProductCustomField[]>([]);

  // Invoice pricing multipliers
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [deliveryCharges, setDeliveryCharges] = useState<number>(0);
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([]);
  const [chargeName, setChargeName] = useState('');
  const [chargeAmount, setChargeAmount] = useState<number>(0);

  // Generic custom properties for overall invoice (Remarks, terms, etc.)
  const [invoiceExtraFields, setInvoiceExtraFields] = useState<InvoiceCustomField[]>([]);
  const [extraFieldKey, setExtraFieldKey] = useState('');
  const [extraFieldValue, setExtraFieldValue] = useState('');
  const [extraFieldQty, setExtraFieldQty] = useState<number>(1);

  // Dynamic Sequential References
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'final'>('final');

  // Billing & Quotation Modes
  const [billingMode, setBillingMode] = useState<'invoice' | 'quotation'>('invoice');
  const [validUntil, setValidUntil] = useState('');

  // Mobile drawer viewport layout toggle
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Show customized toast notifications
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state if loading active draft or recovering workbench
  useEffect(() => {
    if (activeDraft) {
      setCustomerName(activeDraft.customerName);
      setCustomerPhone(activeDraft.customerPhone || '');
      setCustomerWhatsapp(activeDraft.customerWhatsapp || '');
      setCustomerEmail(activeDraft.customerEmail || '');
      setCustomerAddress(activeDraft.customerAddress || '');
      setCustomerCustomFields(activeDraft.customerCustomFields || []);
      setBillingItems(activeDraft.items || []);
      setDiscountType(activeDraft.discountType || 'fixed');
      setDiscountValue(activeDraft.discountValue || 0);
      setDeliveryCharges(activeDraft.deliveryCharges || 0);
      setCustomCharges(activeDraft.customCharges || []);
      setInvoiceExtraFields(activeDraft.customFields || []);
      
      const isQuotationDraft = 'quotationNumber' in activeDraft;
      setBillingMode(isQuotationDraft ? 'quotation' : 'invoice');
      setInvoiceNumber(isQuotationDraft ? (activeDraft as Quotation).quotationNumber : (activeDraft as Invoice).invoiceNumber);
      setValidUntil(isQuotationDraft ? (activeDraft as Quotation).validUntil || '' : '');
      
      setInvoiceDate(activeDraft.date);
      setStatus(activeDraft.status || 'draft');
      setCurrentInvoiceId(activeDraft.id);
      setNotes(activeDraft.notes || '');
      triggerToast(isQuotationDraft ? `Editing Quotation: ${(activeDraft as Quotation).quotationNumber}` : `Editing Draft: ${(activeDraft as Invoice).invoiceNumber}`, 'info');
    } else {
      // Look for recovery state in localStorage first
      const savedWorkbench = localStorage.getItem('invoice_workbench_draft');
      if (savedWorkbench) {
        try {
          const recovered = JSON.parse(savedWorkbench);
          setCustomerName(recovered.customerName || '');
          setCustomerPhone(recovered.customerPhone || '');
          setCustomerWhatsapp(recovered.customerWhatsapp || '');
          setCustomerEmail(recovered.customerEmail || '');
          setCustomerAddress(recovered.customerAddress || '');
          setCustomerCustomFields(recovered.customerCustomFields || []);
          setBillingItems(recovered.items || []);
          setDiscountType(recovered.discountType || 'fixed');
          setDiscountValue(recovered.discountValue || 0);
          setDeliveryCharges(recovered.deliveryCharges || 0);
          setCustomCharges(recovered.customCharges || []);
          setInvoiceExtraFields(recovered.customFields || []);
          setInvoiceNumber(recovered.invoiceNumber || '');
          setInvoiceDate(recovered.date || '');
          setStatus(recovered.status || 'draft');
          setCurrentInvoiceId(recovered.id || crypto.randomUUID());
          setNotes(recovered.notes || '');
        } catch (e) {
          console.error("Error restoring workbench", e);
          handleResetForm();
        }
      } else {
        handleResetForm();
      }
    }
  }, [activeDraft]);

  // Sync pricing configurations on catalog selection
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.discountedPrice && selectedProduct.discountedPrice > 0) {
        setCustomPrice(selectedProduct.discountedPrice);
        setUseDiscount(true);
      } else {
        setCustomPrice(selectedProduct.price);
        setUseDiscount(false);
      }
      setSelectedQty(1);
      if (selectedProduct.colors && selectedProduct.colors.length > 0) {
        setSelectedColor(selectedProduct.colors[0]);
      } else {
        setSelectedColor('Default');
      }
      setTempCustomFields((selectedProduct.customFields || []).map(f => ({ ...f })));
    }
  }, [selectedProduct]);

  // Match products filter matching
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      price: customPrice,
      selectedColor: selectedColor,
      quantity: selectedQty,
      customFields: [...tempCustomFields],
      originalPrice: selectedProduct.price,
      discountedPrice: selectedProduct.discountedPrice,
      useDiscount: useDiscount && !!selectedProduct.discountedPrice && selectedProduct.discountedPrice > 0,
      purchasePrice: selectedProduct.purchasePrice || 0,
      isService: selectedProduct.isService || false,
    };

    setBillingItems([...billingItems, newItem]);
    
    // Reset product selection bench
    setSelectedProduct(null);
    setSearchQuery('');
    setUseDiscount(false);
    triggerToast("Item added to bill sheet", "success");
  };

  const handleRemoveItem = (id: string) => {
    setBillingItems(billingItems.filter(item => item.id !== id));
    triggerToast("Removed item row", "info");
  };

  const handleAddExtraField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFieldKey.trim() || !extraFieldValue.trim()) return;

    const newField: InvoiceCustomField = {
      id: crypto.randomUUID(),
      key: extraFieldKey.trim(),
      value: extraFieldValue.trim(),
      quantity: extraFieldQty > 0 ? extraFieldQty : 1,
    };

    setInvoiceExtraFields([...invoiceExtraFields, newField]);
    setExtraFieldKey('');
    setExtraFieldValue('');
    setExtraFieldQty(1);
    triggerToast(`Added custom ${billingMode} field`, "success");
  };

  const handleRemoveExtraField = (id: string) => {
    setInvoiceExtraFields(invoiceExtraFields.filter(f => f.id !== id));
  };

// Pricing aggregations
  const totalOriginalSubtotal = billingItems.reduce((acc, item) => {
    const orig = typeof item.originalPrice === 'number' ? item.originalPrice : item.price;
    return acc + (orig * item.quantity);
  }, 0);

  const totalProductDiscount = billingItems.reduce((acc, item) => {
    if (item.useDiscount && typeof item.originalPrice === 'number') {
      const diff = Math.max(0, item.originalPrice - item.price);
      return acc + (diff * item.quantity);
    }
    return acc;
  }, 0);

  const subtotal = billingItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * (discountValue / 100)) 
    : discountValue;
  const customChargesSum = customCharges.reduce((acc, c) => acc + c.amount, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharges + customChargesSum);

  // Compile active invoice document body
  const compileInvoice = (finalStatus: 'draft' | 'final' = 'final'): Invoice => {
    return {
      id: currentInvoiceId || activeDraft?.id || crypto.randomUUID(),
      invoiceNumber,
      date: invoiceDate,
      customerName: customerName.trim() || "Walking Customer",
      customerPhone: customerPhone.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      customerEmail: customerEmail.trim(),
      customerAddress: customerAddress.trim(),
      customerCustomFields,
      items: billingItems,
      discountType,
      discountValue,
      deliveryCharges,
      customCharges,
      customFields: invoiceExtraFields,
      subtotal,
      discountAmount,
      total: grandTotal,
      status: finalStatus,
      notes,
      totalOriginalSubtotal,
      totalProductDiscount,
    };
  };

  const compileQuotation = (finalStatus: 'draft' | 'final' = 'final'): Quotation => {
    return {
      id: currentInvoiceId || activeDraft?.id || crypto.randomUUID(),
      quotationNumber: invoiceNumber,
      date: invoiceDate,
      customerName: customerName.trim() || "Walking Customer",
      customerPhone: customerPhone.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      customerEmail: customerEmail.trim(),
      customerAddress: customerAddress.trim(),
      customerCustomFields,
      items: billingItems,
      discountType,
      discountValue,
      deliveryCharges,
      customCharges,
      customFields: invoiceExtraFields,
      subtotal,
      discountAmount,
      total: grandTotal,
      status: finalStatus,
      notes,
      validUntil: validUntil || undefined,
      totalOriginalSubtotal,
      totalProductDiscount,
    };
  };

  // Continuously persist the current state of variables to LocalStorage as a recovery backup draft
  useEffect(() => {
    const hasData = billingItems.length > 0 || customerName || customerPhone || customerWhatsapp || customerEmail || customerAddress || deliveryCharges > 0 || discountValue > 0 || invoiceExtraFields.length > 0 || customerCustomFields.length > 0 || customCharges.length > 0 || notes;
    if (hasData) {
      setAutoSaveStatus('saving');
      const workbenchState = {
        id: currentInvoiceId || crypto.randomUUID(),
        customerName,
        customerPhone,
        customerWhatsapp,
        customerEmail,
        customerAddress,
        customerCustomFields,
        items: billingItems,
        discountType,
        discountValue,
        deliveryCharges,
        customCharges,
        customFields: invoiceExtraFields,
        invoiceNumber,
        date: invoiceDate,
        status: 'draft',
        notes
      };
      localStorage.setItem('invoice_workbench_draft', JSON.stringify(workbenchState));
      
      const timer = setTimeout(() => {
        setAutoSaveStatus('saved');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeStr);
      }, 400);

      return () => clearTimeout(timer);
    } else {
      localStorage.removeItem('invoice_workbench_draft');
      setAutoSaveStatus('idle');
    }
  }, [
    customerName,
    customerPhone,
    customerWhatsapp,
    customerEmail,
    customerAddress,
    customerCustomFields,
    billingItems,
    discountType,
    discountValue,
    deliveryCharges,
    customCharges,
    invoiceExtraFields,
    invoiceNumber,
    invoiceDate,
    status,
    currentInvoiceId,
    notes
  ]);

  // Prevent stale closures inside unmount auto-saving effect
  const latestStatesRef = useRef({
    customerName,
    customerPhone,
    customerWhatsapp,
    customerEmail,
    customerAddress,
    customerCustomFields,
    billingItems,
    discountType,
    discountValue,
    deliveryCharges,
    customCharges,
    invoiceExtraFields,
    invoiceNumber,
    invoiceDate,
    status,
    currentInvoiceId,
    notes,
    onSaveInvoice
  });

  useEffect(() => {
    latestStatesRef.current = {
      customerName,
      customerPhone,
      customerWhatsapp,
      customerEmail,
      customerAddress,
      customerCustomFields,
      billingItems,
      discountType,
      discountValue,
      deliveryCharges,
      customCharges,
      invoiceExtraFields,
      invoiceNumber,
      invoiceDate,
      status,
      currentInvoiceId,
      notes,
      onSaveInvoice
    };
  }, [
    customerName,
    customerPhone,
    customerWhatsapp,
    customerEmail,
    customerAddress,
    customerCustomFields,
    billingItems,
    discountType,
    discountValue,
    deliveryCharges,
    customCharges,
    invoiceExtraFields,
    invoiceNumber,
    invoiceDate,
    status,
    currentInvoiceId,
    notes,
    onSaveInvoice
  ]);

  // Auto-save draft on tab change unmount
  useEffect(() => {
    return () => {
      const current = latestStatesRef.current;
      // Auto-save a draft into master records only if they have actually added bill items and status is not 'final'
      if (current.billingItems.length > 0 && current.status !== 'final') {
        const sub = current.billingItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const draftOriginalSubtotal = current.billingItems.reduce((acc, item) => {
          const orig = typeof item.originalPrice === 'number' ? item.originalPrice : item.price;
          return acc + (orig * item.quantity);
        }, 0);
        const draftProductDiscount = current.billingItems.reduce((acc, item) => {
          if (item.useDiscount && typeof item.originalPrice === 'number') {
            const diff = Math.max(0, item.originalPrice - item.price);
            return acc + (diff * item.quantity);
          }
          return acc;
        }, 0);
        const discAmt = current.discountType === 'percentage' 
          ? (sub * (current.discountValue / 100)) 
          : current.discountValue;
        const extraChargesSum = (current.customCharges || []).reduce((acc: number, c: any) => acc + c.amount, 0);
        const totalSum = Math.max(0, sub - discAmt + current.deliveryCharges + extraChargesSum);

        const autoSavedDraft: Invoice = {
          id: current.currentInvoiceId || crypto.randomUUID(),
          invoiceNumber: current.invoiceNumber,
          date: current.invoiceDate,
          customerName: current.customerName.trim() || "Walking Customer",
          customerPhone: current.customerPhone.trim(),
          customerWhatsapp: current.customerWhatsapp.trim(),
          customerEmail: current.customerEmail.trim(),
          customerAddress: current.customerAddress.trim(),
          customerCustomFields: current.customerCustomFields || [],
          items: current.billingItems,
          discountType: current.discountType,
          discountValue: current.discountValue,
          deliveryCharges: current.deliveryCharges,
          customCharges: current.customCharges || [],
          customFields: current.invoiceExtraFields,
          subtotal: sub,
          discountAmount: discAmt,
          total: totalSum,
          status: 'draft', // Forced to be draft saved when switching tabs
          notes: current.notes,
          totalOriginalSubtotal: draftOriginalSubtotal,
          totalProductDiscount: draftProductDiscount,
        };
        current.onSaveInvoice(autoSavedDraft);
      }
    };
  }, []);

  const handleSaveDraft = () => {
    if (billingItems.length === 0) {
      triggerToast(`Cannot save empty ${billingMode}. Add products first.`, "error");
      return;
    }
    if (billingMode === 'quotation') {
      const quotationData = compileQuotation('draft');
      onSaveQuotation(quotationData);
      triggerToast("Draft quotation saved successfully!", "success");
    } else {
      const invoiceData = compileInvoice('draft');
      onSaveInvoice(invoiceData);
      triggerToast("Draft saved successfully to Records tab!", "success");
    }
    handleResetForm();
    if (onClearActiveDraft) onClearActiveDraft();
  };

  const handleSaveFinal = () => {
    if (billingItems.length === 0) {
      triggerToast(`Cannot finalize empty ${billingMode}. Add products first.`, "error");
      return;
    }
    if (billingMode === 'quotation') {
      const quotationData = compileQuotation('final');
      onSaveQuotation(quotationData);
      triggerToast("Quotation finalized and registered successfully!", "success");
    } else {
      const invoiceData = compileInvoice('final');
      onSaveInvoice(invoiceData);
      triggerToast("Invoice finalized, sequential log registered!", "success");
    }
    handleResetForm();
    if (onClearActiveDraft) onClearActiveDraft();
  };

  const handlePrintDraft = () => {
    if (billingItems.length === 0) {
      triggerToast("Add at least one product before printing document", "error");
      return;
    }
    // Finalize first
    if (billingMode === 'quotation') {
      const quotationData = compileQuotation('final');
      onSaveQuotation(quotationData);
      triggerToast("Opening browser print layout...", "info");
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print blocked by iframe secure environment:", err);
          triggerToast("Embedded print blocked! Auto-saving and downloading PDF copy instead...", "info");
          downloadInvoiceAsPdf(quotationData as unknown as Invoice, 'invoice-document');
        }
      }, 300);
    } else {
      const invoiceData = compileInvoice('final');
      onSaveInvoice(invoiceData);
      triggerToast("Opening browser print layout... (Please open the app in a new tab if inside the AI Studio editor)", "info");
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print blocked by iframe secure environment:", err);
          triggerToast("Embedded print blocked! Auto-saving and downloading PDF copy instead...", "info");
          downloadInvoiceAsPdf(invoiceData, 'invoice-document');
        }
      }, 300);
    }
  };

  const handleDownloadPDF = async () => {
    if (billingItems.length === 0) {
      triggerToast("Draft represents an empty list. Insert items first.", "error");
      return;
    }
    // Save to database first to ensure client is documented
    let docData: Invoice;
    if (billingMode === 'quotation') {
      const quotationData = compileQuotation('final');
      onSaveQuotation(quotationData);
      docData = quotationData as unknown as Invoice;
    } else {
      const invoiceData = compileInvoice('final');
      onSaveInvoice(invoiceData);
      docData = invoiceData;
    }

    setIsPdfDownloading(true);
    triggerToast("Assembling PDF document layout, please hold...", "info");

    const success = await downloadInvoiceAsPdf(docData, 'invoice-document');
    setIsPdfDownloading(false);
    
    if (success) {
      triggerToast(`${billingMode === 'quotation' ? 'Quotation' : 'Invoice'} PDF exported cleanly!`, "success");
    } else {
      triggerToast("Failed to render PDF canvas. Please use traditional Print instead.", "error");
    }
  };

  const handleEmailInvoiceViaGmail = () => {
    if (billingItems.length === 0) {
      triggerToast("Draft represents an empty list. Insert items first.", "error");
      return;
    }
    let invoiceData: Invoice;
    const isQuote = billingMode === 'quotation';
    if (isQuote) {
      const quotationData = compileQuotation('final');
      onSaveQuotation(quotationData);
      invoiceData = quotationData as unknown as Invoice;
    } else {
      invoiceData = compileInvoice('final');
      onSaveInvoice(invoiceData);
    }

    const emailField = customerCustomFields.find(f => f.key.toLowerCase() === 'email' || f.key.toLowerCase() === 'customer email');
    const defaultEmail = customerEmail || (emailField ? emailField.value : '');

    let recipient = defaultEmail.trim();
    if (!recipient) {
      const promptedRecipient = prompt(`Please enter the customer's Email address to send this ${isQuote ? 'quotation' : 'bill'}:`);
      if (promptedRecipient === null) return;
      recipient = promptedRecipient.trim();
    }
    
    if (recipient === '') {
      triggerToast("Email recipient cannot be empty", "error");
      return;
    }

    const docNum = invoiceData.invoiceNumber || (invoiceData as any).quotationNumber || 'Document';
    const prefix = isQuote ? 'Quotation' : 'Invoice';
    const subject = `${prefix} ${docNum} from ${profile.name || 'Our Store'}`;
    const body = formatInvoiceMessage(invoiceData, profile.name, profile.phone);

    // Copy body to clipboard as a helpful backup non-blockingly
    navigator.clipboard.writeText(body)
      .then(() => triggerToast("Summary text copied to clipboard as a backup!", "success"))
      .catch(clipErr => console.warn("Could not copy backup text to clipboard automatically:", clipErr));

    const useGmail = confirm("Press OK to compose using Gmail Web interface.\nPress Cancel to use your device's Default Mail Client (Outlook, Apple Mail, etc.).");

    let link = '';
    if (useGmail) {
      link = getGmailComposeLink(invoiceData, profile, recipient.trim());
    } else {
      link = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    
    // Bypass iframe popup block by using dynamic anchor link synchronously
    try {
      const linkAnchor = document.createElement('a');
      linkAnchor.href = link;
      if (useGmail) {
        linkAnchor.target = '_blank';
        linkAnchor.rel = 'noopener noreferrer';
      }
      document.body.appendChild(linkAnchor);
      linkAnchor.click();
      document.body.removeChild(linkAnchor);
      triggerToast("Mail compose opened!", "success");
    } catch (popupErr) {
      console.error(popupErr);
      navigator.clipboard.writeText(link);
      triggerToast("Gmail open request sent!", "success");
    }

    // Compile and download PDF in background asynchronously
    downloadInvoiceAsPdf(invoiceData, 'invoice-document').catch(err => console.warn(err));
  };

  const handleShareWhatsApp = () => {
    if (billingItems.length === 0) {
      triggerToast("Draft represents an empty list. Insert items first.", "error");
      return;
    }
    let invoiceData: Invoice;
    const isQuote = billingMode === 'quotation';
    if (isQuote) {
      const quotationData = compileQuotation('final');
      onSaveQuotation(quotationData);
      invoiceData = quotationData as unknown as Invoice;
    } else {
      invoiceData = compileInvoice('final');
      onSaveInvoice(invoiceData);
    }

    const whatsappNumber = customerWhatsapp || customerPhone;
    let recipient = whatsappNumber ? whatsappNumber.trim() : '';
    if (!recipient) {
      const promptedRecipient = prompt("Please enter the customer's WhatsApp number (e.g., 0771234567 or with country code, e.g., 94771234567):");
      if (promptedRecipient === null) return;
      recipient = promptedRecipient.trim();
    }
    
    if (recipient === '') {
      triggerToast("WhatsApp number cannot be empty", "error");
      return;
    }

    const cleanedPhone = cleanSriLankanPhoneNumber(recipient);
    const message = formatInvoiceMessage(invoiceData, profile.name, profile.phone);

    // Copy to clipboard non-blockingly
    navigator.clipboard.writeText(message)
      .then(() => triggerToast("Summary copied to clipboard as backup!", "success"))
      .catch(clipErr => console.warn("Clipboard copy failed:", clipErr));

    const waLink = getWhatsAppLink(cleanedPhone, message);
    
    // Open WhatsApp instantly/synchronously
    try {
      const linkAnchor = document.createElement('a');
      linkAnchor.href = waLink;
      linkAnchor.target = '_blank';
      linkAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(linkAnchor);
      linkAnchor.click();
      document.body.removeChild(linkAnchor);
      triggerToast("Opening WhatsApp...", "success");
    } catch (popupErr) {
      console.error("WhatsApp popup failed:", popupErr);
      window.open(waLink, '_blank');
    }

    // Download PDF in the background
    downloadInvoiceAsPdf(invoiceData, 'invoice-document').catch(err => console.warn("Background PDF generation failed:", err));
  };

  const handleCancelEditing = () => {
    if (onClearActiveDraft) onClearActiveDraft();
    handleResetForm();
    triggerToast("Exited draft editing mode", "info");
  };

  const handleResetForm = (targetMode?: 'invoice' | 'quotation') => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerWhatsapp('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerCustomFields([]);
    setCustFieldKey('');
    setCustFieldValue('');
    setBillingItems([]);
    setInvoiceExtraFields([]);
    setExtraFieldQty(1);
    setDiscountValue(0);
    setDeliveryCharges(0);
    setCustomCharges([]);
    setChargeName('');
    setChargeAmount(0);
    setSelectedProduct(null);
    setSearchQuery('');
    setStatus('final');

    const activeMode = targetMode || billingMode;
    const defaultInvoiceNotes = profile.invoiceFormatConfig?.defaultNotes ?? 'Payment is due within 14 days of invoice date. Thank you for your business!';
    const defaultQuotationNotes = profile.quotationFormatConfig?.defaultNotes ?? 'This quotation is valid for 30 days from the date of issue. Please accept and return to proceed.';
    setNotes(activeMode === 'quotation' ? defaultQuotationNotes : defaultInvoiceNotes);

    if (activeMode === 'quotation') {
      const qPfx = profile.quotationPrefix || "QT";
      const qSeq = profile.nextQuotationNumber || 1;
      const seqStr = String(qSeq).padStart(4, '0');
      setInvoiceNumber(`${qPfx}-${seqStr}`);
    } else {
      const pfx = profile.invoicePrefix || "INV";
      const seqStr = String(profile.nextInvoiceNumber || 1).padStart(4, '0');
      setInvoiceNumber(`${pfx}-${seqStr}`);
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    setInvoiceDate(dateStr);

    setCurrentInvoiceId(crypto.randomUUID());
    localStorage.removeItem('invoice_workbench_draft');
    setAutoSaveStatus('idle');
    setLastSavedTime('');
  };

  const activeInvoice = billingMode === 'quotation' 
    ? compileQuotation(activeDraft ? status : 'final') as unknown as Invoice
    : compileInvoice(activeDraft ? status : 'final');

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed top-5 right-5 z-55 shadow-xl border rounded-2xl p-4 flex items-center gap-3 max-w-sm sm:max-w-md bg-white text-slate-800 border-slate-100 no-print"
          >
            {toast.type === 'success' ? (
              <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <CheckCircle2 size={18} />
              </span>
            ) : toast.type === 'error' ? (
              <span className="p-1 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <AlertCircle size={18} />
              </span>
            ) : (
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Eye size={18} />
              </span>
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Mode Indicator Header Alert */}
      {activeDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs animate-fade-in no-print">
          <div className="flex items-start gap-2">
            <span className="p-1 bg-amber-100 text-amber-800 rounded-lg mt-0.5">
              <FileSignature size={15} />
            </span>
            <div>
              <strong className="font-bold">Active Editing Context Mode</strong>
              <p className="mt-0.5">
                You are modifying a historically loaded {'quotationNumber' in activeDraft ? 'quotation' : 'invoice'} record:{' '}
                <strong className="font-mono">
                  {'quotationNumber' in activeDraft 
                    ? (activeDraft as Quotation).quotationNumber 
                    : (activeDraft as Invoice).invoiceNumber
                  }
                </strong>. Updates will replace the original slot.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleCancelEditing}
            className="w-full sm:w-auto px-4 py-2 bg-amber-800 text-white rounded-xl font-bold hover:bg-amber-900 transition shrink-0 cursor-pointer text-center"
          >
            Cancel and Discard edit
          </button>
        </div>
      )}

      {/* Upper Grid Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print border-b border-slate-150 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-display font-extrabold text-slate-900">{billingMode === 'quotation' ? 'New Quotation Estimation' : 'New Bill Generation'}</h2>
            {autoSaveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-extrabold rounded-full font-mono uppercase tracking-wider animate-fade-in select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-saved {lastSavedTime && `at ${lastSavedTime}`}
              </span>
            )}
            {autoSaveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[10px] font-extrabold rounded-full font-mono uppercase tracking-wider animate-pulse select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Saving...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-450 mt-0.5">Select items, customize colors, add custom properties, and download exact A4 PDFs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
          <button
            onClick={handleResetForm}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 text-xs transition cursor-pointer h-9"
          >
            <Undo2 size={13} />
            <span className="hidden sm:inline">Clear Workbench</span>
            <span className="sm:hidden">Clear</span>
          </button>
          
          <button
            onClick={handleSaveDraft}
            disabled={billingItems.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            title="Saves this document as a draft which can be reloaded to revise later"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Draft</span>
          </button>

          <button
            onClick={handleSaveFinal}
            disabled={billingItems.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            title="Finalizes and locks billing data block"
          >
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Save Final Quotation' : 'Save Final Bill'}</span>
            <span className="sm:hidden">Save Final</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={billingItems.length === 0 || isPdfDownloading}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
          >
            <Download size={13} />
            <span>{isPdfDownloading ? "PDF..." : "PDF"}</span>
          </button>

          <button
            onClick={handleEmailInvoiceViaGmail}
            disabled={billingItems.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            title="Compose and send this bill directly to customer's Gmail"
          >
            <Mail size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Email Quotation' : 'Email Bill'}</span>
            <span className="sm:hidden">Email</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            disabled={billingItems.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            title="Send this invoice and access link to customer's WhatsApp"
          >
            <MessageSquare size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">{billingMode === 'quotation' ? 'WhatsApp Quotation' : 'WhatsApp Bill'}</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>

          <button
            onClick={handlePrintDraft}
            disabled={billingItems.length === 0}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Print Quotation' : 'Print Invoice'}</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* Billing Mode Segmented Selector */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-150 p-4 sm:p-5 premium-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-55 text-indigo-600 rounded-xl">
            <CalendarRange size={18} />
          </span>
          <div>
            <h3 className="text-sm font-display font-black text-slate-850">Document Type Selection</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Toggle between generating sequential store invoices or pre-sales estimations.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
          {billingMode === 'quotation' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-3 rounded-xl w-full sm:w-auto">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono shrink-0">
                Valid Until:
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-full sm:w-32"
              />
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl items-center w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setBillingMode('invoice');
                // Switch to invoice sequence
                const pfx = profile.invoicePrefix || "INV";
                const seqStr = String(profile.nextInvoiceNumber || 1).padStart(4, '0');
                setInvoiceNumber(`${pfx}-${seqStr}`);
                
                // Toggle default notes if unaltered
                const defaultInvoiceNotes = profile.invoiceFormatConfig?.defaultNotes ?? 'Payment is due within 14 days of invoice date. Thank you for your business!';
                const defaultQuotationNotes = profile.quotationFormatConfig?.defaultNotes ?? 'This quotation is valid for 30 days from the date of issue. Please accept and return to proceed.';
                if (!notes || notes === defaultQuotationNotes) {
                  setNotes(defaultInvoiceNotes);
                }
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                billingMode === 'invoice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice
            </button>
            <button
              type="button"
              onClick={() => {
                setBillingMode('quotation');
                // Switch to quotation sequence
                const qPfx = profile.quotationPrefix || "QT";
                const qSeq = profile.nextQuotationNumber || 1;
                const seqStr = String(qSeq).padStart(4, '0');
                setInvoiceNumber(`${qPfx}-${seqStr}`);

                // Toggle default notes if unaltered
                const defaultInvoiceNotes = profile.invoiceFormatConfig?.defaultNotes ?? 'Payment is due within 14 days of invoice date. Thank you for your business!';
                const defaultQuotationNotes = profile.quotationFormatConfig?.defaultNotes ?? 'This quotation is valid for 30 days from the date of issue. Please accept and return to proceed.';
                if (!notes || notes === defaultInvoiceNotes) {
                  setNotes(defaultQuotationNotes);
                }
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                billingMode === 'quotation'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotation
            </button>
          </div>
        </div>
      </div>

      {/* Main split dashboard block */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start print:block print:w-full print:p-0 print:m-0">
        
        {/* Left hand side: form inputs */}
        <div className="xl:col-span-6 space-y-4 no-print">
          
          {/* Customer dossier information */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-55 flex-wrap">
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <UserPlus size={14} />
              </span>
              <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">Customer Dossier</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Perera"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition h-9.5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +94 77 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition h-9.5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 94771234567"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition h-9.5"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billing Address
              </label>
              <textarea
                placeholder="e.g. 45/A Highlevel Rd, Colombo 06"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none resize-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Customer Email
              </label>
              <input
                type="email"
                placeholder="e.g. customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition h-9.5"
              />
            </div>

            {/* Customer Custom Fields Input Area */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2 mt-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Custom Customer Fields
              </span>
              
              {customerCustomFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  {customerCustomFields.map((field) => (
                    <div key={field.id} className="flex justify-between items-center text-[10px] bg-indigo-50/45 border border-indigo-100/50 px-2.5 py-1.5 rounded-lg">
                      <div className="min-w-0 pr-1.5">
                        <span className="font-extrabold text-indigo-600 uppercase text-[8px] block tracking-wide">{field.key}</span>
                        <span className="text-slate-700 truncate font-semibold block">{field.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomerCustomFields(customerCustomFields.filter(f => f.id !== field.id))}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Remove custom field"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Field (e.g. Email)"
                  value={custFieldKey}
                  onChange={(e) => setCustFieldKey(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-slate-800 text-xs outline-none h-8"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. abc@mail.com)"
                  value={custFieldValue}
                  onChange={(e) => setCustFieldValue(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-slate-800 text-xs outline-none h-8"
                />
                <button
                  type="button"
                  disabled={!custFieldKey.trim() || !custFieldValue.trim()}
                  onClick={() => {
                    const newField = {
                      id: crypto.randomUUID(),
                      key: custFieldKey.trim(),
                      value: custFieldValue.trim()
                    };
                    setCustomerCustomFields([...customerCustomFields, newField]);
                    setCustFieldKey('');
                    setCustFieldValue('');
                    triggerToast(`Added ${newField.key}`, "success");
                  }}
                  className="px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer h-8 shrink-0"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search catalog & Select Product */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-55 flex-wrap">
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <ShoppingCart size={14} />
              </span>
              <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">Select Invoice Product</h3>
            </div>

            {/* Product selection autocomplete search list */}
            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search & Select Product From Inventory
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={products.length === 0 ? "⚠️ Inventory is empty. Add products in Products tab first." : "Type product code or name to search catalog..."}
                  value={searchQuery}
                  disabled={products.length === 0}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  className="w-full pl-9 pr-9 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition disabled:opacity-50 h-9.5"
                />
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={products.length === 0}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Toggleable selector list container */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-30 left-0 right-0 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl mt-1 divide-y divide-slate-50">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(p);
                        setSearchQuery(`${p.name} (${p.code})`);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/45 transition duration-150 flex items-center justify-between text-xs h-10"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 block truncate">{p.name}</span>
                        <span className="text-slate-450 font-mono text-[8px] uppercase inline-block">Code: {p.code}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] shrink-0">
                        LKR {p.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-slate-400">Can't find a product in catalog?</span>
              <button
                type="button"
                onClick={() => {
                  const customName = searchQuery.trim() || "Custom Item / Charge";
                  setSelectedProduct({
                    id: 'custom-' + Date.now(),
                    name: customName,
                    code: 'CUSTOM',
                    price: 0,
                    colors: [],
                    customFields: []
                  });
                  setCustomPrice(0);
                  setSelectedQty(1);
                  setTempCustomFields([]);
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={10} className="stroke-[3]" />
                <span>Add Custom Line Item</span>
              </button>
            </div>

            {/* Override product settings block */}
            {selectedProduct && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-fade-in text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50">
                  <div className="text-xs">
                    <span className="text-[9px] text-slate-400 uppercase font-mono mr-1">Snapshot Config:</span>
                    <strong className="text-indigo-800 font-bold">{selectedProduct.name}</strong>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedProduct(null)} 
                    className="text-[9px] text-rose-500 hover:text-rose-600 font-bold uppercase transition"
                  >
                    Cancel
                  </button>
                </div>

                {selectedProduct.id.startsWith('custom-') && (
                  <div className="animate-fade-in">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Custom Item Description / Name
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.name}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none text-slate-700 h-9"
                    />
                  </div>
                )}

                {selectedProduct.discountedPrice && selectedProduct.discountedPrice > 0 ? (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div>
                      <span className="block text-[10px] font-extrabold text-emerald-800 dark:text-emerald-450 uppercase tracking-wider">Catalog Discount Available</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Original: <span className="line-through font-mono">LKR {selectedProduct.price.toFixed(2)}</span> → Discounted: <span className="font-extrabold font-mono">LKR {selectedProduct.discountedPrice.toFixed(2)}</span>
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                      <input 
                        type="checkbox" 
                        checked={useDiscount}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseDiscount(checked);
                          setCustomPrice(checked ? selectedProduct.discountedPrice! : selectedProduct.price);
                        }}
                        className="rounded border-emerald-300 text-emerald-650 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">Apply</span>
                    </label>
                  </div>
                ) : null}

                <div className={`grid grid-cols-1 ${selectedProduct.colors && selectedProduct.colors.length > 0 && selectedProduct.colors.some(c => c && !['default', 'none', 'default/none', 'default / none', 'default / none'].includes(c.toLowerCase().trim())) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5`}>
                  {/* Color choose input */}
                  {selectedProduct.colors && selectedProduct.colors.length > 0 && selectedProduct.colors.some(c => c && !['default', 'none', 'default/none', 'default / none', 'default / none'].includes(c.toLowerCase().trim())) && (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Choose Color / Type
                      </label>
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none text-slate-700 h-9"
                      >
                        {selectedProduct.colors.map((color, index) => (
                          <option key={index} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity input spinner target */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-center font-bold outline-none text-slate-800 h-9"
                    />
                  </div>

                  {/* Override Unit Price explicitly */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Unit Price Override LKR
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCustomPrice(isNaN(val) ? 0 : Math.max(0, Math.round(val * 100) / 100));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono text-right outline-none text-slate-800 h-9"
                    />
                  </div>
                </div>

                {/* Sub Product custom override attributes */}
                {tempCustomFields.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/50 space-y-1.5">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Product Custom attributes values:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {tempCustomFields.map((field, idx) => (
                        <div key={field.id} className="flex flex-col bg-white border border-slate-150 rounded-xl px-2.5 py-1.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{field.name}</span>
                          <input
                            type="text"
                            value={field.value}
                            placeholder={`Enter ${field.name}...`}
                            onChange={(e) => {
                              const updated = [...tempCustomFields];
                              updated[idx].value = e.target.value;
                              setTempCustomFields(updated);
                            }}
                            className="bg-transparent border-none p-0 text-xs font-semibold text-slate-700 outline-none mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full mt-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm h-9.5"
                >
                  <Plus size={13} />
                  <span>Push to Bill line items</span>
                </button>
              </div>
            )}
          </div>

          {/* List of bill items added */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
            <h3 className="text-xs font-display font-bold text-slate-800 border-b border-slate-100 pb-2.5 uppercase tracking-wider text-indigo-650">Added Invoice Line Items</h3>
            
            {billingItems.length === 0 ? (
              <div className="py-6 text-center text-slate-400 italic text-xs">
                Your sandbox workbench is empty. Choose products above to compile them onto the bill sheet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {billingItems.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800 truncate">{item.productName}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-mono rounded font-bold text-slate-500 uppercase">{item.productCode}</span>
                        {item.selectedColor && 
                         !['default/none', 'default / none', 'default', 'none', ''].includes(item.selectedColor.trim().toLowerCase()) && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-[8px] font-semibold rounded text-indigo-700">{item.selectedColor}</span>
                        )}
                      </div>
                      
                      {(item.customFields || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(item.customFields || []).map((f) => f.value && (
                            <span key={f.id} className="text-[9px] font-bold text-slate-400 uppercase">
                              {f.name}: <span className="text-slate-650 font-sans font-medium hover:text-slate-800">{f.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {item.quantity} x LKR {item.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-slate-800 whitespace-nowrap">
                        LKR {(item.price * item.quantity).toFixed(2)}
                      </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center"
                          title="Remove row item"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {billingItems.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 border border-slate-800 animate-fade-in no-print">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-250 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-400" />
                    <span>Business Margin Analyzer (Admin Only)</span>
                  </span>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Secured
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <span className="block text-[9.5px] text-slate-400 uppercase tracking-wider mb-0.5">Estimated Cost</span>
                    <span className="text-[14px] font-mono font-extrabold text-slate-200">
                      LKR {billingItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] text-slate-400 uppercase tracking-wider mb-0.5">Projected Net Profit</span>
                    <span className={`text-[14px] font-mono font-extrabold ${grandTotal - billingItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      LKR {(grandTotal - billingItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[9.5px] text-slate-400 uppercase">Gross Profit Margin:</span>
                  <span className={`text-xs font-mono font-extrabold ${grandTotal - billingItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(grandTotal > 0 ? ((grandTotal - billingItems.reduce((acc, item) => acc + ((item.purchasePrice || 0) * item.quantity), 0)) / grandTotal) * 100 : 0).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-relaxed italic">
                  Note: This financial margin analysis is strictly displayed within your secure operator portal. It will never be rendered on any customer PDF outputs, sharing links, or printouts.
                </p>
              </div>
            )}

            {/* Apply Multiplier Discount */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-2.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Discount Multiplier (%) or (LKR)
              </label>
              <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-1 px-2 text-center text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition h-7.5 ${discountType === 'percentage' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Percent size={11} />
                  <span>Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('fixed');
                    setDiscountValue(0);
                  }}
                  className={`flex-1 py-1 px-2 text-center text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition h-7.5 ${discountType === 'fixed' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <DollarSign size={11} />
                  <span>Fixed Value</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder={discountType === 'percentage' ? "Discount % (e.g. 10)" : "Discount Value LKR (e.g. 500)"}
                  value={discountValue || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDiscountValue(isNaN(val) ? 0 : Math.max(0, Math.round(val * 100) / 100));
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-800 text-xs font-mono outline-none h-9"
                />
                <span className="absolute right-3.5 top-2.5 text-[9px] font-extrabold text-slate-400 uppercase">
                  {discountType === 'percentage' ? '%' : 'LKR'}
                </span>
              </div>
            </div>

            {/* Charges and Fees Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Charges & Fees (LKR)
              </label>
              
              {/* Standard Delivery charges input */}
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  Standard Delivery / Transportation
                </span>
                <div className="relative">
                  <Truck size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder="Delivery Charges (e.g. 350)"
                    value={deliveryCharges || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDeliveryCharges(isNaN(val) ? 0 : Math.max(0, Math.round(val * 100) / 100));
                    }}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs font-mono outline-none transition h-9"
                  />
                </div>
              </div>

              {/* Dynamic Custom Charges list */}
              {customCharges.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="block text-[8.5px] font-bold text-indigo-500 uppercase tracking-wider mb-1">
                    Other Added Charges
                  </span>
                  <div className="space-y-1.5">
                    {customCharges.map((charge) => (
                      <div key={charge.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
                        <div className="min-w-0 flex-1 flex justify-between pr-2">
                          <span className="font-bold text-slate-705 truncate text-[10px]">{charge.name}</span>
                          <span className="font-mono font-bold text-indigo-650 text-[10px]">LKR {charge.amount.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomCharges(customCharges.filter(c => c.id !== charge.id))}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Custom Charge Form */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                  Add Additional Fee (e.g. VAT, service tax)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Fee Name (e.g. VAT 15%)"
                    value={chargeName}
                    onChange={(e) => setChargeName(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-slate-800 text-xs outline-none h-8"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Amt LKR"
                    value={chargeAmount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setChargeAmount(isNaN(val) ? 0 : Math.max(0, Math.round(val * 100) / 100));
                    }}
                    className="w-36 px-2 py-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-slate-800 text-xs font-mono outline-none h-8"
                  />
                  <button
                    type="button"
                    disabled={!chargeName.trim() || !chargeAmount}
                    onClick={() => {
                      const newCharge = {
                        id: crypto.randomUUID(),
                        name: chargeName.trim(),
                        amount: chargeAmount
                      };
                      setCustomCharges([...customCharges, newCharge]);
                      setChargeName('');
                      setChargeAmount(0);
                      triggerToast(`Added ${newCharge.name}`, "success");
                    }}
                    className="px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-450 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer h-8 shrink-0"
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

                        {/* Add Custom Invoice / Quotation Fields */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50 flex-wrap">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <FileSignature size={13} />
                </span>
                <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">
                  {billingMode === 'quotation' ? 'Add Custom Quotation Fields' : 'Add Custom Invoice Fields'}
                </h3>
              </div>

              {invoiceExtraFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
                  {invoiceExtraFields.map((field) => (
                    <div key={field.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
                      <div className="min-w-0 pr-1.5">
                        <span className="font-bold text-indigo-600 uppercase text-[8px] block tracking-wider">{field.key}</span>
                        <span className="text-slate-700 truncate block font-semibold text-[10px]">
                          {field.value} {field.quantity && field.quantity > 1 ? `(Qty: ${field.quantity})` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraField(field.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddExtraField} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Label (e.g. Serial #)"
                  value={extraFieldKey}
                  onChange={(e) => setExtraFieldKey(e.target.value)}
                  className="flex-2 min-w-0 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none h-9"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 98765)"
                  value={extraFieldValue}
                  onChange={(e) => setExtraFieldValue(e.target.value)}
                  className="flex-2 min-w-0 px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none h-9"
                />
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 h-9 shrink-0 w-24">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={extraFieldQty}
                    onChange={(e) => setExtraFieldQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent text-xs text-center font-bold text-slate-800 outline-none p-0 border-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!extraFieldKey.trim() || !extraFieldValue.trim()}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer h-9 shrink-0"
                >
                  <Plus size={13} />
                  <span>Add Field</span>
                </button>
              </form>
            </div>

            {/* Notes, Payment and Warranty Terms */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-4 sm:p-5 premium-shadow space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50 flex-wrap">
                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <FileText size={13} />
                </span>
                <h3 className="text-xs font-display font-bold text-slate-800 uppercase tracking-wider">
                  {billingMode === 'quotation' ? 'Quotation Notes & Terms' : 'Invoice Notes & Terms'}
                </h3>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {billingMode === 'quotation' ? 'Validity period, conditions, or quotation notes' : 'Payment Instructions, Warranty details, or Custom Terms'}
                </label>
                <textarea
                  placeholder={billingMode === 'quotation' ? "e.g. Price valid for 30 days. 50% advance to start work, 50% on completion." : "e.g. Please send payments to Bank of Ceylon, Acc: 123456789. Goods once sold are not refundable / warranty covers 12 months."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition resize-y font-medium leading-relaxed placeholder:text-slate-400"
                />
              </div>
            </div>

          </div>

          {/* Desktop Sidebar: Sticky Live Printable layout view */}
          <div className="hidden xl:block xl:col-span-6 w-full sticky top-4 print:static print:w-full print:p-0 print:m-0 pb-8">
            <div className="mb-3 flex items-center justify-between no-print px-1">
              <span className="text-[10px] p-0 font-display font-extrabold text-slate-400 uppercase tracking-widest">
                Document Blueprint Sheet
              </span>
              <div className="text-[9px] text-indigo-600 font-bold bg-indigo-55 py-1 px-2.5 rounded-full font-mono">
                Live Preview
              </div>
            </div>
            
            <InvoiceDocument 
              invoice={activeInvoice} 
              profile={profile} 
              isQuotation={billingMode === 'quotation'}
            />
          </div>

        </div>

        {/* Bottom Grid Actions (Duplicate of Top Actions for easy accessibility) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print border-t border-slate-150 pt-6 mt-6 pb-4">
          <div>
            <h3 className="text-xs font-display font-black text-slate-800 uppercase tracking-wider">Workspace Actions</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Quickly save, print, download, or share your document from the bottom of the page.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
            <button
              onClick={handleResetForm}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 text-xs transition cursor-pointer h-9"
            >
              <Undo2 size={13} />
              <span className="hidden sm:inline">Clear Workbench</span>
              <span className="sm:hidden">Clear</span>
            </button>
            
            <button
              onClick={handleSaveDraft}
              disabled={billingItems.length === 0}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
              title="Saves this document as a draft which can be reloaded to revise later"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Draft</span>
            </button>

            <button
              onClick={handleSaveFinal}
              disabled={billingItems.length === 0}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
              title="Finalizes and locks billing data block"
            >
              <CheckCircle2 size={13} />
              <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Save Final Quotation' : 'Save Final Bill'}</span>
              <span className="sm:hidden">Save Final</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={billingItems.length === 0 || isPdfDownloading}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            >
              <Download size={13} />
              <span>{isPdfDownloading ? "PDF..." : "PDF"}</span>
            </button>

            <button
              onClick={handleEmailInvoiceViaGmail}
              disabled={billingItems.length === 0}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-indigo-55 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
              title="Compose and send this bill directly to customer's Gmail"
            >
              <Mail size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Email Quotation' : 'Email Bill'}</span>
              <span className="sm:hidden">Email</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={billingItems.length === 0}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-55 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
              title="Send this invoice and access link to customer's WhatsApp"
            >
              <MessageSquare size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{billingMode === 'quotation' ? 'WhatsApp Quotation' : 'WhatsApp Bill'}</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              onClick={handlePrintDraft}
              disabled={billingItems.length === 0}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-9"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">{billingMode === 'quotation' ? 'Print Quotation' : 'Print Invoice'}</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Mobile Floating Action Button to toggle sheet preview */}
        <div className="xl:hidden fixed bottom-6 right-6 z-40 no-print">
          <button
            onClick={() => setShowMobilePreview(true)}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 active:bg-indigo-700 text-white rounded-full font-extrabold shadow-2xl shadow-indigo-300 text-xs transition cursor-pointer h-11"
          >
            <Eye size={15} />
            <span>Preview & Export</span>
          </button>
        </div>

        {/* Mobile Drawer Slide modal Sheet Preview */}
        {showMobilePreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 no-print">
            <div className="w-full max-w-2xl bg-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[92vh]">
              
              {/* Slide Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <Eye className="text-indigo-600" size={15} />
                  <span className="text-[11px] font-display font-extrabold text-slate-800 tracking-tight">
                    Document Preview ({invoiceNumber})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isPdfDownloading}
                    className="px-3 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm transition h-8.5"
                  >
                    <Download size={11} />
                    <span>{isPdfDownloading ? "Wait..." : "PDF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailInvoiceViaGmail}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-105 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm transition h-8.5"
                  >
                    <Mail size={11} strokeWidth={2.5} />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm transition h-8.5"
                  >
                    <MessageSquare size={11} strokeWidth={2.5} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintDraft}
                    className="px-3 py-1.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm transition h-8.5"
                  >
                    <Printer size={11} />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobilePreview(false)}
                    className="p-1 px-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Preview Sheet Area */}
              <div className="flex-1 overflow-y-auto p-1.5 bg-slate-200 flex items-start justify-center">
                <MobileA4ScaledPreview>
                  <InvoiceDocument 
                    invoice={activeInvoice} 
                    profile={profile} 
                    isQuotation={billingMode === 'quotation'}
                  />
                </MobileA4ScaledPreview>
              </div>
              
              {/* Modal Bottom controller */}
              <div className="p-3 bg-white border-t border-slate-150 flex items-center justify-between no-print shrink-0">
                <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider font-mono">Total: LKR {grandTotal.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setShowMobilePreview(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
