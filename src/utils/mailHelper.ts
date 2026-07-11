import { Invoice, CompanyProfile } from '../types';

export function formatInvoiceMessage(
  invoice: Invoice,
  profileName: string,
  profilePhone: string
): string {
  const itemsText = invoice.items
    .map(item => {
      const colorSuffix = item.selectedColor && item.selectedColor !== 'Default' && item.selectedColor !== 'None' 
        ? ` (${item.selectedColor})` 
        : '';
      return `- ${item.productName}${colorSuffix} x${item.quantity} @ LKR ${item.price.toFixed(2)} = LKR ${(item.price * item.quantity).toFixed(2)}`;
    })
    .join('\n');

  // Format custom charges dynamically, making 'vat' lowercase as specified in user request template
  const customChargesText = invoice.customCharges && invoice.customCharges.length > 0
    ? '\n' + invoice.customCharges.map(c => `${c.name.toLowerCase() === 'vat' ? 'vat' : c.name}: LKR ${c.amount.toFixed(2)}`).join('\n')
    : '';

  return `Dear ${invoice.customerName || 'Customer'},

Thank you for your business. Please find your invoice summary below:

--------------------------------------------------
INVOICE DETAILS
--------------------------------------------------
Invoice Number: ${invoice.invoiceNumber}
Date: ${invoice.date}
Store Name: ${profileName || 'Our Store'}
Phone: ${profilePhone || 'N/A'}

--------------------------------------------------
ITEMS ORDERED
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

If you have any questions, feel free to contact us at ${profilePhone || 'our phone number'}.

Best regards,
${profileName || 'Management'}`;
}

export function getGmailComposeLink(
  invoice: Invoice,
  profile: CompanyProfile,
  recipientEmail: string
): string {
  const subject = `Invoice ${invoice.invoiceNumber} from ${profile.name || 'Our Store'}`;
  const body = formatInvoiceMessage(invoice, profile.name, profile.phone);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

