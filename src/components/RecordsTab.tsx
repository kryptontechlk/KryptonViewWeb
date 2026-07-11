import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice, CompanyProfile } from '../types';
import InvoiceDocument from './InvoiceDocument';
import MobileA4ScaledPreview from './MobileA4ScaledPreview';
import { downloadInvoiceAsPdf } from '../utils/pdfGenerator';
import { getGmailComposeLink, formatInvoiceMessage } from '../utils/mailHelper';
import { 
  Search, 
  FileText, 
  Printer, 
  Trash, 
  Eye, 
  X, 
  Download, 
  ShieldAlert, 
  ArchiveRestore, 
  FileSignature,
  Mail,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Tag,
  Truck,
  Info,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';

interface RecordsTabProps {
  invoices: Invoice[];
  profile: CompanyProfile;
  onDeleteInvoice: (id: string) => void;
  onClearAllInvoices: () => void;
  onLoadDraft: (draft: Invoice) => void;
}

export default function RecordsTab({ 
  invoices, 
  profile, 
  onDeleteInvoice, 
  onClearAllInvoices,
  onLoadDraft
}: RecordsTabProps) {
  // Modal toggle state for selected viewing invoice details
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [quickViewInvoice, setQuickViewInvoice] = useState<Invoice | null>(null);
  const [activePdfGeneratingInvoice, setActivePdfGeneratingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'draft' | 'final'>('all');

  // Confirmation alert banner state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pdfRendering, setPdfRendering] = useState(false);

  // Filters mapping
  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase().trim();
    const invoiceNum = inv.invoiceNumber.toLowerCase();
    const custName = inv.customerName.toLowerCase();
    const custPhone = (inv.customerPhone || '').toLowerCase();
    
    const matchesQuery = query === '' || 
      invoiceNum.includes(query) ||
      custName.includes(query) ||
      custPhone.includes(query);
      
    const matchesStartDate = startDate === '' || inv.date >= startDate;
    const matchesEndDate = endDate === '' || inv.date <= endDate;
    
    const matchesStatus = statusTab === 'all' || inv.status === statusTab;
    
    return matchesQuery && matchesStartDate && matchesEndDate && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusTab('all');
  };

  const handlePrintExplicit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(async () => {
      try {
        window.print();
      } catch (err) {
        console.error("Print blocked by iframe secure environment:", err);
        alert("Normal window printing is blocked inside this embedded viewport. Automatically saving and downloading PDF invoice instead so you can print it...");
        setActivePdfGeneratingInvoice(invoice);
        await new Promise(resolve => setTimeout(resolve, 150));
        await downloadInvoiceAsPdf(invoice, 'invoice-document');
        setActivePdfGeneratingInvoice(null);
      }
    }, 400);
  };

  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Invoices_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCSV = () => {
    if (invoices.length === 0) {
      alert("No invoices available to export.");
      return;
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Status',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Customer Address',
      'Customer WhatsApp',
      'Items Summary',
      'Total Items Count',
      'Subtotal Amount (LKR)',
      'Discount Type',
      'Discount Value/Rate',
      'Discount Amount (LKR)',
      'Delivery Charges (LKR)',
      'Custom Charges Summary',
      'Custom Charges Total (LKR)',
      'Grand Total (LKR)',
      'Additional Fields',
      'Notes'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      const cleaned = str.replace(/"/g, '""');
      return `"${cleaned}"`;
    };

    const rows = invoices.map(inv => {
      // Items Summary
      const itemsSummary = inv.items.map(item => {
        const colorText = item.selectedColor ? ` [Color: ${item.selectedColor}]` : '';
        const codeText = item.productCode ? ` (${item.productCode})` : '';
        return `${item.productName}${codeText}${colorText} x${item.quantity}`;
      }).join('; ');

      // Total Items Count (sum of quantity)
      const totalItemsQty = inv.items.reduce((sum, item) => sum + item.quantity, 0);

      // Custom charges details
      const customChargesList = inv.customCharges?.map(tc => `${tc.name}: LKR ${tc.amount.toFixed(2)}`).join('; ') || '';
      const customChargesTotal = inv.customCharges?.reduce((sum, tc) => sum + tc.amount, 0) || 0;

      // Customer custom fields summary
      const customFieldsList = inv.customerCustomFields?.map(f => `${f.key}: ${f.value}`).join('; ') || '';

      return [
        escapeCSV(inv.invoiceNumber),
        escapeCSV(inv.date),
        escapeCSV(inv.status),
        escapeCSV(inv.customerName),
        escapeCSV(inv.customerPhone),
        escapeCSV(inv.customerEmail || ''),
        escapeCSV(inv.customerAddress),
        escapeCSV(inv.customerWhatsapp || ''),
        escapeCSV(itemsSummary),
        totalItemsQty,
        inv.subtotal,
        escapeCSV(inv.discountType),
        inv.discountValue,
        inv.discountAmount,
        inv.deliveryCharges,
        escapeCSV(customChargesList),
        customChargesTotal,
        inv.total,
        escapeCSV(customFieldsList),
        escapeCSV(inv.notes || '')
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `Invoice_History_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadModalPdf = async (invoice: Invoice) => {
    setPdfRendering(true);
    // Ensure standard InvoiceDocument element is rendered off-screen
    setActivePdfGeneratingInvoice(invoice);
    await new Promise(resolve => setTimeout(resolve, 150));

    const success = await downloadInvoiceAsPdf(invoice, 'invoice-document');
    
    setActivePdfGeneratingInvoice(null);
    setPdfRendering(false);
    if (!success) {
      alert("Encountered an output error rendering PDF element. Please use print explicit options instead.");
    }
  };

  const handleSendLocalEmail = async (invoice: Invoice) => {
    const emailField = invoice.customerCustomFields?.find(f => f.key.toLowerCase() === 'email' || f.key.toLowerCase() === 'customer email');
    const defaultEmail = invoice.customerEmail || (emailField ? emailField.value : '');

    let recipient = defaultEmail.trim();
    if (!recipient) {
      const promptedRecipient = prompt(`Composing email for invoice ${invoice.invoiceNumber}. Please verify customer's Email:`);
      if (promptedRecipient === null) return;
      recipient = promptedRecipient.trim();
    }
    
    if (recipient === '') {
      alert("Recipient email address cannot be empty.");
      return;
    }

    // Ask operator for preferred client
    const useGmail = confirm("Press OK to compose using Gmail Web interface.\nPress Cancel to use your system's Default Mail Client (Outlook, Apple Mail, Mail app).");

    // Set active PDF generating invoice to render it off-screen
    setActivePdfGeneratingInvoice(invoice);
    // Wait brief 100ms for React render and repaint
    await new Promise(resolve => setTimeout(resolve, 100));

    // Automatically trigger local PDF download so they can attach it
    await downloadInvoiceAsPdf(invoice, 'invoice-document');

    // Clean up
    setActivePdfGeneratingInvoice(null);

    let link = '';
    const subject = `Invoice ${invoice.invoiceNumber} from ${profile.name || 'Our Store'}`;
    const body = formatInvoiceMessage(invoice, profile.name, profile.phone);

    if (useGmail) {
      link = getGmailComposeLink(invoice, profile, recipient.trim());
    } else {
      link = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    
    // Bypass iframe popup block
    try {
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (popupErr) {
      console.error(popupErr);
      const confirmCopy = confirm("Your browser blocked opening your email app. Copy compose URL link directly to clipboard?");
      if (confirmCopy) {
        navigator.clipboard.writeText(link);
        alert("Copied successfully! You can paste the link in your browser bar.");
      }
    }
  };

  const handleShareLocalWhatsApp = (invoice: Invoice) => {
    const whatsappNumber = invoice.customerWhatsapp || invoice.customerPhone;
    let recipient = whatsappNumber ? whatsappNumber.trim() : '';
    if (!recipient) {
      const promptedRecipient = prompt(`Composing WhatsApp message for invoice ${invoice.invoiceNumber}. Verify phone number (with country code):`);
      if (promptedRecipient === null) return;
      recipient = promptedRecipient.trim();
    }
    
    if (recipient === '') {
      alert("WhatsApp recipient number cannot be empty.");
      return;
    }
    
    let cleanedPhone = recipient.trim().replace(/[^0-9]/g, '');
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
      cleanedPhone = '94' + cleanedPhone.substring(1);
    }
    
    const message = formatInvoiceMessage(invoice, profile.name, profile.phone);

    const waLink = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    
    // Bypass iframe popup block
    try {
      const a = document.createElement('a');
      a.href = waLink;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (popupErr) {
      console.error(popupErr);
      const confirmCopy = confirm("Popup opening seemed to have failed or was blocked. Copy WhatsApp link directly to clipboard?");
      if (confirmCopy) {
        navigator.clipboard.writeText(waLink);
        alert("WhatsApp link copied to clipboard successfully!");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in no-print">
      
      {/* Search and control action row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900">Saved Billing Records</h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">Audit saved drafts and finalized invoice listings, and resume editing or download files.</p>
        </div>
        
        {invoices.length > 0 && (
          <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition"
              title="Exports the full local database block to a backup JSON file"
            >
              <Download size={14} />
              <span className="text-xs font-bold font-sans">Export JSON</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold cursor-pointer transition"
              title="Export the entire invoice history to CSV format for Excel/accounting"
            >
              <FileSpreadsheet size={14} />
              <span className="text-xs font-bold font-sans">Export CSV</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              <Trash size={14} />
              <span>Wipe DB</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirm wiping block prompt */}
      {showClearConfirm && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs animate-fade-in">
          <div className="flex items-start gap-2 text-rose-800">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Danger: Irreversible Database Wipe Request</strong>
              This will permanently delete all {invoices.length} saved invoice records from your client browser local storage. Proceed?
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto self-end">
            <button 
              onClick={() => {
                onClearAllInvoices();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer transition"
            >
              Wipe Database
            </button>
            <button 
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-white border border-slate-250 text-slate-700 rounded-lg font-medium cursor-pointer transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Records search controller and filters block */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 premium-shadow space-y-4">
        <div className="flex items-center gap-2 pb-1 text-slate-700 border-b border-slate-50">
          <span className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Search size={14} />
          </span>
          <span className="text-xs font-display font-black uppercase tracking-wider text-slate-700">Filter Records Database</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          {/* Text input filter */}
          <div className="md:col-span-6 space-y-1.5 col-span-1">
            <label className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-widest block">Customer or Invoice Reference</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search by customer name, phone number, or invoice code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition min-h-[44px]"
              />
            </div>
          </div>

          {/* Date range inputs */}
          <div className="md:col-span-3 space-y-1.5 col-span-1">
            <label className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-widest block">From Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition min-h-[44px] cursor-pointer font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5 col-span-1">
            <label className="text-[10px] sm:text-xs font-bold text-slate-450 uppercase tracking-widest block">To Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-xs outline-none transition min-h-[44px] cursor-pointer font-mono"
              />
            </div>
          </div>
        </div>

        {/* Filters Active Display & Clear Button */}
        {(searchQuery || startDate || endDate || statusTab !== 'all') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/65 text-indigo-700 text-[10px] font-extrabold rounded-lg font-mono">
                  Query: "{searchQuery}"
                </span>
              )}
              {startDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/65 text-indigo-700 text-[10px] font-extrabold rounded-lg font-mono">
                  Since: {startDate}
                </span>
              )}
              {endDate && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/65 text-indigo-700 text-[10px] font-extrabold rounded-lg font-mono">
                  Until: {endDate}
                </span>
              )}
              {statusTab !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100/65 text-indigo-700 text-[10px] font-extrabold rounded-lg font-mono capitalize">
                  Status: {statusTab}
                </span>
              )}
            </div>

            <button
              onClick={clearFilters}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 rounded-xl text-[10px] font-bold cursor-pointer transition whitespace-nowrap"
            >
              <X size={11} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Invoice Register Board Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden premium-shadow">
        
        {/* Tab-based status filters bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/25 px-4 sm:px-5 py-3 gap-4 flex-wrap select-none no-print">
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-100/80 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2
                ${statusTab === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <span>All Invoices</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${statusTab === 'all' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {invoices.length}
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setStatusTab('final')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2
                ${statusTab === 'final' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusTab === 'final' ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>Final</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${statusTab === 'final' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {invoices.filter(i => i.status === 'final').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('draft')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2
                ${statusTab === 'draft' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusTab === 'draft' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>Drafts</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${statusTab === 'draft' ? 'bg-indigo-700/80 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {invoices.filter(i => i.status === 'draft').length}
              </span>
            </button>
          </div>
          
          <div className="text-[11px] text-slate-450 font-bold uppercase tracking-wider font-mono">
            Showing {filteredInvoices.length} of {statusTab === 'all' ? invoices.length : invoices.filter(i => i.status === statusTab).length} entries
          </div>
        </div>
        
        {/* Table Body */}
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400/80 italic space-y-2">
            <ArchiveRestore size={35} className="mx-auto stroke-[1.2] text-slate-300 animate-pulse" />
            <div>
              {searchQuery || startDate || endDate
                ? `No invoices match active filtering criteria.` 
                : 'No invoice documents have been generated yet.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-loose">
                  <th className="py-2.5 px-3 sm:px-5">Invoice Reference</th>
                  <th className="py-2.5 px-2 sm:px-4 font-sans">Status</th>
                  <th className="py-2.5 px-2 sm:px-4 hidden sm:table-cell">Date</th>
                  <th className="py-2.5 px-2 sm:px-4 font-display">Customer Details</th>
                  <th className="py-2.5 px-2 sm:px-4 text-right">Sum Total</th>
                  <th className="py-2.5 px-3 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-sans">
                <AnimatePresence initial={false}>
                  {filteredInvoices.map((inv) => (
                    <motion.tr 
                      key={inv.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, height: 0, overflow: "hidden" }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="hover:bg-slate-50/40 transition"
                    >
                      {/* Invoice ID Code */}
                      <td className="py-2.5 px-3 sm:px-5">
                        <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg inline-block text-[11px]">
                          {inv.invoiceNumber}
                        </div>
                      </td>

                      {/* Status badge representation */}
                      <td className="py-2.5 px-2 sm:px-4">
                        {inv.status === 'draft' ? (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                            ⚠️ Draft
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded uppercase tracking-wider whitespace-nowrap">
                            ✓ Final
                          </span>
                        )}
                      </td>

                      {/* Placement Date */}
                      <td className="py-2.5 px-2 sm:px-4 font-mono text-[11px] text-slate-500 hidden sm:table-cell">
                        {inv.date}
                      </td>

                      {/* Customer overview */}
                      <td className="py-2.5 px-2 sm:px-4">
                        <div className="font-bold text-slate-805 text-[11.5px] truncate max-w-[140px]" title={inv.customerName}>{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div className="text-[9px] text-slate-400 mt-0.2 font-mono">{inv.customerPhone}</div>
                        )}
                      </td>

                      {/* Calculations amount totals representation */}
                      <td className="py-2.5 px-2 sm:px-4 text-right">
                        <div className="font-bold text-indigo-700 font-mono text-[11.5px]">
                          LKR {inv.total.toFixed(2)}
                        </div>
                        <div className="text-[8.5px] text-slate-400 font-medium">
                          {inv.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                        </div>
                      </td>

                      {/* Functional callbacks */}
                      <td className="py-2.5 px-3 sm:px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          
                          {/* Resume / edit bill option */}
                          <button
                            onClick={() => onLoadDraft(inv)}
                            className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer h-8 w-8 flex items-center justify-center ${
                              inv.status === 'draft'
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/45'
                                : 'text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200/40'
                            }`}
                            title={inv.status === 'draft' ? "Resume Editing Draft" : "Re-load Bill Sheet Template"}
                          >
                            <FileSignature size={13} />
                          </button>

                          <button
                            onClick={() => setQuickViewInvoice(inv)}
                            className="px-2 py-1 bg-indigo-55 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition h-8 shrink-0 select-none whitespace-nowrap"
                            title="Instant Details Quick View"
                          >
                            <Eye size={12} className="shrink-0" />
                            <span className="hidden sm:inline">Quick View</span>
                          </button>

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="hidden md:flex p-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition cursor-pointer h-8 w-8 items-center justify-center"
                            title="Open PDF Preview Sheet"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => handlePrintExplicit(inv)}
                            className="hidden md:flex p-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-lg transition cursor-pointer h-8 w-8 items-center justify-center"
                            title="Quick Print Slip"
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            onClick={() => handleSendLocalEmail(inv)}
                            className="hidden md:flex p-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-150 rounded-lg transition cursor-pointer h-8 w-8 items-center justify-center"
                            title="Send Bill to Customer's Gmail"
                          >
                            <Mail size={13} strokeWidth={2.5} />
                          </button>

                          <button
                            onClick={() => handleShareLocalWhatsApp(inv)}
                            className="hidden md:flex p-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-150 rounded-lg transition cursor-pointer h-8 w-8 items-center justify-center"
                            title="Send Bill to Customer's WhatsApp"
                          >
                            <MessageSquare size={13} strokeWidth={2.5} />
                          </button>

                          <button
                            onClick={() => onDeleteInvoice(inv.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer h-8 w-8 flex items-center justify-center"
                            title="Erase Record"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Pop-up Modal Sheet Overlay component details viewer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 print:bg-white print:p-0 print:block print:static">
          <div className="w-full max-w-3xl bg-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] print:h-auto print:bg-white print:rounded-none print:shadow-none print:block print:overflow-visible">
            
            {/* Header controllers */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 no-print">
              <div className="flex items-center gap-1.5">
                <FileText className="text-indigo-600" size={16} />
                <span className="text-[11px] font-display font-extrabold text-slate-800">
                  Document Preview ({selectedInvoice.invoiceNumber})
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDownloadModalPdf(selectedInvoice)}
                  disabled={pdfRendering}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm h-8.5"
                >
                  <Download size={11} />
                  <span>{pdfRendering ? "wait..." : "Download PDF"}</span>
                </button>
                <button
                  onClick={() => handleSendLocalEmail(selectedInvoice)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-155 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition h-8.5 shadow-sm"
                >
                  <Mail size={11} strokeWidth={2.5} />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => handleShareLocalWhatsApp(selectedInvoice)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-155 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition h-8.5 shadow-sm"
                >
                  <MessageSquare size={11} strokeWidth={2.5} />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handlePrintExplicit(selectedInvoice)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm h-8.5"
                >
                  <Printer size={11} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Render Scrollable Frame */}
            <div className="flex-1 overflow-y-auto p-1.5 bg-slate-200 flex items-start justify-center print:bg-white print:p-0 print:block print:overflow-visible">
              <MobileA4ScaledPreview>
                <InvoiceDocument 
                  invoice={selectedInvoice} 
                  profile={profile} 
                />
              </MobileA4ScaledPreview>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Details Modal */}
      {quickViewInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] md:max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl">
                  <FileText size={18} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-display font-black text-slate-800">
                      Invoice: {quickViewInvoice.invoiceNumber}
                    </h3>
                    {quickViewInvoice.status === 'draft' ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        ⚠️ Draft
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-55 text-emerald-750 border border-emerald-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        ✓ Final
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">DB ID: {quickViewInvoice.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onLoadDraft(quickViewInvoice);
                    setQuickViewInvoice(null);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition hidden sm:inline-flex"
                  title="Load Bill into active workbook to edit"
                >
                  <FileSignature size={12} />
                  <span>Resume Worksheet Drafting</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-205 rounded-xl cursor-pointer transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              
              {/* Top Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Customer Details Block */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <User size={15} className="text-slate-450" />
                    <h4 className="text-xs font-display font-black text-slate-805 uppercase tracking-widest">Customer Profile</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 items-start gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-sans col-span-1 pt-0.5">Name</span>
                      <div className="col-span-3 text-xs font-bold text-slate-800">
                        {quickViewInvoice.customerName || <span className="text-slate-400 italic">No customer name provided</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-sans col-span-1 pt-0.5">Phone</span>
                      <div className="col-span-3 text-xs font-mono font-bold text-slate-700">
                        {quickViewInvoice.customerPhone || <span className="text-slate-400 italic">No phone details</span>}
                      </div>
                    </div>

                    {quickViewInvoice.customerWhatsapp && (
                      <div className="grid grid-cols-4 items-start gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-sans col-span-1 pt-0.5">WhatsApp</span>
                        <div className="col-span-3 text-xs font-mono font-semibold text-emerald-600">
                          {quickViewInvoice.customerWhatsapp}
                        </div>
                      </div>
                    )}

                    {quickViewInvoice.customerEmail && (
                      <div className="grid grid-cols-4 items-start gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-sans col-span-1 pt-0.5">Email</span>
                        <div className="col-span-3 text-xs font-medium text-slate-700 break-all">
                          {quickViewInvoice.customerEmail}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-4 items-start gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-sans col-span-1 pt-0.5">Address</span>
                      <div className="col-span-3 text-xs text-slate-650 leading-relaxed">
                        {quickViewInvoice.customerAddress || <span className="text-slate-400 italic">No address provided</span>}
                      </div>
                    </div>
                  </div>

                  {/* Customer Custom Fields */}
                  {quickViewInvoice.customerCustomFields && quickViewInvoice.customerCustomFields.length > 0 && (
                    <div className="pt-3 border-t border-slate-100/70 space-y-2">
                      <h5 className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Additional Field Parameters</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {quickViewInvoice.customerCustomFields.map((field) => (
                          <div key={field.id} className="p-2 bg-white rounded-xl border border-slate-100/80 text-[11px] min-w-0">
                            <span className="block text-[9px] font-bold uppercase text-slate-400 truncate">{field.key}</span>
                            <span className="font-medium text-slate-700 block truncate" title={field.value}>{field.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Summary & Parameters */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <Tag size={15} className="text-indigo-600" />
                      <h4 className="text-xs font-display font-black text-slate-805 uppercase tracking-widest">Financial Parameters</h4>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Items Subtotal</span>
                        <span className="font-bold text-slate-705">LKR {quickViewInvoice.subtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500">
                        <span className="flex items-center gap-1">
                          Discount Value
                          {quickViewInvoice.discountType === 'percentage' && (
                            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-sans">
                              {quickViewInvoice.discountValue}%
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-rose-600">- LKR {quickViewInvoice.discountAmount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500">
                        <span>Delivery & Transport</span>
                        <span className="font-bold text-slate-705">LKR {quickViewInvoice.deliveryCharges.toFixed(2)}</span>
                      </div>

                      {/* Custom charges if any */}
                      {quickViewInvoice.customCharges && quickViewInvoice.customCharges.length > 0 && (
                        <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-1.5 text-slate-500 text-[11px]">
                          {quickViewInvoice.customCharges.map((tc) => (
                            <div key={tc.id} className="flex justify-between items-center">
                              <span className="truncate max-w-[150px] capitalize">{tc.name}</span>
                              <span className="font-bold">LKR {tc.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Absolute Total focus bento box */}
                  <div className="pt-2">
                    <div className="bg-indigo-50/70 border border-indigo-100/55 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-black text-indigo-700 tracking-wider block">Grand Net Payable</span>
                        <div className="text-xl sm:text-2xl font-mono font-black text-indigo-905 mt-1">
                          LKR {quickViewInvoice.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-indigo-500 block">Date Generated</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{quickViewInvoice.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Items Table details ledger */}
              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center gap-2">
                  <ArchiveRestore size={14} className="text-slate-500" />
                  <span className="text-[10px] font-display font-black uppercase tracking-wider text-slate-700">Purchased Items Ledger ({quickViewInvoice.items.length})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-150 text-[10px] font-extrabold text-slate-455 uppercase tracking-widest h-9">
                        <th className="py-2 px-3 text-center w-12 mr-1">#</th>
                        <th className="py-2 px-3">Item Details & Reference Code</th>
                        <th className="py-2 px-3 text-right w-28">Unit Price</th>
                        <th className="py-2 px-3 text-center w-20">Quantity</th>
                        <th className="py-2 px-3 text-right w-32">Subtotal Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                      {quickViewInvoice.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Index # */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">
                            {index + 1}
                          </td>

                          {/* Details & color */}
                          <td className="py-2.5 px-3 min-w-[200px]">
                            <div className="font-bold text-slate-800 text-[11.5px]">{item.productName}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.productCode && (
                                <span className="font-mono bg-slate-105 text-slate-655 px-1.5 py-0.2 rounded text-[9.5px]">
                                  Code: {item.productCode}
                                </span>
                              )}
                              {item.selectedColor && 
                               !['default/none', 'default / none', 'default', 'none', ''].includes(item.selectedColor.trim().toLowerCase()) && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-550">
                                  <span className="h-1.5 w-1.5 rounded-full border border-slate-350" style={{ backgroundColor: item.selectedColor }} />
                                  Color: {item.selectedColor}
                                </span>
                              )}
                            </div>

                            {/* Item Custom Fields snapshots */}
                            {item.customFields && item.customFields.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.customFields.map((f) => (
                                  <span key={f.id} className="inline-block bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 text-[9px] text-slate-550 font-sans">
                                    <strong className="font-semibold">{f.name}:</strong> {f.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Unit price */}
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600">
                            LKR {item.price.toFixed(2)}
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {item.quantity}
                          </td>

                          {/* Subtotal Item balance */}
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-700 text-[11.5px]">
                            LKR {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Counter totals banner footer */}
                <div className="bg-slate-50/70 border-t border-slate-150 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Aggregation Totals:</span>
                  <div className="flex gap-4 font-mono text-[11px]">
                    <span>
                      Total Quantity: <strong className="text-slate-800 font-bold">{quickViewInvoice.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                    </span>
                    <span>
                      Subtotal Weight: <strong className="text-indigo-700 font-extrabold">LKR {quickViewInvoice.subtotal.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Custom Metadata fields (Additional Terms, Due dates, terms of delivery, payment info, etc.) */}
              {quickViewInvoice.customFields && quickViewInvoice.customFields.length > 0 && (
                <div className="bg-slate-50/40 rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-3.5 font-sans">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <Info size={14} className="text-indigo-650" />
                    <span className="text-[10px] font-display font-black uppercase tracking-wider text-slate-700">Invoice Custom Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {quickViewInvoice.customFields.map((field) => (
                      <div key={field.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                        <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider truncate">{field.key}</span>
                        <div className="text-xs font-medium text-slate-700 leading-normal line-clamp-2" title={field.value}>
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-between items-stretch sm:items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  onLoadDraft(quickViewInvoice);
                  setQuickViewInvoice(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs cursor-pointer transition select-none h-10"
                title="Loads this invoice into active workspace workspace template to immediately edit details"
              >
                <FileSignature size={13} />
                <span>Resume drafting in worksheet</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadModalPdf(quickViewInvoice)}
                  disabled={pdfRendering}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-xs disabled:opacity-50 select-none h-10"
                  title="Direct Download of Invoice Document in PDF Form"
                >
                  <Download size={13} />
                  <span>{pdfRendering ? "Converting..." : "Download Ledger PDF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintExplicit(quickViewInvoice)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow-xs select-none h-10"
                  title="Print Copy directly to local connected printer"
                >
                  <Printer size={13} />
                  <span>Quick Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickViewInvoice(null)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition select-none h-10"
                >
                  <span>Dismiss</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Off-screen PDF container for direct row actions when modal is closed */}
      {activePdfGeneratingInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} className="no-print">
          <InvoiceDocument invoice={activePdfGeneratingInvoice} profile={profile} />
        </div>
      )}

    </div>
  );
}
