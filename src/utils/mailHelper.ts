import { Invoice, CompanyProfile } from '../types';

/**
 * Formats a clean, professional, and visually structured email/WhatsApp message summary 
 * that dynamically adapts to both Invoices and Quotations/Estimates.
 */
export function formatInvoiceMessage(
  invoice: Invoice,
  profileName: string,
  profilePhone: string
): string {
  const isQuote = !invoice.invoiceNumber && !!(invoice as any).quotationNumber;
  const docNum = invoice.invoiceNumber || (invoice as any).quotationNumber || 'Document';
  const prefix = isQuote ? 'Quotation' : 'Invoice';

  const itemsText = invoice.items
    .map(item => {
      const colorSuffix = item.selectedColor && item.selectedColor !== 'Default' && item.selectedColor !== 'None' 
        ? ` (${item.selectedColor})` 
        : '';
      return `- ${item.productName}${colorSuffix} x${item.quantity} @ LKR ${item.price.toFixed(2)} = LKR ${(item.price * item.quantity).toFixed(2)}`;
    })
    .join('\n');

  // Format custom charges dynamically, making 'vat' lowercase
  const customChargesText = invoice.customCharges && invoice.customCharges.length > 0
    ? '\n' + invoice.customCharges.map(c => `${c.name.toLowerCase() === 'vat' ? 'vat' : c.name}: LKR ${c.amount.toFixed(2)}`).join('\n')
    : '';

  const greeting = isQuote
    ? `Dear ${invoice.customerName || 'Customer'},\n\nThank you for requesting a quotation. Please find your quotation summary below:`
    : `Dear ${invoice.customerName || 'Customer'},\n\nThank you for your business. Please find your invoice summary below:`;

  const validUntilText = isQuote && (invoice as any).validUntil
    ? `Valid Until: ${(invoice as any).validUntil}\n`
    : '';

  const docDetails = `--------------------------------------------------
${prefix.toUpperCase()} DETAILS
--------------------------------------------------
${prefix} Number: ${docNum}
Date: ${invoice.date}
${validUntilText}Store Name: ${profileName || 'Our Store'}
Phone: ${profilePhone || 'N/A'}`;

  const footerText = isQuote
    ? `If you have any questions or would like to proceed with this quotation, please contact us at ${profilePhone || 'our phone number'}.`
    : `If you have any questions, feel free to contact us at ${profilePhone || 'our phone number'}.`;

  return `${greeting}

${docDetails}

--------------------------------------------------
ITEMS LISTED
--------------------------------------------------
${itemsText}

--------------------------------------------------
SUMMARY
--------------------------------------------------
Subtotal: LKR ${invoice.subtotal.toFixed(2)}
Discount: LKR ${invoice.discountAmount.toFixed(2)}
Delivery/Transport: LKR ${invoice.deliveryCharges.toFixed(2)}${customChargesText}

GRAND TOTAL: LKR ${invoice.total.toFixed(2)}

--------------------------------------------------
PDF ATTACHMENT
--------------------------------------------------

${footerText}

Best regards,
${profileName || 'Management'}`;
}

/**
 * Generates a clean web link to compose an email in Gmail web view.
 */
export function getGmailComposeLink(
  invoice: Invoice,
  profile: CompanyProfile,
  recipientEmail: string
): string {
  const isQuote = !invoice.invoiceNumber && !!(invoice as any).quotationNumber;
  const docNum = invoice.invoiceNumber || (invoice as any).quotationNumber || 'Document';
  const prefix = isQuote ? 'Quotation' : 'Invoice';
  const subject = `${prefix} ${docNum} from ${profile.name || 'Our Store'}`;
  const body = formatInvoiceMessage(invoice, profile.name, profile.phone);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Cleans and formats Sri Lankan phone numbers specifically for WhatsApp API integration.
 * Correctly handles +94, 07..., and 9-digit numbers starting with 7.
 */
export function cleanSriLankanPhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/[^0-9]/g, '');
  // Format local 10-digit Sri Lankan numbers starting with 0
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  }
  // Format local 9-digit numbers starting with 7
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '94' + cleaned;
  }
  return cleaned;
}

/**
 * Generates the ideal WhatsApp API link. Uses the official, universally robust
 * wa.me format which seamlessly redirects to WhatsApp Web or desktop on computers,
 * and launches the native WhatsApp application on mobile devices.
 */
export function getWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanSriLankanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
