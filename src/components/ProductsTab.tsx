import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductCustomField, CompanyProfile, Category, PurchaseHistoryRecord } from '../types';
import { 
  Plus, 
  Trash, 
  Edit3, 
  FileBox, 
  Check, 
  Search, 
  PlusCircle, 
  AlertCircle, 
  Settings, 
  X,
  Grid,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Percent,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Download,
  History,
  Calendar,
  Wrench,
  Info,
  ShieldCheck
} from 'lucide-react';

interface ProductsTabProps {
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
}

export default function ProductsTab({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  profile,
  onUpdateProfile,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: ProductsTabProps) {
  // Mode setup: adding vs editing
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Product state forms
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [warranty, setWarranty] = useState('');
  const [packageIncludes, setPackageIncludes] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [showInStorefront, setShowInStorefront] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  // Financial, Inventory, and Purchase History states
  const [purchasePrice, setPurchasePrice] = useState('');
  const [stock, setStock] = useState('');
  const [isService, setIsService] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRecord[]>([]);
  
  // New purchase history batch record form states
  const [newBatchPrice, setNewBatchPrice] = useState('');
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchNotes, setNewBatchNotes] = useState('');
  
  // Custom templates fields state
  const [customFields, setCustomFields] = useState<ProductCustomField[]>([]);

  // Searching catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('All');

  // Local validation states
  const [errorMsg, setErrorMsg] = useState('');
  const [showManageAttributes, setShowManageAttributes] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editingAttrName, setEditingAttrName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Manager States
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Default initial categories backup
  const defaultCategories = [
    'Electronics',
    'Computers & Accessories',
    'Mobile Phones',
    'Audio & Speakers',
    'Home Appliances',
    'Cables & Adapters',
    'Office Equipment',
    'Hardware & Tools'
  ];

  // Get dynamic categories list from props, fallback to defaults
  const allCategories = (categories.length > 0 ? categories.map(c => c.name) : defaultCategories).sort();

  // For unique categories in filter selection
  const uniqueCategories = allCategories;

  // Get dynamic brands list from existing products
  const uniqueBrands = Array.from(
    new Set(
      products
        .map(p => p.brand)
        .filter((b): b is string => !!b && b.trim() !== '')
    )
  ).sort();

  // Get active attributes templates (with fallback)
  const attributeTemplates = profile.customProductAttributes || [
    { id: 'ca1', name: 'Brand' },
    { id: 'ca2', name: 'Model' },
    { id: 'ca3', name: 'Warranty' },
    { id: 'ca4', name: 'Material' },
    { id: 'ca5', name: 'Size' },
    { id: 'ca6', name: 'Weight' },
    { id: 'ca7', name: 'Made In' }
  ];

  // Initialize fields based on current templates
  const getInitializedFields = (existingFields: ProductCustomField[]) => {
    if (!existingFields || existingFields.length === 0) {
      return attributeTemplates.map(t => ({
        id: crypto.randomUUID(),
        name: t.name,
        value: ''
      }));
    }

    const merged = [...existingFields];
    attributeTemplates.forEach(t => {
      const alreadyExists = existingFields.some(ef => ef.name.trim().toLowerCase() === t.name.trim().toLowerCase());
      if (!alreadyExists && t.name.trim() !== '') {
        merged.push({
          id: crypto.randomUUID(),
          name: t.name,
          value: ''
        });
      }
    });
    return merged;
  };

  // Sync customFields when entering adding/editing mode or templates list changes
  useEffect(() => {
    if (!editingId) {
      setCustomFields(getInitializedFields([]));
    } else {
      const currentEditingProduct = products.find(p => p.id === editingId);
      if (currentEditingProduct) {
        setCustomFields(getInitializedFields(currentEditingProduct.customFields || []));
      }
    }
  }, [editingId, profile.customProductAttributes]);

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  // Create global attribute template
  const handleCreateAttribute = () => {
    const trimmed = newAttributeName.trim();
    if (!trimmed) return;

    if (attributeTemplates.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Attribute "${trimmed}" already exists.`);
      return;
    }

    const updatedTemplates = [
      ...attributeTemplates,
      { id: crypto.randomUUID(), name: trimmed }
    ];

    onUpdateProfile({
      ...profile,
      customProductAttributes: updatedTemplates
    });

    setNewAttributeName('');
    setErrorMsg('');

    setCustomFields(prev => {
      const alreadyHas = prev.some(f => f.name.toLowerCase() === trimmed.toLowerCase());
      if (!alreadyHas) {
        return [...prev, { id: crypto.randomUUID(), name: trimmed, value: '' }];
      }
      return prev;
    });
  };

  const handleStartEditAttribute = (id: string, name: string) => {
    setEditingAttrId(id);
    setEditingAttrName(name);
  };

  const handleSaveEditedAttribute = (id: string) => {
    const trimmed = editingAttrName.trim();
    if (!trimmed) return;

    if (attributeTemplates.some(t => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Attribute "${trimmed}" already exists.`);
      return;
    }

    const oldAttr = attributeTemplates.find(t => t.id === id);
    const oldName = oldAttr ? oldAttr.name : '';

    const updatedTemplates = attributeTemplates.map(t => 
      t.id === id ? { ...t, name: trimmed } : t
    );

    onUpdateProfile({
      ...profile,
      customProductAttributes: updatedTemplates
    });

    setEditingAttrId(null);
    setEditingAttrName('');
    setErrorMsg('');

    if (oldName) {
      setCustomFields(prev => 
        prev.map(f => f.name.toLowerCase() === oldName.toLowerCase() ? { ...f, name: trimmed } : f)
      );
    }
  };

  const handleDeleteAttribute = (id: string) => {
    const targetAttr = attributeTemplates.find(t => t.id === id);
    const targetName = targetAttr ? targetAttr.name : '';

    const updatedTemplates = attributeTemplates.filter(t => t.id !== id);

    onUpdateProfile({
      ...profile,
      customProductAttributes: updatedTemplates
    });

    setErrorMsg('');

    if (targetName) {
      setCustomFields(prev => 
        prev.filter(f => !(f.name.toLowerCase() === targetName.toLowerCase() && f.value.trim() === ''))
      );
    }
  };

  // Image upload handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: any) => {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Each image must be smaller than 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Reset form parameters
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setPrice('');
    setBrand('');
    setModel('');
    setCategory('');
    setCustomCategory('');
    setIsAddingCustomCategory(false);
    setDiscountedPrice('');
    setShortDescription('');
    setWarranty('');
    setPackageIncludes('');
    setIsAvailable(true);
    setIsBestSeller(false);
    setShowInStorefront(true);
    setImages([]);
    setCustomFields(getInitializedFields([]));
    setErrorMsg('');
    setPurchasePrice('');
    setStock('');
    setIsService(false);
    setPurchaseHistory([]);
    setNewBatchPrice('');
    setNewBatchQty('');
    setNewBatchNotes('');
  };

  // Add or Update product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) return setErrorMsg('Product Name is required.');

    // Fields can be null/empty, we handle default values safely
    const finalCode = code.trim() ? code.trim().toUpperCase() : `PRD-${Date.now().toString().slice(-5)}`;
    const finalPrice = price ? Number(price) : 0;
    if (isNaN(finalPrice) || finalPrice < 0) {
      return setErrorMsg('Price must be a valid positive number.');
    }

    const finalCategory = isAddingCustomCategory 
      ? (customCategory.trim() || 'General') 
      : (category || 'General');

    const discPriceNum = discountedPrice ? Number(discountedPrice) : undefined;
    if (discPriceNum !== undefined) {
      if (isNaN(discPriceNum) || discPriceNum <= 0) {
        return setErrorMsg('Discounted price must be a valid positive number.');
      }
      if (discPriceNum >= finalPrice && finalPrice > 0) {
        return setErrorMsg('Discounted price must be lower than the standard base price.');
      }
    }

    // Check duplicate code (ignoring current being edited) only if they typed a code
    if (code.trim()) {
      const isDuplicate = products.some(p => p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== editingId);
      if (isDuplicate) {
        return setErrorMsg(`Product code "${code}" already exists in the catalog directory.`);
      }
    }

    // Build specifications from the visual key value pairs + Brand/Model parameters
    const specsList = customFields.filter(f => f.name.trim() !== '' && f.value.trim() !== '');

    const payload: Product = {
      id: editingId || crypto.randomUUID(),
      name: name.trim(),
      code: finalCode,
      price: finalPrice,
      brand: brand.trim(),
      model: model.trim(),
      category: finalCategory,
      discountedPrice: discPriceNum,
      shortDescription: shortDescription.trim(),
      warranty: warranty.trim(),
      packageIncludes: packageIncludes.trim(),
      isAvailable,
      isBestSeller,
      showInStorefront,
      images: images.length > 0 ? images : undefined,
      colors: [],
      customFields: specsList,
      createdTime: editingId ? (products.find(p => p.id === editingId)?.createdTime || new Date().toISOString()) : new Date().toISOString(),
      purchasePrice: purchasePrice ? Number(purchasePrice) : 0,
      stock: isService ? 0 : (stock ? Number(stock) : 0),
      isService,
      purchaseHistory: purchaseHistory
    };

    // Auto-save custom category to collection if it doesn't exist
    if (isAddingCustomCategory && customCategory.trim() !== '') {
      const exists = categories.some(c => c.name.toLowerCase() === customCategory.trim().toLowerCase());
      if (!exists) {
        onAddCategory({
          id: crypto.randomUUID(),
          name: customCategory.trim()
        });
      }
    }

    if (editingId) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }

    resetForm();
  };

  // Start editing a product
  const handleStartEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCode(product.code);
    setPrice(product.price.toString());
    setBrand(product.brand || '');
    setModel(product.model || '');
    
    if (allCategories.includes(product.category || '')) {
      setCategory(product.category || '');
      setIsAddingCustomCategory(false);
    } else {
      setCategory('');
      setCustomCategory(product.category || '');
      setIsAddingCustomCategory(true);
    }

    setDiscountedPrice(product.discountedPrice ? product.discountedPrice.toString() : '');
    setShortDescription(product.shortDescription || '');
    setWarranty(product.warranty || '');
    setPackageIncludes(product.packageIncludes || '');
    setIsAvailable(product.isAvailable !== false); // default to true
    setIsBestSeller(!!product.isBestSeller);
    setShowInStorefront(product.showInStorefront !== false);
    setImages(product.images || []);
    setCustomFields(getInitializedFields(product.customFields || []));
    setErrorMsg('');
    
    // Financial & stock initialization
    setPurchasePrice(product.purchasePrice ? product.purchasePrice.toString() : '');
    setStock(product.stock ? product.stock.toString() : '');
    setIsService(!!product.isService);
    setPurchaseHistory(product.purchaseHistory || []);
    setNewBatchPrice('');
    setNewBatchQty('');
    setNewBatchNotes('');
  };

  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'SKU Code',
      'Base Price',
      'Category',
      'Brand',
      'Model',
      'Discounted Price',
      'Short Description',
      'Warranty',
      'Package Includes',
      'In Stock',
      'Best Seller'
    ];
    
    const sampleRow = [
      'Asus Vivobook Pro 15',
      'LP-ASUS-15',
      '245000',
      'Electronics',
      'Asus',
      'K3500-PH',
      '235000',
      'Sleek 15.6 OLED laptop for creators',
      '2 Years Agent Warranty',
      'Laptop, Charger, Backpack, User Guide',
      'true',
      'true'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'SKU Code',
      'Base Price',
      'Category',
      'Brand',
      'Model',
      'Discounted Price',
      'Short Description',
      'Warranty',
      'Package Includes',
      'In Stock',
      'Best Seller'
    ];
    
    const rows = products.map(p => [
      p.name,
      p.code,
      p.price,
      p.category || '',
      p.brand || '',
      p.model || '',
      p.discountedPrice || '',
      p.shortDescription || '',
      p.warranty || '',
      p.packageIncludes || '',
      p.isAvailable !== false ? 'true' : 'false',
      p.isBestSeller ? 'true' : 'false'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          alert("CSV file is empty or only contains headers.");
          return;
        }

        let importedCount = 0;
        let duplicateCount = 0;

        // Simple CSV cell parser that handles quotes properly
        const parseCSVRow = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ''));
          return result;
        };

        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVRow(lines[i]);
          if (cells.length < 3) continue; // Must have at least name, code, price

          const nameVal = cells[0];
          const codeVal = cells[1];
          const priceVal = Number(cells[2]);

          if (!nameVal || !codeVal || isNaN(priceVal)) {
            continue;
          }

          // Check duplicates
          const isDuplicate = products.some(p => p.code.toLowerCase() === codeVal.toLowerCase());
          if (isDuplicate) {
            duplicateCount++;
            continue;
          }

          const categoryVal = cells[3] || 'Electronics';
          const brandVal = cells[4] || '';
          const modelVal = cells[5] || '';
          const discPriceVal = cells[6] ? Number(cells[6]) : undefined;
          const descVal = cells[7] || '';
          const warrantyVal = cells[8] || '';
          const pkgVal = cells[9] || '';
          const inStockVal = cells[10] ? cells[10].toLowerCase() === 'true' : true;
          const bestSellerVal = cells[11] ? cells[11].toLowerCase() === 'true' : false;

          // Automatically add category to collection if it doesn't exist
          if (categoryVal) {
            const catExists = categories.some(c => c.name.toLowerCase() === categoryVal.toLowerCase());
            if (!catExists) {
              await onAddCategory({
                id: crypto.randomUUID(),
                name: categoryVal,
              });
            }
          }

          const newProduct: Product = {
            id: crypto.randomUUID(),
            name: nameVal,
            code: codeVal.toUpperCase(),
            price: priceVal,
            category: categoryVal,
            brand: brandVal,
            model: modelVal,
            discountedPrice: isNaN(Number(discPriceVal)) ? undefined : discPriceVal,
            shortDescription: descVal,
            warranty: warrantyVal,
            packageIncludes: pkgVal,
            isAvailable: inStockVal,
            isBestSeller: bestSellerVal,
            colors: [],
            customFields: [],
            createdTime: new Date().toISOString()
          };

          onAddProduct(newProduct);
          importedCount++;
        }

        alert(`Successfully imported ${importedCount} products.${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicate SKU codes.` : ''}`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse CSV file. Ensure it is a valid CSV template.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter and Search list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.model || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
    const matchesBrand = selectedBrandFilter === 'All' || p.brand === selectedBrandFilter;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Storefront Product Catalog</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage public storefront display details, specifications, prices, discounts, and visual media.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Creation/Editing Form Section */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 sm:p-8 premium-shadow space-y-6 h-fit">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-indigo-55 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileBox size={18} />
            </span>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Catalog Item' : 'Add New Catalog Item'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asus Vivobook Pro 15"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  required
                />
              </div>

              {/* Brand and Model Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Asus"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Model Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K3500-PH"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Product Code and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Catalog SKU Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LP-ASUS-15"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-mono outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Category *
                    </label>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => setShowCategoryManager(true)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-bold transition cursor-pointer"
                      >
                        Manage
                      </button>
                      <span className="text-slate-300 dark:text-slate-700 text-[9px]">•</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition cursor-pointer"
                      >
                        {isAddingCustomCategory ? 'Use select' : '+ Create new'}
                      </button>
                    </div>
                  </div>
                  
                  {isAddingCustomCategory ? (
                    <input
                      type="text"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                    >
                      <option value="">-- Choose Category (Optional) --</option>
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Pricing & Discounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Base Price (LKR) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 240000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-mono outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Discounted Price (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 215000"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-mono outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Product vs Service Type */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Offering Type
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <input 
                      type="radio" 
                      name="isService" 
                      checked={!isService} 
                      onChange={() => {
                        setIsService(false);
                      }} 
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Physical Product (with inventory stock)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <input 
                      type="radio" 
                      name="isService" 
                      checked={isService} 
                      onChange={() => {
                        setIsService(true);
                      }} 
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Service offering (no physical stock)</span>
                  </label>
                </div>
              </div>

              {/* Purchase / Cost Price and Inventory Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                    <span>{isService ? "Cost of Service (LKR) (Optional)" : "Cost/Purchase Price (LKR) (Optional)"}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 180000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-mono outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
                {!isService && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Current Stock Level (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm font-mono outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Purchase History / Cost Tracker Batch Logger */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-md space-y-3 border border-slate-800">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <History size={12} className="text-emerald-400" />
                    <span>Purchase Cost History & Stock Replenishment</span>
                  </span>
                </div>
                
                {/* Form to log a new purchase batch */}
                <div className="space-y-2 bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="block text-[9.5px] font-extrabold uppercase text-slate-300 tracking-wider">
                    Log New Purchase Batch
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Batch Cost (LKR)</span>
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="Cost"
                        value={newBatchPrice}
                        onChange={(e) => setNewBatchPrice(e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs font-mono outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">{isService ? "Batch Logs (Qty)" : "Add Stock (Qty)"}</span>
                      <input 
                        type="number" 
                        min="1" 
                        placeholder="Qty"
                        value={newBatchQty}
                        onChange={(e) => setNewBatchQty(e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs font-mono outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Optional Batch Notes</span>
                    <input 
                      type="text" 
                      placeholder="e.g., Purchased from Alpha Dist."
                      value={newBatchNotes}
                      onChange={(e) => setNewBatchNotes(e.target.value)}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-[11px] outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBatchPrice || isNaN(Number(newBatchPrice))) return;
                      const qty = newBatchQty ? Number(newBatchQty) : 1;
                      const priceVal = Number(newBatchPrice);
                      const newRecord: PurchaseHistoryRecord = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        purchasePrice: priceVal,
                        qtyAdded: qty,
                        notes: newBatchNotes.trim() || undefined
                      };
                      setPurchaseHistory([newRecord, ...purchaseHistory]);
                      setPurchasePrice(priceVal.toString());
                      if (!isService) {
                        const currentStock = stock ? Number(stock) : 0;
                        setStock((currentStock + qty).toString());
                      }
                      setNewBatchPrice('');
                      setNewBatchQty('');
                      setNewBatchNotes('');
                    }}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded transition"
                  >
                    Apply Batch & Update Stock
                  </button>
                </div>

                {/* Display history list */}
                {purchaseHistory.length > 0 ? (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    <span className="block text-[9px] text-indigo-300 uppercase font-extrabold tracking-wider">
                      Batch Cost Logs ({purchaseHistory.length})
                    </span>
                    <div className="space-y-1">
                      {purchaseHistory.map((h) => (
                        <div key={h.id} className="flex justify-between items-start text-[10px] bg-white/5 hover:bg-white/10 p-2 rounded border border-white/5">
                          <div className="space-y-0.5 text-left">
                            <span className="font-mono text-emerald-400 font-bold block">LKR {h.purchasePrice.toLocaleString()}</span>
                            <span className="text-[8px] text-slate-400 flex items-center gap-1">
                              <Calendar size={8} /> {new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {h.notes && <span className="block text-[8.5px] text-slate-300 italic">"{h.notes}"</span>}
                          </div>
                          <span className="font-bold text-indigo-200">+{h.qtyAdded} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9.5px] text-slate-400 italic text-center py-2">
                    No cost history logged yet. Newly created purchase batches will display here.
                  </div>
                )}
              </div>

              {/* Marketing & Storefront Toggles */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="flex items-center justify-between pr-2 border-r border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">In Stock</span>
                    <span className="text-[9px] text-slate-400">Available</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className="text-slate-500 hover:text-indigo-600 transition"
                  >
                    {isAvailable ? (
                      <ToggleRight size={28} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 border-r border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Best Seller</span>
                    <span className="text-[9px] text-slate-400">Featured</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBestSeller(!isBestSeller)}
                    className="text-slate-500 hover:text-indigo-600 transition"
                  >
                    {isBestSeller ? (
                      <ToggleRight size={28} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pl-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Storefront</span>
                    <span className="text-[9px] text-slate-400">Show Web</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInStorefront(!showInStorefront)}
                    className="text-slate-500 hover:text-indigo-600 transition"
                  >
                    {showInStorefront ? (
                      <ToggleRight size={28} className="text-indigo-600 shrink-0" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-300 dark:text-slate-700 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Short Description
                </label>
                <textarea
                  placeholder="e.g. Thin, light premium creator laptop featuring OLED screen and Ryzen 7 processor."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                />
              </div>

              {/* Warranty and Package includes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Warranty Information
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Years Company Warranty"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Package Includes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop, Charger, Bag, User Manual"
                    value={packageIncludes}
                    onChange={(e) => setPackageIncludes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 text-sm outline-none transition duration-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Product Images ({images.length})
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-800/30 transition"
                >
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 block">Click to upload pictures</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Supports multiple images (Max 2MB each)</span>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Images Preview List */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3 p-2 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-xl max-h-44 overflow-y-auto">
                    {images.map((img, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <img 
                          src={img} 
                          alt={`Product thumbnail ${index}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customizable Product Specifications (Key/Value list) */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Product Specifications
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManageAttributes(!showManageAttributes)}
                    className="text-[10px] text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Settings size={11} />
                    <span>{showManageAttributes ? "Hide Manager" : "Manage Variables"}</span>
                  </button>
                </div>

                {/* Attribute Manager Sub-panel */}
                <AnimatePresence>
                  {showManageAttributes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 space-y-3 text-left"
                    >
                      <div className="flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
                        <span className="text-[11px] font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Settings size={12} className="text-indigo-600" />
                          Global Attribute Variables
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManageAttributes(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. RAM Capacity"
                          value={newAttributeName}
                          onChange={(e) => setNewAttributeName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-850 dark:text-slate-100 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCreateAttribute}
                          className="px-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {attributeTemplates.map((attr) => (
                          <div key={attr.id} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-1.5 rounded-lg text-xs">
                            {editingAttrId === attr.id ? (
                              <div className="flex-1 flex gap-1 items-center">
                                <input
                                  type="text"
                                  value={editingAttrName}
                                  onChange={(e) => setEditingAttrName(e.target.value)}
                                  className="flex-1 px-2 py-0.5 border border-indigo-300 rounded text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedAttribute(attr.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAttrId(null)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{attr.name}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditAttribute(attr.id, attr.name)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttribute(attr.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition cursor-pointer"
                                  >
                                    <Trash size={11} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Add Buttons */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Quick Add Attributes
                  </span>
                  {attributeTemplates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {attributeTemplates.map((attr) => {
                        const exists = customFields.some(f => f.name.toLowerCase() === attr.name.toLowerCase());
                        return (
                          <button
                            key={attr.id}
                            type="button"
                            disabled={exists}
                            onClick={() => {
                              const newField: ProductCustomField = {
                                id: crypto.randomUUID(),
                                name: attr.name,
                                value: '',
                              };
                              setCustomFields([...customFields, newField]);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer select-none ${
                              exists
                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 cursor-not-allowed'
                                : 'bg-indigo-55 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50'
                            }`}
                          >
                            + {attr.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">
                      No attributes defined yet.
                    </div>
                  )}
                </div>

                {/* Inline custom spec inputs */}
                {customFields.length > 0 ? (
                  <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/10 p-3 rounded-xl border border-slate-150 dark:border-slate-800 max-h-60 overflow-y-auto">
                    {customFields.map((field, idx) => (
                      <div key={field.id} className="flex gap-1.5 items-end">
                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-1.5">
                          <div className="col-span-5">
                            <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                              Spec Label
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              placeholder="e.g. CPU"
                              onChange={(e) => {
                                const updated = [...customFields];
                                updated[idx].name = e.target.value;
                                setCustomFields(updated);
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                            />
                          </div>
                          <div className="col-span-7">
                            <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                              Spec Value
                            </label>
                            <input
                              type="text"
                              value={field.value}
                              placeholder={`e.g. Ryzen 7 5800H`}
                              onChange={(e) => {
                                const updated = [...customFields];
                                updated[idx].value = e.target.value;
                                setCustomFields(updated);
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-850 dark:text-slate-200 outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-[11px] text-slate-400 italic">
                    No specifications. Tap attributes to add them.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const newField: ProductCustomField = {
                      id: crypto.randomUUID(),
                      name: '',
                      value: '',
                    };
                    setCustomFields([...customFields, newField]);
                  }}
                  className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle size={11} />
                  <span>Add Free-Form Attribute Row</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 font-display font-bold"
              >
                {editingId ? 'Save Changes' : 'Register Product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Products Directory Section */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Quick Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 sm:p-5 premium-shadow space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Filter Catalog Directory</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, SKU, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category selector */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Brand Selector */}
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none"
              >
                <option value="All">All Brands</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">CSV Portable Data Tools</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-slate-55 hover:bg-slate-100 text-slate-650 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="Download CSV Template with sample product details"
                >
                  <Download size={11} />
                  <span>Download Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-55 hover:bg-slate-100 text-slate-650 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="Import products from a CSV file"
                >
                  <Upload size={11} />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                  title="Export all registered products to a CSV file"
                >
                  <Download size={11} />
                  <span>Export CSV</span>
                </button>
                <input
                  type="file"
                  ref={csvFileInputRef}
                  onChange={handleImportCSV}
                  accept=".csv"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 sm:p-6 premium-shadow">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Grid size={14} className="text-indigo-600" />
              <span>Catalog Registry ({filteredProducts.length})</span>
            </h4>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                <HelpCircle size={32} className="mx-auto opacity-40 text-indigo-500" />
                <p className="text-sm font-medium">No matching items found.</p>
                <p className="text-xs">Adjust filters or refine search query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[700px] overflow-y-auto pr-1 space-y-2">
                {filteredProducts.map((p) => {
                  const hasDiscount = p.discountedPrice && p.discountedPrice < p.price;
                  const discountPct = hasDiscount 
                    ? Math.round(((p.price - (p.discountedPrice || 0)) / p.price) * 100) 
                    : 0;

                  return (
                    <div key={p.id} className="py-3.5 flex justify-between items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                      
                      {/* Product Thumbnail image */}
                      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 flex items-center justify-center">
                        {p.images && p.images.length > 0 ? (
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ImageIcon className="text-slate-300 dark:text-slate-600" size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{p.name}</h5>
                          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase">
                            {p.code}
                          </span>
                          {p.isBestSeller && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              <Sparkles size={8} />
                              <span>Best Seller</span>
                            </span>
                          )}
                          {!p.isAvailable && (
                            <span className="text-[8px] bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              OOS
                            </span>
                          )}
                          {p.showInStorefront === false ? (
                            <span className="text-[8px] bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              Hidden
                            </span>
                          ) : (
                            <span className="text-[8px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              Storefront
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {p.brand && <span className="font-semibold mr-2">Brand: <span className="text-slate-600 dark:text-slate-350">{p.brand}</span></span>}
                          {p.model && <span className="font-semibold mr-2">Model: <span className="text-slate-600 dark:text-slate-350">{p.model}</span></span>}
                          {p.category && <span className="font-semibold bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.2 rounded">{p.category}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                            <span>Price:</span>
                            {hasDiscount ? (
                              <div className="flex items-center gap-1.5">
                                <span className="line-through text-slate-405 font-mono">
                                  LKR {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="font-mono text-emerald-600 font-bold dark:text-emerald-400">
                                  LKR {p.discountedPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-black text-[9px] px-1 py-0.2 rounded flex items-center">
                                  <Percent size={8} /> {discountPct}% OFF
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-indigo-600 font-bold dark:text-indigo-400">
                                LKR {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>                           {/* Financials & Stock Status */}
                          <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[10px] text-slate-500 text-left">
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Inventory Status</span>
                              {p.isService ? (
                                <span className="inline-flex items-center gap-1 text-[9.5px] text-indigo-650 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                                  <Wrench size={10} /> Service
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded ${Number(p.stock || 0) === 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' : Number(p.stock || 0) <= 2 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 animate-pulse' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'}`}>
                                  {p.stock || 0} In Stock
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Admin Financials</span>
                              <div className="space-y-0.5">
                                <span className="block font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                                  Cost: LKR {(p.purchasePrice || 0).toLocaleString()}
                                </span>
                                {p.price > 0 && (
                                  <span className="block text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Margin: {(((hasDiscount ? (p.discountedPrice || p.price) : p.price) - (p.purchasePrice || 0)) / (hasDiscount ? (p.discountedPrice || p.price) : p.price) * 100).toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-extrabold mb-0.5">Total Valuations</span>
                              {p.isService ? (
                                <span className="block text-[9px] text-slate-400 italic">N/A (Service)</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="block font-mono text-[9px] font-semibold text-slate-650 dark:text-slate-300">
                                    Retail: LKR {((hasDiscount ? (p.discountedPrice || p.price) : p.price) * (p.stock || 0)).toLocaleString()}
                                  </span>
                                  <span className="block font-mono text-[8.5px] text-slate-450 dark:text-slate-400">
                                    Cost: LKR {((p.purchasePrice || 0) * (p.stock || 0)).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {p.customFields && p.customFields.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.customFields.map((f) => (
                                <span 
                                  key={f.id} 
                                  className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded text-[9px] font-semibold"
                                >
                                  <span className="text-slate-400 uppercase text-[8px] tracking-wider">{f.name}:</span>
                                  <span>{f.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
                          title="Edit product catalog parameters"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-slate-700"
                          title="Delete from catalog database"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Manager Modal Overlay */}
      <AnimatePresence>
        {showCategoryManager && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Grid size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Category Manager
                  </h3>
                </div>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Add New Category Form */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Create New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Smart Watches"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={async () => {
                      if (!newCategoryName.trim()) return;
                      const exists = categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
                      if (exists) {
                        alert("Category already exists!");
                        return;
                      }
                      await onAddCategory({
                        id: crypto.randomUUID(),
                        name: newCategoryName.trim()
                      });
                      setNewCategoryName('');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Categories list */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Registered Categories ({categories.length})
                </label>
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-55 dark:divide-slate-800 max-h-60 overflow-y-auto bg-slate-50/50 dark:bg-slate-850/50">
                  {categories.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 italic">No categories created yet.</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        {editingCategoryId === cat.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-400 rounded-lg text-xs"
                              autoFocus
                            />
                            <button
                              onClick={async () => {
                                if (!editingCategoryName.trim()) return;
                                await onUpdateCategory({
                                  ...cat,
                                  name: editingCategoryName.trim()
                                });
                                setEditingCategoryId(null);
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCategoryId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 dark:text-slate-350 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                                title="Edit category name"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete the category "${cat.name}"? Existing products under this category will remain unchanged.`)) {
                                    await onDeleteCategory(cat.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded cursor-pointer"
                                title="Delete category"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
