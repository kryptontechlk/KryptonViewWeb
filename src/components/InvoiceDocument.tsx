import { CompanyProfile, Invoice, Quotation, DocumentFormatConfig } from '../types';
import { Mail, Phone, MapPin, Calendar, FileText, User, MessageSquare } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice | Quotation;
  profile: CompanyProfile;
  isQuotation?: boolean;
}

export default function InvoiceDocument({ invoice, profile, isQuotation }: InvoiceDocumentProps) {
  const actualIsQuotation = isQuotation || 'quotationNumber' in invoice;
  const docNumber = actualIsQuotation ? (invoice as Quotation).quotationNumber : (invoice as Invoice).invoiceNumber;
  const validUntil = actualIsQuotation ? (invoice as Quotation).validUntil : undefined;

  const findDetail = (keywords: string[]) => {
    const detail = profile.extraDetails?.find(d => 
      keywords.some(kw => d.key.toLowerCase().includes(kw))
    );
    return detail ? detail.value : '';
  };

  const emailAddress = findDetail(['email', 'mail', 'e-mail']) || 'info@company.com';
  const streetAddress = findDetail(['street', 'address', 'location', 'addr', 'road']) || 'Main Street, Colombo';
  const cityStateZip = findDetail(['city', 'zip', 'state', 'postal']) || 'Western Province, Sri Lanka';
  const faxNumber = findDetail(['fax']) || '';

  const qConfig: Partial<DocumentFormatConfig> = profile.quotationFormatConfig || {};
  const qTitle = qConfig.title || 'QUOTATION';
  const qShowLogo = qConfig.showLogo !== false;
  const qShowPhone = qConfig.showPhone !== false;
  const qShowEmail = qConfig.showEmail !== false;
  const qShowSignature = qConfig.showSignature !== false;
  const qShowTerms = qConfig.showTerms !== false;
  const qShowAcceptance = qConfig.showAcceptance !== false;
  const qShowDescriptionOfWork = qConfig.showDescriptionOfWork !== false;
  const qPreparedByTitle = qConfig.preparedByTitle || 'Authorized Rep';
  const qAccentColor = qConfig.accentColor || '#0f172a';

  // Extended properties for Quotation
  const qConstantFields = qConfig.constantFields || [];
  const qShowPaymentMethod = qConfig.showPaymentMethod || false;
  const qPaymentBankName = qConfig.paymentBankName || '';
  const qPaymentAccountNo = qConfig.paymentAccountNo || '';
  const qPaymentAccountName = qConfig.paymentAccountName || '';
  const qPaymentBranch = qConfig.paymentBranch || '';
  const qTaxRegistrationNo = qConfig.taxRegistrationNo || '';
  const qBusinessRegNo = qConfig.businessRegNo || '';
  const qWebsiteUrl = qConfig.websiteUrl || '';
  const qColumnNameItem = qConfig.columnNameItem || 'Itemized Costs';
  const qColumnNameQty = qConfig.columnNameQty || 'Qty';
  const qColumnNamePrice = qConfig.columnNamePrice || 'Unit Price';
  const qColumnNameAmount = qConfig.columnNameAmount || 'Amount';

  if (actualIsQuotation) {
    return (
      <div 
        id="invoice-document"
        className="bg-white text-slate-900 p-8 sm:p-12 border border-slate-300 rounded-2xl max-w-4xl mx-auto premium-shadow print-card print:border-none print:shadow-none font-sans"
      >
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start justify-between pb-6 mb-6">
          {/* Left Column: Company Info */}
          <div>
            {qShowLogo && profile.logo ? (
              <img 
                src={profile.logo} 
                alt={profile.name || "Company Logo"} 
                className="h-16 w-auto object-contain mb-3 max-w-[200px]"
                referrerPolicy="no-referrer"
                crossOrigin={profile.logo.startsWith('data:') ? undefined : 'anonymous'}
              />
            ) : null}
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-800 tracking-tight">
              {profile.name || "Your Company Name"}
            </h1>
            <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
              <p>{streetAddress}</p>
              <p>{cityStateZip}</p>
              {qShowPhone && profile.phone && <p>Phone: {profile.phone}</p>}
              {qShowEmail && (
                <>
                  {faxNumber && <p>Fax: {faxNumber}</p>}
                  {emailAddress && <p>E-mail: {emailAddress}</p>}
                </>
              )}
              {qBusinessRegNo && <p>BRN: {qBusinessRegNo}</p>}
              {qTaxRegistrationNo && <p>VAT/TAX No: {qTaxRegistrationNo}</p>}
              {qWebsiteUrl && <p>Website: {qWebsiteUrl}</p>}
            </div>
          </div>

          {/* Right Column: Title and 2x2 Header Table */}
          <div className="flex flex-col items-end">
            <h2 style={{ color: qAccentColor }} className="text-3xl sm:text-4xl font-display font-black tracking-widest mb-4 text-right">
              {qTitle}
            </h2>
            
            <div className="w-full max-w-sm border border-slate-300 rounded-lg overflow-hidden shadow-xs bg-white">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr style={{ backgroundColor: qAccentColor }} className="text-white">
                    <td className="border-r border-slate-200/25 px-3 py-1.5 font-bold text-[10px] text-center uppercase font-mono w-1/2">QUOTE #</td>
                    <td className="px-3 py-1.5 font-bold text-[10px] text-center uppercase font-mono w-1/2">DATE</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="border-r border-slate-200 px-3 py-2 text-center font-bold text-slate-800 font-mono text-[11px]">{docNumber}</td>
                    <td className="px-3 py-2 text-center font-bold text-slate-800 font-mono text-[11px]">{invoice.date}</td>
                  </tr>
                  <tr style={{ backgroundColor: qAccentColor }} className="text-white">
                    <td className="border-r border-slate-200/25 px-3 py-1.5 font-bold text-[10px] text-center uppercase font-mono">CUSTOMER ID</td>
                    <td className="px-3 py-1.5 font-bold text-[10px] text-center uppercase font-mono">VALID UNTIL</td>
                  </tr>
                  <tr>
                    <td className="border-r border-slate-200 px-3 py-2 text-center font-semibold text-slate-600 font-mono text-[11px] truncate max-w-[140px]" title={invoice.customerPhone || 'N/A'}>
                      {invoice.customerPhone || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-slate-850 font-mono text-[11px]">{validUntil || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Customer Info & Prepared By section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 items-stretch">
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white">
            <div style={{ backgroundColor: qAccentColor }} className="text-white px-3.5 py-1.5 font-bold text-[10px] tracking-wider font-mono">
              CUSTOMER INFO
            </div>
            <div className="p-4 text-xs space-y-1.5 text-slate-700">
              <div className="font-extrabold text-sm text-slate-900">{invoice.customerName || "Walking Customer"}</div>
              {invoice.customerAddress ? (
                <div className="whitespace-pre-line text-slate-600 leading-relaxed font-medium">{invoice.customerAddress}</div>
              ) : (
                <div className="text-slate-400 italic font-mono">[No Address Provided]</div>
              )}
              {(invoice.customerPhone || invoice.customerEmail) && (
                <div className="pt-1.5 border-t border-slate-100 mt-1.5 text-[11px] text-slate-500 font-medium">
                  {invoice.customerPhone && <div className="flex items-center gap-1.5"><span>Phone:</span> <strong className="text-slate-700">{invoice.customerPhone}</strong></div>}
                  {invoice.customerEmail && <div className="flex items-center gap-1.5"><span>E-mail:</span> <strong className="text-slate-700">{invoice.customerEmail}</strong></div>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-end items-end text-right p-4">
            <span className="italic text-slate-400 text-xs font-serif">{qPreparedByTitle}:</span>
            <div className="font-extrabold text-slate-800 text-sm mt-1">{profile.signatureTitle || "Sales Representative"}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{profile.name}</div>
          </div>
        </div>

        {/* Constant Custom Document Fields (Global) */}
        {qConstantFields.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-300 rounded-xl bg-slate-50/50 mb-6 text-xs">
            {qConstantFields.map((field) => (
              <div key={field.id} className="space-y-0.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{field.key}</span>
                <span className="font-bold text-slate-700">{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description of Work block */}
        {qShowDescriptionOfWork && (
          <div className="border border-slate-300 rounded-xl overflow-hidden mt-6 shadow-2xs bg-white">
            <div style={{ backgroundColor: qAccentColor }} className="text-white px-3.5 py-1.5 font-bold text-[10px] tracking-wider font-mono">
              DESCRIPTION OF WORK
            </div>
            <div className="p-4 text-xs text-slate-700 min-h-[50px] leading-relaxed whitespace-pre-line bg-white font-medium">
              {invoice.notes || "This estimate is for the standard supply of goods and services as list below."}
            </div>
          </div>
        )}

        {/* Itemized Costs Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mt-6 shadow-2xs bg-white">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ backgroundColor: qAccentColor }} className="text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3.5 border-r border-slate-300/20 text-left font-mono">{qColumnNameItem}</th>
                <th className="py-2.5 px-2 border-r border-slate-300/20 text-center w-14 font-mono">{qColumnNameQty}</th>
                <th className="py-2.5 px-3 border-r border-slate-300/20 text-right w-24 font-mono">{qColumnNamePrice}</th>
                <th className="py-2.5 px-3.5 text-right w-28 font-mono">{qColumnNameAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No items added to this quotation.
                  </td>
                </tr>
              ) : (
                invoice.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-2.5 px-3.5 border-r border-slate-200 text-slate-900 font-medium">
                      <div className="font-bold">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-x-2">
                        {item.productCode && <span>Code: {item.productCode}</span>}
                        {item.selectedColor && !['default/none', 'default / none', 'default', 'none', ''].includes(item.selectedColor.trim().toLowerCase()) && (
                          <span>Color: {item.selectedColor}</span>
                        )}
                        {item.customFields?.map(f => f.value && (
                          <span key={f.id}>{f.name}: {f.value}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 border-r border-slate-200 text-center font-extrabold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-600">
                      {item.price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-extrabold text-slate-900">
                      {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
              {/* Fill with empty row padding if items length is small, to match the template style in the image */}
              {Array.from({ length: Math.max(0, 4 - invoice.items.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="h-7">
                  <td className="border-r border-slate-200 py-2 px-3">&nbsp;</td>
                  <td className="border-r border-slate-200 py-2 px-2">&nbsp;</td>
                  <td className="border-r border-slate-200 py-2 px-3">&nbsp;</td>
                  <td className="py-2 px-3">&nbsp;</td>
                </tr>
              ))}
              
              {/* Table Footer row containing "Thank you" and calculations */}
              <tr className="border-t border-slate-300">
                <td colSpan={2} rowSpan={4} className="py-4 px-4 italic text-slate-400 font-serif text-[11px] align-middle text-left border-r border-slate-300">
                  Thank you for your business!
                </td>
                <td className="py-2 px-2 border-r border-slate-200 font-bold text-[10px] text-right uppercase text-slate-500 font-mono align-middle bg-slate-50">
                  Subtotal
                </td>
                <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900 align-middle">
                  LKR {invoice.subtotal.toFixed(2)}
                </td>
              </tr>
              
              <tr className="border-t border-slate-200">
                <td className="py-2 px-2 border-r border-slate-200 font-bold text-[10px] text-right uppercase text-slate-500 font-mono align-middle bg-slate-50">
                  {invoice.discountAmount > 0 ? `Discount` : 'Other'}
                </td>
                <td className="py-2 px-3.5 text-right font-mono font-semibold text-slate-900 align-middle">
                  {invoice.discountAmount > 0 ? `-LKR ${invoice.discountAmount.toFixed(2)}` : '-'}
                </td>
              </tr>
              
              {invoice.deliveryCharges > 0 ? (
                <tr className="border-t border-slate-200">
                  <td className="py-2 px-2 border-r border-slate-200 font-bold text-[10px] text-right uppercase text-slate-500 font-mono align-middle bg-slate-50">
                    Delivery
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono font-semibold text-slate-900 align-middle">
                    LKR {invoice.deliveryCharges.toFixed(2)}
                  </td>
                </tr>
              ) : invoice.customCharges && invoice.customCharges.length > 0 ? (
                <tr className="border-t border-slate-200">
                  <td className="py-2 px-2 border-r border-slate-200 font-bold text-[10px] text-right uppercase text-slate-500 font-mono align-middle bg-slate-50">
                    {invoice.customCharges[0].name}
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono font-semibold text-slate-900 align-middle">
                    LKR {invoice.customCharges[0].amount.toFixed(2)}
                  </td>
                </tr>
              ) : (
                <tr className="border-t border-slate-200">
                  <td className="py-2 px-2 border-r border-slate-200 font-bold text-[10px] text-right uppercase text-slate-500 font-mono align-middle bg-slate-50">
                    Delivery
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono text-slate-400 align-middle">-</td>
                </tr>
              )}

              <tr className="border-t-2 border-slate-300 bg-slate-100">
                <td className="py-2.5 px-2 border-r border-slate-200 font-black text-[10px] text-right uppercase text-slate-700 font-mono align-middle">
                  Total Quote
                </td>
                <td style={{ color: qAccentColor }} className="py-2.5 px-3.5 text-right font-mono font-black text-[13px] align-middle whitespace-nowrap">
                  LKR {invoice.total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disclaimer Text */}
        {qShowTerms && (
          <>
            <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">
              This quotation is not a contract or a bill. It is our best guess at the total price for the service and goods described above. The customer will be billed after indicating acceptance of this quote. Payment will be due prior to the delivery of service and goods.
            </p>
            {invoice.notes && !qShowDescriptionOfWork && (
              <div className="mt-4 text-[10px] text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                {invoice.notes}
              </div>
            )}
            {profile.defaultTermsAndConditions?.trim() && (
              <div className="mt-4 text-[10px] text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-left">
                <span className="block font-bold text-[9px] uppercase tracking-wider mb-1" style={{ color: qAccentColor }}>Terms & Conditions</span>
                {profile.defaultTermsAndConditions.trim()}
              </div>
            )}
          </>
        )}

        {/* Bank Payment Info Box */}
        {qShowPaymentMethod && qPaymentBankName && (
          <div className="border border-slate-300 rounded-xl overflow-hidden mt-6 shadow-2xs bg-slate-50/20">
            <div style={{ backgroundColor: qAccentColor }} className="text-white px-3.5 py-1.5 font-bold text-[10px] tracking-wider font-mono">
              BANK REMITTANCE & PAYMENT DETAILS
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700 bg-white text-left">
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Bank Name</span>
                <span className="text-slate-800 text-[11px] font-bold">{qPaymentBankName}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Account Number</span>
                <span className="text-slate-800 text-[11px] font-mono font-extrabold">{qPaymentAccountNo || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Account Name</span>
                <span className="text-slate-800 text-[11px] font-bold">{qPaymentAccountName || profile.name || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Branch / Swift</span>
                <span className="text-slate-800 text-[11px] font-bold">{qPaymentBranch || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Acceptance Box */}
        {qShowAcceptance && (
          <div className="border border-slate-300 rounded-lg overflow-hidden mt-6 shadow-2xs bg-white">
            <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 font-bold text-[10px] text-slate-600 uppercase tracking-wider font-mono">
              Customer Acceptance
            </div>
            <div className="grid grid-cols-12 text-[10px]">
              <div className="col-span-6 border-r border-slate-300 p-3 min-h-[50px] flex flex-col justify-between">
                <span className="italic text-slate-300 font-serif text-xs">x</span>
                <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Signature</span>
              </div>
              <div className="col-span-4 border-r border-slate-300 p-3 min-h-[50px] flex flex-col justify-between">
                <span className="text-slate-200">&nbsp;</span>
                <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Printed Name</span>
              </div>
              <div className="col-span-2 p-3 min-h-[50px] flex flex-col justify-between">
                <span className="text-slate-200">&nbsp;</span>
                <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Date</span>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info Footer */}
        <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-150">
          If you have any questions, please contact <strong className="text-slate-600 font-bold">{profile.name}</strong> at <strong className="text-slate-600 font-bold">{profile.phone}</strong>{emailAddress ? <span> or via email at <strong className="text-slate-600 font-bold">{emailAddress}</strong></span> : ''}.
        </div>
      </div>
    );
  }

  // Otherwise, default back to original elegant invoice template layout
  const iConfig: Partial<DocumentFormatConfig> = profile.invoiceFormatConfig || {};
  const iTitle = iConfig.title || 'INVOICE';
  const iShowLogo = iConfig.showLogo !== false;
  const iShowPhone = iConfig.showPhone !== false;
  const iShowEmail = iConfig.showEmail !== false;
  const iShowSignature = iConfig.showSignature !== false;
  const iShowTerms = iConfig.showTerms !== false;
  const iShowAcceptance = iConfig.showAcceptance === true;
  const iAccentColor = iConfig.accentColor || '#4f46e5';

  // Extended properties for Invoice
  const iConstantFields = iConfig.constantFields || [];
  const iShowPaymentMethod = iConfig.showPaymentMethod || false;
  const iPaymentBankName = iConfig.paymentBankName || '';
  const iPaymentAccountNo = iConfig.paymentAccountNo || '';
  const iPaymentAccountName = iConfig.paymentAccountName || '';
  const iPaymentBranch = iConfig.paymentBranch || '';
  const iTaxRegistrationNo = iConfig.taxRegistrationNo || '';
  const iBusinessRegNo = iConfig.businessRegNo || '';
  const iWebsiteUrl = iConfig.websiteUrl || '';
  const iColumnNameItem = iConfig.columnNameItem || 'Product Details';
  const iColumnNameQty = iConfig.columnNameQty || 'Qty';
  const iColumnNamePrice = iConfig.columnNamePrice || 'Price';
  const iColumnNameAmount = iConfig.columnNameAmount || 'Total';

  return (
    <div 
      id="invoice-document"
      className="bg-white text-slate-800 p-8 sm:p-12 border border-slate-200 rounded-2xl max-w-3xl mx-auto premium-shadow print-card print:border-none print:shadow-none"
    >
      {/* Header Section */}
      <div style={{ borderColor: `${iAccentColor}20` }} className="flex flex-row justify-between items-start gap-6 border-b pb-6 mb-6">
        <div>
          {iShowLogo && (
            profile.logo ? (
              <img 
                src={profile.logo} 
                alt={profile.name || "Company Logo"} 
                className="h-16 w-auto object-contain mb-3 max-w-[200px]"
                referrerPolicy="no-referrer"
                crossOrigin={profile.logo.startsWith('data:') ? undefined : 'anonymous'}
              />
            ) : (
              <div style={{ backgroundColor: iAccentColor }} className="h-14 w-14 text-white flex items-center justify-center rounded-xl font-display text-2xl font-bold mb-3">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'B'}
              </div>
            )
          )}
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight leading-snug">
            {profile.name || "Your Company Name"}
          </h1>
          
          <div className="mt-3 space-y-1.5 text-xs text-slate-500 text-left">
            {iShowPhone && profile.phone && (
              <div className="flex items-center gap-2 min-h-[20px]">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 font-medium">{profile.phone}</span>
              </div>
            )}
            {iShowEmail && profile.extraDetails && profile.extraDetails.map((detail) => (
              <div key={detail.id} className="flex items-center gap-2 min-h-[22px]">
                <span className="font-bold text-[9px] py-0.5 px-2 bg-slate-100 rounded text-slate-500 uppercase tracking-wider shrink-0 inline-flex items-center justify-center min-h-[18px]">
                  {detail.key}
                </span>
                <span className="text-slate-600 font-medium break-all flex-1">{detail.value}</span>
              </div>
            ))}
            {iBusinessRegNo && (
              <div className="flex items-center gap-2 min-h-[20px]">
                <span className="font-bold text-[9px] py-0.5 px-2 bg-slate-100 rounded text-slate-500 uppercase tracking-wider shrink-0">BRN</span>
                <span className="text-slate-600 font-medium">{iBusinessRegNo}</span>
              </div>
            )}
            {iTaxRegistrationNo && (
              <div className="flex items-center gap-2 min-h-[20px]">
                <span className="font-bold text-[9px] py-0.5 px-2 bg-slate-100 rounded text-slate-500 uppercase tracking-wider shrink-0">VAT/TAX</span>
                <span className="text-slate-600 font-medium">{iTaxRegistrationNo}</span>
              </div>
            )}
            {iWebsiteUrl && (
              <div className="flex items-center gap-2 min-h-[20px]">
                <span className="font-bold text-[9px] py-0.5 px-2 bg-slate-100 rounded text-slate-500 uppercase tracking-wider shrink-0">WEB</span>
                <span className="text-slate-600 font-medium">{iWebsiteUrl}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0">
          {invoice.status === 'draft' ? (
            <div className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
              ⚠️ Saved Draft
            </div>
          ) : (
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
              ✓ Finalized Bill
            </div>
          )}
          <h2 style={{ color: iAccentColor }} className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight mb-1">
            {iTitle}
          </h2>
          <div className="text-xs text-slate-500 space-y-1 font-mono">
            <div>
              <span className="text-slate-400">No:</span>{" "}
              <span className="font-bold text-slate-700">{docNumber}</span>
            </div>
            <div><span className="text-slate-400">Date:</span> {invoice.date || new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Bill To / Bill From Grid */}
      <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-slate-100">
        <div className="space-y-3">
          <h3 style={{ borderColor: iAccentColor }} className="font-display font-bold text-[10px] tracking-wider border-l-4 pl-2.5 leading-none uppercase">BILL TO</h3>
          <div className="space-y-1.5 text-xs text-slate-600 mt-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <User style={{ color: iAccentColor }} size={14} className="shrink-0" />
              <span>{invoice.customerName || "Walking Customer"}</span>
            </div>
            {invoice.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{invoice.customerPhone}</span>
              </div>
            )}
            {invoice.customerWhatsapp && (
              <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-emerald-500 shrink-0" />
                <span>{invoice.customerWhatsapp} (WhatsApp)</span>
              </div>
            )}
            {invoice.customerEmail && (
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-sky-500 shrink-0" />
                <span>{invoice.customerEmail}</span>
              </div>
            )}
            {invoice.customerAddress && (
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="whitespace-pre-line text-slate-600 leading-normal">{invoice.customerAddress}</span>
              </div>
            )}
            {invoice.customerCustomFields && invoice.customerCustomFields.length > 0 && (
              <div className="pt-2 border-t border-slate-100/60 mt-1.5 space-y-1.5 text-xs text-slate-500">
                {invoice.customerCustomFields.map((field) => (
                  <div key={field.id} className="flex gap-2 min-h-[18px] items-center">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] w-24 shrink-0">{field.key}:</span>
                    <span className="text-slate-600 font-semibold text-xs flex-1 truncate">{field.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {invoice.customFields.length > 0 && (
            <>
              <h3 className="font-display font-bold text-[10px] tracking-wider text-slate-400 border-l-4 border-slate-300 pl-2.5 leading-none uppercase">
                INVOICE NOTES
              </h3>
              <div className="space-y-1.5 text-xs text-slate-605 mt-2">
                {invoice.customFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 min-h-[18px]">
                    <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] w-24 shrink-0 truncate">{field.key}:</span>
                    <span className="text-slate-600 font-semibold text-xs flex-1 truncate">{field.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Constant Custom Document Fields (Global) */}
      {iConstantFields.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/30 mb-6 text-xs text-left">
          {iConstantFields.map((field) => (
            <div key={field.id} className="space-y-0.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{field.key}</span>
              <span className="font-bold text-slate-700">{field.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Items Table */}
      <div className="overflow-x-auto -mx-8 sm:-mx-12 px-8 sm:px-12 mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-2.5 pl-1 font-display">{iColumnNameItem}</th>
              <th className="py-2.5 px-3 text-center w-16 font-display">{iColumnNameQty}</th>
              <th className="py-2.5 px-3 text-right w-32 font-display whitespace-nowrap">{iColumnNamePrice}</th>
              <th className="py-2.5 pr-1 text-right w-36 font-display whitespace-nowrap">{iColumnNameAmount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {invoice.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                  No items added to this invoice.
                </td>
              </tr>
            ) : (
              invoice.items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50/50">
                  <td className="py-3 pl-1">
                    <div className="font-semibold text-slate-900 text-xs">{item.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 space-y-1">
                      <div>Code: {item.productCode}</div>
                      {item.selectedColor && 
                       !['default/none', 'default / none', 'default', 'none', ''].includes(item.selectedColor.trim().toLowerCase()) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">Color:</span>
                          <span className="text-slate-800 font-medium">
                            {item.selectedColor}
                          </span>
                        </div>
                      )}
                      {item.customFields.map((f) => f.value && (
                        <div key={f.id} className="flex items-center gap-1 mt-0.5">
                          <span className="text-slate-500 font-semibold uppercase text-[9px] tracking-wider">{f.name}:</span>
                          <span className="text-slate-800 font-medium">
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-950 font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                    LKR {item.price.toFixed(2)}
                  </td>
                  <td className="py-3 pr-1 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Calculations & Summary Section */}
      <div className="flex flex-row justify-end items-stretch gap-6 pt-3 border-t border-slate-150">
        <div className="w-80 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span>Subtotal:</span>
            <span className="font-mono text-slate-800">LKR {invoice.subtotal.toFixed(2)}</span>
          </div>
          
          {invoice.discountValue > 0 && (
            <div className="flex justify-between items-center text-emerald-600 font-medium">
              <span>
                Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'}):
              </span>
              <span className="font-mono">- LKR {invoice.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {invoice.deliveryCharges > 0 && (
            <div className="flex justify-between items-center text-slate-500">
              <span>Delivery Charges:</span>
              <span className="font-mono text-slate-800">LKR {invoice.deliveryCharges.toFixed(2)}</span>
            </div>
          )}

          {invoice.customCharges && invoice.customCharges.map((charge) => (
            <div key={charge.id} className="flex justify-between items-center text-slate-500">
              <span>{charge.name}:</span>
              <span className="font-mono text-slate-800">LKR {charge.amount.toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderColor: `${iAccentColor}20` }} className="flex justify-between items-center pt-2.5 border-t text-sm font-bold text-slate-900">
            <span className="font-display uppercase tracking-wider text-[11px] text-slate-500 font-black">Grand Total:</span>
            <span style={{ color: iAccentColor }} className="font-mono text-base font-extrabold whitespace-nowrap">LKR {invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bank Payment Info Box */}
      {iShowPaymentMethod && iPaymentBankName && (
        <div style={{ borderColor: `${iAccentColor}20` }} className="border rounded-xl overflow-hidden mt-6 bg-slate-50/10 text-left">
          <div style={{ backgroundColor: iAccentColor }} className="text-white px-3.5 py-1.5 font-bold text-[10px] tracking-wider font-mono">
            DIRECT BANK REMITTANCE INSTRUCTIONS
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700 bg-white">
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Bank Name</span>
              <span className="text-slate-800 text-[11px] font-bold">{iPaymentBankName}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Account Number</span>
              <span className="text-slate-800 text-[11px] font-mono font-extrabold">{iPaymentAccountNo || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Account Holder</span>
              <span className="text-slate-800 text-[11px] font-bold">{iPaymentAccountName || profile.name || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Branch / Code</span>
              <span className="text-slate-800 text-[11px] font-bold">{iPaymentBranch || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Acceptance Box (Optional) */}
      {iShowAcceptance && (
        <div className="border border-slate-300 rounded-lg overflow-hidden mt-6 shadow-2xs bg-white">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 font-bold text-[10px] text-slate-600 uppercase tracking-wider font-mono">
            Customer Acknowledgment & Receipt
          </div>
          <div className="grid grid-cols-12 text-[10px]">
            <div className="col-span-6 border-r border-slate-300 p-3 min-h-[50px] flex flex-col justify-between">
              <span className="italic text-slate-300 font-serif text-xs">x</span>
              <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Signature</span>
            </div>
            <div className="col-span-4 border-r border-slate-300 p-3 min-h-[50px] flex flex-col justify-between">
              <span className="text-slate-200">&nbsp;</span>
              <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Printed Name</span>
            </div>
            <div className="col-span-2 p-3 min-h-[50px] flex flex-col justify-between">
              <span className="text-slate-200">&nbsp;</span>
              <span className="text-slate-400 uppercase tracking-wider text-[8px] font-mono font-bold">Date</span>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Footer Note & Signature Section */}
      <div className="mt-10 pt-5 border-t border-slate-100 flex flex-row justify-between items-end gap-6 text-left">
        {iShowTerms && (invoice.notes || profile.defaultTermsAndConditions?.trim()) ? (
          <div className="flex-1 max-w-md">
            <div style={{ color: iAccentColor }} className="text-[9px] font-bold uppercase tracking-wider mb-1">
              Terms & Custom Notes
            </div>
            <div className="text-[10px] text-slate-600 leading-relaxed font-medium whitespace-pre-line bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              {invoice.notes}
              {invoice.notes && profile.defaultTermsAndConditions?.trim() && "\n\n"}
              {profile.defaultTermsAndConditions?.trim() && `Terms & Conditions:\n${profile.defaultTermsAndConditions.trim()}`}
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 italic max-w-sm leading-relaxed self-end">
            "Thank you for your business! Please keep this copy for your records."
          </div>
        )}
        
        {/* Dynamic Signature Stamp */}
        {iShowSignature && (
          <div className="flex flex-col items-center shrink-0 min-w-[160px]">
            {profile.signature ? (
              <img 
                src={profile.signature} 
                alt="Authorized Signature" 
                className="h-11 w-auto max-w-[140px] object-contain mb-1"
                referrerPolicy="no-referrer"
                crossOrigin={profile.signature.startsWith('data:') ? undefined : 'anonymous'}
              />
            ) : (
              <div className="h-11"></div>
            )}
            <div className="w-36 border-t border-slate-300 my-1"></div>
            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest text-center">
              {profile.signatureTitle || "Authorized Signatory"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
