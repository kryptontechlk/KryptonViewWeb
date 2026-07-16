export interface ExtraDetail {
  id: string;
  key: string;
  value: string;
}

export interface DocumentFormatConfig {
  title: string;
  showLogo: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showSignature: boolean;
  showTerms: boolean;
  showAcceptance: boolean;
  showDescriptionOfWork: boolean;
  defaultNotes: string;
  preparedByTitle: string;
  accentColor: string;
  // Extended layout format customization
  constantFields?: ExtraDetail[];
  showPaymentMethod?: boolean;
  paymentBankName?: string;
  paymentAccountNo?: string;
  paymentAccountName?: string;
  paymentBranch?: string;
  taxRegistrationNo?: string;
  businessRegNo?: string;
  websiteUrl?: string;
  columnNameItem?: string;
  columnNameQty?: string;
  columnNamePrice?: string;
  columnNameAmount?: string;
}

export interface CompanyProfile {
  name: string;
  logo: string; // Base64 data URL or external URL
  phone: string;
  extraDetails: ExtraDetail[];
  invoicePrefix: string;      // Premium sequential configuration
  nextInvoiceNumber: number;  // Keeps track of the next sequence
  signature?: string;         // Base64 data URL or external URL for signature image
  signatureTitle?: string;    // E.g. "Authorized Signatory", "Manager"
  customProductAttributes?: { id: string; name: string }[];
  quotationPrefix?: string;   // Separate quotation prefix e.g. QT
  nextQuotationNumber?: number; // Separate quotation sequential tracker
  invoiceFormatConfig?: DocumentFormatConfig;
  quotationFormatConfig?: DocumentFormatConfig;
  defaultTermsAndConditions?: string;
  // Extended public storefront fields
  vision?: string;
  mission?: string;
  experience?: string;
  introduction?: string;
  whatsappNumber?: string;
  servicesList?: Service[];
  slogan?: string;
  address?: string;
  email?: string;
  website?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  iconName?: string; // Lucide icon names like Hammer, Award, Settings etc.
  priceInfo?: string;
}

export interface ProductCustomField {
  id: string;
  name: string;
  value: string;
}

export interface PurchaseHistoryRecord {
  id: string;
  date: string;
  purchasePrice: number;
  qtyAdded: number;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  ownerId?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  colors: string[]; // List of available colors
  customFields: ProductCustomField[];
  ownerId?: string;
  // Extended fields for the public catalog storefront
  category?: string;
  brand?: string;
  model?: string;
  discountedPrice?: number;
  shortDescription?: string;
  warranty?: string;
  packageIncludes?: string;
  images?: string[]; // Multiple images as base64 or links
  isAvailable?: boolean;
  isBestSeller?: boolean;
  createdTime?: string;
  // Financial & Inventory fields
  purchasePrice?: number;
  stock?: number;
  isService?: boolean;
  purchaseHistory?: PurchaseHistoryRecord[];
  showInStorefront?: boolean;
}

export interface InvoiceItem {
  id: string; // unique item reference in this invoice
  productId: string;
  productName: string;
  productCode: string;
  price: number;
  selectedColor: string;
  quantity: number;
  customFields: ProductCustomField[]; // Snapshot of custom fields for the product
  originalPrice?: number;
  discountedPrice?: number;
  useDiscount?: boolean;
  // Financial Snapshot
  purchasePrice?: number;
  isService?: boolean;
}

export interface InvoiceCustomField {
  id: string;
  key: string;
  value: string;
  quantity?: number;
}

export interface CustomCharge {
  id: string;
  name: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  customerCustomFields?: InvoiceCustomField[];
  customerWhatsapp?: string;
  items: InvoiceItem[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  deliveryCharges: number;
  customCharges?: CustomCharge[];
  customFields: InvoiceCustomField[];
  subtotal: number;
  discountAmount: number;
  total: number;
  status: 'draft' | 'final'; // Dynamic invoice routing status
  notes?: string;                 // Terms and conditions or custom notes
  ownerId?: string;
  totalOriginalSubtotal?: number;
  totalProductDiscount?: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  customerCustomFields?: InvoiceCustomField[];
  customerWhatsapp?: string;
  items: InvoiceItem[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  deliveryCharges: number;
  customCharges?: CustomCharge[];
  customFields: InvoiceCustomField[];
  subtotal: number;
  discountAmount: number;
  total: number;
  status: 'draft' | 'final'; // quotation status
  notes?: string;                 // Terms and conditions or custom notes
  ownerId?: string;
  validUntil?: string;            // Valid until date
  totalOriginalSubtotal?: number;
  totalProductDiscount?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  subscriptionPlan?: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus?: 'active' | 'expired' | 'trialing' | 'unpaid';
  subscriptionExpiresAt?: string;
}

export interface Category {
  id: string;
  name: string;
  ownerId?: string;
  createdAt?: string;
}

export interface TrashItem {
  id: string;
  type: 'product' | 'invoice' | 'quotation' | 'category';
  itemData: any; // original object data
  deletedAt: string;
  ownerId?: string;
}


