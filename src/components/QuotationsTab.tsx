import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quotation, CompanyProfile, Invoice } from '../types';
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
  Mail,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  ArrowUpRight,
  ClipboardCheck,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

interface QuotationsTabProps {
  quotations: Quotation[];
  profile: CompanyProfile;
  onDeleteQuotation: (id: string) => void;
  onClearAllQuotations: () => void;
  onConvertToInvoice: (quotation: Quotation) => void;
}

export default function QuotationsTab({ 
  quotations, 
  profile, 
  onDeleteQuotation, 
  onClearAllQuotations,
  onConvertToInvoice
}: QuotationsTabProps) {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quickViewQuotation, setQuickViewQuotation] = useState<Quotation | null>(null);
  const [activePdfGeneratingQuotation, setActivePdfGeneratingQuotation] = useState<Quotation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'draft' | 'final'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pdfRendering, setPdfRendering] = useState(false);

  const qtySum = quickViewQuotation
    ? quickViewQuotation.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  // Filters mapping
  const filteredQuotations = quotations.filter(q => {
    const query = searchQuery.toLowerCase().trim();
    const qNum = q.quotationNumber.toLowerCase();
    const custName = q.customerName.toLowerCase();
    const custPhone = (q.customerPhone || '').toLowerCase();
    
    const matchesQuery = query === '' || 
      qNum.includes(query) ||
      custName.includes(query) ||
      custPhone.includes(query);
      
    const matchesStartDate = startDate === '' || q.date >= startDate;
    const matchesEndDate = endDate === '' || q.date <= endDate;
    
    const matchesStatus = statusTab === 'all' || q.status === statusTab;
    
    return matchesQuery && matchesStartDate && matchesEndDate && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusTab('all');
  };

  const handlePrintExplicit = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setTimeout(async () => {
      try {
        window.print();
      } catch (err) {
        console.error("Print blocked by iframe secure environment:", err);
        alert("Normal window printing is blocked inside this embedded viewport. Automatically saving and downloading PDF quotation instead so you can print it...");
        setActivePdfGeneratingQuotation(quotation);
        await new Promise(resolve => setTimeout(resolve, 150));
        await downloadInvoiceAsPdf(quotation as unknown as Invoice, 'invoice-document');
        setActivePdfGeneratingQuotation(null);
      }
    }, 400);
  };

  const handleDownloadModalPdf = async (quotation: Quotation) => {
    setPdfRendering(true);
    setActivePdfGeneratingQuotation(quotation);
    await new Promise(resolve => setTimeout(resolve, 150));

    const success = await downloadInvoiceAsPdf(quotation as unknown as Invoice, 'invoice-document');
    
    setActivePdfGeneratingQuotation(null);
    setPdfRendering(false);
    if (!success) {
      alert("Encountered an output error rendering PDF element. Please use print explicit options instead.");
    }
  };

  const handleSendLocalEmail = async (quotation: Quotation) => {
    const emailField = quotation.customerCustomFields?.find(f => f.key.toLowerCase() === 'email' || f.key.toLowerCase() === 'customer email');
    const defaultEmail = quotation.customerEmail || (emailField ? emailField.value : '');

    let recipient = defaultEmail.trim();
    if (!recipient) {
      const promptedRecipient = prompt(`Composing email for quotation ${quotation.quotationNumber}. Please verify customer's Email:`);
      if (promptedRecipient === null) return;
      recipient = promptedRecipient.trim();
    }
    
    if (recipient === '') {
      alert("Recipient email address cannot be empty.");
      return;
    }

    const useGmail = confirm("Press OK to compose using Gmail Web interface.\nPress Cancel to use your system's Default Mail Client (Outlook, Apple Mail, Mail app).");

    setActivePdfGeneratingQuotation(quotation);
    await new Promise(resolve => setTimeout(resolve, 100));
    await downloadInvoiceAsPdf(quotation as unknown as Invoice, 'invoice-document');
    setActivePdfGeneratingQuotation(null);

    let link = '';
    const subject = `Quotation ${quotation.quotationNumber} from ${profile.name || 'Our Store'}`;
    const body = formatInvoiceMessage(quotation as unknown as Invoice, profile.name, profile.phone);

    if (useGmail) {
      link = getGmailComposeLink(quotation as unknown as Invoice, profile, recipient.trim());
    } else {
      link = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    
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

  const handleShareLocalWhatsApp = (quotation: Quotation) => {
    const whatsappNumber = quotation.customerWhatsapp || quotation.customerPhone;
    let recipient = whatsappNumber ? whatsappNumber.trim() : '';
    if (!recipient) {
      const promptedRecipient = prompt(`Composing WhatsApp message for quotation ${quotation.quotationNumber}. Verify phone number (with country code):`);
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
    
    const message = formatInvoiceMessage(quotation as unknown as Invoice, profile.name, profile.phone);
    const waLink = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    
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
      window.open(waLink, '_blank');
    }
  };

  // CSV Export Engine
  const exportToCSV = () => {
    if (filteredQuotations.length === 0) {
      alert("No matching quotations found to export.");
      return;
    }

    const headers = [
      "Quotation Number", "Date", "Valid Until", "Status", 
      "Customer Name", "Customer Phone", "Customer Email", "Customer Address", "Customer WhatsApp",
      "Billing Items", "Total Items Qty", "Subtotal (LKR)", 
      "Discount Type", "Discount Value", "Discount Amount (LKR)", 
      "Delivery Charges (LKR)", "Custom Charges Details", "Custom Charges Total (LKR)", "Grand Total (LKR)",
      "Customer Extra Fields", "Terms/Notes"
    ];

    const escapeCSV = (str: any) => {
      const val = str === null || str === undefined ? "" : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = filteredQuotations.map(q => {
      const itemsSummary = q.items.map(item => {
        const colorText = item.selectedColor ? ` [Color: ${item.selectedColor}]` : '';
        const codeText = item.productCode ? ` (${item.productCode})` : '';
        return `${item.productName}${codeText}${colorText} x${item.quantity}`;
      }).join('; ');

      const totalItemsQty = q.items.reduce((sum, item) => sum + item.quantity, 0);
      const customChargesList = q.customCharges?.map(tc => `${tc.name}: LKR ${tc.amount.toFixed(2)}`).join('; ') || '';
      const customChargesTotal = q.customCharges?.reduce((sum, tc) => sum + tc.amount, 0) || 0;
      const customFieldsList = q.customerCustomFields?.map(f => `${f.key}: ${f.value}`).join('; ') || '';

      return [
        escapeCSV(q.quotationNumber),
        escapeCSV(q.date),
        escapeCSV(q.validUntil || ''),
        escapeCSV(q.status),
        escapeCSV(q.customerName),
        escapeCSV(q.customerPhone),
        escapeCSV(q.customerEmail || ''),
        escapeCSV(q.customerAddress),
        escapeCSV(q.customerWhatsapp || ''),
        escapeCSV(itemsSummary),
        totalItemsQty,
        q.subtotal,
        escapeCSV(q.discountType),
        q.discountValue,
        q.discountAmount,
        q.deliveryCharges,
        escapeCSV(customChargesList),
        customChargesTotal,
        q.total,
        escapeCSV(customFieldsList),
        escapeCSV(q.notes || '')
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `Quotation_Records_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in no-print">
      
      {/* Offscreen element exclusively for print canvas render & PDF output */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none no-print">
        {activePdfGeneratingQuotation && (
          <InvoiceDocument 
            invoice={activePdfGeneratingQuotation} 
            profile={profile} 
            isQuotation={true}
          />
        )}
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 premium-shadow">
        <div>
          <h2 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText size={18} />
            </span>
            <span>Quotations Registry</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1 dark:text-slate-500">
            Search, export, view, and directly convert pre-sales estimates to finalized store bills.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-500" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2 border border-rose-200 dark:border-rose-900 text-rose-650 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <Trash size={14} />
            <span>Wipe Registry</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Console */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 premium-shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
            Filter Query
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search no, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 rounded-xl w-full focus:outline-indigo-600 transition"
            />
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
            From Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 rounded-xl w-full focus:outline-indigo-600 transition"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
            To Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 rounded-xl w-full focus:outline-indigo-600 transition"
            />
          </div>
        </div>

        {/* Clear Filter Button */}
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden premium-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                <th className="py-3 px-4">Quotation Info</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Subtotal / Total</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No matching quotation records found. Create estimations first.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const qtySum = q.items.reduce((acc, item) => acc + item.quantity, 0);
                  const isExpired = q.validUntil ? new Date(q.validUntil) < new Date() : false;
                  
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{q.quotationNumber}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{q.date}</div>
                      </td>
                      <td className="py-4 px-4 space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span>{q.customerName}</span>
                        </div>
                        {q.customerPhone && (
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>{q.customerPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <div className="text-[10px] text-slate-400">LKR {q.subtotal.toFixed(2)}</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">LKR {q.total.toFixed(2)}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold font-mono text-[10px]">
                          {qtySum}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {q.validUntil ? (
                          <span className={`inline-flex items-center gap-1 font-bold font-mono text-[10px] ${
                            isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {q.validUntil} {isExpired && "(Expired)"}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No limit</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Convert to Invoice Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Convert ${q.quotationNumber} estimate into a live bill?`)) {
                                onConvertToInvoice(q);
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Convert to Live Invoice Bill"
                          >
                            <ArrowUpRight size={15} />
                          </button>

                          {/* Quick Preview Button */}
                          <button
                            onClick={() => setQuickViewQuotation(q)}
                            className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Quick View Document Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Print Explicit */}
                          <button
                            onClick={() => handlePrintExplicit(q)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-600 dark:text-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Print Quotation Paper"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => {
                              if (confirm(`Confirm permanent deletion of quotation record ${q.quotationNumber}?`)) {
                                onDeleteQuotation(q.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Delete quotation record permanently"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal to Clear All Registers */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                ⚠️ Wipe Entire Registry?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                This is an irreversible operation. It will permanently delete all quotations stored in your active store estimate history from both this browser and connected cloud directories.
              </p>
              <div className="flex gap-2.5 mt-6 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllQuotations();
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
                >
                  Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Modal popup for full verification */}
      <AnimatePresence>
        {quickViewQuotation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col"
            >
              <header className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                      Quotation Estimate Verification
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block font-mono">
                      No: {quickViewQuotation.quotationNumber} ({quickViewQuotation.status === 'draft' ? "DRAFT" : "ACTIVE"})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {/* Convert to Bill Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Convert this estimate into an active bill in the editor?`)) {
                        onConvertToInvoice(quickViewQuotation);
                        setQuickViewQuotation(null);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8"
                    title="Convert to Live Invoice Bill"
                  >
                    <ArrowUpRight size={12} />
                    <span>Convert to Invoice</span>
                  </button>

                  <button
                    onClick={() => handleSendLocalEmail(quickViewQuotation)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Send to Customer Email"
                  >
                    <Mail size={15} />
                  </button>
                  <button
                    onClick={() => handleShareLocalWhatsApp(quickViewQuotation)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <MessageSquare size={15} />
                  </button>
                  <button
                    onClick={() => handleDownloadModalPdf(quickViewQuotation)}
                    disabled={pdfRendering}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8 disabled:opacity-50"
                  >
                    <Download size={12} />
                    <span>{pdfRendering ? "Rendering..." : "PDF"}</span>
                  </button>
                  <button
                    onClick={() => handlePrintExplicit(quickViewQuotation)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer h-8"
                  >
                    <Printer size={12} />
                    <span>Print paper</span>
                  </button>
                  <button
                    onClick={() => setQuickViewQuotation(null)}
                    className="p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/40">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left A4 Document Preview Grid */}
                  <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-150 dark:border-slate-800 bg-white">
                    <MobileA4ScaledPreview>
                      <InvoiceDocument 
                        invoice={quickViewQuotation} 
                        profile={profile} 
                        isQuotation={true}
                      />
                    </MobileA4ScaledPreview>
                  </div>

                  {/* Right Meta details rail */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3.5">
                      <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest block">
                        Estimate Details
                      </h4>
                      
                      <div className="space-y-2.5 text-xs text-slate-650 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Date Issued:</span>
                          <span className="font-bold font-mono">{quickViewQuotation.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Validity Exp:</span>
                          <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                            {quickViewQuotation.validUntil || "Infinite"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Items Count:</span>
                          <span className="font-bold font-mono">{quickViewQuotation.items.length} unique</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Qty:</span>
                          <span className="font-bold font-mono">{qtySum} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                            quickViewQuotation.status === 'final' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {quickViewQuotation.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3">
                      <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest block">
                        Client Information
                      </h4>
                      <div className="space-y-2.5 text-xs text-slate-605 mt-2 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white">{quickViewQuotation.customerName}</span>
                        </div>
                        {quickViewQuotation.customerPhone && (
                          <div className="flex items-center gap-2">
                            <span>Phone: <strong>{quickViewQuotation.customerPhone}</strong></span>
                          </div>
                        )}
                        {quickViewQuotation.customerAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="break-words line-clamp-3">{quickViewQuotation.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </main>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
